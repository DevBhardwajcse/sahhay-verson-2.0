'use client';

import React, { useMemo, useState } from 'react';
import {
  BookmarkCheck,
  Download,
  Lock,
  LogIn,
  Search,
  Trash2,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import type { SavedSessionRecord } from '@/lib/firebase-client';
import { useAuth } from './AuthProvider';

interface SavedSessionsViewProps {
  language: Language;
}

const TYPE_LABELS: Record<SavedSessionRecord['sessionType'], { en: string; hi: string }> = {
  general_chat: { en: 'Medical Q&A', hi: 'स्वास्थ्य चैट' },
  medicine_scan: { en: 'Medicine Scan', hi: 'दवा स्कैन' },
  injury_analysis: { en: 'Injury Observation', hi: 'चोट अवलोकन' },
  guided_triage: { en: 'Guided Triage', hi: 'निर्देशित ट्राइएज' },
  voice_session: { en: 'Voice Transcript', hi: 'वॉइस सत्र' },
};

export function SavedSessionsView({ language }: SavedSessionsViewProps) {
  const { user, savedSessions, signInWithGoogle, removeSavedSession } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return savedSessions.filter((s) => {
      if (filterType !== 'all' && s.sessionType !== filterType) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        (s.consentedTranscript || '').toLowerCase().includes(q)
      );
    });
  }, [savedSessions, filterType, search]);

  const exportSessionText = (session: SavedSessionRecord) => {
    const content = [
      'SAHAAY — Saved Health Information Summary (Not a medical diagnosis)',
      `Title: ${session.title}`,
      `Type: ${TYPE_LABELS[session.sessionType].en}`,
      `Urgency: ${session.urgencyLevel.toUpperCase()}`,
      `Language: ${session.language.toUpperCase()}`,
      '',
      'Summary:',
      session.summary,
      ...(session.consentedTranscript
        ? ['', 'Consented Transcript:', session.consentedTranscript]
        : []),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahaay-${session.sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">
          {language === 'hi' ? 'सहेजे गए स्वास्थ्य सत्र' : 'Saved Health Sessions'}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
          {language === 'hi'
            ? 'आपकी गोपनीयता के लिए कोई भी बातचीत या स्कैन अपने-आप सहेजा नहीं जाता। अपनी स्पष्ट सहमति से सारांश सहेजने, देखने या हटाने के लिए Google से साइन इन करें।'
            : 'For your privacy under DPDP Act 2023, SAHAAY never stores sessions automatically. Sign in with Google to save, review, export, or delete consented summaries.'}
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle(language)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          <span>{language === 'hi' ? 'Google से साइन इन करें' : 'Sign in with Google'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wide">
              <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
              <span>{language === 'hi' ? 'स्पष्ट सहमति से सहेजे गए सारांश' : 'Explicit-Consent Saved Summaries'}</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              {language === 'hi' ? 'मेरे सहेजे गए सत्र' : 'My Saved Sessions'}
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              {language === 'hi'
                ? 'केवल टेक्स्ट सारांश ही सहेजे जाते हैं — दवा या चोट की मूल तस्वीरें कभी सहेजी नहीं जातीं।'
                : 'Only text summaries you explicitly approved are saved here — raw medicine or injury photographs are never stored.'}
            </p>
          </div>
          <div className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
            {savedSessions.length} {language === 'hi' ? 'सत्र सहेजे गए' : 'saved record(s)'}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search saved sessions"
              placeholder={
                language === 'hi' ? 'सहेजे गए सत्र खोजें...' : 'Search saved summaries...'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['all', 'general_chat', 'medicine_scan', 'injury_analysis', 'guided_triage', 'voice_session'] as const).map(
              (typeKey) => (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setFilterType(typeKey)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    filterType === typeKey
                      ? 'bg-teal-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {typeKey === 'all'
                    ? language === 'hi'
                      ? 'सभी'
                      : 'All'
                    : language === 'hi'
                      ? TYPE_LABELS[typeKey].hi
                      : TYPE_LABELS[typeKey].en}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {language === 'hi'
            ? 'कोई सहेजा गया सत्र नहीं मिला। AI चिकित्सा सहायक या निर्देशित ट्राइएज में "सत्र सारांश सहेजें" बटन का उपयोग करें।'
            : 'No saved sessions match your filter. Use "Save Session Summary" inside the AI Medical Assistant or Guided Triage to keep a record for your doctor.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => (
            <article
              key={session.sessionId}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-teal-800">
                      {language === 'hi'
                        ? TYPE_LABELS[session.sessionType].hi
                        : TYPE_LABELS[session.sessionType].en}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono uppercase">{session.urgencyLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">{session.language}</span>
                  </div>
                  <h2 className="mt-1 text-base font-bold text-slate-900">{session.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportSessionText(session)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{language === 'hi' ? 'निर्यात' : 'Export'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === session.sessionId}
                    onClick={async () => {
                      setDeletingId(session.sessionId);
                      try {
                        await removeSavedSession(session.sessionId);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{language === 'hi' ? 'हटाएं' : 'Delete'}</span>
                  </button>
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                {session.summary}
              </p>

              {session.consentedTranscript && (
                <details className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                    {language === 'hi' ? 'सहमति वाला ट्रांसक्रिप्ट देखें' : 'View Consented Transcript'}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                    {session.consentedTranscript}
                  </p>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
