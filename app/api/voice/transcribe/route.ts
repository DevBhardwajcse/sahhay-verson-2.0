import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { z } from 'zod';
import {
  GEMINI_MODELS,
  formatSafeGeminiError,
  getGeminiServerClient,
} from '@/lib/gemini-server';
import { checkApiRateLimit } from '@/lib/security-utils';

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/mpeg',
]);

const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // 8 MB

const TranscribeSchema = z.object({
  audioBase64: z.string().min(50),
  mimeType: z.string().min(5).max(50),
  preferredLanguage: z.enum(['auto', 'en', 'hi']).optional().default('auto'),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`transcribe:${clientIp}`, 25, 60_000)) {
      return NextResponse.json(
        { error: 'Too many voice requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = TranscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid audio payload received.' },
        { status: 400 }
      );
    }

    const { audioBase64, mimeType, preferredLanguage } = parsed.data;
    const baseMime = mimeType.split(';')[0].trim().toLowerCase();
    if (!ALLOWED_AUDIO_MIMES.has(mimeType.toLowerCase()) && !ALLOWED_AUDIO_MIMES.has(baseMime)) {
      return NextResponse.json(
        { error: 'Unsupported audio recording format.' },
        { status: 400 }
      );
    }

    const cleaned = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.;=+-]+;base64,/, '');
    const byteLength = Math.floor((cleaned.length * 3) / 4);
    if (byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: 'Audio recording exceeds the 8 MB limit. Please record a shorter message.' },
        { status: 400 }
      );
    }

    const ai = getGeminiServerClient();
    const langHint =
      preferredLanguage === 'hi'
        ? 'The speaker prefers Hindi (Devanagari script).'
        : preferredLanguage === 'en'
          ? 'The speaker prefers English.'
          : 'Auto-detect whether the speaker is speaking Hindi or English.';

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.transcribe,
      contents: [
        {
          inlineData: {
            mimeType: baseMime,
            data: cleaned,
          },
        },
        `Transcribe the spoken medical question accurately. ${langHint} If spoken in Hindi, transcribe in clean Devanagari Hindi. Return JSON with fields "transcript" and "detectedLanguage" ("en" or "hi"). If no speech is audible, return an empty string for transcript.`,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING, enum: ['en', 'hi'] },
          },
          required: ['transcript', 'detectedLanguage'],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || '{"transcript":"","detectedLanguage":"en"}') as {
      transcript: string;
      detectedLanguage: 'en' | 'hi';
    };

    return NextResponse.json({
      transcript: data.transcript?.trim() || '',
      detectedLanguage: data.detectedLanguage === 'hi' ? 'hi' : 'en',
    });
  } catch (err) {
    const safe = formatSafeGeminiError(err);
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
