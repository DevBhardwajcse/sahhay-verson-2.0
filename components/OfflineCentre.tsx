'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  PhoneCall,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import {
  INDEPENDENT_OFFLINE_FACILITIES,
  OFFLINE_CLINICAL_GUIDES,
} from '@/lib/helplines-data';
import type { Language } from '@/lib/triage-engine';

interface OfflineCentreProps {
  language: Language;
  onStartOfflineTriage: () => void;
}

export function OfflineCentre({ language, onStartOfflineTriage }: OfflineCentreProps) {
  const [cityFilter, setCityFilter] = useState('');

  const filteredHospitals = INDEPENDENT_OFFLINE_FACILITIES.filter((h) => {
    const q = cityFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q) ||
      h.state.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-slate-700 uppercase">
              <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>
                {language === 'hi'
                  ? 'आपातकालीन सुरक्षा एवं सरकारी अस्पताल निर्देशिका'
                  : 'Emergency Safety & Public Hospital Directory'}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900">
              {language === 'hi'
                ? 'प्राथमिक उपचार गाइड एवं प्रमुख सरकारी अस्पताल संदर्भ'
                : 'First-Aid Guides & Verified Public Hospital Backup'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {language === 'hi'
                ? 'यह संदर्भ भारत सरकार के स्वतंत्र सार्वजनिक स्वास्थ्य डेटा और WHO प्राथमिक उपचार दिशानिर्देशों पर आधारित है (Google Maps से अलग) और नेटवर्क कम होने पर भी उपलब्ध रहता है।'
                : 'Independently sourced Government of India public tertiary hospital contacts and WHO/NHM first-aid guidelines — kept available as a quick safety backup alongside Live Google Maps.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onStartOfflineTriage}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
          >
            <Stethoscope className="h-4 w-4" aria-hidden="true" />
            <span>
              {language === 'hi' ? 'ऑफ़लाइन ट्राइएज शुरू करें' : 'Launch Offline Triage'}
            </span>
          </button>
        </div>
      </div>

      {/* Offline First-Aid & Clinical Guides */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">
            {language === 'hi'
              ? 'आपातकालीन प्राथमिक उपचार मार्गदर्शन (WHO / NHM)'
              : 'Emergency First-Aid Reference Guides (WHO / NHM)'}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {OFFLINE_CLINICAL_GUIDES.map((guide) => (
            <article key={guide.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'hi' ? guide.titleHi : guide.titleEn}
                </h3>
                <span className="shrink-0 font-mono text-[11px] text-slate-500 tabular-nums">
                  {guide.lastReviewed}
                </span>
              </div>

              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                {(language === 'hi' ? guide.stepsHi : guide.stepsEn).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>

              <div className="mt-3.5 rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs text-red-900">
                <strong className="font-bold">
                  {language === 'hi' ? 'खतरे के संकेत (तुरंत अस्पताल/112):' : 'Emergency Red Flags:'}
                </strong>{' '}
                {language === 'hi' ? guide.redFlagsHi : guide.redFlagsEn}
              </div>

              <div className="mt-3 text-[11px] text-slate-500">
                {language === 'hi' ? 'संदर्भ:' : 'Reference:'} {guide.source}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Independent Government of India Public Hospital Directory */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              {language === 'hi'
                ? 'स्वतंत्र सरकारी प्रमुख अस्पताल निर्देशिका (ऑफ़लाइन)'
                : 'Independent Public Tertiary Hospital Directory (Offline)'}
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              aria-label="Filter offline government hospitals by district or state"
              placeholder={
                language === 'hi' ? 'शहर या राज्य खोजें...' : 'Filter by city, state, or hospital...'
              }
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredHospitals.map((h) => (
            <article
              key={h.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{h.name}</h3>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-teal-800">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {h.category}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  {h.district}, {h.state}
                </p>
                <p className="mt-1 text-xs text-slate-600">{h.address}</p>
                <p className="mt-1.5 text-xs text-slate-600">
                  {language === 'hi' ? h.notesHi : h.notesEn}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  {h.source} · Verified {h.lastVerified}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <a
                  href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
                >
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="tabular-nums">{h.phone}</span>
                </a>
                <span className="text-[11px] text-slate-500">
                  {h.verifiedOwnership}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
