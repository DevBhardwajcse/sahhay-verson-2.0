'use client';

import React, { useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  Loader2,
  MapPin,
  PhoneCall,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react';
import { UI_STRINGS } from '@/lib/i18n';
import type { Language } from '@/lib/triage-engine';
import { fileToBase64, type InjuryResult } from '@/lib/assistant-types';

interface InjuryObserverPanelProps {
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

export function InjuryObserverPanel({
  language,
  onFindHospital,
  onSaveSession,
  onClearSaveFeedback,
}: InjuryObserverPanelProps) {
  const t = UI_STRINGS[language];
  const [injPreview, setInjPreview] = useState<string | null>(null);
  const [injMime, setInjMime] = useState<string>('image/jpeg');
  const [injDesc, setInjDesc] = useState('');
  const [injLoading, setInjLoading] = useState(false);
  const [injError, setInjError] = useState<string | null>(null);
  const [injResult, setInjResult] = useState<InjuryResult | null>(null);

  const handleInjuryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInjError(null);
    setInjResult(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setInjError('Please upload a JPEG, PNG, or WebP photograph.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setInjError('Image exceeds 6 MB. Please select a smaller photograph.');
      return;
    }
    const b64 = await fileToBase64(file);
    setInjMime(file.type);
    setInjPreview(b64);
  };

  const runInjuryAnalysis = async () => {
    if (!injPreview || injLoading) return;
    setInjLoading(true);
    setInjError(null);
    setInjResult(null);
    onClearSaveFeedback();
    try {
      const res = await fetch('/api/medical/injury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: injPreview,
          mimeType: injMime,
          description: injDesc,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInjError(data.error || 'Injury observation could not be completed.');
      } else {
        setInjResult(data);
      }
    } catch {
      setInjError('Unable to reach server right now. If urgent, call 112 or visit a hospital.');
    } finally {
      setInjLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5">
        <h2 className="text-base font-bold text-slate-900">
          {language === 'hi' ? 'दृश्य चोट का सीमित अवलोकन' : 'Limited Visible Injury Observation'}
        </h2>
        <p className="text-xs leading-relaxed text-slate-600">
          {language === 'hi'
            ? 'यह उपकरण केवल सतह पर दिखने वाले सामान्य संकेतों का वर्णन करता है और हड्डी टूटने, आंतरिक चोट या संक्रमण का निदान नहीं कर सकता। यदि अत्यधिक रक्तस्राव, गंभीर जलन या सिर की चोट है तो तुरंत 112 पर कॉल करें।'
            : 'This tool offers calm, non-diagnostic surface observations only. A photo cannot diagnose fractures, internal injury, or infection. For heavy bleeding, deep burns, or head trauma, call 112 immediately.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800">
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{language === 'hi' ? 'चोट की तस्वीर चुनें' : 'Upload Injury Photo'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleInjuryFile(e)}
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
              onChange={(e) => void handleInjuryFile(e)}
              className="sr-only"
            />
          </label>
        </div>

        {injPreview && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={injPreview}
                alt="Uploaded injury preview"
                className="max-h-60 w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setInjPreview(null);
                  setInjResult(null);
                }}
                aria-label="Remove injury preview"
                className="absolute top-2 right-2 rounded-lg bg-slate-900/75 p-1.5 text-white hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="inj-desc" className="block text-xs font-semibold text-slate-700">
                {language === 'hi'
                  ? 'यह कब और कैसे हुआ? (वैकल्पिक विवरण)'
                  : 'How & when did this happen? (Optional context)'}
              </label>
              <textarea
                id="inj-desc"
                rows={2}
                maxLength={600}
                value={injDesc}
                onChange={(e) => setInjDesc(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'जैसे: 2 घंटे पहले गिरने से हल्की खरोंच और सूजन...'
                    : 'e.g. Scraped knee after tripping 2 hours ago, mild swelling...'
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <button
              type="button"
              disabled={injLoading}
              onClick={() => void runInjuryAnalysis()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {injLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {injLoading
                  ? language === 'hi'
                    ? 'दृश्य अवलोकन किया जा रहा है...'
                    : 'Performing limited visual observation...'
                  : language === 'hi'
                    ? 'दृश्य अवलोकन देखें'
                    : 'Review Visual Observations'}
              </span>
            </button>
          </div>
        )}

        {injError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {injError}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'hi'
              ? 'अवलोकन, सीमाएं और अगले कदम'
              : 'Observations, Limitations & Next Steps'}
          </h2>
          <button
            type="button"
            onClick={() => onFindHospital('emergency_hospital')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.findHospital}</span>
          </button>
        </div>

        {!injResult ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-xs leading-relaxed text-slate-500">
            {language === 'hi'
              ? 'तस्वीर अपलोड करने के बाद SAHAAY गैर-नैदानिक दृश्य अवलोकन, स्पष्ट सीमाएं और डॉक्टर/अस्पताल कब जाएं इसकी जानकारी दिखाएगा।'
              : 'Once you upload a photo, SAHAAY will provide non-diagnostic visual observations, clearly explain what cannot be determined from an image, and help you decide when to visit a clinic or hospital.'}
          </div>
        ) : injResult.stoppedForEmergency && injResult.emergency ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden="true" />
              <span>
                {language === 'hi' ? injResult.emergency.headlineHi : injResult.emergency.headlineEn}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed">
              {language === 'hi' ? injResult.emergency.guidanceHi : injResult.emergency.guidanceEn}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                Call 112 Now
              </a>
              <button
                type="button"
                onClick={() => onFindHospital('emergency_hospital')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {t.findHospital}
              </button>
            </div>
          </div>
        ) : (
          injResult.result && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-950">
                <strong className="font-bold">Important Limitation: </strong>
                {injResult.result.limitationsExplanation}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="font-bold text-slate-900">Visible Surface Observations</div>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                    {injResult.result.visibleObservations.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="font-bold text-slate-900">Cannot Be Determined From Photo</div>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                    {injResult.result.cannotDetermineFromImage.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="font-bold text-slate-900">
                  General Next Steps &amp; Follow-Up Questions
                </div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                  {injResult.result.generalNextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                {injResult.result.followUpQuestions.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    <div className="font-semibold text-teal-800">
                      Helpful Questions to Consider for Your Doctor:
                    </div>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600">
                      {injResult.result.followUpQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5">
                  <div className="font-bold text-teal-950">When to Consult a Doctor</div>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                    {injResult.result.whenToSeeDoctor.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5">
                  <div className="font-bold text-red-900">When Immediate Emergency Care Is Needed</div>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-red-900">
                    {injResult.result.whenEmergencyNeeded.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onFindHospital('emergency_hospital')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.findHospital}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const summary = `Visible Observations: ${injResult.result!.visibleObservations.join(
                      '; '
                    )}\nLimitations: ${injResult.result!.limitationsExplanation}\nNext Steps: ${injResult.result!.generalNextSteps.join(
                      '; '
                    )}\nNote: Raw injury photograph was immediately discarded and not saved.`;
                    void onSaveSession(
                      'injury_analysis',
                      'Injury Observation Summary',
                      summary,
                      injResult.result!.recommendHospitalVisit ? 'urgent' : 'soon'
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.saveSessionBtn}</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
