'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';

interface ExtractedPrescriptionMedicine {
  writtenName: string;
  activeIngredientIfClear: string;
  writtenInstructions: string;
  generalPurpose: string;
  legibility: 'clear' | 'unclear';
}

interface PrescriptionResponse {
  dateVisible: string;
  prescriberOrClinic: string;
  legibilityAssessment: string;
  medicines: ExtractedPrescriptionMedicine[];
  illegibleNotes: string[];
  safetyReminder: string;
}

interface PrescriptionReaderProps {
  language: Language;
  onSendToSafetyChecker: (medicines: string[]) => void;
  onSaveSummary?: (title: string, summary: string) => Promise<void>;
}

export function PrescriptionReader({
  language,
  onSendToSafetyChecker,
  onSaveSummary,
}: PrescriptionReaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const isHi = language === 'hi';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setResult(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a clear JPEG, PNG, or WebP photograph of the prescription.');
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

  const handleScan = async () => {
    if (!imageBase64 || !mimeType || loading) return;
    setLoading(true);
    setError(null);
    setSavedNotice(null);
    try {
      const res = await fetch('/api/medical/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          imageBase64,
          mimeType,
          userNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not read prescription image right now.');
      } else {
        setResult(data as PrescriptionResponse);
      }
    } catch {
      setError('Network error while reading prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <FileText className="h-4 w-4 text-teal-700" aria-hidden="true" />
          <span>{isHi ? 'AI प्रिस्क्रिप्शन रीडर' : 'AI Prescription Reader'}</span>
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {isHi
            ? 'डॉक्टर के पर्चे की फोटो अपलोड करें। यह पढ़ने योग्य दवा के नाम, समय निर्देश (जैसे OD, BD, खाने के बाद) और दिनांक को सरल भाषा में समझाता है — बिना उपचार में कोई बदलाव किए।'
            : 'Scan a printed or clearly written doctor prescription to extract readable medicine names, timing instructions (such as OD/BD/after food), and visible dates without altering or prescribing treatment.'}
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
        <strong>{isHi ? 'महत्वपूर्ण सुरक्षा नियम:' : 'Strict Legibility Safety Rule:'}</strong>{' '}
        {isHi
          ? 'अस्पष्ट लिखावट का अनुमान कभी नहीं लगाया जाएगा। किसी भी दवा को लेने से पहले हमेशा फार्मासिस्ट या डॉक्टर से नाम और मात्रा की पुष्टि करें।'
          : 'Unclear handwriting is never guessed. Always verify every medicine name, strength, and dosing schedule directly with a licensed pharmacist or your prescribing doctor.'}
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-teal-600">
        <Upload className="h-6 w-6 text-teal-700" aria-hidden="true" />
        <span className="mt-2 text-xs font-bold text-slate-800">
          {isHi
            ? 'प्रिस्क्रिप्शन की स्पष्ट फोटो अपलोड करें (JPEG, PNG, WebP · अधिकतम 5 MB)'
            : 'Upload a clear photo of the prescription (JPEG, PNG, WebP · max 5 MB)'}
        </span>
        <span className="mt-0.5 text-[11px] text-slate-500">
          {isHi ? 'अच्छी रोशनी में पूरा पर्चा सीधा रखकर फोटो लें।' : 'Ensure good lighting with full text sharp and flat.'}
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
            alt="Uploaded prescription preview"
            className="mx-auto max-h-60 rounded-lg object-contain"
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
              ? 'वैकल्पिक नोट (जैसे: केवल समय निर्देश समझाएं)'
              : 'Optional note (e.g., Explain timing abbreviations)'
          }
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          disabled={!imageBase64 || loading}
          onClick={() => void handleScan()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isHi ? 'प्रिस्क्रिप्शन पढ़ें' : 'Read Prescription'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 border-t border-slate-200 pt-5">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Visible Date</div>
              <div className="mt-0.5 font-bold text-slate-900">{result.dateVisible}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Clinic / Prescriber</div>
              <div className="mt-0.5 font-bold text-slate-900">{result.prescriberOrClinic}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-500">Legibility Assessment</div>
              <div className="mt-0.5 font-bold text-slate-900">{result.legibilityAssessment}</div>
            </div>
          </div>

          {result.medicines.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-900">
                Extracted Medicines ({result.medicines.length})
              </div>
              {result.medicines.map((med, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 text-xs ${
                    med.legibility === 'unclear'
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900">{med.writtenName}</div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[11px] font-bold uppercase ${
                        med.legibility === 'clear'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-300 bg-amber-100 text-amber-900'
                      }`}
                    >
                      {med.legibility === 'clear' ? 'Readable' : 'Unclear — Confirm With Pharmacist'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-slate-700">
                    <strong>Active ingredient (if clear):</strong> {med.activeIngredientIfClear}
                  </div>
                  <div className="mt-1 text-slate-700">
                    <strong>Written instructions:</strong> {med.writtenInstructions}
                  </div>
                  <div className="mt-1 text-slate-600">
                    <strong>General class / purpose:</strong> {med.generalPurpose}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.illegibleNotes.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950">
              <div className="font-bold">Unclear / Illegible Items Flagged:</div>
              <ul className="mt-1 list-disc pl-4">
                {result.illegibleNotes.map((n, idx) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>{result.safetyReminder}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {result.medicines.length >= 2 && (
              <button
                type="button"
                onClick={() =>
                  onSendToSafetyChecker(
                    result.medicines.map((m) =>
                      m.activeIngredientIfClear &&
                      !m.activeIngredientIfClear.toLowerCase().includes('confirm')
                        ? `${m.writtenName} (${m.activeIngredientIfClear})`
                        : m.writtenName
                    )
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {isHi
                    ? 'दवा सुरक्षा चेकर में इंटरैक्शन जांचें'
                    : 'Check Listed Medicines in Safety Checker'}
                </span>
              </button>
            )}

            {onSaveSummary && (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await onSaveSummary(
                    `Prescription Summary (${result.dateVisible})`,
                    `Prescriber/Clinic: ${result.prescriberOrClinic}\nMedicines:\n${result.medicines
                      .map((m) => `- ${m.writtenName}: ${m.writtenInstructions} (${m.legibility})`)
                      .join('\n')}`
                  );
                  setSavedNotice('Prescription text summary saved with consent (photo not stored).');
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
