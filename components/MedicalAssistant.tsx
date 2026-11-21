'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import {
  BookmarkPlus,
  BookOpen,
  Brain,
  Camera,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileSearch,
  FileText,
  Flag,
  Loader2,
  MapPin,
  MessageSquareHeart,
  Mic,
  PhoneCall,
  Pill,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';
import { INITIAL_GREETING, UI_STRINGS } from '@/lib/i18n';
import type { Language } from '@/lib/triage-engine';
import type { ChatMessage } from '@/lib/assistant-types';
import { useAuth } from './AuthProvider';
import { usePWA } from './PWABootstrap';
import type { AssistantSubMode } from './HomeDashboard';
import { LabReportAnalyzer } from './LabReportAnalyzer';
import { PrescriptionReader } from './PrescriptionReader';
import { MedicineSafetyChecker } from './MedicineSafetyChecker';
import { MedicineScannerPanel } from './assistant/MedicineScannerPanel';
import { InjuryObserverPanel } from './assistant/InjuryObserverPanel';
import { VoiceConsultationPanel } from './assistant/VoiceConsultationPanel';
import { ClinicalReferencePanel } from './assistant/ClinicalReferencePanel';
import { DoctorSummaryModal, ReportAnswerModal } from './assistant/AssistantModals';

interface MedicalAssistantProps {
  language: Language;
  initialMode?: AssistantSubMode;
  onFindHospital: (category?: string, specialtyQuery?: string) => void;
  onOpenOffline: () => void;
}

const ASSISTANT_TABS = [
  { id: 'chat', icon: MessageSquareHeart, en: 'Medical Chat', hi: 'स्वास्थ्य चैट' },
  { id: 'lab_report', icon: FileSearch, en: 'Lab Report', hi: 'लैब रिपोर्ट' },
  { id: 'prescription', icon: FileText, en: 'Prescription', hi: 'प्रिस्क्रिप्शन' },
  { id: 'safety_check', icon: ShieldCheck, en: 'Safety Checker', hi: 'दवा सुरक्षा' },
  { id: 'medicine', icon: Pill, en: 'Medicine Scan', hi: 'दवा स्कैन' },
  { id: 'injury', icon: Camera, en: 'Injury Photo', hi: 'चोट अवलोकन' },
  { id: 'voice', icon: Mic, en: 'Voice', hi: 'वॉइस' },
  { id: 'reference', icon: BookOpen, en: 'References', hi: 'चिकित्सा संदर्भ' },
] as const;

export function MedicalAssistant({
  language,
  initialMode = 'chat',
  onFindHospital,
  onOpenOffline,
}: MedicalAssistantProps) {
  const t = UI_STRINGS[language];
  const { isOnline } = usePWA();
  const { user, profile, saveSessionWithConsent } = useAuth();

  const [mode, setMode] = useState<AssistantSubMode>(initialMode);
  const [prevInitialMode, setPrevInitialMode] = useState<AssistantSubMode>(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
  }
  const msgSeqRef = useRef(0);

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [deepThinking, setDeepThinking] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [expandedRefKeys, setExpandedRefKeys] = useState<Record<string, boolean>>({});
  const [doctorSummary, setDoctorSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [safetySeedMedicines, setSafetySeedMedicines] = useState<string[]>([]);
  const [flaggingMsg, setFlaggingMsg] = useState<ChatMessage | null>(null);

  const medicalHistoryPayload = profile?.consentMedicalHistory
    ? {
        ageGroup: profile.ageGroup || undefined,
        allergies: profile.allergiesSummary || undefined,
        chronicConditions: profile.conditionsSummary || undefined,
        currentMedications: profile.medicationsSummary || undefined,
      }
    : undefined;

  const sendChatMessage = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text || chatLoading) return;
    setChatError(null);
    setSaveFeedback(null);

    msgSeqRef.current += 1;
    const userMsg: ChatMessage = {
      id: `u-${msgSeqRef.current}`,
      role: 'user',
      text,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/medical/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          deepThinking,
          useSearchGrounding: true,
          history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
          medicalHistoryContext: medicalHistoryPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || 'Could not reach SAHAAY AI right now.');
      } else {
        msgSeqRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${msgSeqRef.current}`,
            role: 'model',
            text: data.reply,
            emergency: data.emergency,
            references: data.references,
            groundingSources: data.groundingSources,
            recommendedCare: data.recommendedCare,
            followUpSuggestions: data.followUpSuggestions,
          },
        ]);
      }
    } catch {
      setChatError(
        language === 'hi'
          ? 'नेटवर्क त्रुटि। कृपया सुरक्षा निर्देशिका या 112 हेल्पलाइन का उपयोग करें।'
          : 'Network error. Please use the Safety Directory or Verified 112 Helplines if urgent.'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateDoctorSummary = async () => {
    if (messages.length === 0 || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/medical/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          messages: messages.slice(-20).map((m) => ({
            role: m.role,
            text: m.text.slice(0, 4000),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setDoctorSummary(data.summary);
      } else {
        setChatError(data.error || 'Could not generate doctor summary.');
      }
    } catch {
      setChatError('Unable to generate doctor summary right now.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveCurrentSession = async (
    sessionType: 'general_chat' | 'medicine_scan' | 'injury_analysis' | 'voice_session',
    title: string,
    summary: string,
    urgency: 'routine' | 'soon' | 'urgent' | 'emergency' = 'routine',
    consentedTranscript?: string
  ) => {
    if (!user) {
      setSaveFeedback(
        language === 'hi'
          ? 'सत्र सारांश सहेजने के लिए कृपया Profile & Privacy में Google से साइन इन करें।'
          : 'Sign in with Google under Profile & Privacy to save consented summaries.'
      );
      return;
    }
    try {
      await saveSessionWithConsent({
        sessionType,
        language,
        title,
        summary,
        urgencyLevel: urgency,
        consentedTranscript,
      });
      setSaveFeedback(
        language === 'hi'
          ? 'आपकी स्पष्ट सहमति से सारांश "Saved Sessions" में सहेजा गया।'
          : 'Summary saved to Saved Sessions with your explicit consent.'
      );
    } catch {
      setSaveFeedback(
        language === 'hi' ? 'सारांश सहेजने में त्रुटि हुई।' : 'Could not save summary right now.'
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Mode Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {language === 'hi' ? 'SAHAAY AI चिकित्सा सहायक' : 'SAHAAY AI Medical Assistant'}
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">
              {language === 'hi'
                ? 'सामान्य स्वास्थ्य जानकारी, दवा पैकेजिंग स्कैन, दृश्य चोट अवलोकन और द्विभाषी आवाज़ सहायता — डॉक्टर का विकल्प नहीं।'
                : 'General health education, medicine packaging scan, limited injury observations & bilingual voice — informational only.'}
            </p>
          </div>
          <a
            href="tel:112"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.emergency112}</span>
          </a>
        </div>

        {/* Clean Segmented Sub-Mode Tabs */}
        <div
          role="tablist"
          aria-label="Medical assistant modes"
          className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4"
        >
          {ASSISTANT_TABS.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setMode(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{language === 'hi' ? item.hi : item.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!isOnline && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
          <span>
            {language === 'hi'
              ? 'आप वर्तमान में ऑफ़लाइन हैं। लाइव AI उत्तर के लिए इंटरनेट आवश्यक है — आप ऑफ़लाइन सहायता केंद्र और 112 हेल्पलाइन का उपयोग कर सकते हैं।'
              : 'You are currently offline. Live Gemini AI features require connectivity — Offline Assistance Centre and 112 Helplines work offline.'}
          </span>
          <button
            type="button"
            onClick={onOpenOffline}
            className="rounded-lg bg-amber-800 px-3 py-1.5 font-bold text-white hover:bg-amber-900"
          >
            {language === 'hi' ? 'ऑफ़लाइन केंद्र खोलें' : 'Open Offline Centre'}
          </button>
        </div>
      )}

      {saveFeedback && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-semibold text-teal-900"
        >
          <span>{saveFeedback}</span>
          <button type="button" onClick={() => setSaveFeedback(null)} aria-label="Dismiss notice">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ==================== TAB 1: MEDICAL CHAT ==================== */}
      {mode === 'chat' && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={deepThinking}
                onChange={(e) => setDeepThinking(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <Brain className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <span>
                {language === 'hi'
                  ? 'गहन चिकित्सा विश्लेषण (Deep Reasoning)'
                  : 'Deep Medical Reasoning'}
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {messages.length > 0 && (
                <>
                  <button
                    type="button"
                    disabled={summaryLoading}
                    onClick={() => void handleGenerateDoctorSummary()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {summaryLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-700" aria-hidden="true" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                    )}
                    <span>
                      {language === 'hi' ? 'डॉक्टर सारांश बनाएं' : 'Generate Doctor Summary'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const summaryText = messages
                        .map((m) => `${m.role === 'user' ? 'User' : 'SAHAAY'}: ${m.text}`)
                        .join('\n\n')
                        .slice(0, 3800);
                      const hasEmergency = messages.some((m) => m.emergency?.isEmergency);
                      void handleSaveCurrentSession(
                        'general_chat',
                        messages[0].text.slice(0, 90),
                        summaryText,
                        hasEmergency ? 'emergency' : 'routine'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.saveSessionBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setDoctorSummary(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{language === 'hi' ? 'साफ़ करें' : 'Clear'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="max-h-[540px] space-y-4 overflow-y-auto p-5">
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm leading-relaxed text-slate-800">
              <div className="mb-1 text-xs font-bold text-teal-800">SAHAAY AI Health Assistant</div>
              <p>{INITIAL_GREETING[language]}</p>

              {messages.length === 0 && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {(language === 'hi'
                    ? [
                        'हल्के बुखार और सिरदर्द में डॉक्टर से कब मिलना चाहिए?',
                        'निर्जलीकरण (डिहाइड्रेशन) के शुरुआती लक्षण क्या हैं?',
                        'दवा के लेबल पर एक्सपायरी और सामग्री कैसे जांचें?',
                      ]
                    : [
                        'When should a doctor evaluate a persistent fever?',
                        'What are early warning signs of dehydration?',
                        'How should I check medicine packaging safely?',
                      ]
                  ).map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => void sendChatMessage(sample)}
                      className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-teal-900 hover:bg-teal-50"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? 'flex justify-end' : 'space-y-3'}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-2xl rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
                    {msg.text}
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl border p-4 text-sm ${
                      msg.emergency?.isEmergency
                        ? 'border-red-300 bg-red-50 text-red-950'
                        : 'border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {msg.emergency?.isEmergency && (
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-600 px-4 py-3 text-white">
                        <div className="flex items-center gap-2 text-xs font-extrabold">
                          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {language === 'hi' ? msg.emergency.headlineHi : msg.emergency.headlineEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href="tel:112"
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 hover:bg-red-50"
                          >
                            Call 112
                          </a>
                          <button
                            type="button"
                            onClick={() => onFindHospital('emergency_hospital')}
                            className="rounded-lg border border-white/50 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            {t.findHospital}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="markdown-clinical text-sm">
                      <Markdown>{msg.text}</Markdown>
                    </div>

                    {msg.recommendedCare?.shouldRecommend && !msg.emergency?.isEmergency && (
                      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
                            <Stethoscope className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="text-xs">
                            <div className="font-bold text-teal-950">
                              {language === 'hi'
                                ? `सुझाई गई देखभाल: ${msg.recommendedCare.labelHi}`
                                : `Appropriate Care Match: ${msg.recommendedCare.labelEn}`}
                            </div>
                            <p className="mt-0.5 text-slate-700">
                              {language === 'hi'
                                ? msg.recommendedCare.reasonHi
                                : msg.recommendedCare.reasonEn}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onFindHospital(
                              msg.recommendedCare!.facilityCategory,
                              msg.recommendedCare!.specialtyQuery
                            )
                          }
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-teal-800"
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            {language === 'hi'
                              ? 'नजदीकी चिकित्सा सहायता खोजें'
                              : 'Find Nearby Medical Assistance'}
                          </span>
                        </button>
                      </div>
                    )}

                    {msg.references && msg.references.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="text-[11px] font-bold tracking-wide text-teal-800 uppercase">
                          {language === 'hi'
                            ? 'सत्यापित चिकित्सा संदर्भ (MoHFW / WHO / OpenFDA / MedlinePlus)'
                            : 'Clinician-Reviewed References (MoHFW / WHO / OpenFDA / MedlinePlus)'}
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {msg.references.map((ref, idx) => {
                            const refKey = `${msg.id}-${idx}`;
                            const isExpanded = Boolean(expandedRefKeys[refKey]);
                            return (
                              <div
                                key={refKey}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-bold text-slate-900">
                                    {ref.documentTitle || ref.title}
                                  </div>
                                  <button
                                    type="button"
                                    aria-expanded={isExpanded}
                                    onClick={() =>
                                      setExpandedRefKeys((prev) => ({
                                        ...prev,
                                        [refKey]: !prev[refKey],
                                      }))
                                    }
                                    className="shrink-0 rounded-md p-0.5 text-slate-500 hover:bg-slate-200/70"
                                    aria-label={
                                      isExpanded
                                        ? 'Collapse reference details'
                                        : 'Expand reference details'
                                    }
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                                <div className="mt-0.5 text-[11px] font-medium text-teal-800">
                                  {ref.source}
                                </div>
                                {(ref.version || ref.lastVerifiedDate) && (
                                  <div className="mt-1 font-mono text-[10px] text-slate-500">
                                    {ref.reviewStatus || 'Reviewed'}
                                    {ref.version ? ` · ${ref.version}` : ''}
                                    {ref.lastVerifiedDate
                                      ? ` · Verified ${ref.lastVerifiedDate}`
                                      : ''}
                                  </div>
                                )}
                                <p
                                  className={`mt-1.5 text-slate-600 ${
                                    isExpanded ? '' : 'line-clamp-2'
                                  }`}
                                >
                                  {ref.commonUses}
                                </p>
                                {isExpanded && (
                                  <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                                    <div>
                                      <strong className="text-slate-800">Precautions:</strong>{' '}
                                      {ref.precautions}
                                    </div>
                                    {ref.publicationDate && (
                                      <div>
                                        <strong className="text-slate-800">Published:</strong>{' '}
                                        {ref.publicationDate}
                                      </div>
                                    )}
                                    {ref.url && (
                                      <a
                                        href={ref.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                                      >
                                        <span>Open Reference Source</span>
                                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Sources:</span>
                        {msg.groundingSources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-teal-800 hover:underline"
                          >
                            <span className="max-w-[180px] truncate">{src.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px]">
                      <Link
                        href="/verification"
                        className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:underline"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {language === 'hi'
                            ? 'स्रोत एवं सत्यापन तिथियां देखें'
                            : 'Verify Clinical Sources & Evidence'}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setFlaggingMsg(msg)}
                        className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-amber-700"
                      >
                        <Flag className="h-3 w-3" aria-hidden="true" />
                        <span>
                          {language === 'hi'
                            ? 'गलत उत्तर रिपोर्ट करें'
                            : 'Report Potentially Incorrect Answer'}
                        </span>
                      </button>
                    </div>

                    {msg.followUpSuggestions &&
                      msg.followUpSuggestions.length > 0 &&
                      messages[messages.length - 1]?.id === msg.id && (
                        <div className="mt-3.5 border-t border-slate-100 pt-3">
                          <div className="mb-1.5 text-[11px] font-semibold text-slate-500">
                            {language === 'hi' ? 'संबंधित अगले प्रश्न:' : 'Suggested follow-up questions:'}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUpSuggestions.map((sugg) => (
                              <button
                                key={sugg}
                                type="button"
                                disabled={chatLoading}
                                onClick={() => void sendChatMessage(sugg)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs font-medium text-slate-800 transition hover:border-teal-600 hover:bg-teal-50 hover:text-teal-900 disabled:opacity-50"
                              >
                                {sugg}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>
                  {language === 'hi'
                    ? 'सत्यापित चिकित्सा संदर्भों के साथ उत्तर तैयार किया जा रहा है...'
                    : 'Consulting clinician-reviewed references and preparing structured guidance...'}
                </span>
              </div>
            )}

            {chatError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {chatError}
              </div>
            )}
          </div>

          {/* Input Composer with Quick Multimodal Shortcuts */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendChatMessage();
            }}
            className="border-t border-slate-200 p-4"
          >
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                {language === 'hi' ? 'त्वरित उपकरण:' : 'Quick tools:'}
              </span>
              <button
                type="button"
                onClick={() => setMode('medicine')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
              >
                <Pill className="h-3 w-3" aria-hidden="true" />
                <span>{language === 'hi' ? 'दवा स्कैन' : 'Medicine Scan'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('injury')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
              >
                <Camera className="h-3 w-3" aria-hidden="true" />
                <span>{language === 'hi' ? 'चोट तस्वीर' : 'Injury Photo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('voice')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
              >
                <Mic className="h-3 w-3" aria-hidden="true" />
                <span>{language === 'hi' ? 'बोलकर पूछें' : 'Voice Chat'}</span>
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendChatMessage();
                  }
                }}
                aria-label={
                  language === 'hi' ? 'अपना स्वास्थ्य प्रश्न लिखें' : 'Ask a general health question'
                }
                placeholder={
                  language === 'hi'
                    ? 'अपना सामान्य स्वास्थ्य प्रश्न हिन्दी या अंग्रेज़ी में लिखें...'
                    : 'Type a general health question in English or Hindi...'
                }
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{language === 'hi' ? 'भेजें' : 'Send'}</span>
              </button>
            </div>
          </form>

          {doctorSummary && (
            <DoctorSummaryModal
              language={language}
              summary={doctorSummary}
              firstQuestionSnippet={messages[0]?.text || 'Consultation'}
              hasEmergency={messages.some((m) => m.emergency?.isEmergency)}
              onClose={() => setDoctorSummary(null)}
              onSaveSummary={async (title, summaryText, urgency) => {
                await handleSaveCurrentSession('general_chat', title, summaryText, urgency);
              }}
            />
          )}
        </div>
      )}

      {mode === 'medicine' && (
        <MedicineScannerPanel
          language={language}
          onFindHospital={onFindHospital}
          onSaveSession={handleSaveCurrentSession}
          onClearSaveFeedback={() => setSaveFeedback(null)}
        />
      )}

      {mode === 'injury' && (
        <InjuryObserverPanel
          language={language}
          onFindHospital={onFindHospital}
          onSaveSession={handleSaveCurrentSession}
          onClearSaveFeedback={() => setSaveFeedback(null)}
        />
      )}

      {mode === 'voice' && (
        <VoiceConsultationPanel
          language={language}
          medicalHistoryContext={medicalHistoryPayload}
          onSwitchToChat={() => setMode('chat')}
          onSaveSession={handleSaveCurrentSession}
        />
      )}

      {mode === 'reference' && <ClinicalReferencePanel language={language} />}

      {mode === 'lab_report' && (
        <LabReportAnalyzer
          language={language}
          onFindHospital={onFindHospital}
          onSaveSummary={async (title, summary) => {
            await handleSaveCurrentSession('general_chat', title, summary, 'routine');
          }}
        />
      )}

      {mode === 'prescription' && (
        <PrescriptionReader
          language={language}
          onSendToSafetyChecker={(meds) => {
            setSafetySeedMedicines(meds);
            setMode('safety_check');
          }}
          onSaveSummary={async (title, summary) => {
            await handleSaveCurrentSession('medicine_scan', title, summary, 'routine');
          }}
        />
      )}

      {mode === 'safety_check' && (
        <MedicineSafetyChecker language={language} initialMedicines={safetySeedMedicines} />
      )}

      {flaggingMsg && (
        <ReportAnswerModal
          message={flaggingMsg}
          questionSnippet={messages[0]?.text || 'Medical chat answer'}
          onClose={() => setFlaggingMsg(null)}
        />
      )}
    </div>
  );
}
