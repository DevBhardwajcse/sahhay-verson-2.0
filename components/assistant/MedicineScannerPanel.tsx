'use client';

import React, { useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  PhoneCall,
  Pill,
  Upload,
  X,
} from 'lucide-react';
import { UI_STRINGS } from '@/lib/i18n';
import type { Language } from '@/lib/triage-engine';
import { fileToBase64, type MedicineResult } from '@/lib/assistant-types';

interface MedicineScannerPanelProps {
  language: Language;
  onFindHospital: (category?: string, specialtyQuery?: string) => void;
  onSaveSession: (
    sessionType: 'general_chat' | 'medicine_scan' | 'injury_analysis' | 'voice_session',
    title: string,
    summary: string,
    urgency?: 'routine' | 'soon' | 'urgent' | 'emergency'
  ) => Promise<void>;
  onClearSaveFeedback: () => void;
}

export function MedicineScannerPanel({
  language,
  onFindHospital,
  onSaveSession,
  onClearSaveFeedback,
}: MedicineScannerPanelProps) {
  const t = UI_STRINGS[language];
  const [medPreview, setMedPreview] = useState<string | null>(null);
  const [medMime, setMedMime] = useState<string>('image/jpeg');
  const [medNote, setMedNote] = useState('');
  const [medLoading, setMedLoading] = useState(false);
  const [medError, setMedError] = useState<string | null>(null);
  const [medResult, setMedResult] = useState<MedicineResult | null>(null);

  const handleMedicineFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedError(null);
    setMedResult(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMedError('Please upload a JPEG, PNG, or WebP photograph of medicine packaging.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setMedError('Image exceeds 6 MB. Please select a smaller photograph.');
      return;
    }
    const b64 = await fileToBase64(file);
    setMedMime(file.type);
    setMedPreview(b64);
  };

  const runMedicineAnalysis = async () => {
    if (!medPreview || medLoading) return;
    setMedLoading(true);
    setMedError(null);
    setMedResult(null);
    onClearSaveFeedback();
    try {
      const res = await fetch('/api/medical/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: medPreview,
          mimeType: medMime,
          userNote: medNote,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMedError(data.error || 'Medicine image analysis could not be completed.');
      } else {
        setMedResult(data);
      }
    } catch {
      setMedError('Unable to reach server for medicine image analysis. Please retry.');
    } finally {
      setMedLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5">
        <h2 className="text-base font-bold text-slate-900">
          {language === 'hi' ? 'दवा पैकेजिंग या लेबल स्कैन करें' : 'Scan Medicine Packaging or Label'}
        </h2>
        <p className="text-xs leading-relaxed text-slate-600">
          {language === 'hi'
            ? 'दवा की पट्टी, बोतल, सिरप पैकेजिंग या प्रिस्क्रिप्शन लेबल की स्पष्ट तस्वीर अपलोड करें। सुरक्षा कारणों से खुली गोलियों की पहचान नहीं की जाती और मूल तस्वीर स्थायी रूप से सहेजी नहीं जाती।'
            : 'Upload a clear photograph of medicine strips, boxes, syrup bottles, or prescription labels. Loose unmarked pills are never guessed, and photos are discarded after analysis.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800">
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{language === 'hi' ? 'तस्वीर अपलोड करें' : 'Upload Packaging Photo'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleMedicineFile(e)}
              className="sr-only"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span>{language === 'hi' ? 'कैमरा उपयोग करें' : 'Use Camera'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void handleMedicineFile(e)}
              className="sr-only"
            />
          </label>
        </div>

        {medPreview && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={medPreview}
                alt="Medicine packaging preview"
                className="max-h-60 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setMedPreview(null);
                  setMedResult(null);
                }}
                aria-label="Remove medicine preview"
                className="absolute top-2 right-2 rounded-lg bg-slate-900/75 p-1.5 text-white hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="med-note" className="block text-xs font-semibold text-slate-700">
                {language === 'hi'
                  ? 'अतिरिक्त प्रश्न (वैकल्पिक)'
                  : 'Optional question about this packaging'}
              </label>
              <input
                id="med-note"
                type="text"
                maxLength={400}
                value={medNote}
                onChange={(e) => setMedNote(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'जैसे: यह किस श्रेणी की दवा है?'
                    : 'e.g. What category of medicine is this?'
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <button
              type="button"
              disabled={medLoading}
              onClick={() => void runMedicineAnalysis()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {medLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Pill className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {medLoading
                  ? language === 'hi'
                    ? 'पैकेजिंग का विश्लेषण हो रहा है...'
                    : 'Analyzing packaging & cross-checking OpenFDA/WHO...'
                  : language === 'hi'
                    ? 'दवा पैकेजिंग विश्लेषण करें'
                    : 'Analyze Medicine Packaging'}
              </span>
            </button>
          </div>
        )}

        {medError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {medError}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7">
        <h2 className="text-base font-bold text-slate-900">
          {language === 'hi' ? 'दवा जानकारी एवं सुरक्षा समीक्षा' : 'Medicine Information & Safety Review'}
        </h2>

        {!medResult ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-xs leading-relaxed text-slate-500">
            {language === 'hi'
              ? 'दवा का नाम, सक्रिय घटक, मात्रा, निर्माता, एक्सपायरी तिथि, सामान्य उपयोग और WHO/OpenFDA संदर्भ देखने के लिए बाईं ओर पैकेजिंग की तस्वीर अपलोड करें।'
              : 'Upload a photograph on the left to inspect visible product name, active ingredients, printed strength, dosage form, manufacturer, expiry date, recognized uses, and verified clinical references.'}
          </div>
        ) : (
          <div className="space-y-4">
            {medResult.emergency?.isEmergency && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-950">
                <div className="font-extrabold">
                  {language === 'hi'
                    ? medResult.emergency.headlineHi
                    : medResult.emergency.headlineEn}
                </div>
                <p className="mt-1">
                  {language === 'hi'
                    ? medResult.emergency.guidanceHi
                    : medResult.emergency.guidanceEn}
                </p>
                <a
                  href="tel:112"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 font-bold text-white"
                >
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                  Call 112 Immediately
                </a>
              </div>
            )}

            {medResult.safetyReason && (
              <div
                className={`rounded-xl border p-3.5 text-xs font-medium ${
                  medResult.unidentified || medResult.isUncertain
                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                    : 'border-teal-200 bg-teal-50 text-teal-950'
                }`}
              >
                {medResult.safetyReason}
              </div>
            )}

            {medResult.extraction && (
              <div className="space-y-3">
                <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-500">Possible Product Name</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">
                      {medResult.extraction.productName}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Active Ingredient(s)</dt>
                    <dd className="mt-0.5 font-bold text-slate-900">
                      {medResult.extraction.activeIngredients.length > 0
                        ? medResult.extraction.activeIngredients.join(', ')
                        : 'Not clearly visible'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Strength / Dosage Form</dt>
                    <dd className="mt-0.5 text-slate-800">
                      {medResult.extraction.strength} · {medResult.extraction.dosageForm}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Manufacturer &amp; Expiry</dt>
                    <dd className="mt-0.5 text-slate-800">
                      {medResult.extraction.manufacturer} · Exp: {medResult.extraction.expiryDate}
                    </dd>
                  </div>
                </dl>

                {!medResult.unidentified && (
                  <div className="space-y-2.5 text-xs leading-relaxed text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">Category: </span>
                      {medResult.extraction.category}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Common Recognized Uses: </span>
                      {medResult.extraction.generalUses}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">
                        Why a Healthcare Professional May Prescribe It:{' '}
                      </span>
                      {medResult.extraction.whyPrescribed}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">
                        Why Doctor / Pharmacist Confirmation Matters:{' '}
                      </span>
                      {medResult.extraction.doctorPharmacistGuidance}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">
                        Missing or Unclear Packaging Details:{' '}
                      </span>
                      {medResult.extraction.missingOrUnclearDetails}
                    </div>
                  </div>
                )}
              </div>
            )}

            {medResult.clinicalReferences && medResult.clinicalReferences.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-[11px] font-bold text-teal-800 uppercase">
                  Cross-Checked Clinical Reference Sources
                </div>
                {medResult.clinicalReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                      <span>{ref.title}</span>
                    </div>
                    <div className="text-[11px] text-teal-800">{ref.source}</div>
                    <p className="mt-1 text-slate-600">{ref.commonUses}</p>
                    <p className="mt-1 text-slate-700">
                      <strong>Precautions:</strong> {ref.precautions}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {medResult.mandatorySafetyReminders && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <div className="font-bold text-slate-900">Important Medicine Safety Rules</div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                  {medResult.mandatorySafetyReminders.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const name = medResult.extraction?.productName || 'Scanned Medicine';
                  const summary = `Product: ${name}\nIngredients: ${
                    medResult.extraction?.activeIngredients.join(', ') || 'Unclear'
                  }\nStrength: ${medResult.extraction?.strength || 'Unclear'}\nUses: ${
                    medResult.extraction?.generalUses || 'Verify with pharmacist'
                  }\nNote: Raw photograph was discarded and not saved.`;
                  void onSaveSession('medicine_scan', `Medicine Scan — ${name}`, summary, 'routine');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
              >
                <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.saveSessionBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => onFindHospital('pharmacy')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <MapPin className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                <span>
                  {language === 'hi' ? 'नजदीकी फ़ार्मेसी / डॉक्टर खोजें' : 'Find Nearby Pharmacy / Doctor'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
