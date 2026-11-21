'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import type { MedicineSafetyCheckResult } from '@/lib/drug-interactions';

interface SafetyCheckApiResponse extends MedicineSafetyCheckResult {
  openFdaExcerpts: Array<{
    medicine: string;
    source: string;
    excerpt: string;
    url: string;
  }>;
  checkedAt: string;
}

interface MedicineSafetyCheckerProps {
  language: Language;
  initialMedicines?: string[];
}

export function MedicineSafetyChecker({
  language,
  initialMedicines,
}: MedicineSafetyCheckerProps) {
  const initialKey = (initialMedicines || []).join('|');
  const [prevInitialKey, setPrevInitialKey] = useState(initialKey);
  const [medicines, setMedicines] = useState<string[]>(
    initialMedicines && initialMedicines.length >= 2 ? initialMedicines : []
  );
  const [draftInput, setDraftInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SafetyCheckApiResponse | null>(null);

  const isHi = language === 'hi';

  if (initialKey !== prevInitialKey) {
    setPrevInitialKey(initialKey);
    if (initialMedicines && initialMedicines.length >= 2) {
      setMedicines(initialMedicines);
      setResult(null);
    }
  }

  const handleAddMedicine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = draftInput.trim();
    if (cleaned.length < 2) return;
    if (medicines.length >= 12) return;
    if (!medicines.some((m) => m.toLowerCase() === cleaned.toLowerCase())) {
      setMedicines((prev) => [...prev, cleaned]);
      setResult(null);
    }
    setDraftInput('');
  };

  const handleRemove = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
    setResult(null);
  };

  const handleRunCheck = async (overrideList?: string[]) => {
    const targetList = overrideList ?? medicines;
    if (targetList.length < 2 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/medical/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: targetList,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not run medicine safety check right now.');
      } else {
        setResult(data as SafetyCheckApiResponse);
      }
    } catch {
      setError('Network error while checking medicine interactions.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: string[]) => {
    setMedicines(preset);
    setResult(null);
    void handleRunCheck(preset);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>{isHi ? 'दवा सुरक्षा और इंटरैक्शन चेकर' : 'Medicine Safety & Interaction Checker'}</span>
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {isHi
            ? 'दो या अधिक दवाओं के नाम दर्ज करें। SAHAAY सत्यापित इंटरैक्शन नियमों, समान सक्रिय तत्वों (जैसे Dolo 650 + Combiflam) और लाइव OpenFDA डेटाबेस से संभावित जोखिम चिह्नित करता है।'
            : 'Enter 2 or more medicines to screen against clinician-reviewed drug interaction rules, duplicate active ingredients (e.g., Dolo 650 + Combiflam), and live U.S. FDA OpenFDA drug labeling.'}
        </p>
      </div>

      {/* Add Medicine Input */}
      <form onSubmit={handleAddMedicine} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draftInput}
          onChange={(e) => setDraftInput(e.target.value)}
          aria-label="Enter medicine name to add to interaction check"
          placeholder={
            isHi
              ? 'दवा का नाम लिखें (जैसे: Warfarin, Aspirin, Dolo 650, Clopidogrel, Omeprazole)...'
              : 'Enter a medicine name (e.g., Warfarin, Aspirin, Dolo 650, Clopidogrel, Omeprazole)...'
          }
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={draftInput.trim().length < 2 || medicines.length >= 12}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isHi ? 'दवा जोड़ें' : 'Add Medicine'}</span>
        </button>
      </form>

      {/* Quick Example Scenarios */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-semibold text-slate-500">
          {isHi ? 'उदाहरण जांच:' : 'Try verified check:'}
        </span>
        <button
          type="button"
          onClick={() => loadPreset(['Warfarin', 'Ibuprofen'])}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
        >
          Warfarin + Ibuprofen
        </button>
        <button
          type="button"
          onClick={() => loadPreset(['Dolo 650', 'Combiflam'])}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
        >
          Dolo 650 + Combiflam
        </button>
        <button
          type="button"
          onClick={() => loadPreset(['Clopidogrel', 'Omeprazole'])}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
        >
          Clopidogrel + Omeprazole
        </button>
      </div>

      {/* Selected Medicines List */}
      {medicines.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Listed Medicines ({medicines.length})</span>
            <button
              type="button"
              onClick={() => {
                setMedicines([]);
                setResult(null);
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-red-700"
            >
              Clear list
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {medicines.map((med, idx) => (
              <span
                key={`${med}-${idx}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                <span>{med}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  aria-label={`Remove ${med}`}
                  className="text-slate-400 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3">
            <button
              type="button"
              disabled={medicines.length < 2 || loading}
              onClick={() => void handleRunCheck()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {isHi ? 'इंटरैक्शन व सुरक्षा जांचें' : 'Check Potential Interactions'}
              </span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 border-t border-slate-200 pt-5">
          {/* Flagged Interactions */}
          {result.flaggedInteractions.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-red-800">
                Potential Drug Interactions Flagged ({result.flaggedInteractions.length})
              </div>
              {result.flaggedInteractions.map((flag) => (
                <div
                  key={flag.id}
                  className={`rounded-xl border p-4 text-xs ${
                    flag.severity === 'major'
                      ? 'border-red-300 bg-red-50/80 text-red-950'
                      : 'border-amber-300 bg-amber-50/80 text-amber-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-extrabold">
                      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {flag.matchedPair[0]} + {flag.matchedPair[1]}
                      </span>
                    </div>
                    <span className="rounded border border-current/30 px-2 py-0.5 text-[11px] font-bold uppercase">
                      {flag.severity === 'major'
                        ? 'Major — Doctor/Pharmacist Review Required'
                        : 'Moderate — Pharmacist Review Advised'}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold">{flag.pairLabel}</div>
                  <p className="mt-1.5 leading-relaxed">
                    {isHi ? flag.summaryHi : flag.summaryEn}
                  </p>
                  <p className="mt-1.5 font-semibold">
                    {isHi ? 'सुझाया गया कदम: ' : 'Recommended Action: '}
                    {isHi ? flag.actionHi : flag.actionEn}
                  </p>
                  <div className="mt-2 font-mono text-[10px] opacity-80">
                    Source: {flag.source} · Verified {flag.lastVerifiedDate}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Duplicate Active Ingredients */}
          {result.duplicateIngredients.length > 0 && (
            <div className="space-y-2">
              {result.duplicateIngredients.map((dup) => (
                <div
                  key={dup.generic}
                  className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950"
                >
                  <div className="flex items-center gap-2 font-extrabold">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Duplicate Active Ingredient Flag: {dup.generic.toUpperCase()}</span>
                  </div>
                  <p className="mt-1 leading-relaxed">
                    {isHi ? dup.warningHi : dup.warningEn}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* When zero curated flags matched — NEVER declare safe! */}
          {result.flaggedInteractions.length === 0 && result.duplicateIngredients.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
              <div className="font-bold text-slate-900">
                {isHi
                  ? 'हमारे क्यूरेटेड डेटाबेस में कोई प्रत्यक्ष प्रमुख इंटरैक्शन चिह्नित नहीं हुआ'
                  : 'No direct match found in our curated interaction rules'}
              </div>
              <p className="mt-1 text-slate-600">
                {isHi
                  ? 'कृपया नीचे दिए गए OpenFDA लेबल अंश पढ़ें और हमेशा अपने डॉक्टर या फार्मासिस्ट से पुष्टि करें।'
                  : 'Review any live U.S. FDA label excerpts below and always confirm your complete medication list with a qualified pharmacist or doctor.'}
              </p>
            </div>
          )}

          {/* Live OpenFDA Excerpts */}
          {result.openFdaExcerpts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Live U.S. FDA OpenFDA Labeling Excerpts
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {result.openFdaExcerpts.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{ex.medicine}</span>
                      <a
                        href={ex.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                      >
                        <span>OpenFDA</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-slate-600">{ex.excerpt}…</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Non-Guarantee Safety Banner */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-950">
            <strong>{isHi ? 'सुरक्षा अस्वीकरण:' : 'Mandatory Safety Reminder:'}</strong>{' '}
            {isHi ? result.neverSafeGuaranteeNoticeHi : result.neverSafeGuaranteeNoticeEn}
          </div>
        </div>
      )}
    </div>
  );
}
