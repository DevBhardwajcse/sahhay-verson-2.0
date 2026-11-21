import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
} from '@/lib/gemini-server';
import { checkApiRateLimit, validateUploadedImage } from '@/lib/security-utils';
import {
  evaluateLabValueStatus,
  summarizeOutOfRangeCount,
  type ParsedLabParameter,
} from '@/lib/lab-report-utils';

const LabReportSchema = z.object({
  language: z.enum(['en', 'hi']).default('en'),
  imageBase64: z.string().optional(),
  mimeType: z.string().optional(),
  reportText: z.string().trim().max(8000).optional(),
  userNote: z.string().trim().max(400).optional(),
});

interface RawLabJson {
  reportType?: string;
  imageQualityNote?: string;
  overallSummary?: string;
  extractedParameters?: Array<{
    name?: string;
    value?: string;
    unit?: string;
    referenceRange?: string;
    status?: string;
    plainExplanation?: string;
  }>;
  doctorQuestions?: string[];
  limitations?: string;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`lab-report:${clientIp}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Too many lab report analysis requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LabReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid lab report request.' }, { status: 400 });
    }

    const { language, imageBase64, mimeType, reportText, userNote } = parsed.data;
    const hasImage = Boolean(imageBase64 && mimeType);
    const hasText = Boolean(reportText && reportText.length >= 10);

    if (!hasImage && !hasText) {
      return NextResponse.json(
        { error: 'Please upload a lab report image or paste at least 10 characters of lab results.' },
        { status: 400 }
      );
    }

    let cleanBase64 = '';
    if (hasImage) {
      const validation = validateUploadedImage({
        mimeType: mimeType!,
        base64Data: imageBase64!,
      });
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      cleanBase64 = imageBase64!.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    }

    const ai = getGeminiServerClient();
    const langInstruction =
      language === 'hi'
        ? 'Write all explanations, summaries, doctor questions, and limitations in simple, clear Hindi (Devanagari script), while keeping standard lab test abbreviations (like HbA1c, CBC, TSH, Creatinine) recognizable.'
        : 'Write all explanations, summaries, doctor questions, and limitations in clear, plain, patient-friendly English.';

    const prompt = `You are SAHAAY AI Lab Report Analyzer — an informational medical education assistant.
Analyze ONLY the visible/provided lab report data (blood test, urine test, lipid profile, thyroid panel, CBC, liver/kidney panel, etc.).

STRICT CLINICAL SAFETY RULES:
1. NEVER diagnose a disease or medical condition from lab values alone.
2. NEVER prescribe or recommend changing any medication or dosage.
3. Extract only parameters clearly printed in the report. If numbers are blurry or cut off, state "Unclear" rather than guessing.
4. Compare each extracted numeric result ONLY against the reference range displayed on the report itself (or mark "unclear" if no reference range is displayed).
5. Explain what each medical term generally measures in simple language, highlight values outside the printed reference range, and recommend discussing all findings with the ordering physician.
6. ${langInstruction}
${userNote ? `\nPatient note: ${userNote}` : ''}
${hasText ? `\nPasted lab report text:\n${reportText}` : ''}`;

    const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [];
    if (hasImage) {
      parts.push({
        inlineData: {
          mimeType: mimeType!,
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: prompt });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        reportType: { type: Type.STRING },
        imageQualityNote: { type: Type.STRING },
        overallSummary: { type: Type.STRING },
        extractedParameters: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.STRING },
              unit: { type: Type.STRING },
              referenceRange: { type: Type.STRING },
              status: { type: Type.STRING },
              plainExplanation: { type: Type.STRING },
            },
          },
        },
        doctorQuestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        limitations: { type: Type.STRING },
      },
    };

    const callConfig = {
      responseMimeType: 'application/json',
      responseSchema,
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

    let rawJson: RawLabJson = {};
    try {
      rawJson = JSON.parse((response.text ?? '{}').trim()) as RawLabJson;
    } catch {
      rawJson = {
        reportType: 'Lab Report',
        overallSummary: response.text?.trim() || 'Unable to parse structured parameters.',
        extractedParameters: [],
      };
    }

    const parameters: ParsedLabParameter[] = (rawJson.extractedParameters ?? [])
      .filter((p) => Boolean(p?.name))
      .slice(0, 30)
      .map((p) => {
        const valueStr = String(p.value ?? 'Not visible').trim();
        const rangeStr = String(p.referenceRange ?? 'Not printed').trim();
        // Deterministic double-check against displayed numeric reference range
        const deterministicStatus = evaluateLabValueStatus(valueStr, rangeStr);
        const aiStatus = String(p.status ?? '').toLowerCase();
        const normalizedStatus: ParsedLabParameter['status'] =
          deterministicStatus !== 'unclear'
            ? deterministicStatus
            : aiStatus === 'high' || aiStatus === 'low' || aiStatus === 'normal' || aiStatus === 'borderline'
              ? (aiStatus as ParsedLabParameter['status'])
              : 'unclear';

        return {
          name: String(p.name).trim(),
          value: valueStr,
          unit: String(p.unit ?? '').trim(),
          referenceRange: rangeStr,
          status: normalizedStatus,
          plainExplanation:
            String(p.plainExplanation ?? '').trim() ||
            'Discuss this parameter with your ordering doctor for interpretation in clinical context.',
        };
      });

    const stats = summarizeOutOfRangeCount(parameters);

    return NextResponse.json({
      reportType: rawJson.reportType || (language === 'hi' ? 'प्रयोगशाला रिपोर्ट' : 'Laboratory Report'),
      imageQualityNote:
        rawJson.imageQualityNote ||
        (hasImage
          ? 'Verify every extracted number directly against your original printed lab report.'
          : 'Analyzed from pasted text — confirm values against your official signed lab copy.'),
      overallSummary:
        rawJson.overallSummary ||
        (language === 'hi'
          ? 'यह विश्लेषण केवल रिपोर्ट के शब्दों और संदर्भ सीमाओं को समझाने के लिए है। सही चिकित्सा व्याख्या के लिए अपने डॉक्टर से मिलें।'
          : 'This summary explains lab terms and highlights values outside printed reference ranges. Always discuss your complete report with your doctor.'),
      extractedParameters: parameters,
      stats,
      doctorQuestions:
        rawJson.doctorQuestions && rawJson.doctorQuestions.length > 0
          ? rawJson.doctorQuestions.slice(0, 5)
          : language === 'hi'
            ? [
                'मेरी उम्र और लक्षणों के संदर्भ में ये मान क्या संकेत देते हैं?',
                'क्या इनमें से किसी टेस्ट को दोबारा कराने या अतिरिक्त जांच की आवश्यकता है?',
                'क्या मेरी वर्तमान दवाओं या आहार में किसी बदलाव की ज़रूरत है?',
              ]
            : [
                'What do any out-of-range values mean in the context of my overall health and symptoms?',
                'Do any of these tests need to be repeated or followed up with additional lab work?',
                'Are there safe lifestyle or follow-up steps you recommend before my next visit?',
              ],
      limitations:
        rawJson.limitations ||
        (language === 'hi'
          ? 'लैब रिपोर्ट की व्याख्या अकेले संख्याओं से नहीं की जा सकती; आयु, लक्षण, दवाइयां और चिकित्सकीय इतिहास डॉक्टर द्वारा मूल्यांकित किया जाना आवश्यक है।'
          : 'Lab values cannot establish a medical diagnosis on their own. Reference ranges vary by laboratory, age, sex, and clinical context — consult a qualified physician.'),
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
