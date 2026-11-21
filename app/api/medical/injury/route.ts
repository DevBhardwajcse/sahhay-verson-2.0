import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
} from '@/lib/gemini-server';
import { checkApiRateLimit, validateUploadedImage } from '@/lib/security-utils';
import { evaluateEmergencyRedFlags } from '@/lib/triage-engine';

const InjuryScanSchema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.string().min(5).max(40),
  description: z.string().max(800).optional().default(''),
  language: z.enum(['en', 'hi']).default('en'),
});

interface InjuryObservationResult {
  imageQuality: 'clear' | 'limited' | 'unclear';
  visibleObservations: string[];
  cannotDetermineFromImage: string[];
  limitationsExplanation: string;
  followUpQuestions: string[];
  generalNextSteps: string[];
  whenToSeeDoctor: string[];
  whenEmergencyNeeded: string[];
  recommendHospitalVisit: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`injury:${clientIp}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Too many injury analysis requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = InjuryScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid injury image submission. Please upload a valid JPEG, PNG, or WebP photo.' },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, description, language } = parsed.data;

    // 1. Validate MIME & size
    const imgCheck = validateUploadedImage({ mimeType, base64Data: imageBase64 });
    if (!imgCheck.valid) {
      return NextResponse.json({ error: imgCheck.error }, { status: 400 });
    }

    // 2. Deterministic emergency check runs FIRST — immediately escalates if severe trauma described
    const emergencyCheck = evaluateEmergencyRedFlags(description);
    if (emergencyCheck.isEmergency) {
      return NextResponse.json({
        emergency: emergencyCheck,
        stoppedForEmergency: true,
        recommendHospitalVisit: true,
      });
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    const ai = getGeminiServerClient();

    const promptText =
      language === 'hi'
        ? `आप SAHAAY AI स्वास्थ्य सहायक हैं। इस दृश्य चोट की तस्वीर का बहुत ही सावधानीपूर्वक, शांत और गैर-डरावनी भाषा में सीमित दृश्य अवलोकन करें। सभी फ़ील्ड सरल हिन्दी (देवनागरी) में लिखें।
सख्त चिकित्सा सुरक्षा सीमाएं:
- केवल वही सामान्य दृश्य संकेत बताएं जो सतह पर दिख रहे हैं (जैसे लालिमा, सूजन, सतही खरोंच, छाला, नील पड़ना आदि)।
- कभी भी फ्रैक्चर/हड्डी टूटने, आंतरिक चोट, संक्रमण या जलने की डिग्री का निश्चित निदान या खारिज न करें।
- कभी भी किसी दवा, क्रीम या एंटीबायोटिक की सलाह न दें।
- स्पष्ट करें कि केवल तस्वीर से क्या तय नहीं किया जा सकता।
- अधिकतम 4 संक्षिप्त अनुवर्ती प्रश्न पूछें।
- यदि चोट गंभीर, गहरी, फैलती हुई या अस्पष्ट लगती है तो recommendHospitalVisit = true सेट करें।
उपयोगकर्ता का विवरण: ${description || 'कोई अतिरिक्त विवरण नहीं दिया गया'}`
        : `You are SAHAAY AI Health Assistant. Provide calm, non-graphic, limited visual observations of this injury image in simple English.
STRICT CLINICAL SAFETY BOUNDARIES:
- Describe ONLY basic surface-level visible observations (e.g., visible redness, swelling, minor abrasion, bruising, blistering, or unclear lighting).
- NEVER diagnose or rule out fractures, internal injury, infection, tetanus risk, or exact burn degree from a photograph.
- NEVER prescribe medications, ointments, or antibiotics.
- Clearly list what CANNOT be determined from a photograph alone.
- Ask at most 4 concise follow-up context questions.
- Set recommendHospitalVisit = true whenever the injury appears deep, large, worsening, near sensitive areas, or uncertain.
User context description: ${description || 'No additional description provided'}`;

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
            imageQuality: {
              type: Type.STRING,
              enum: ['clear', 'limited', 'unclear'],
            },
            visibleObservations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            cannotDetermineFromImage: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            limitationsExplanation: { type: Type.STRING },
            followUpQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            generalNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            whenToSeeDoctor: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            whenEmergencyNeeded: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendHospitalVisit: { type: Type.BOOLEAN },
          },
          required: [
            'imageQuality',
            'visibleObservations',
            'cannotDetermineFromImage',
            'limitationsExplanation',
            'followUpQuestions',
            'generalNextSteps',
            'whenToSeeDoctor',
            'whenEmergencyNeeded',
            'recommendHospitalVisit',
          ],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    const result = JSON.parse(rawText) as InjuryObservationResult;

    return NextResponse.json({
      emergency: emergencyCheck,
      stoppedForEmergency: false,
      result: {
        ...result,
        followUpQuestions: (result.followUpQuestions || []).slice(0, 4),
      },
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
