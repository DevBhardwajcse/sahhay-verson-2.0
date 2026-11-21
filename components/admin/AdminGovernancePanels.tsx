'use client';

import React from 'react';
import Link from 'next/link';
import type { AdminAuditLogRecord, UserProfileRecord } from '@/lib/firebase-client';
import type { AnswerVerificationReport } from '@/lib/answer-reports-store';
import type { FacilityInfoReport } from '@/lib/facility-reports-store';
import type { ServerAuditEntry } from '@/app/api/admin/records/route';

export function PatientsPanel({ profiles }: { profiles: UserProfileRecord[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-bold text-slate-900">
        Registered User Profiles (Consented Metadata Only)
      </h2>
      {profiles.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          No live Firestore user profiles loaded yet. Sign in with the verified Firebase Admin
          Google account to query live profiles.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 text-xs">
          {profiles.map((p) => (
            <div key={p.uid} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <div className="font-bold text-slate-900">
                  {p.displayName} ({p.patientRefId})
                </div>
                <div className="text-slate-500">
                  Lang: {p.preferredLanguage.toUpperCase()} · Retention: {p.retentionDays}d ·
                  Medical History Consent: {p.consentMedicalHistory ? 'Granted' : 'No'}
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-500">{p.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FacilityReportsPanel({
  reports,
  canReview,
  onMarkReviewed,
}: {
  reports: FacilityInfoReport[];
  canReview: boolean;
  onMarkReviewed: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-bold text-slate-900">User-Reported Facility Corrections</h2>
      {reports.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          No facility correction reports submitted yet. Users can report closed hospitals or wrong
          phone numbers directly from the Live Hospital Map.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 text-xs">
          {reports.map((rep) => (
            <div key={rep.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <div className="font-bold text-slate-900">{rep.facilityName}</div>
                <div className="text-[11px] text-slate-500">{rep.facilityAddress}</div>
                <div className="mt-1 text-slate-700">
                  <span className="font-mono font-bold text-amber-800 uppercase">
                    {rep.issueType.replace(/_/g, ' ')}
                  </span>{' '}
                  — {rep.details}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase text-slate-500">{rep.status}</span>
                {rep.status === 'open' && canReview && (
                  <button
                    type="button"
                    onClick={() => onMarkReviewed(rep.id)}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800"
                  >
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiQualityMonitorPanel({
  reports,
  canReview,
  onMarkReviewed,
}: {
  reports: AnswerVerificationReport[];
  canReview: boolean;
  onMarkReviewed: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            AI Response Quality Monitor &amp; Verification Reports
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            User-flagged AI medical answers submitted from the chat interface or the dedicated
            /verification portal.
          </p>
        </div>
        <Link
          href="/verification"
          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
        >
          Open Public /verification Registry
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          No AI medical answer quality reports have been submitted yet.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 text-xs">
          {reports.map((rep) => (
            <div key={rep.id} className="flex flex-wrap items-start justify-between gap-4 py-3.5">
              <div className="max-w-3xl space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-amber-800 uppercase">
                    {rep.issueCategory.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    {new Date(rep.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </span>
                </div>
                <div className="font-bold text-slate-900">Question: {rep.questionSnippet}</div>
                {rep.answerSnippet && (
                  <div className="text-slate-600">Answer excerpt: {rep.answerSnippet}</div>
                )}
                <div className="text-slate-800">Report details: {rep.details}</div>
                {rep.sourceCited && (
                  <div className="text-[11px] text-teal-800">Source cited: {rep.sourceCited}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[11px] font-bold uppercase ${
                    rep.reviewed ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {rep.reviewed ? 'Reviewed' : 'Open Review'}
                </span>
                {!rep.reviewed && canReview && (
                  <button
                    type="button"
                    onClick={() => onMarkReviewed(rep.id)}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800"
                  >
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditLogPanel({
  serverAuditLogs,
  firestoreAudit,
}: {
  serverAuditLogs: ServerAuditEntry[];
  firestoreAudit: AdminAuditLogRecord[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-bold text-slate-900">Append-Only Administrative Audit Trail</h2>
      <div className="mt-3 divide-y divide-slate-100 text-xs">
        {serverAuditLogs.map((log) => (
          <div key={log.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-bold text-teal-800">{log.action}</span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {new Date(log.createdAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                })}
              </span>
            </div>
            <p className="mt-1 text-slate-700">{log.details}</p>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Actor: {log.actor} · Target: {log.targetId}
            </div>
          </div>
        ))}
        {firestoreAudit.map((log) => (
          <div key={log.logId} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-bold text-slate-800">{log.action}</span>
              <span className="font-mono text-[11px] text-slate-500">Firestore</span>
            </div>
            <p className="mt-1 text-slate-700">{log.details}</p>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Actor: {log.adminLabel} · Target: {log.targetRefId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
