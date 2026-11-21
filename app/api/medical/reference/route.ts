import { NextRequest, NextResponse } from 'next/server';
import { lookupClinicalReference } from '@/lib/gemini-server';
import { checkApiRateLimit } from '@/lib/security-utils';

export async function GET(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!checkApiRateLimit(`ref:${clientIp}`, 40, 60_000)) {
    return NextResponse.json(
      { error: 'Too many reference lookups. Please wait a moment.' },
      { status: 429 }
    );
  }

  const query = req.nextUrl.searchParams.get('q')?.trim() || '';
  const kindParam = req.nextUrl.searchParams.get('kind');
  const kind = kindParam === 'topic' ? 'topic' : 'medicine';

  if (query.length < 2 || query.length > 120) {
    return NextResponse.json(
      { error: 'Please enter a medicine or health topic (2 to 120 characters).' },
      { status: 400 }
    );
  }

  const results = await lookupClinicalReference(query, kind);
  return NextResponse.json({
    query,
    kind,
    sourcesQueried: [
      'WHO Essential Medicines / NLEM India / ICMR Curated Reference',
      'U.S. FDA Drug Labeling Database (OpenFDA)',
      'NIH / U.S. National Library of Medicine (MedlinePlus)',
    ],
    results,
  });
}
