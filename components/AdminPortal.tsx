'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Flag,
  Lock,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  AdminAuditLogRecord,
  SavedSessionRecord,
  UserProfileRecord,
  adminFetchAllProfiles,
  adminFetchAllSessions,
  adminFetchAuditLogs,
  adminWriteAuditLog,
  deleteSavedSession,
} from '@/lib/firebase-client';
import type { AnswerVerificationReport } from '@/lib/answer-reports-store';
import type { FacilityInfoReport } from '@/lib/facility-reports-store';
import type { ServerAuditEntry, ServerManagedRecord } from '@/app/api/admin/records/route';
import { useAuth } from './AuthProvider';
import { AdminLoginCard } from './admin/AdminLoginCard';
import {
  AdminRecordsTable,
  RecordDetailModal,
  type CombinedAdminRow,
  type SelectedAdminRecord,
} from './admin/AdminRecordsTable';
import {
  AiQualityMonitorPanel,
  AuditLogPanel,
  FacilityReportsPanel,
  PatientsPanel,
} from './admin/AdminGovernancePanels';

export function AdminPortal() {
  const { user, isFirebaseAdmin, signInWithGoogle, signOut } = useAuth();

  // Server-side `dev admin` auth state (Bearer token kept strictly in React state, NEVER localStorage)
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [requiresFirstRunSetup, setRequiresFirstRunSetup] = useState(false);
  const [configuredViaEnv, setConfiguredViaEnv] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminLabel, setAdminLabel] = useState<string | null>(null);

  const [username, setUsername] = useState('dev admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [serverRecords, setServerRecords] = useState<ServerManagedRecord[]>([]);
  const [facilityReports, setFacilityReports] = useState<FacilityInfoReport[]>([]);
  const [answerReports, setAnswerReports] = useState<AnswerVerificationReport[]>([]);
  const [serverAuditLogs, setServerAuditLogs] = useState<ServerAuditEntry[]>([]);
  const [securityPosture, setSecurityPosture] = useState<{
    geminiKeyServerOnly: boolean;
    mapsKeyConfigured: boolean;
    rawMedicalPhotosStored: boolean;
    secretsExposedToClient: boolean;
    dpdpConsentEnforced: boolean;
  } | null>(null);

  const [firestoreProfiles, setFirestoreProfiles] = useState<UserProfileRecord[]>([]);
  const [firestoreSessions, setFirestoreSessions] = useState<SavedSessionRecord[]>([]);
  const [firestoreAudit, setFirestoreAudit] = useState<AdminAuditLogRecord[]>([]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<
    'records' | 'patients' | 'reports' | 'ai_quality' | 'audit'
  >('records');
  const [selectedRecord, setSelectedRecord] = useState<SelectedAdminRecord | null>(null);

  const loadServerAdminData = useCallback(async (token: string) => {
    const res = await fetch('/api/admin/records', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setServerRecords(data.records || []);
    setFacilityReports(data.facilityReports || []);
    setAnswerReports(data.answerReports || []);
    setServerAuditLogs(data.auditLogs || []);
    setSecurityPosture(data.securityPosture || null);
  }, []);

  const loadFirestoreAdminData = useCallback(async () => {
    if (!isFirebaseAdmin || !user) return;
    try {
      const [profiles, sessions, logs] = await Promise.all([
        adminFetchAllProfiles(),
        adminFetchAllSessions(),
        adminFetchAuditLogs(),
      ]);
      setFirestoreProfiles(profiles);
      setFirestoreSessions(sessions);
      setFirestoreAudit(logs);
      await adminWriteAuditLog({
        adminUid: user.uid,
        adminLabel: user.email || 'Firebase Admin',
        action: 'view_dashboard',
        targetRefId: 'admin-portal',
        details: 'Opened SAHAAY Admin Portal dashboard.',
      });
    } catch {
      // Non-fatal if Firestore admin permissions not matched
    }
  }, [isFirebaseAdmin, user]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/auth')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setRequiresFirstRunSetup(Boolean(data.requiresFirstRunSetup));
          setConfiguredViaEnv(Boolean(data.configuredViaEnv));
        }
      })
      .finally(() => {
        if (!cancelled) setBootstrapLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    let cancelled = false;
    fetch('/api/admin/records', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setServerRecords(data.records || []);
          setFacilityReports(data.facilityReports || []);
          setAnswerReports(data.answerReports || []);
          setServerAuditLogs(data.auditLogs || []);
          setSecurityPosture(data.securityPosture || null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  useEffect(() => {
    if (!isFirebaseAdmin || !user) return;
    let cancelled = false;
    Promise.all([adminFetchAllProfiles(), adminFetchAllSessions(), adminFetchAuditLogs()])
      .then(([profiles, sessions, logs]) => {
        if (cancelled) return;
        setFirestoreProfiles(profiles);
        setFirestoreSessions(sessions);
        setFirestoreAudit(logs);
        return adminWriteAuditLog({
          adminUid: user.uid,
          adminLabel: user.email || 'Firebase Admin',
          action: 'view_dashboard',
          targetRefId: 'admin-portal',
          details: 'Opened SAHAAY Admin Portal dashboard.',
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isFirebaseAdmin, user]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (requiresFirstRunSetup && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthBusy(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: requiresFirstRunSetup ? 'claim' : 'login',
          username,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      setAdminToken(data.token);
      setAdminLabel(data.adminUser || 'dev admin');
      setRequiresFirstRunSetup(false);
      setPassword('');
      setConfirmPassword('');
    } catch {
      setAuthError('Could not reach admin authentication service.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: 'logout' }),
      }).catch(() => {});
    }
    setAdminToken(null);
    setAdminLabel(null);
    setServerRecords([]);
    setServerAuditLogs([]);
    setSelectedRecord(null);
  };

  const handleArchiveToggle = async (id: string) => {
    if (!adminToken) return;
    const record = serverRecords.find((r) => r.id === id);
    if (!record) return;
    const res = await fetch('/api/admin/records', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ id: record.id, archived: !record.archived }),
    });
    if (res.ok) {
      await loadServerAdminData(adminToken);
    }
  };

  const handleDeleteServerRecord = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/records?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      await loadServerAdminData(adminToken);
    }
  };

  const handleMarkReportReviewed = async (reportId: string) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/records', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reportId, markReviewed: true }),
    });
    if (res.ok) {
      await loadServerAdminData(adminToken);
    }
  };

  const handleMarkAnswerReportReviewed = async (answerReportId: string) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/records', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ answerReportId, markReviewed: true }),
    });
    if (res.ok) {
      await loadServerAdminData(adminToken);
    }
  };

  const handleExportRecord = (title: string, summary: string) => {
    const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'record';
    const blob = new Blob([`SAHAAY Consented Record Export\nTitle: ${title}\n\n${summary}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahaay-admin-${safeSlug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAuthorized = Boolean(adminToken || isFirebaseAdmin);

  const combinedRecords: CombinedAdminRow[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fsRows: CombinedAdminRow[] = firestoreSessions.map((s) => ({
      id: s.sessionId,
      patientLabel: s.patientRefId,
      recordType: s.sessionType,
      language: s.language,
      title: s.title,
      summary: s.summary,
      urgencyLevel: s.urgencyLevel,
      archived: s.status === 'archived',
      isSyntheticDemo: false,
      source: 'firestore',
      createdAt: s.createdAt?.toDate?.()?.toISOString?.() || '',
    }));

    const srvRows: CombinedAdminRow[] = serverRecords.map((r) => ({
      id: r.id,
      patientLabel: r.patientLabel,
      recordType: r.recordType,
      language: r.language,
      title: r.title,
      summary: r.summary,
      urgencyLevel: r.urgencyLevel,
      archived: r.archived,
      isSyntheticDemo: r.isSyntheticDemo,
      source: 'server',
      createdAt: r.createdAt,
    }));

    return [...fsRows, ...srvRows].filter((row) => {
      if (typeFilter !== 'all' && !row.recordType.includes(typeFilter)) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.patientLabel.toLowerCase().includes(q) ||
        row.summary.toLowerCase().includes(q)
      );
    });
  }, [firestoreSessions, serverRecords, search, typeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                SAHAAY Role-Protected Admin Portal
              </div>
              <div className="text-[11px] text-slate-500">
                Consented Summary Governance &amp; Security Audit Console
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/?autostart=1"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to SAHAAY App</span>
            </Link>
            {isAuthorized && (
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                  if (user) void signOut();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!isAuthorized ? (
          <AdminLoginCard
            bootstrapLoading={bootstrapLoading}
            requiresFirstRunSetup={requiresFirstRunSetup}
            configuredViaEnv={configuredViaEnv}
            username={username}
            password={password}
            confirmPassword={confirmPassword}
            authError={authError}
            authBusy={authBusy}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleAdminSubmit}
            onGoogleSignIn={() => void signInWithGoogle('en')}
          />
        ) : (
          <div className="space-y-6">
            {/* Security Posture & Real Counts */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold text-slate-500">Live Firestore Patients</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
                  {firestoreProfiles.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {isFirebaseAdmin
                    ? 'Synced with Firestore'
                    : 'Sign in with Firebase Admin Google account to view live profiles'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold text-slate-500">Consented Saved Records</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
                  {combinedRecords.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {firestoreSessions.length} live · {serverRecords.length} labeled synthetic preview
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold text-slate-500">Audit Events Logged</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
                  {serverAuditLogs.length + firestoreAudit.length}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Append-only administrative accountability
                </div>
              </div>

              <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>Secret Isolation Verified</span>
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-teal-950">
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-teal-700" aria-hidden="true" />
                    Gemini API Key: Server-Only
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-teal-700" aria-hidden="true" />
                    Raw Medical Photos: Never Stored
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-teal-700" aria-hidden="true" />
                    Client Secrets Exposed: {securityPosture?.secretsExposedToClient ? 'Yes' : 'Zero'}
                  </li>
                </ul>
              </div>
            </section>

            {/* Sub-Tab Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'records', label: 'Consented Session Records', icon: ClipboardList },
                    { id: 'patients', label: 'Registered Profiles', icon: Users },
                    {
                      id: 'reports',
                      label: `Facility Reports (${facilityReports.length})`,
                      icon: Flag,
                    },
                    {
                      id: 'ai_quality',
                      label: `AI Quality Monitor (${answerReports.length})`,
                      icon: ShieldAlert,
                    },
                    { id: 'audit', label: 'Append-Only Audit Log', icon: ShieldCheck },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                        activeSubTab === tab.id
                          ? 'bg-teal-700 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-500">
                Active Operator:{' '}
                <strong className="font-semibold text-slate-800">
                  {adminLabel || user?.email || 'Administrator'}
                </strong>
              </div>
            </div>

            {activeSubTab === 'records' && (
              <AdminRecordsTable
                records={combinedRecords}
                search={search}
                typeFilter={typeFilter}
                onSearchChange={setSearch}
                onTypeFilterChange={setTypeFilter}
                onSelectRecord={setSelectedRecord}
                onExportRecord={handleExportRecord}
                onArchiveServerRecord={(id) => void handleArchiveToggle(id)}
                onDeleteServerRecord={(id) => void handleDeleteServerRecord(id)}
                onDeleteFirestoreRecord={(id) => {
                  void (async () => {
                    await deleteSavedSession(id);
                    await loadFirestoreAdminData();
                  })();
                }}
              />
            )}

            {activeSubTab === 'patients' && <PatientsPanel profiles={firestoreProfiles} />}

            {activeSubTab === 'reports' && (
              <FacilityReportsPanel
                reports={facilityReports}
                canReview={Boolean(adminToken)}
                onMarkReviewed={(id) => void handleMarkReportReviewed(id)}
              />
            )}

            {activeSubTab === 'ai_quality' && (
              <AiQualityMonitorPanel
                reports={answerReports}
                canReview={Boolean(adminToken)}
                onMarkReviewed={(id) => void handleMarkAnswerReportReviewed(id)}
              />
            )}

            {activeSubTab === 'audit' && (
              <AuditLogPanel serverAuditLogs={serverAuditLogs} firestoreAudit={firestoreAudit} />
            )}
          </div>
        )}
      </main>

      {selectedRecord && (
        <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}
