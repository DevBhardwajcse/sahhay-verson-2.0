'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  FileSearch,
  Loader2,
  Stethoscope,
  Upload,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import type { ParsedLabParameter } from '@/lib/lab-report-utils';

interface LabReportResponse {
  reportType: string;
  imageQualityNote: string;
  overallSummary: string;
  extractedParameters: ParsedLabParameter[];
  stats: {
    total: number;
    outOfRange: number;
    highCount: number;
    lowCount: number;
    borderlineCount: number;
  };
  doctorQuestions: string[];
  limitations: string;
}

interface LabReportAnalyzerProps {
  language: Language;
  onFindHospital: (category?: string, specialtyQuery?: string) => void;
  onSaveSummary?: (title: string, summary: string) => Promise<void>;
}

const SAMPLE_LAB_TEXT = `Complete Blood Count (CBC) & Metabolic Panel
Hemoglobin (Hb): 10.4 g/dL (Reference Range: 12.0 - 15.5 g/dL)
WBC Count: 7,800 /uL (Reference Range: 4,000 - 11,000 /uL)
Platelet Count: 210,000 /uL (Reference Range: 150,000 - 450,000 /uL)
Fasting Blood Glucose: 138 mg/dL (Reference Range: 70 - 99 mg/dL)
HbA1c: 6.8 % (Reference Range: 4.0 - 5.6 %)
Vitamin D (25-OH): 14 ng/mL (Reference Range: 30 - 100 ng/mL)`;

export function LabReportAnalyzer({
  language,
  onFindHospital,
  onSaveSummary,
}: LabReportAnalyzerProps) {
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [reportText, setReportText] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LabReportResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const isHi = language === 'hi';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setResult(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a clear JPEG, PNG, or WebP photograph/screenshot of your lab report.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setPreviewUrl(dataUrl);
      setImageBase64(dataUrl);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSavedNotice(null);
    try {
      const payload =
        inputMode === 'image'
          ? { language, imageBase64, mimeType, userNote }
          : { language, reportText, userNote };

      const res = await fetch('/api/medical/lab-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not analyze lab report right now.');
      } else {
        setResult(data as LabReportResponse);
      }
    } catch {
      setError('Network error while analyzing lab report.');
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze =
    inputMode === 'image' ? Boolean(imageBase64 && mimeType) : reportText.trim().length >= 10;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileSearch className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>{isHi ? 'AI लैब रिपोर्ट विश्लेषक' : 'AI Lab Report Analyzer'}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {isHi
              ? 'ब्लड टेस्ट, यूरिन रिपोर्ट या पैथोलॉजी रिपोर्ट की फोटो अपलोड करें या मान पेस्ट करें। Gemini चिकित्सा शब्दों को सरल भाषा में समझाता है और संदर्भ सीमा से बाहर के मान हाइलाइट करता है।'
              : 'Upload a photo/screenshot of a blood test, urine report, or lab panel — or paste lab values directly. SAHAAY explains terminology, highlights values outside displayed reference ranges, and prepares doctor questions.'}
          </p>
        </div>

        <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInputMode('image')}
            className={`rounded-md px-3 py-1.5 transition ${
              inputMode === 'image' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            {isHi ? 'रिपोर्ट फोटो' : 'Upload Report Photo'}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`rounded-md px-3 py-1.5 transition ${
              inputMode === 'text' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            {isHi ? 'मान पेस्ट करें' : 'Paste Lab Values'}
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
        <strong>{isHi ? 'सुरक्षा सीमा:' : 'Clinical Safety Boundary:'}</strong>{' '}
        {isHi
          ? 'यह टूल केवल रिपोर्ट में लिखे मान और सामान्य शब्दावली समझाता है। यह किसी बीमारी का निदान नहीं करता — हमेशा पूरी रिपोर्ट अपने डॉक्टर को दिखाएं।'
          : 'This analyzer explains medical terms and flags numbers outside printed reference ranges. It does not diagnose medical conditions — always review lab results with your ordering doctor.'}
      </div>

      {inputMode === 'image' ? (
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-teal-600">
            <Upload className="h-6 w-6 text-teal-700" aria-hidden="true" />
            <span className="mt-2 text-xs font-bold text-slate-800">
              {isHi
                ? 'लैब रिपोर्ट की स्पष्ट फोटो चुनें (JPEG, PNG, WebP · अधिकतम 5 MB)'
                : 'Choose a clear photo or screenshot of your lab report (JPEG, PNG, WebP · max 5 MB)'}
            </span>
            <span className="mt-0.5 text-[11px] text-slate-500">
              {isHi
                ? 'रॉ फोटो स्थायी रूप से सहेजी नहीं जाती है।'
                : 'Raw uploaded report images are never permanently stored.'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          {previewUrl && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded laboratory report preview"
                className="mx-auto max-h-60 rounded-lg object-contain"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="lab-report-text" className="text-xs font-semibold text-slate-700">
              {isHi ? 'लैब रिपोर्ट के मान और संदर्भ सीमा पेस्ट करें:' : 'Paste lab parameters, values & reference ranges:'}
            </label>
            <button
              type="button"
              onClick={() => setReportText(SAMPLE_LAB_TEXT)}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              {isHi ? 'नमूना CBC/शुगर रिपोर्ट भरें' : 'Load Sample Lab Report'}
            </button>
          </div>
          <textarea
            id="lab-report-text"
            rows={6}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="e.g., Hemoglobin: 10.4 g/dL (Ref: 12.0 - 15.5 g/dL), Fasting Glucose: 138 mg/dL (Ref: 70 - 99 mg/dL)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="text"
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder={
            isHi
              ? 'वैकल्पिक प्रश्न (जैसे: HbA1c का क्या अर्थ है?)'
              : 'Optional question (e.g., What does HbA1c measure?)'
          }
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          disabled={!canAnalyze || loading}
          onClick={() => void handleAnalyze()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileSearch className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isHi ? 'रिपोर्ट का विश्लेषण करें' : 'Analyze Lab Report'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-teal-800">{result.reportType}</div>
              <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
                {isHi ? 'रिपोर्ट सारांश एवं मान विश्लेषण' : 'Lab Report Explanation & Range Check'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{result.overallSummary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-slate-700 tabular-nums">
                {result.stats.total} parameters
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  result.stats.outOfRange > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {result.stats.outOfRange} outside displayed range
              </span>
            </div>
          </div>

          {result.extractedParameters.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-600">
                  <tr>
                    <th className="px-3.5 py-2.5">Parameter</th>
                    <th className="px-3.5 py-2.5">Result</th>
                    <th className="px-3.5 py-2.5">Printed Ref. Range</th>
                    <th className="px-3.5 py-2.5">Range Check</th>
                    <th className="px-3.5 py-2.5">Plain Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.extractedParameters.map((p, idx) => {
                    const statusStyle =
                      p.status === 'high' || p.status === 'low'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : p.status === 'borderline'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : p.status === 'normal'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <tr key={idx} className={p.status === 'high' || p.status === 'low' ? 'bg-red-50/30' : ''}>
                        <td className="px-3.5 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-3.5 py-3 font-mono font-semibold text-slate-900 tabular-nums">
                          {p.value} {p.unit}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-slate-600 tabular-nums">
                          {p.referenceRange}
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold uppercase ${statusStyle}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="max-w-xs px-3.5 py-3 leading-relaxed text-slate-700">
                          {p.plainExplanation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Questions to Discuss with Doctor */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 text-xs">
            <div className="font-bold text-teal-950">
              {isHi ? 'अपने डॉक्टर से पूछने योग्य प्रश्न:' : 'Suggested Questions to Discuss With Your Doctor:'}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-700">
              {result.doctorQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <div>{result.limitations}</div>
              <div className="mt-1 text-[11px] text-slate-500">{result.imageQualityNote}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onFindHospital('doctor', 'general physician pathology clinic')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
            >
              <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isHi ? 'नजदीकी डॉक्टर खोजें' : 'Find Nearby Doctor to Review Report'}</span>
            </button>

            {onSaveSummary && (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await onSaveSummary(
                    `Lab Report: ${result.reportType}`,
                    `${result.overallSummary}\n\nParameters:\n${result.extractedParameters
                      .map((p) => `- ${p.name}: ${p.value} ${p.unit} (Ref: ${p.referenceRange}) [${p.status}]`)
                      .join('\n')}`
                  );
                  setSavedNotice('Summary saved with consent (raw report image not stored).');
                  setSaving(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50"
              >
                <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save Summary with Consent'}</span>
              </button>
            )}
          </div>

          {savedNotice && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
