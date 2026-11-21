'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  ClipboardCopy,
  MapPin,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import {
  GUIDED_TRIAGE_PATHWAYS,
  Language,
  TriagePathway,
  evaluateTriageResponses,
} from '@/lib/triage-engine';
import { useAuth } from './AuthProvider';

interface GuidedTriageProps {
  language: Language;
  onFindHospital: (category?: string) => void;
}

export function GuidedTriage({ language, onFindHospital }: GuidedTriageProps) {
  const { user, saveSessionWithConsent } = useAuth();
  const [selectedPathway, setSelectedPathway] = useState<TriagePathway | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSelectedPathway(null);
    setStepIndex(0);
    setAnswers({});
    setCompleted(false);
    setCopied(false);
    setSaveStatus(null);
  };

  const handleSelectOption = (questionId: string, value: string, immediateEmergency?: boolean) => {
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);
    if (immediateEmergency) {
      setCompleted(true);
      return;
    }
    if (selectedPathway && stepIndex + 1 < selectedPathway.questions.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setCompleted(true);
    }
  };

  const evaluation =
    selectedPathway && completed
      ? evaluateTriageResponses(selectedPathway, answers)
      : null;

  const buildDoctorSummary = () => {
    if (!selectedPathway || !evaluation) return '';
    const title = language === 'hi' ? selectedPathway.titleHi : selectedPathway.titleEn;
    const qaLines = selectedPathway.questions.map((q) => {
      const prompt = language === 'hi' ? q.promptHi : q.promptEn;
      const ans = q.options.find((o) => o.value === answers[q.id]);
      const ansLabel = ans ? (language === 'hi' ? ans.labelHi : ans.labelEn) : 'Not answered';
      return `- ${prompt} -> ${ansLabel}`;
    });
    const rec = language === 'hi' ? evaluation.recommendedActionHi : evaluation.recommendedActionEn;
    return [
      `SAHAAY Guided Triage Summary (Not a medical diagnosis)`,
      `Pathway: ${title}`,
      `Urgency Level: ${evaluation.urgency.toUpperCase()}`,
      `Responses:`,
      ...qaLines,
      `Guidance: ${rec}`,
    ].join('\n');
  };

  const handleCopySummary = async () => {
    const text = buildDoctorSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleSaveConsented = async () => {
    if (!user || !selectedPathway || !evaluation) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await saveSessionWithConsent({
        sessionType: 'guided_triage',
        language,
        title: `Triage: ${language === 'hi' ? selectedPathway.titleHi : selectedPathway.titleEn}`,
        summary: buildDoctorSummary(),
        urgencyLevel: evaluation.urgency,
      });
      setSaveStatus(
        language === 'hi'
          ? 'सहमति के साथ सत्र सारांश सहेजा गया।'
          : 'Triage summary saved with your explicit consent.'
      );
    } catch {
      setSaveStatus(
        language === 'hi'
          ? 'सारांश सहेजने में समस्या हुई।'
          : 'Could not save summary right now.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wide">
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              <span>
                {language === 'hi'
                  ? 'ऑफ़लाइन-सक्षम संरचित जांच'
                  : '100% Offline-Capable Deterministic Screening'}
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900">
              {language === 'hi' ? 'निर्देशित स्वास्थ्य ट्राइएज' : 'Guided Health Triage'}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              {language === 'hi'
                ? 'कुछ संरचित प्रश्नों के उत्तर देकर समझें कि क्या तत्काल 112 आपातकालीन मदद, आज अस्पताल जाना, या डॉक्टर से सामान्य परामर्श आवश्यक है।'
                : 'Answer structured clinician-reviewed questions to understand whether immediate 112 emergency help, same-day hospital care, or a routine doctor visit is safer.'}
            </p>
          </div>
          {selectedPathway && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{language === 'hi' ? 'नया ट्राइएज शुरू करें' : 'Start Over'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Select Pathway */}
      {!selectedPathway && (
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDED_TRIAGE_PATHWAYS.map((pathway) => (
            <button
              key={pathway.id}
              type="button"
              onClick={() => {
                setSelectedPathway(pathway);
                setStepIndex(0);
                setAnswers({});
                setCompleted(false);
              }}
              className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
            >
              <h2 className="text-base font-bold text-slate-900">
                {language === 'hi' ? pathway.titleHi : pathway.titleEn}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {language === 'hi' ? pathway.summaryHi : pathway.summaryEn}
              </p>
              <span className="mt-4 text-xs font-semibold text-teal-700">
                {pathway.questions.length}{' '}
                {language === 'hi' ? 'संरचित प्रश्न →' : 'structured questions →'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Active Question */}
      {selectedPathway && !completed && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              {language === 'hi' ? selectedPathway.titleHi : selectedPathway.titleEn}
            </span>
            <span className="tabular-nums">
              {language === 'hi'
                ? `प्रश्न ${stepIndex + 1} / ${selectedPathway.questions.length}`
                : `Question ${stepIndex + 1} of ${selectedPathway.questions.length}`}
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-700 transition-all"
              style={{
                width: `${Math.round(((stepIndex + 1) / selectedPathway.questions.length) * 100)}%`,
              }}
            />
          </div>

          {(() => {
            const currentQ = selectedPathway.questions[stepIndex];
            return (
              <div className="mt-6">
                <h2 className="text-lg font-bold text-slate-900">
                  {language === 'hi' ? currentQ.promptHi : currentQ.promptEn}
                </h2>
                <div className="mt-4 space-y-2.5">
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        handleSelectOption(currentQ.id, opt.value, opt.immediateEmergency)
                      }
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition ${
                        opt.immediateEmergency
                          ? 'border-red-200 bg-red-50/60 text-red-900 hover:border-red-400 hover:bg-red-50'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-teal-600 hover:bg-teal-50/40'
                      }`}
                    >
                      <span>{language === 'hi' ? opt.labelHi : opt.labelEn}</span>
                      {opt.immediateEmergency && (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>

                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex(stepIndex - 1)}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{language === 'hi' ? 'पिछला प्रश्न' : 'Previous question'}</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Step 3: Outcome & Doctor Summary */}
      {selectedPathway && completed && evaluation && (
        <div className="space-y-4">
          <div
            role="status"
            className={`rounded-2xl border p-6 ${
              evaluation.urgency === 'emergency'
                ? 'border-red-300 bg-red-50 text-red-950'
                : evaluation.urgency === 'urgent'
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-teal-200 bg-teal-50/60 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {evaluation.urgency === 'emergency' ? (
                <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
              ) : evaluation.urgency === 'urgent' ? (
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
              )}
              <div className="flex-1">
                <div className="text-xs font-bold tracking-wider uppercase">
                  {language === 'hi' ? 'तात्कालिकता स्तर' : 'Urgency Assessment'}:{' '}
                  {evaluation.urgency.toUpperCase()}
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed">
                  {language === 'hi'
                    ? evaluation.recommendedActionHi
                    : evaluation.recommendedActionEn}
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  {evaluation.escalateTo112 && (
                    <a
                      href="tel:112"
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                    >
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      <span>{language === 'hi' ? 'अभी 112 पर कॉल करें' : 'Call 112 Immediately'}</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onFindHospital(
                        evaluation.recommendedFacilityType === 'hospital'
                          ? 'emergency_hospital'
                          : evaluation.recommendedFacilityType === 'clinic'
                            ? 'phc'
                            : 'doctor'
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {language === 'hi'
                        ? 'नजदीकी अस्पताल / क्लिनिक खोजें'
                        : 'Find Nearby Hospital / Clinic'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shareable Doctor Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {language === 'hi'
                  ? 'डॉक्टर के साथ साझा करने योग्य सारांश'
                  : 'Doctor-Ready Triage Summary'}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopySummary()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {copied
                      ? language === 'hi'
                        ? 'कॉपी हो गया'
                        : 'Copied'
                      : language === 'hi'
                        ? 'सारांश कॉपी करें'
                        : 'Copy Summary'}
                  </span>
                </button>
                {user && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveConsented()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-60"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {saving
                        ? language === 'hi'
                          ? 'सहेजा जा रहा है...'
                          : 'Saving...'
                        : language === 'hi'
                          ? 'सहमति से सहेजें'
                          : 'Save with Consent'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700">
              {buildDoctorSummary()}
            </pre>

            {saveStatus && (
              <p className="mt-2 text-xs font-medium text-teal-700">{saveStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
