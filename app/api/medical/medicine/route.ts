import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
  lookupClinicalReference,
} from '@/lib/gemini-server';
import { checkApiRateLimit, validateUploadedImage } from '@/lib/security-utils';
import { enforceMedicineSafetyGuard, evaluateEmergencyRedFlags } from '@/lib/triage-engine';

const MedicineScanSchema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.string().min(5).max(40),
  userNote: z.string().max(500).optional().default(''),
  language: z.enum(['en', 'hi']).default('en'),
});

interface MedicineExtraction {
  isLoosePillOnly: boolean;
  packagingLegibility: 'clear' | 'partial' | 'unclear';
  productName: string;
  activeIngredients: string[];
  strength: string;
  dosageForm: string;
  manufacturer: string;
  expiryDate: string;
  packagingWarnings: string[];
  category: string;
  generalUses: string;
  whyPrescribed: string;
  doctorPharmacistGuidance: string;
  missingOrUnclearDetails: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`medicine:${clientIp}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Too many scan requests. Please wait a minute before scanning another image.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = MedicineScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid medicine image submission. Please upload a valid JPEG, PNG, or WebP photo.' },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, userNote, language } = parsed.data;

    // Validate MIME and file size strictly (<= 6 MB)
    const imgCheck = validateUploadedImage({ mimeType, base64Data: imageBase64 });
    if (!imgCheck.valid) {
      return NextResponse.json({ error: imgCheck.error }, { status: 400 });
    }

    // Check optional user note for overdose/poisoning/emergency red flags FIRST
    const emergencyCheck = evaluateEmergencyRedFlags(userNote);
    if (emergencyCheck.isEmergency) {
      return NextResponse.json({
        emergency: emergencyCheck,
        unidentified: true,
        safetyNotice:
          language === 'hi' ? emergencyCheck.guidanceHi : emergencyCheck.guidanceEn,
      });
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    const ai = getGeminiServerClient();

    const promptText =
      language === 'hi'
        ? `इस दवा की पैकेजिंग, स्ट्रिप, बोतल या लेबल की तस्वीर का सावधानीपूर्वक विश्लेषण करें। सभी वर्णनात्मक फ़ील्ड सरल हिन्दी (देवनागरी) में लिखें (दवा का मूल मुद्रित नाम/घटक अंग्रेज़ी में रख सकते हैं)।
सख्त सुरक्षा नियम:
- यदि तस्वीर में केवल खुली गोलियां/कैप्सूल हैं और कोई पठनीय पैकेजिंग नहीं है, तो isLoosePillOnly = true और packagingLegibility = "unclear" सेट करें। कभी भी रंग या आकार से खुली गोली का अनुमान न लगाएं।
- यदि टेक्स्ट धुंधला या अपूर्ण है, तो स्पष्ट रूप से बताएं कि क्या पढ़ा नहीं जा सका।
- कभी भी खुराक की सलाह न दें या किसी व्यक्ति के लिए दवा शुरू/बंद करने को न कहें।
उपयोगकर्ता का अतिरिक्त नोट: ${userNote || 'कोई नहीं'}`
        : `Carefully inspect this image of medicine packaging, strip, syrup bottle, or prescription label. Write all explanatory fields in simple, clear English.
STRICT SAFETY RULES:
- If the image shows ONLY loose pills/tablets/capsules without legible printed packaging, set isLoosePillOnly = true and packagingLegibility = "unclear". NEVER guess a loose pill from shape, colour, or appearance.
- Read ONLY visibly legible printed information. If expiry date, manufacturer, strength, or active ingredients are not clearly readable, state "Not clearly visible".
- NEVER prescribe, recommend a dose, or tell the user whether they should start, stop, or combine this medicine.
User note: ${userNote || 'None'}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.multimodalVision,
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanedBase64,
          },
        },
        promptText,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isLoosePillOnly: { type: Type.BOOLEAN },
            packagingLegibility: {
              type: Type.STRING,
              enum: ['clear', 'partial', 'unclear'],
            },
            productName: { type: Type.STRING },
            activeIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            strength: { type: Type.STRING },
            dosageForm: { type: Type.STRING },
            manufacturer: { type: Type.STRING },
            expiryDate: { type: Type.STRING },
            packagingWarnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            category: { type: Type.STRING },
            generalUses: { type: Type.STRING },
            whyPrescribed: { type: Type.STRING },
            doctorPharmacistGuidance: { type: Type.STRING },
            missingOrUnclearDetails: { type: Type.STRING },
          },
          required: [
            'isLoosePillOnly',
            'packagingLegibility',
            'productName',
            'activeIngredients',
            'strength',
            'dosageForm',
            'manufacturer',
            'expiryDate',
            'packagingWarnings',
            'category',
            'generalUses',
            'whyPrescribed',
            'doctorPharmacistGuidance',
            'missingOrUnclearDetails',
          ],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    const extraction = JSON.parse(rawText) as MedicineExtraction;

    // Deterministic safety guard enforces loose-pill & legibility refusal regardless of model output
    const guard = enforceMedicineSafetyGuard({
      isLoosePillOnly: extraction.isLoosePillOnly,
      packagingLegibility: extraction.packagingLegibility,
      productName: extraction.productName,
      activeIngredients: extraction.activeIngredients,
    });

    // Cross-verify against reputable clinician-reviewed medical reference sources
    const lookupTerm =
      guard.allowIdentification
        ? extraction.activeIngredients?.[0] || extraction.productName || ''
        : '';
    const clinicalReferences = lookupTerm
      ? await lookupClinicalReference(lookupTerm, 'medicine')
      : [];

    return NextResponse.json({
      emergency: emergencyCheck,
      unidentified: !guard.allowIdentification,
      isUncertain: guard.isUncertain,
      safetyReason: language === 'hi' ? guard.safetyReasonHi : guard.safetyReasonEn,
      extraction: guard.allowIdentification
        ? extraction
        : {
            ...extraction,
            productName: language === 'hi' ? 'अज्ञात (पहचान संभव नहीं)' : 'Unidentified',
            activeIngredients: [],
            strength: language === 'hi' ? 'स्पष्ट नहीं' : 'Not clearly visible',
            dosageForm: extraction.dosageForm || (language === 'hi' ? 'स्पष्ट नहीं' : 'Not clearly visible'),
          },
      clinicalReferences,
      mandatorySafetyReminders:
        language === 'hi'
          ? [
              'दवा लेने से पहले हमेशा मूल पैकेजिंग पर एक्सपायरी तिथि और बैच विवरण की जांच करें।',
              'केवल तस्वीर के आधार पर दवा की असली पहचान या आपके लिए सुरक्षा की पुष्टि नहीं की जा सकती।',
              'किसी योग्य डॉक्टर या फार्मासिस्ट से सलाह लिए बिना कोई भी दवा शुरू, बंद या बदलें नहीं।',
              'यदि दवा लेने के बाद एलर्जी, सांस लेने में दिक्कत या गंभीर लक्षण दिखें, तो तुरंत 112 पर कॉल करें।',
            ]
          : [
              'Always verify the printed expiry date, strength, and intact seal on the physical packaging.',
              'A photograph alone cannot verify authenticity, storage condition, or suitability for an individual.',
              'Never start, stop, change dosage, or combine medicines without consulting a qualified doctor or pharmacist.',
              'If accidental ingestion, overdose, or severe allergic symptoms occur, call 112 immediately.',
            ],
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
