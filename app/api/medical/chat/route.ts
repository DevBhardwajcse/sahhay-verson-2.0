import { NextRequest, NextResponse } from 'next/server';
import { ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
  lookupClinicalReference,
} from '@/lib/gemini-server';
import {
  analyzeCareRecommendation,
  generateFollowUpSuggestions,
  searchClinicalKnowledgeBase,
} from '@/lib/clinical-knowledge-base';
import { checkApiRateLimit } from '@/lib/security-utils';
import { classifyInteractionIntent, evaluateEmergencyRedFlags } from '@/lib/triage-engine';

const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'hi']).default('en'),
  deepThinking: z.boolean().optional().default(false),
  useSearchGrounding: z.boolean().optional().default(true),
  isVoice: z.boolean().optional().default(false),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(2500),
      })
    )
    .max(12)
    .optional()
    .default([]),
  medicalHistoryContext: z
    .object({
      ageGroup: z.string().max(40).optional(),
      allergies: z.string().max(300).optional(),
      chronicConditions: z.string().max(300).optional(),
      currentMedications: z.string().max(300).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`chat:${clientIp}`, 30, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before asking another question.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid health question (1 to 2000 characters).' },
        { status: 400 }
      );
    }

    const { message, language, deepThinking, useSearchGrounding, isVoice, history, medicalHistoryContext } =
      parsed.data;

    // Step 1: Deterministic non-overridable emergency screening runs FIRST
    const emergencyCheck = evaluateEmergencyRedFlags(message);
    const detectedIntent = classifyInteractionIntent({
      text: message,
      isVoice,
    });

    // Step 2: Hybrid RAG retrieval (curated MoHFW/WHO/ICMR knowledge base + MedlinePlus + OpenFDA)
    const kbMatches = searchClinicalKnowledgeBase(message, 3);
    const references = await lookupClinicalReference(message, 'topic');
    const recommendedCare = analyzeCareRecommendation(message, emergencyCheck.isEmergency, kbMatches);
    const followUpSuggestions = generateFollowUpSuggestions(
      language,
      kbMatches,
      emergencyCheck.isEmergency
    );

    // If deterministic emergency detected, return immediate safe escalation without delaying on AI
    if (emergencyCheck.isEmergency) {
      const emergencyText =
        language === 'hi'
          ? `### ${emergencyCheck.headlineHi}\n\n${emergencyCheck.guidanceHi}\n\n**तत्काल कदम:**\n- अभी **112** (एकीकृत आपातकालीन सेवा) या **102** (राष्ट्रीय एम्बुलेंस) पर कॉल करें।\n- यदि संभव हो तो किसी पास के व्यक्ति को सूचित करें और नजदीकी आपातकालीन अस्पताल जाएं।\n- जब तक पेशेवर चिकित्सा सहायता न मिले, स्वयं कोई नई दवा न लें।`
          : `### ${emergencyCheck.headlineEn}\n\n${emergencyCheck.guidanceEn}\n\n**Immediate Steps:**\n- Call **112** (India Integrated Emergency) or **102** (National Ambulance) immediately.\n- Alert someone nearby and go to the nearest emergency hospital right away.\n- Do not take unprescribed medication or delay in-person care while using this app.`;

      return NextResponse.json({
        reply: emergencyText,
        intent: 'emergency',
        emergency: emergencyCheck,
        references,
        groundingSources: [],
        recommendedCare,
        followUpSuggestions,
        language,
      });
    }

    const ai = getGeminiServerClient();

    const referenceBlock =
      references.length > 0
        ? `\nPrioritized clinician-reviewed clinical reference context retrieved for grounding (cite these transparently when relevant):\n${references
            .map(
              (r, idx) =>
                `[${idx + 1}] ${r.documentTitle || r.title} — ${r.source}${
                  r.version ? ` (${r.version}, verified ${r.lastVerifiedDate || '2026'})` : ''
                }: ${r.commonUses} | Precautions: ${r.precautions}`
            )
            .join('\n')}`
        : '';

    const historyContextBlock = medicalHistoryContext
      ? `\nUser-consented optional background context (use only to tailor safety precautions, never to prescribe or diagnose): Age group: ${
          medicalHistoryContext.ageGroup || 'Not shared'
        }; Allergies: ${medicalHistoryContext.allergies || 'None shared'}; Conditions: ${
          medicalHistoryContext.chronicConditions || 'None shared'
        }; Current medications: ${medicalHistoryContext.currentMedications || 'None shared'}.`
      : '';

    const languageDirective =
      language === 'hi'
        ? 'Respond strictly in clear, simple, respectful Hindi (Devanagari script). Do not mix long English paragraphs unless naming a specific medical term in parentheses.'
        : 'Respond strictly in clear, simple, compassionate English.';

    const voiceDirective = isVoice
      ? 'Keep each section concise and easy to listen to when read aloud, while preserving all safety boundaries.'
      : '';

    const systemInstruction = `You are SAHAAY AI Health Assistant, an online informational and healthcare navigation assistant for users in India.
You are NOT a doctor, diagnostician, pharmacist, or replacement for professional medical assessment.

STRICT SAFETY RULES:
1. NEVER provide a confident medical diagnosis from incomplete information.
2. NEVER prescribe medication or independently advise starting, stopping, changing, or combining medicines or doses.
3. Prioritize the retrieved clinician-reviewed medical references below over general speculation, and communicate uncertainty clearly.
4. Keep advice calm, respectful, non-judgmental, and accessible to non-medical users.
5. ${languageDirective}
6. ${voiceDirective}

MANDATORY RESPONSE STRUCTURE (use clear Markdown headings in the user's selected language):
${
  language === 'hi'
    ? `1. **आपके प्रश्न का अर्थ**
2. **सामान्य चिकित्सा जानकारी**
3. **महत्वपूर्ण बातें और सावधानियां**
4. **आगे क्या करें (सुझाए गए कदम)**
5. **डॉक्टर से कब मिलें**
6. **आपातकालीन सहायता कब आवश्यक है (112)**
7. **स्पष्टीकरण और सीमाएं** (यदि आवश्यक हो तो केवल 1–2 सबसे महत्वपूर्ण अनुवर्ती प्रश्न पूछें)`
    : `1. **What Your Question Means**
2. **General Medical Information**
3. **Important Considerations & Limitations**
4. **What You Can Do Next**
5. **When to Consult a Doctor**
6. **When Immediate Emergency Help Is Necessary (Call 112)**
7. **Helpful Follow-Up Context** (Ask at most 1–2 concise clarifying questions only if truly needed)`
}${referenceBlock}${historyContextBlock}`;

    const contents = [
      ...history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: message }],
      },
    ];

    const config: Record<string, unknown> = {
      systemInstruction,
    };

    if (deepThinking) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODELS.chat,
        contents,
        config,
      });
    } catch (primaryErr) {
      // Automatic fallback to fastLite model without search tool when primary quota/rate limit is hit
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODELS.fastLite,
          contents,
          config: { systemInstruction },
        });
      } catch {
        // Re-throw only if no curated clinical context is available to ground a safe fallback
        if (kbMatches.length === 0 && references.length === 0) {
          throw primaryErr;
        }
      }
    }

    let reply = response?.text?.trim() || '';

    if (!reply) {
      const topEntry = kbMatches[0]?.entry;
      const topRef = references[0];
      if (language === 'hi') {
        reply = `### 1. आपके प्रश्न का अर्थ\nआपने **"${message}"** के बारे में सामान्य स्वास्थ्य जानकारी और सुरक्षित अगले कदम पूछे हैं।\n\n### 2. सामान्य चिकित्सा जानकारी\n${
          topEntry?.summaryHi ||
          topRef?.commonUses ||
          'लगातार या बढ़ते हुए लक्षणों का सही कारण केवल प्रत्यक्ष चिकित्सकीय जांच द्वारा ही समझा जा सकता है।'
        }\n\n### 3. महत्वपूर्ण बातें और सावधानियां\n${
          topEntry?.precautionsHi ||
          topRef?.precautions ||
          'बिना डॉक्टर की सलाह स्वयं दवा शुरू न करें, न बदलें और न ही बंद करें।'
        }\n\n### 4. आगे क्या करें\n- अपने लक्षणों की अवधि, गंभीरता और तापमान (यदि बुखार है) नोट करें।\n- पर्याप्त तरल पदार्थ और आराम बनाए रखें।\n\n### 5. डॉक्टर से कब मिलें\nयदि लक्षण 2–3 दिनों से अधिक बने रहें, तेज़ हों या दैनिक गतिविधियों को प्रभावित करें तो योग्य डॉक्टर से परामर्श लें।\n\n### 6. आपातकालीन सहायता कब आवश्यक है (112)\nसांस लेने में कठिनाई, सीने में दर्द, बेहोशी, लगातार उल्टी या गंभीर रक्तस्राव होने पर तुरंत **112** पर कॉल करें।`;
      } else {
        reply = `### 1. What Your Question Means\nYou are asking for general medical information and safe next steps regarding **"${message}"**.\n\n### 2. General Medical Information\n${
          topEntry?.summaryEn ||
          topRef?.commonUses ||
          'Persistent or worsening symptoms require an in-person clinical evaluation to identify the underlying cause safely.'
        }\n\n### 3. Important Considerations & Limitations\n${
          topEntry?.precautionsEn ||
          topRef?.precautions ||
          'Do not start, stop, or combine prescription medications without consulting a qualified doctor or pharmacist.'
        }\n\n### 4. What You Can Do Next\n- Note when your symptoms started, how severe they are, and any changes over time.\n- Stay safely hydrated and rest while arranging a medical review.\n\n### 5. When to Consult a Doctor\nArrange a prompt visit with a qualified clinician if symptoms persist beyond 2–3 days, worsen, or interfere with normal daily activities.\n\n### 6. When Immediate Emergency Help Is Necessary (Call 112)\nCall **112** or go to the nearest emergency hospital immediately if you develop chest pain, trouble breathing, confusion, stiff neck, severe bleeding, or inability to keep fluids down.`;
      }
    }

    // Extract Google Search grounding citations if returned
    const groundingChunks =
      response?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const groundingSources = groundingChunks
      .filter((c) => c.web?.uri && c.web?.title)
      .map((c) => ({
        title: c.web!.title!,
        uri: c.web!.uri!,
      }))
      .slice(0, 5);

    return NextResponse.json({
      reply,
      intent: detectedIntent,
      emergency: emergencyCheck,
      references,
      groundingSources,
      recommendedCare,
      followUpSuggestions,
      language,
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
