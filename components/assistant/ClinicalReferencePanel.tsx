'use client';

import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, Search } from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import type { ClinicalRefCard } from '@/lib/assistant-types';

interface ClinicalReferencePanelProps {
  language: Language;
}

export function ClinicalReferencePanel({ language }: ClinicalReferencePanelProps) {
  const [refQuery, setRefQuery] = useState('');
  const [refKind, setRefKind] = useState<'medicine' | 'topic'>('medicine');
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const [refResults, setRefResults] = useState<ClinicalRefCard[]>([]);
  const [refSources, setRefSources] = useState<string[]>([]);

  const runReferenceSearch = async (overrideQ?: string, overrideKind?: 'medicine' | 'topic') => {
    const q = (overrideQ ?? refQuery).trim();
    const k = overrideKind ?? refKind;
    if (q.length < 2) return;
    setRefQuery(q);
    setRefKind(k);
    setRefLoading(true);
    setRefError(null);
    try {
      const res = await fetch(
        `/api/medical/reference?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(k)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setRefError(data.error || 'Reference lookup failed.');
      } else {
        setRefResults(data.results || []);
        setRefSources(data.sourcesQueried || []);
      }
    } catch {
      setRefError('Could not query clinical references right now.');
    } finally {
      setRefLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          {language === 'hi'
            ? 'सत्यापित चिकित्सा संदर्भ डेटाबेस (WHO / OpenFDA / NIH MedlinePlus)'
            : 'Clinician-Reviewed Medical Reference Database'}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {language === 'hi'
            ? 'विश्वसनीय सार्वजनिक स्रोतों (WHO Essential Medicines / NLEM India, U.S. FDA OpenFDA Drug Labels, और NIH MedlinePlus) से सामान्य दवा उपयोग और स्वास्थ्य सावधानियां खोजें।'
            : 'Search trustworthy, clinician-reviewed public databases (WHO Essential Medicines / India NLEM, U.S. FDA OpenFDA Drug Labeling, and NIH NLM MedlinePlus) for medicine uses and precautions.'}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runReferenceSearch();
        }}
        className="flex flex-col gap-2.5 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={refQuery}
            onChange={(e) => setRefQuery(e.target.value)}
            aria-label="Search medicine or health topic in clinical reference database"
            placeholder="Search medicine or topic (e.g., Paracetamol, Metformin, ORS, Asthma, Fever)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          aria-label="Reference lookup type"
          value={refKind}
          onChange={(e) => setRefKind(e.target.value as 'medicine' | 'topic')}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800"
        >
          <option value="medicine">Medicine / Drug</option>
          <option value="topic">Health Topic</option>
        </select>

        <button
          type="submit"
          disabled={refLoading || refQuery.trim().length < 2}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {refLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span>Search References</span>
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {[
          { q: 'Paracetamol', k: 'medicine' as const },
          { q: 'Metformin', k: 'medicine' as const },
          { q: 'Amoxicillin', k: 'medicine' as const },
          { q: 'ORS', k: 'medicine' as const },
          { q: 'Dehydration', k: 'topic' as const },
        ].map((item) => (
          <button
            key={item.q}
            type="button"
            onClick={() => void runReferenceSearch(item.q, item.k)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
          >
            {item.q}
          </button>
        ))}
      </div>

      {refError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {refError}
        </div>
      )}

      {refSources.length > 0 && (
        <div className="text-[11px] text-slate-500">Sources checked: {refSources.join(' · ')}</div>
      )}

      {refResults.length > 0 && (
        <div className="space-y-3">
          {refResults.map((item, idx) => (
            <article
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <div className="mt-0.5 font-semibold text-teal-800">{item.source}</div>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
                  >
                    <span>Official Source</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
              {item.category && (
                <div className="mt-2 text-slate-600">
                  <strong className="text-slate-800">Category:</strong> {item.category}
                </div>
              )}
              <p className="mt-2 leading-relaxed text-slate-700">
                <strong className="text-slate-900">Common Uses / Summary: </strong>
                {item.commonUses}
              </p>
              <p className="mt-2 leading-relaxed text-slate-700">
                <AlertTriangle
                  className="mr-1 inline h-3.5 w-3.5 text-amber-600"
                  aria-hidden="true"
                />
                <strong className="text-slate-900">Precautions: </strong>
                {item.precautions}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
