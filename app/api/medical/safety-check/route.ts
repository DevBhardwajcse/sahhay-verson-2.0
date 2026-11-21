import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp } from '@/lib/api-helpers';
import { checkMedicineSafety } from '@/lib/drug-interactions';
import { checkApiRateLimit } from '@/lib/security-utils';

const SafetyCheckSchema = z.object({
  medicines: z.array(z.string().trim().min(2).max(100)).min(2).max(12),
  language: z.enum(['en', 'hi']).default('en'),
});

interface OpenFdaInteractionExcerpt {
  medicine: string;
  source: string;
  excerpt: string;
  url: string;
}

async function fetchOpenFdaInteractionNote(medicine: string): Promise<OpenFdaInteractionExcerpt | null> {
  try {
    const safeTerm = medicine.replace(/[^a-zA-Z0-9\s-]/g, '').trim().split(/\s+/).slice(0, 2).join('+');
    if (safeTerm.length < 3) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
        safeTerm
      )}"+openfda.brand_name:"${encodeURIComponent(safeTerm)}"&limit=1`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        drug_interactions?: string[];
        warnings?: string[];
        openfda?: { generic_name?: string[]; brand_name?: string[] };
      }>;
    };
    const item = data.results?.[0];
    if (!item) return null;
    const interactionText = item.drug_interactions?.[0] || item.warnings?.[0];
    if (!interactionText) return null;

    return {
      medicine: item.openfda?.generic_name?.[0] || item.openfda?.brand_name?.[0] || medicine,
      source: 'U.S. FDA OpenFDA Drug Labeling Database',
      excerpt: interactionText.replace(/\s+/g, ' ').trim().slice(0, 420),
      url: 'https://open.fda.gov/apis/drug/label/',
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  if (!checkApiRateLimit(`safety-check:${clientIp}`, 25, 60_000)) {
    return NextResponse.json(
      { error: 'Too many safety check requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const parsed = SafetyCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter at least 2 medicine names (2–100 characters each) to check.' },
      { status: 400 }
    );
  }

  const { medicines, language } = parsed.data;
  const deterministicResult = checkMedicineSafety(medicines);

  // Enrich with live OpenFDA official drug interaction excerpts for up to first 4 listed medicines
  const fdaChecks = await Promise.all(
    medicines.slice(0, 4).map((m) => fetchOpenFdaInteractionNote(m))
  );
  const openFdaExcerpts = fdaChecks.filter((x): x is OpenFdaInteractionExcerpt => x !== null);

  return NextResponse.json({
    ...deterministicResult,
    openFdaExcerpts,
    language,
    checkedAt: new Date().toISOString(),
  });
}
