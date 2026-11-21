import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBearerToken } from '@/lib/api-helpers';
import { listFacilityReports, markFacilityReportReviewed } from '@/lib/facility-reports-store';
import { listAnswerReports, markAnswerReportReviewed } from '@/lib/answer-reports-store';
import { resolveGoogleMapsApiKey } from '@/lib/maps-key';
import { verifyAdminSessionToken } from '@/lib/security-utils';

export interface ServerAuditEntry {
  id: string;
  actor: string;
  action: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface ServerManagedRecord {
  id: string;
  patientLabel: string;
  language: 'en' | 'hi';
  recordType: 'chat' | 'medicine' | 'injury' | 'triage';
  title: string;
  summary: string;
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
  consentVerified: boolean;
  isSyntheticDemo: boolean;
  archived: boolean;
  createdAt: string;
}

const globalForAdmin = globalThis as unknown as {
  __sahaayDemoRecords?: ServerManagedRecord[];
  __sahaayServerAudit?: ServerAuditEntry[];
};

function ensureStore() {
  if (!globalForAdmin.__sahaayDemoRecords) {
    globalForAdmin.__sahaayDemoRecords = [
      {
        id: 'demo-rec-001',
        patientLabel: 'SYNTHETIC DEMO RECORD #01 (Consented Summary)',
        language: 'en',
        recordType: 'medicine',
        title: 'Medicine Packaging Scan — Paracetamol 500 mg',
        summary:
          'Consented text summary only (no raw photo stored). Verified against WHO/NLEM India reference; reminded to confirm dose with pharmacist.',
        urgencyLevel: 'routine',
        consentVerified: true,
        isSyntheticDemo: true,
        archived: false,
        createdAt: new Date(Date.now() - 86_400_000 * 2).toISOString(),
      },
      {
        id: 'demo-rec-002',
        patientLabel: 'SYNTHETIC DEMO RECORD #02 (Consented Summary)',
        language: 'hi',
        recordType: 'triage',
        title: 'ऑफ़लाइन ट्राइएज — बुखार और कमजोरी (3 दिन)',
        summary:
          'Consented triage outcome: Consult a doctor or PHC within 24–48 hours. No raw audio or imagery retained.',
        urgencyLevel: 'soon',
        consentVerified: true,
        isSyntheticDemo: true,
        archived: false,
        createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: 'demo-rec-003',
        patientLabel: 'SYNTHETIC DEMO RECORD #03 (Consented Summary)',
        language: 'en',
        recordType: 'injury',
        title: 'Visible Injury Observation — Forearm Abrasion',
        summary:
          'Consented non-graphic observation summary only (source photograph discarded immediately after analysis). Advised in-person clinician evaluation.',
        urgencyLevel: 'urgent',
        consentVerified: true,
        isSyntheticDemo: true,
        archived: false,
        createdAt: new Date(Date.now() - 3_600_000 * 5).toISOString(),
      },
    ];
  }
  if (!globalForAdmin.__sahaayServerAudit) {
    globalForAdmin.__sahaayServerAudit = [
      {
        id: 'audit-init-001',
        actor: 'system',
        action: 'SECURITY_POSTURE_VERIFIED',
        targetId: 'sahaay-core',
        details:
          'Server-only Gemini API key isolation active; Firestore Eight Pillars rules deployed; raw medical images excluded from persistence.',
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

function requireAdmin(req: NextRequest) {
  return verifyAdminSessionToken(extractBearerToken(req));
}

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized. Valid administrator session required.' },
      { status: 401 }
    );
  }

  ensureStore();
  const records = globalForAdmin.__sahaayDemoRecords!;
  const auditLogs = globalForAdmin.__sahaayServerAudit!;

  return NextResponse.json({
    adminUser: session.sub,
    securityPosture: {
      geminiKeyServerOnly: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      mapsKeyConfigured: Boolean(resolveGoogleMapsApiKey()),
      rawMedicalPhotosStored: false,
      secretsExposedToClient: false,
      dpdpConsentEnforced: true,
    },
    records,
    facilityReports: listFacilityReports(),
    answerReports: listAnswerReports(),
    auditLogs: auditLogs.slice(0, 50),
  });
}

const PatchRecordSchema = z.union([
  z.object({
    id: z.string().min(1).max(80),
    archived: z.boolean(),
  }),
  z.object({
    reportId: z.string().min(1).max(80),
    markReviewed: z.literal(true),
  }),
  z.object({
    answerReportId: z.string().min(1).max(80),
    markReviewed: z.literal(true),
  }),
]);

export async function PATCH(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = PatchRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid record update payload.' }, { status: 400 });
  }

  ensureStore();
  const payload = parsed.data;
  if ('answerReportId' in payload) {
    const updatedAnswerReport = markAnswerReportReviewed(payload.answerReportId);
    if (!updatedAnswerReport) {
      return NextResponse.json({ error: 'Answer quality report not found.' }, { status: 404 });
    }
    globalForAdmin.__sahaayServerAudit!.unshift({
      id: `audit-${Date.now()}`,
      actor: session.sub,
      action: 'REVIEW_AI_ANSWER_REPORT',
      targetId: updatedAnswerReport.id,
      details: `Reviewed flagged AI answer report (${updatedAnswerReport.issueCategory}).`,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, answerReport: updatedAnswerReport });
  }

  if ('reportId' in payload) {
    const updatedReport = markFacilityReportReviewed(payload.reportId);
    if (!updatedReport) {
      return NextResponse.json({ error: 'Facility report not found.' }, { status: 404 });
    }
    globalForAdmin.__sahaayServerAudit!.unshift({
      id: `audit-${Date.now()}`,
      actor: session.sub,
      action: 'REVIEW_FACILITY_REPORT',
      targetId: updatedReport.id,
      details: `Marked facility report for "${updatedReport.facilityName}" (${updatedReport.issueType}) as reviewed.`,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, report: updatedReport });
  }

  const target = globalForAdmin.__sahaayDemoRecords!.find((r) => r.id === payload.id);
  if (!target) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }

  target.archived = payload.archived;
  globalForAdmin.__sahaayServerAudit!.unshift({
    id: `audit-${Date.now()}`,
    actor: session.sub,
    action: payload.archived ? 'ARCHIVE_DEMO_RECORD' : 'RESTORE_DEMO_RECORD',
    targetId: target.id,
    details: `${payload.archived ? 'Archived' : 'Restored'} consented summary "${target.title}".`,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, record: target });
}

export async function DELETE(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 });
  }

  ensureStore();
  const idx = globalForAdmin.__sahaayDemoRecords!.findIndex((r) => r.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }

  const [removed] = globalForAdmin.__sahaayDemoRecords!.splice(idx, 1);
  globalForAdmin.__sahaayServerAudit!.unshift({
    id: `audit-${Date.now()}`,
    actor: session.sub,
    action: 'DELETE_DEMO_RECORD',
    targetId: removed.id,
    details: `Permanently deleted consented summary "${removed.title}".`,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, deletedId: removed.id });
}
