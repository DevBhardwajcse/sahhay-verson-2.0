import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp } from '@/lib/api-helpers';
import { addAnswerReport } from '@/lib/answer-reports-store';
import { checkApiRateLimit } from '@/lib/security-utils';

const AnswerReportSchema = z.object({
  questionSnippet: z.string().trim().min(3).max(500),
  answerSnippet: z.string().trim().max(1000).optional().default(''),
  issueCategory: z.enum([
    'inaccurate_medical_info',
    'outdated_source',
    'missing_warning',
    'translation_error',
    'other',
  ]),
  details: z.string().trim().min(5).max(800),
  sourceCited: z.string().trim().max(200).optional().default('Not specified'),
});

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  if (!checkApiRateLimit(`answer-report:${clientIp}`, 15, 60_000)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = AnswerReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please describe the concern clearly (at least 5 characters).' },
      { status: 400 }
    );
  }

  const saved = addAnswerReport(parsed.data);
  return NextResponse.json(
    {
      ok: true,
      reportId: saved.id,
      message:
        'Thank you — this answer quality report has been logged for clinical content review in the Admin Portal.',
    },
    { status: 201 }
  );
}
