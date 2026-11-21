'use client';

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { BookmarkPlus, CheckCircle2, Copy, Download, X } from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import type { ChatMessage } from '@/lib/assistant-types';

interface DoctorSummaryModalProps {
  language: Language;
  summary: string;
  firstQuestionSnippet: string;
  hasEmergency: boolean;
  onClose: () => void;
  onSaveSummary: (
    title: string,
    summaryText: string,
    urgency: 'routine' | 'emergency'
  ) => Promise<void>;
}

export function DoctorSummaryModal({
  language,
  summary,
  firstQuestionSnippet,
  hasEmergency,
  onClose,
  onSaveSummary,
}: DoctorSummaryModalProps) {
  const [summaryCopied, setSummaryCopied] = useState(false);

  const handleDownloadDoctorSummary = () => {
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sahaay-doctor-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Doctor consultation summary"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold tracking-wide text-teal-800 uppercase">
              {language === 'hi'
                ? 'डॉक्टर से मिलने हेतु संरचित सारांश'
                : 'Structured Doctor Consultation Summary'}
            </div>
            <h2 className="mt-0.5 text-base font-extrabold text-slate-900">
              {language === 'hi'
                ? 'अपने चिकित्सक के साथ साझा करने के लिए तैयार'
                : 'Ready to Share With Your Healthcare Provider'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close doctor summary modal"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="markdown-clinical text-xs leading-relaxed text-slate-800">
            <Markdown>{summary}</Markdown>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(summary);
                  setSummaryCopied(true);
                  setTimeout(() => setSummaryCopied(false), 2500);
                } catch {
                  setSummaryCopied(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800"
            >
              {summaryCopied ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{summaryCopied ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDoctorSummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>Download .txt</span>
            </button>
            <button
              type="button"
              onClick={() => {
                void onSaveSummary(
                  `Doctor Summary: ${firstQuestionSnippet.slice(0, 70)}`,
                  summary.slice(0, 3800),
                  hasEmergency ? 'emergency' : 'routine'
                );
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Save with Consent</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReportAnswerModalProps {
  message: ChatMessage;
  questionSnippet: string;
  onClose: () => void;
}

export function ReportAnswerModal({
  message,
  questionSnippet,
  onClose,
}: ReportAnswerModalProps) {
  const [flagReason, setFlagReason] = useState('');
  const [flagBusy, setFlagBusy] = useState(false);
  const [flagDone, setFlagDone] = useState<string | null>(null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report potentially incorrect AI answer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase">
              AI Response Quality Review
            </div>
            <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
              Report Potentially Incorrect Answer
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Help improve SAHAAY medical accuracy. Flagged responses are logged for review in the Admin
          AI Quality Monitor.
        </p>
        <textarea
          rows={3}
          value={flagReason}
          onChange={(e) => setFlagReason(e.target.value)}
          placeholder="Briefly describe what looks inaccurate, outdated, or missing..."
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
        />
        {flagDone && (
          <div className="mt-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">
            {flagDone}
          </div>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={flagBusy || flagReason.trim().length < 5}
            onClick={async () => {
              setFlagBusy(true);
              try {
                const res = await fetch('/api/medical/answer-report', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    questionSnippet: questionSnippet.slice(0, 400) || 'Medical chat answer',
                    answerSnippet: message.text.slice(0, 800),
                    issueCategory: 'inaccurate_medical_info',
                    details: flagReason.trim(),
                    sourceCited: message.references?.[0]?.source || 'AI Chat Response',
                  }),
                });
                const data = await res.json();
                if (res.ok) {
                  setFlagDone(data.message || 'Submitted for clinical quality review.');
                  setFlagReason('');
                }
              } finally {
                setFlagBusy(false);
              }
            }}
            className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {flagBusy ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
