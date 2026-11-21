import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
} from '@/lib/gemini-server';
import { checkApiRateLimit, validateUploadedImage } from '@/lib/security-utils';

const PrescriptionSchema = z.object({
  language: z.enum(['en', 'hi']).default('en'),
  imageBase64: z.string().min(20),
  mimeType: z.string().min(5),
  userNote: z.string().trim().max(400).optional(),
});

interface RawPrescriptionJson {
  dateVisible?: string;
  prescriberOrClinic?: string;
  legibilityAssessment?: string;
  medicines?: Array<{
    writtenName?: string;
    activeIngredientIfClear?: string;
    writtenInstructions?: string;
    generalPurpose?: string;
    legibility?: string;
  }>;
  illegibleNotes?: string[];
  safetyReminder?: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`prescription:${clientIp}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Too many prescription scan requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = PrescriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please upload a valid prescription image.' },
        { status: 400 }
      );
    }

    const { language, imageBase64, mimeType, userNote } = parsed.data;
    const validation = validateUploadedImage({
      mimeType,
      base64Data: imageBase64,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    const ai = getGeminiServerClient();
    const langDirective =
      language === 'hi'
        ? 'Provide general explanations, legibility notes, and safety reminders in clear Hindi (Devanagari script), keeping printed medicine names intact.'
        : 'Provide general explanations, legibility notes, and safety reminders in clear, plain English.';

    const prompt = `You are SAHAAY AI Prescription Reader — an informational assistant helping patients understand written prescription details.

STRICT SAFETY RULES:
1. Extract ONLY clearly readable medicine names, written dosage/timing instructions (e.g., OD, BD, TDS, after meals — explain standard abbreviations plainly), and dates visible on the prescription.
2. NEVER guess illegible or heavily cursive doctor handwriting! If any medicine name or dose is unclear, explicitly mark legibility as "unclear" and add it to illegibleNotes instructing the patient to confirm with the dispensing pharmacist or prescribing doctor.
3. NEVER alter, increase, decrease, substitute, start, or stop prescribed treatment.
4. Explain only what each clearly legible medicine class is generally used for.
5. ${langDirective}
${userNote ? `\nUser note: ${userNote}` : ''}`;

    const parts = [
      {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      },
      { text: prompt },
    ];

    const callConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dateVisible: { type: Type.STRING },
          prescriberOrClinic: { type: Type.STRING },
          legibilityAssessment: { type: Type.STRING },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                writtenName: { type: Type.STRING },
                activeIngredientIfClear: { type: Type.STRING },
                writtenInstructions: { type: Type.STRING },
                generalPurpose: { type: Type.STRING },
                legibility: { type: Type.STRING },
              },
            },
          },
          illegibleNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          safetyReminder: { type: Type.STRING },
        },
      },
    };

    let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODELS.multimodalVision,
        contents: { parts },
        config: callConfig,
      });
    } catch {
      response = await ai.models.generateContent({
        model: GEMINI_MODELS.fastLite,
        contents: { parts },
        config: callConfig,
      });
    }

    let rawJson: RawPrescriptionJson = {};
    try {
      rawJson = JSON.parse((response.text ?? '{}').trim()) as RawPrescriptionJson;
    } catch {
      rawJson = {
        legibilityAssessment: 'Unclear — could not reliably parse prescription text.',
        medicines: [],
        illegibleNotes: ['Please confirm every item directly with your licensed pharmacist or doctor.'],
      };
    }

    const medicines = (rawJson.medicines ?? [])
      .filter((m) => Boolean(m?.writtenName))
      .slice(0, 20)
      .map((m) => ({
        writtenName: String(m.writtenName).trim(),
        activeIngredientIfClear: String(m.activeIngredientIfClear ?? 'Confirm with pharmacist').trim(),
        writtenInstructions: String(m.writtenInstructions ?? 'Not clearly legible — verify with pharmacist').trim(),
        generalPurpose: String(m.generalPurpose ?? 'Verify intended use with prescribing doctor.').trim(),
        legibility: String(m.legibility ?? '').toLowerCase() === 'clear' ? 'clear' : 'unclear',
      }));

    return NextResponse.json({
      dateVisible: rawJson.dateVisible || 'Not clearly visible',
      prescriberOrClinic: rawJson.prescriberOrClinic || 'Not clearly visible',
      legibilityAssessment:
        rawJson.legibilityAssessment ||
        'Confirm every handwritten entry with your dispensing pharmacist before taking any medicine.',
      medicines,
      illegibleNotes: rawJson.illegibleNotes ?? [],
      safetyReminder:
        rawJson.safetyReminder ||
        (language === 'hi'
          ? 'यह रीडर केवल लिखे हुए विवरण को समझाने में मदद करता है। दवा की सटीक मात्रा, समय और सुरक्षा की पुष्टि हमेशा अपने डॉक्टर या फार्मासिस्ट से करें।'
          : 'This tool explains readable prescription text only and never modifies treatment. Always confirm exact drug names, doses, and timing with a licensed pharmacist or your prescribing doctor.'),
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
