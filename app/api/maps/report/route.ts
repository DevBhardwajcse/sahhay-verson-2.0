import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp } from '@/lib/api-helpers';
import { addFacilityReport } from '@/lib/facility-reports-store';
import { checkApiRateLimit } from '@/lib/security-utils';

const ReportSchema = z.object({
  placeId: z.string().trim().min(1).max(200),
  facilityName: z.string().trim().min(1).max(160),
  facilityAddress: z.string().trim().max(300).optional().default(''),
  issueType: z.enum([
    'closed',
    'wrong_phone',
    'wrong_address',
    'wrong_hours',
    'wrong_specialty',
    'other',
  ]),
  details: z.string().trim().min(3).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    if (!checkApiRateLimit(`maps-report:${clientIp}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many reports submitted. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please select an issue type and provide a brief description (3–500 characters).' },
        { status: 400 }
      );
    }

    const saved = addFacilityReport(parsed.data);

    // Append to admin audit stream if initialized
    const globalForAdmin = globalThis as unknown as {
      __sahaayServerAudit?: Array<{
        id: string;
        actor: string;
        action: string;
        targetId: string;
        details: string;
        createdAt: string;
      }>;
    };
    if (globalForAdmin.__sahaayServerAudit) {
      globalForAdmin.__sahaayServerAudit.unshift({
        id: `audit-${Date.now()}`,
        actor: 'public-user',
        action: 'FACILITY_INFO_REPORTED',
        targetId: saved.id,
        details: `Reported ${saved.issueType} for "${saved.facilityName}": ${saved.details.slice(0, 120)}`,
        createdAt: saved.createdAt,
      });
    }

    return NextResponse.json({
      ok: true,
      reportId: saved.id,
      message: 'Thank you. Your facility correction report has been logged for review.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not submit facility report right now.' },
      { status: 500 }
    );
  }
}
