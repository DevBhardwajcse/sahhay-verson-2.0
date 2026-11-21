import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
} from '@/lib/gemini-server';
import { checkApiRateLimit } from '@/lib/security-utils';

const TtsSchema = z.object({
  text: z.string().trim().min(1).max(1400),
  language: z.enum(['en', 'hi']).default('en'),
});

function stripMarkdownForSpeech(input: string): string {
  return input
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`tts:${clientIp}`, 25, 60_000)) {
      return NextResponse.json(
        { error: 'Too many audio synthesis requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = TtsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid speech text payload.' }, { status: 400 });
    }

    const spokenText = stripMarkdownForSpeech(parsed.data.text);
    if (!spokenText) {
      return NextResponse.json({ error: 'No speakable text provided.' }, { status: 400 });
    }

    const ai = getGeminiServerClient();
    const stylePrompt =
      parsed.data.language === 'hi'
        ? 'Speak calmly, warmly, and clearly in natural Hindi like a caring healthcare information assistant.'
        : 'Speak calmly, warmly, and clearly in natural English like a caring healthcare information assistant.';

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.ttsStandard,
      contents: spokenText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
        // Pass gentle tone instruction via systemInstruction for natural delivery
        systemInstruction: stylePrompt,
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data
    );
    if (!audioPart?.inlineData?.data) {
      return NextResponse.json(
        { error: 'Voice playback audio could not be generated. Please read the text transcript.' },
        { status: 502 }
      );
    }

    // Unary TTS generateContent returns a complete audio/wav payload directly
    return NextResponse.json({
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav',
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
