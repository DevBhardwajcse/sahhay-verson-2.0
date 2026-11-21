'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, PhoneCall, Search, ShieldAlert, X } from 'lucide-react';
import { HelplineRecord, VERIFIED_HELPLINES } from '@/lib/helplines-data';
import type { Language } from '@/lib/triage-engine';

interface HelplinesDirectoryProps {
  language: Language;
}

const CATEGORIES: Array<{ id: string; labelEn: string; labelHi: string }> = [
  { id: 'all', labelEn: 'All Helplines', labelHi: 'सभी हेल्पलाइन' },
  { id: 'integrated', labelEn: 'Integrated (112)', labelHi: 'एकीकृत (112)' },
  { id: 'medical', labelEn: 'Medical & Ambulance', labelHi: 'चिकित्सा और एम्बुलेंस' },
  { id: 'police', labelEn: 'Police & Cyber', labelHi: 'पुलिस और साइबर' },
  { id: 'fire', labelEn: 'Fire & Rescue', labelHi: 'अग्निशमन' },
  { id: 'women_child', labelEn: 'Women & Child', labelHi: 'महिला और बाल' },
  { id: 'mental_health', labelEn: 'Mental Health', labelHi: 'मानसिक स्वास्थ्य' },
  { id: 'senior', labelEn: 'Senior Citizens', labelHi: 'वरिष्ठ नागरिक' },
  { id: 'disaster', labelEn: 'Disaster & Road', labelHi: 'आपदा और सड़क' },
];

export function HelplinesDirectory({ language }: HelplinesDirectoryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [confirmEntry, setConfirmEntry] = useState<HelplineRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VERIFIED_HELPLINES.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.number.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.nameHi.toLowerCase().includes(q) ||
        item.descriptionEn.toLowerCase().includes(q) ||
        item.descriptionHi.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-red-700 uppercase">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <span>
                {language === 'hi'
                  ? 'सत्यापित राष्ट्रीय हेल्पलाइन निर्देशिका (ऑफ़लाइन उपलब्ध)'
                  : 'Verified India National Helplines Directory (Offline Available)'}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900">
              {language === 'hi'
                ? 'सरकारी आपातकालीन हेल्पलाइन नंबर'
                : 'Verified Government Emergency Helplines'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {language === 'hi'
                ? 'ये राष्ट्रीय आपातकालीन नंबर सीधे आधिकारिक भारत सरकार के स्रोतों से सत्यापित हैं और बिना इंटरनेट के भी उपलब्ध रहते हैं।'
                : 'Official Government of India emergency helplines kept separate from physical map listings and always accessible offline.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmEntry(VERIFIED_HELPLINES[0])}
            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white shadow-xs transition hover:bg-red-700"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">
              {language === 'hi' ? '112 — राष्ट्रीय आपातकाल' : '112 — National Emergency'}
            </span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={language === 'hi' ? 'हेल्पलाइन खोजें' : 'Search helplines'}
            placeholder={
              language === 'hi'
                ? 'नंबर या सेवा खोजें (उदा. 112, 102, एम्बुलेंस, महिला, मानसिक स्वास्थ्य)...'
                : 'Search by number or service (e.g. 112, 102, ambulance, child, mental health)...'
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                category === c.id
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {language === 'hi' ? c.labelHi : c.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className={`flex flex-col justify-between rounded-2xl border p-5 ${
              item.featured ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {item.number}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.jurisdiction}
                </span>
              </div>

              <h2 className="mt-2 text-sm font-bold text-slate-900">
                {language === 'hi' ? item.nameHi : item.nameEn}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === 'hi' ? item.descriptionHi : item.descriptionEn}
              </p>

              <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <div>
                  <strong className="font-semibold text-slate-700">
                    {language === 'hi' ? 'स्रोत:' : 'Source:'}
                  </strong>{' '}
                  {item.source}
                </div>
                <div className="mt-0.5 tabular-nums">
                  {language === 'hi' ? 'सत्यापित:' : 'Verified:'} {item.lastVerified}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmEntry(item)}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                item.featured
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-teal-700 bg-white text-teal-800 hover:bg-teal-50'
              }`}
            >
              <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {language === 'hi' ? `${item.number} पर कॉल करें` : `Call ${item.number}`}
              </span>
            </button>
          </article>
        ))}
      </div>

      {confirmEntry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-call-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="confirm-call-title" className="text-lg font-extrabold text-slate-900">
                  {language === 'hi'
                    ? `${confirmEntry.number} पर कॉल करने की पुष्टि करें`
                    : `Confirm Call to ${confirmEntry.number}`}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {language === 'hi' ? confirmEntry.nameHi : confirmEntry.nameEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmEntry(null)}
                aria-label="Close call confirmation"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {language === 'hi' ? confirmEntry.descriptionHi : confirmEntry.descriptionEn}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              {language === 'hi'
                ? 'यह आपके डिवाइस का फ़ोन डायलर खोलेगा। आधिकारिक स्रोत: '
                : 'This will open your device phone dialer. Official source: '}
              {confirmEntry.source}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmEntry(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <a
                href={`tel:${confirmEntry.number.replace(/[^0-9+]/g, '')}`}
                onClick={() => setConfirmEntry(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                <span>
                  {language === 'hi'
                    ? `अभी डायल करें (${confirmEntry.number})`
                    : `Dial ${confirmEntry.number} Now`}
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
