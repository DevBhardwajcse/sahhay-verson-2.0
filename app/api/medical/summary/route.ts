import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GEMINI_MODELS, getGeminiServerClient } from '@/lib/gemini-server';
import { checkApiRateLimit } from '@/lib/security-utils';

const SummaryRequestSchema = z.object({
  language: z.enum(['en', 'hi']).default('en'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(8000),
      })
    )
    .min(1)
    .max(30),
});

function buildDeterministicSummary(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  language: 'en' | 'hi'
): string {
  const userQuestions = messages
    .filter((m) => m.role === 'user')
    .map((m, i) => `${i + 1}. ${m.text.trim()}`)
    .join('\n');

  if (language === 'hi') {
    return `SAHAAY डॉक्टर परामर्श सारांश (गैर-नैदानिक)
दिनांक: ${new Date().toLocaleString('en-IN')}

1. मुख्य चिंता / पूछे गए प्रश्न:
${userQuestions}

2. चर्चा का संक्षिप्त सार:
उपयोगकर्ता ने सामान्य स्वास्थ्य जानकारी और सुरक्षा सावधानियों के लिए SAHAAY AI सहायक से परामर्श किया।

3. डॉक्टर से पूछने योग्य प्रश्न:
- क्या इन लक्षणों के लिए किसी शारीरिक जांच या लैब टेस्ट की आवश्यकता है?
- मुझे किन चेतावनी संकेतों पर तुरंत ध्यान देना चाहिए?
- मेरी स्थिति के लिए सबसे सुरक्षित उपचार योजना क्या है?

4. अस्वीकरण:
यह सारांश केवल डॉक्टर से बातचीत की तैयारी में सहायता के लिए है। यह कोई चिकित्सा निदान या दवा का पर्चा नहीं है।`;
  }

  return `SAHAAY Doctor Consultation Summary (Non-Diagnostic)
Generated: ${new Date().toLocaleString('en-IN')}

1. Chief Concern & User Questions:
${userQuestions}

2. Summary of Information Reviewed:
The user consulted SAHAAY AI Health Assistant for general educational guidance, precautions, and care navigation.

3. Suggested Questions for Your Doctor:
- Do my symptoms warrant an in-person exam or diagnostic testing?
- Which warning signs should prompt urgent care?
- What is the safest evaluation and management plan for me?

4. Important Notice:
This summary was prepared from an informational AI chat to help organize your doctor visit. It is NOT a clinical diagnosis or prescription.`;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`summary:${clientIp}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Too many summary requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = SummaryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'At least one conversation message is required to generate a doctor summary.' },
        { status: 400 }
      );
    }

    const { messages, language } = parsed.data;
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Patient/User' : 'SAHAAY Assistant'}: ${m.text}`)
      .join('\n\n')
      .slice(0, 8000);

    try {
      const ai = getGeminiServerClient();
      const prompt =
        language === 'hi'
          ? `निम्नलिखित SAHAAY स्वास्थ्य चैट से डॉक्टर को दिखाने के लिए एक संक्षिप्त, स्पष्ट और संरचित सारांश (हिन्दी में) तैयार करें।
नियम: कोई निदान (diagnosis) या दवा की खुराक न लिखें। केवल उपयोगकर्ता द्वारा बताए गए तथ्य, मुख्य चिंता, पूछे गए विषय, जांचे गए खतरे के संकेत, और डॉक्टर से पूछने के 3 उपयोगी प्रश्न शामिल करें। अंत में स्पष्ट लिखें कि यह केवल एक गैर-नैदानिक सूचनात्मक सारांश है।

चैट रिकॉर्ड:
${transcript}`
          : `Distill the following SAHAAY health conversation into a concise, clean, structured Doctor Consultation Summary in plain text / clean bullet points.
STRICT RULES:
- Never invent symptoms not mentioned by the user.
- Never state a medical diagnosis or recommend/prescribe medication doses.
- Include exactly these sections:
  1. Chief Concern & Context Mentioned
  2. Key Questions & Topics Discussed
  3. Safety / Red-Flag Screening Notes
  4. Suggested Questions to Ask Your Doctor (3 concise bullets)
  5. Non-Diagnostic Notice

Conversation transcript:
${transcript}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODELS.fastLite,
        contents: prompt,
      });

      const summary = response.text?.trim() || buildDeterministicSummary(messages, language);
      return NextResponse.json({ summary, generatedBy: 'gemini' });
    } catch {
      return NextResponse.json({
        summary: buildDeterministicSummary(messages, language),
        generatedBy: 'structured_fallback',
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Unable to generate doctor summary right now.' },
      { status: 500 }
    );
  }
}
