'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Flag,
  HeartPulse,
  Loader2,
  PhoneCall,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { CURATED_CLINICAL_KNOWLEDGE_BASE } from '@/lib/clinical-knowledge-base';
import { CURATED_DRUG_INTERACTIONS } from '@/lib/drug-interactions';

const EXTERNAL_PUBLIC_DATABASES = [
  {
    id: 'openfda',
    title: 'U.S. FDA OpenFDA Drug Labeling API',
    authority: 'U.S. Food & Drug Administration',
    tier: 'Tier 2 · Live Regulatory Drug Database',
    lastVerifiedDate: '2026-03-01',
    scope: 'Official drug indications, active ingredients, boxed warnings, and drug-drug interaction excerpts.',
    limitations: 'Covers U.S.-registered labels; Indian brand formulations and combination strips require local pharmacist confirmation.',
    url: 'https://open.fda.gov/apis/drug/label/',
  },
  {
    id: 'medlineplus',
    title: 'NIH National Library of Medicine — MedlinePlus',
    authority: 'U.S. National Institutes of Health (NLM)',
    tier: 'Tier 2 · Live Patient Health Encyclopedia',
    lastVerifiedDate: '2026-03-01',
    scope: 'Peer-reviewed general health education summaries on symptoms, chronic conditions, and medical terminology.',
    limitations: 'General educational reference only; cannot account for individual medical history or replace physical exam.',
    url: 'https://medlineplus.gov/',
  },
  {
    id: 'eraktkosh',
    title: 'e-RaktKosh Centralized Blood Bank Management System',
    authority: 'Ministry of Health & Family Welfare (MoHFW), Govt. of India',
    tier: 'Tier 1 · Official National Blood Stock Portal',
    lastVerifiedDate: '2026-03-01',
    scope: 'Official government blood-unit availability lookup across licensed Indian blood banks.',
    limitations: 'Real-time unit availability must be checked directly on e-RaktKosh or confirmed by phone with the blood bank.',
    url: 'https://eraktkosh.mohfw.gov.in/',
  },
];

export function VerificationPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('all');

  // Report Potentially Incorrect AI Answer form state
  const [questionSnippet, setQuestionSnippet] = useState('');
  const [answerSnippet, setAnswerSnippet] = useState('');
  const [issueCategory, setIssueCategory] = useState<
    'inaccurate_medical_info' | 'outdated_source' | 'missing_warning' | 'translation_error' | 'other'
  >('inaccurate_medical_info');
  const [sourceCited, setSourceCited] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const authorities = useMemo(() => {
    const set = new Set<string>();
    CURATED_CLINICAL_KNOWLEDGE_BASE.forEach((e) => {
      if (e.sourceName.includes('MoHFW') || e.sourceName.includes('NHM')) set.add('MoHFW / NHM India');
      if (e.sourceName.includes('WHO')) set.add('World Health Organization (WHO)');
      if (e.sourceName.includes('ICMR')) set.add('ICMR India');
      if (e.sourceName.includes('CDSCO') || e.sourceName.includes('NLEM')) set.add('NLEM / CDSCO');
    });
    return Array.from(set);
  }, []);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CURATED_CLINICAL_KNOWLEDGE_BASE.filter((entry) => {
      const matchesAuth =
        selectedAuthority === 'all' ||
        (selectedAuthority === 'MoHFW / NHM India' &&
          (entry.sourceName.includes('MoHFW') || entry.sourceName.includes('NHM'))) ||
        (selectedAuthority === 'World Health Organization (WHO)' && entry.sourceName.includes('WHO')) ||
        (selectedAuthority === 'ICMR India' && entry.sourceName.includes('ICMR')) ||
        (selectedAuthority === 'NLEM / CDSCO' &&
          (entry.sourceName.includes('NLEM') || entry.sourceName.includes('CDSCO')));

      if (!matchesAuth) return false;
      if (!q) return true;
      return (
        entry.documentTitle.toLowerCase().includes(q) ||
        entry.sourceName.toLowerCase().includes(q) ||
        entry.subject.toLowerCase().includes(q) ||
        entry.version.toLowerCase().includes(q) ||
        entry.summaryEn.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedAuthority]);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch('/api/medical/answer-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionSnippet: questionSnippet.trim(),
          answerSnippet: answerSnippet.trim(),
          issueCategory,
          sourceCited: sourceCited.trim() || 'Not specified',
          details: details.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus({
          ok: true,
          message:
            data.message ||
            'Report submitted. It is now queued in the Admin AI Response Quality Monitor.',
        });
        setQuestionSnippet('');
        setAnswerSnippet('');
        setSourceCited('');
        setDetails('');
      } else {
        setSubmitStatus({
          ok: false,
          message: data.error || 'Could not submit report. Please check required fields.',
        });
      }
    } catch {
      setSubmitStatus({
        ok: false,
        message: 'Network error while submitting report. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clinical-precision-surface min-h-screen">
      {/* Top 3-Zone Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0f131d]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-base font-bold tracking-tight text-[#dfe2f1]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#06B6D4]/15 text-[#4cd7f6]">
              <HeartPulse className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="clinical-precision-display">SAHAAY</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#bcc9cd] md:flex">
            <a href="#registry" className="whitespace-nowrap transition hover:text-[#4cd7f6]">
              Source Registry
            </a>
            <a href="#methodology" className="whitespace-nowrap transition hover:text-[#4cd7f6]">
              Evidence Tiers
            </a>
            <a href="#interactions" className="whitespace-nowrap transition hover:text-[#4cd7f6]">
              Drug Rules
            </a>
            <a href="#report-answer" className="whitespace-nowrap transition hover:text-[#4cd7f6]">
              Report Error
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/?autostart=1&tab=assistant"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded bg-[#06B6D4] px-4 py-2 text-xs font-bold text-[#0B0F19] transition hover:bg-[#22D3EE]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Open Assistant</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:py-14">
        {/* Hero Header */}
        <section className="rounded-lg border border-slate-800 bg-[#171b26] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#6bd8cb]">
                <span>Clinical Governance</span>
                <span aria-hidden="true">·</span>
                <span>Source Verification Registry</span>
                <span aria-hidden="true">·</span>
                <span>Last Audited March 2026</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#dfe2f1] sm:text-4xl">
                Medical Answer Verification &amp; Clinical Sources
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#bcc9cd]">
                Every medical explanation in SAHAAY is grounded against transparent, clinician-reviewed public health guidelines and regulatory databases. Inspect exact publication versions, verification dates, evidence boundaries, or report any answer that needs clinical review.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:shrink-0">
              <div className="rounded border border-slate-800 bg-[#0f131d] px-4 py-3">
                <div className="font-mono text-2xl font-bold text-[#4cd7f6] tabular-nums">
                  {CURATED_CLINICAL_KNOWLEDGE_BASE.length}
                </div>
                <div className="mt-0.5 text-[11px] text-[#bcc9cd]">Curated Guidelines</div>
              </div>
              <div className="rounded border border-slate-800 bg-[#0f131d] px-4 py-3">
                <div className="font-mono text-2xl font-bold text-[#6bd8cb] tabular-nums">
                  {CURATED_DRUG_INTERACTIONS.length}
                </div>
                <div className="mt-0.5 text-[11px] text-[#bcc9cd]">Interaction Rules</div>
              </div>
              <div className="rounded border border-slate-800 bg-[#0f131d] px-4 py-3">
                <div className="font-mono text-2xl font-bold text-[#dfe2f1] tabular-nums">3</div>
                <div className="mt-0.5 text-[11px] text-[#bcc9cd]">Live Public APIs</div>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Quality & Clinical Boundary Methodology */}
        <section id="methodology" className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-[#171b26] p-5">
            <div className="text-xs font-semibold text-[#4cd7f6]">01. Tier 1 — National &amp; WHO Protocols</div>
            <h2 className="mt-1.5 text-base font-semibold text-[#dfe2f1]">
              Clinician-Reviewed Grounding
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#bcc9cd]">
              MoHFW India Standard Treatment Guidelines, NHM Maternal &amp; Child Health, ICMR, NLEM India, and WHO Primary Care protocols are retrieved first and injected directly into Gemini prompts with explicit provenance metadata.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#171b26] p-5">
            <div className="text-xs font-semibold text-[#6bd8cb]">02. Tier 2 — Live Regulatory Databases</div>
            <h2 className="mt-1.5 text-base font-semibold text-[#dfe2f1]">
              OpenFDA &amp; NIH MedlinePlus
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#bcc9cd]">
              Medicine safety queries and general health topics query live U.S. FDA OpenFDA Drug Labeling and NIH NLM MedlinePlus feeds alongside local Indian generic/brand mappings.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#171b26] p-5">
            <div className="text-xs font-semibold text-[#FCA5A5]">03. Hard Safety Guardrails</div>
            <h2 className="mt-1.5 text-base font-semibold text-[#dfe2f1]">
              Strict Non-Diagnostic Boundaries
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#bcc9cd]">
              Deterministic red-flag screening runs before AI generation for immediate 112 escalation. SAHAAY never diagnoses from incomplete symptoms or photos, never prescribes doses, and never guarantees drug combinations safe.
            </p>
          </div>
        </section>

        {/* Searchable Curated Source Registry */}
        <section id="registry" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#dfe2f1]">
                Verified Clinical Knowledge Registry
              </h2>
              <p className="mt-1 text-xs text-[#bcc9cd]">
                Inspect document titles, versions, publication dates, verification dates, and official external links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Filter verified clinical sources"
                  placeholder="Search guideline, topic, version..."
                  className="w-64 rounded border border-slate-700 bg-[#0B0F19] py-2 pr-3 pl-9 text-xs text-[#dfe2f1] placeholder:text-slate-500 focus:border-[#06B6D4] focus:outline-none"
                />
              </div>

              <select
                aria-label="Filter by issuing health authority"
                value={selectedAuthority}
                onChange={(e) => setSelectedAuthority(e.target.value)}
                className="rounded border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs font-medium text-[#dfe2f1] focus:border-[#06B6D4] focus:outline-none"
              >
                <option value="all">All Authorities</option>
                {authorities.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredEntries.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col justify-between rounded-lg border border-slate-800 bg-[#171b26] p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#6bd8cb]">
                    <span>{entry.reviewStatus}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{entry.version}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Verified {entry.lastVerifiedDate}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[#dfe2f1]">
                    {entry.documentTitle}
                  </h3>
                  <div className="mt-1 text-xs font-medium text-[#4cd7f6]">{entry.sourceName}</div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#bcc9cd]">{entry.summaryEn}</p>
                  <div className="mt-3 rounded border border-slate-800 bg-[#0f131d] p-3 text-[11px] leading-relaxed text-[#bcc9cd]">
                    <span className="font-semibold text-[#dfe2f1]">Clinical Precautions &amp; Limits: </span>
                    {entry.precautionsEn}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                  <span className="font-mono tabular-nums">Published: {entry.publicationDate}</span>
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#4cd7f6] hover:underline"
                  >
                    <span>Official Source</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Live Public Regulatory APIs */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {EXTERNAL_PUBLIC_DATABASES.map((db) => (
              <div
                key={db.id}
                className="rounded-lg border border-slate-800 bg-[#1c1f2a] p-5 text-xs"
              >
                <div className="text-[11px] font-semibold text-[#4cd7f6]">{db.tier}</div>
                <h3 className="mt-1 text-sm font-semibold text-[#dfe2f1]">{db.title}</h3>
                <div className="mt-0.5 text-[11px] text-[#6bd8cb]">{db.authority}</div>
                <p className="mt-2 leading-relaxed text-[#bcc9cd]">{db.scope}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  <strong className="text-[#dfe2f1]">Limitation:</strong> {db.limitations}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2.5 text-[11px]">
                  <span className="font-mono text-slate-400 tabular-nums">
                    Verified {db.lastVerifiedDate}
                  </span>
                  <a
                    href={db.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#4cd7f6] hover:underline"
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Drug Interaction Rules Overview */}
        <section id="interactions" className="rounded-lg border border-slate-800 bg-[#171b26] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#dfe2f1]">
                Medicine Safety &amp; Interaction Reference Rules
              </h2>
              <p className="mt-1 text-xs text-[#bcc9cd]">
                Curated major and moderate interaction rules paired with live U.S. FDA OpenFDA drug labeling checks.
              </p>
            </div>
            <Link
              href="/?autostart=1&tab=assistant"
              className="inline-flex items-center gap-1.5 rounded border border-[#06B6D4]/50 bg-[#06B6D4]/10 px-3.5 py-2 text-xs font-semibold text-[#4cd7f6] hover:bg-[#06B6D4]/20"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Run Medicine Safety Checker</span>
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 pr-4">Drug Class / Pair</th>
                  <th className="py-2.5 pr-4">Severity</th>
                  <th className="py-2.5 pr-4">Reference Source</th>
                  <th className="py-2.5">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-[#bcc9cd]">
                {CURATED_DRUG_INTERACTIONS.map((rule) => (
                  <tr key={rule.id}>
                    <td className="py-3 pr-4 font-medium text-[#dfe2f1]">{rule.pairLabel}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`font-semibold uppercase ${
                          rule.severity === 'major' ? 'text-[#FCA5A5]' : 'text-amber-300'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{rule.source}</td>
                    <td className="py-3 font-mono text-[11px] tabular-nums">
                      {rule.lastVerifiedDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Report Potentially Incorrect AI Answer Form */}
        <section
          id="report-answer"
          className="rounded-lg border border-slate-800 bg-[#171b26] p-6 sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4cd7f6]">
                <Flag className="h-4 w-4" aria-hidden="true" />
                <span>AI Response Quality Monitor</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-[#dfe2f1]">
                Report a Potentially Incorrect Medical Answer
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-[#bcc9cd]">
                If you notice an unclear explanation, missing precaution, outdated guideline, or Hindi translation issue in any SAHAAY AI response, report it here. Reports go directly to the administrator AI Response Quality Monitor for audit and correction.
              </p>

              <div className="mt-6 rounded border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-xs text-[#FCA5A5]">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Need urgent medical care right now?</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-red-200">
                  Do not wait for an answer review during an emergency. Dial India Integrated Emergency 112 or visit the nearest emergency hospital immediately.
                </p>
                <a
                  href="tel:112"
                  className="mt-3 inline-flex items-center gap-1.5 rounded bg-[#EF4444] px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600"
                >
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Emergency Call 112</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 lg:col-span-7">
              <div>
                <label
                  htmlFor="report-question"
                  className="block font-mono text-[11px] font-medium text-[#bcc9cd]"
                >
                  QUESTION OR TOPIC ASKED *
                </label>
                <input
                  id="report-question"
                  type="text"
                  required
                  minLength={3}
                  maxLength={500}
                  value={questionSnippet}
                  onChange={(e) => setQuestionSnippet(e.target.value)}
                  placeholder="e.g., Question about fever medication precautions..."
                  className="mt-1.5 w-full rounded border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-[#dfe2f1] placeholder:text-slate-500 focus:border-[#06B6D4] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="report-category"
                    className="block font-mono text-[11px] font-medium text-[#bcc9cd]"
                  >
                    ISSUE CATEGORY *
                  </label>
                  <select
                    id="report-category"
                    value={issueCategory}
                    onChange={(e) =>
                      setIssueCategory(
                        e.target.value as
                          | 'inaccurate_medical_info'
                          | 'outdated_source'
                          | 'missing_warning'
                          | 'translation_error'
                          | 'other'
                      )
                    }
                    className="mt-1.5 w-full rounded border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-[#dfe2f1] focus:border-[#06B6D4] focus:outline-none"
                  >
                    <option value="inaccurate_medical_info">Potentially Inaccurate Information</option>
                    <option value="missing_warning">Missing Precaution / Red-Flag Warning</option>
                    <option value="outdated_source">Outdated Clinical Source / Guideline</option>
                    <option value="translation_error">Hindi / English Translation Error</option>
                    <option value="other">Other Quality Concern</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-source"
                    className="block font-mono text-[11px] font-medium text-[#bcc9cd]"
                  >
                    CITED SOURCE (OPTIONAL)
                  </label>
                  <input
                    id="report-source"
                    type="text"
                    maxLength={200}
                    value={sourceCited}
                    onChange={(e) => setSourceCited(e.target.value)}
                    placeholder="e.g., MoHFW STG-IN-2024.2"
                    className="mt-1.5 w-full rounded border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-[#dfe2f1] placeholder:text-slate-500 focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="report-answer-excerpt"
                  className="block font-mono text-[11px] font-medium text-[#bcc9cd]"
                >
                  AI ANSWER EXCERPT (OPTIONAL)
                </label>
                <textarea
                  id="report-answer-excerpt"
                  rows={2}
                  maxLength={1000}
                  value={answerSnippet}
                  onChange={(e) => setAnswerSnippet(e.target.value)}
                  placeholder="Paste the specific sentence you want reviewed..."
                  className="mt-1.5 w-full rounded border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-[#dfe2f1] placeholder:text-slate-500 focus:border-[#06B6D4] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="report-details"
                  className="block font-mono text-[11px] font-medium text-[#bcc9cd]"
                >
                  WHAT NEEDS CORRECTION OR VERIFICATION? *
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  required
                  minLength={5}
                  maxLength={800}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the discrepancy or link an authoritative guideline..."
                  className="mt-1.5 w-full rounded border border-slate-700 bg-[#0B0F19] px-3.5 py-2.5 text-xs text-[#dfe2f1] placeholder:text-slate-500 focus:border-[#06B6D4] focus:outline-none"
                />
              </div>

              {submitStatus && (
                <div
                  className={`flex items-start gap-2 rounded border p-3 text-xs ${
                    submitStatus.ok
                      ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#6EE7B7]'
                      : 'border-[#EF4444]/50 bg-[#EF4444]/10 text-[#FCA5A5]'
                  }`}
                >
                  {submitStatus.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{submitStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || questionSnippet.trim().length < 3 || details.trim().length < 5}
                className="inline-flex items-center gap-2 rounded bg-[#06B6D4] px-5 py-2.5 text-xs font-bold text-[#0B0F19] transition hover:bg-[#22D3EE] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Submit for Clinical Review</span>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
