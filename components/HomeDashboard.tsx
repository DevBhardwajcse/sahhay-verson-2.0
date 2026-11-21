'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookmarkCheck,
  BookOpen,
  Camera,
  Droplets,
  FileSearch,
  FileText,
  MapPin,
  MessageSquareHeart,
  Mic,
  PhoneCall,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import { UI_STRINGS } from '@/lib/i18n';
import { usePWA, PWAInstallButton } from './PWABootstrap';
import { useAuth } from './AuthProvider';

export type SahaayTab =
  | 'home'
  | 'assistant'
  | 'triage'
  | 'map'
  | 'helplines'
  | 'offline'
  | 'saved'
  | 'profile';

export type AssistantSubMode =
  | 'chat'
  | 'lab_report'
  | 'prescription'
  | 'safety_check'
  | 'medicine'
  | 'injury'
  | 'voice'
  | 'reference';

interface HomeDashboardProps {
  language: Language;
  onNavigate: (
    tab: SahaayTab,
    options?: { assistantMode?: AssistantSubMode; mapCategory?: string; mapSpecialtyQuery?: string }
  ) => void;
}

export function HomeDashboard({ language, onNavigate }: HomeDashboardProps) {
  const t = UI_STRINGS[language];
  const { isOnline } = usePWA();
  const { user, profile, savedSessions } = useAuth();

  const greetingName = profile?.displayName || user?.displayName || null;

  return (
    <div className="space-y-6">
      {/* Hero + Immediate Emergency Escalation Strip */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5 text-teal-800 font-semibold">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.onlineLabel}
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
                    {t.offlineLabel}
                  </>
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {language === 'hi'
                  ? 'द्विभाषी चिकित्सा जानकारी और आपातकालीन नेविगेशन'
                  : 'Bilingual Medical Information & Emergency Navigation'}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {language === 'hi'
                ? greetingName
                  ? `नमस्ते, ${greetingName}`
                  : 'AI से पूछें। स्थिति समझें। सही सहायता खोजें।'
                : greetingName
                  ? `Namaste, ${greetingName}`
                  : 'Ask AI. Understand the concern. Find the right help.'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {language === 'hi'
                ? 'लाइव Gemini चिकित्सा सहायक से प्रश्न पूछें, दवा पैकेजिंग स्कैन करें, या लाइव Google Maps पर अपने आसपास के उपयुक्त अस्पताल, विशेषज्ञ और सरकारी हेल्पलाइन खोजें।'
                : 'Ask our live bilingual Gemini medical assistant, scan medicine packaging, or locate the most appropriate nearby hospitals, specialists, and traffic-aware routes on live Google Maps.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <PWAInstallButton compact />
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-red-700"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              <span>{language === 'hi' ? 'आपातकाल: 112 कॉल करें' : 'Emergency: Call 112'}</span>
            </a>
            <button
              type="button"
              onClick={() => onNavigate('map', { mapCategory: 'emergency_hospital' })}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-700 bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{t.findHospital}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Primary Multimodal AI & Triage Quick-Launch Grid */}
      <section aria-label={language === 'hi' ? 'मुख्य सेवाएं' : 'Core workflows'}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'hi' ? 'AI चिकित्सा सहायक एवं जांच उपकरण' : 'AI Medical Assistant & Assessment Tools'}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('assistant', { assistantMode: 'reference' })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {language === 'hi' ? 'चिकित्सा संदर्भ डेटाबेस' : 'Clinical Reference Lookup'}
            </span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onNavigate('assistant', { assistantMode: 'chat' })}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <MessageSquareHeart className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                {language === 'hi' ? 'सामान्य स्वास्थ्य चैट' : 'Medical Q&A Chat'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === 'hi'
                  ? 'MedlinePlus और WHO संदर्भों के साथ हिन्दी या अंग्रेज़ी में संरचित स्वास्थ्य जानकारी।'
                  : 'Structured health explanations grounded in MedlinePlus, OpenFDA & WHO references.'}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
              <span>{language === 'hi' ? 'प्रश्न पूछें' : 'Ask a question'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('assistant', { assistantMode: 'medicine' })}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Pill className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 text-sm font-bold text-slate-900">{t.scanMedicine}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === 'hi'
                  ? 'दवा की पैकेजिंग, स्ट्रिप या बोतल का लेबल पढ़ें, घटक और सुरक्षा सावधानियां समझें।'
                  : 'Inspect packaging, strips, or bottles for ingredients, expiry, uses & safety limits.'}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
              <span>{language === 'hi' ? 'पैकेजिंग स्कैन करें' : 'Scan packaging'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('assistant', { assistantMode: 'injury' })}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 text-sm font-bold text-slate-900">{t.analyzeInjury}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === 'hi'
                  ? 'गैर-नैदानिक दृश्य अवलोकन, सीमाएं और डॉक्टर/अस्पताल जाने के संकेत जानें।'
                  : 'Limited non-diagnostic surface observations, clear boundaries & hospital referral.'}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
              <span>{language === 'hi' ? 'दृश्य अवलोकन शुरू करें' : 'Start observation'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('assistant', { assistantMode: 'voice' })}
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Mic className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 text-sm font-bold text-slate-900">{t.voiceChat}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {language === 'hi'
                  ? 'हिन्दी या अंग्रेज़ी में बोलकर पूछें और स्पष्ट आवाज़ व टेक्स्ट ट्रांसक्रिप्ट में उत्तर सुनें।'
                  : 'Speak in Hindi or English with live transcription and calm spoken AI responses.'}
              </p>
            </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
                <span>{language === 'hi' ? 'वॉइस मोड खोलें' : 'Open voice mode'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </button>
          </div>

          {/* Top-Priority Clinical Tools Row: Lab Report, Prescription, Medicine Safety, Blood Bank & Verification */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => onNavigate('assistant', { assistantMode: 'lab_report' })}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                  <FileSearch className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  {language === 'hi' ? 'AI लैब रिपोर्ट विश्लेषक' : 'AI Lab Report Analyzer'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {language === 'hi'
                    ? 'ब्लड या यूरिन रिपोर्ट अपलोड करें, सीमा से बाहर के मान पहचानें और डॉक्टर के प्रश्न पाएं।'
                    : 'Upload blood or urine reports to explain terms, flag out-of-range values & prep doctor questions.'}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
                <span>{language === 'hi' ? 'लैब रिपोर्ट जांचें' : 'Analyze report'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('assistant', { assistantMode: 'prescription' })}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  {language === 'hi' ? 'AI प्रिस्क्रिप्शन रीडर' : 'AI Prescription Reader'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {language === 'hi'
                    ? 'पर्चे से पढ़ने योग्य दवा के नाम, समय निर्देश और दिनांक समझें — बिना उपचार बदले।'
                    : 'Extract legible medicine names, written instructions & dates while flagging unclear handwriting.'}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
                <span>{language === 'hi' ? 'पर्चा स्कैन करें' : 'Read prescription'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('assistant', { assistantMode: 'safety_check' })}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600 hover:shadow-xs"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  {language === 'hi' ? 'दवा सुरक्षा चेकर' : 'Medicine Safety Checker'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {language === 'hi'
                    ? 'संभावित दवा इंटरैक्शन और समान सक्रिय तत्वों की जांच करें (OpenFDA + सत्यापित नियम)।'
                    : 'Flag potential drug interactions and duplicate active ingredients for pharmacist/doctor review.'}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition">
                <span>{language === 'hi' ? 'इंटरैक्शन जांचें' : 'Check interactions'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('map', { mapCategory: 'blood_bank' })}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-red-500 hover:shadow-xs"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
                  <Droplets className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                  {language === 'hi' ? 'ब्लड बैंक फाइंडर' : 'Blood Bank Finder'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {language === 'hi'
                    ? 'नजदीकी ब्लड बैंक, सीधा फोन संपर्क और आधिकारिक e-RaktKosh ब्लड ग्रुप खोज लिंक।'
                    : 'Locate nearby blood banks on Live Maps with direct phone calls and official e-RaktKosh lookup.'}
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-red-700 group-hover:translate-x-0.5 transition">
                <span>{language === 'hi' ? 'ब्लड बैंक खोजें' : 'Find blood banks'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-xs">
            <span className="font-medium text-teal-950">
              {language === 'hi'
                ? 'प्रत्येक AI उत्तर के स्रोत, प्रकाशन दिनांक और गुणवत्ता ऑडिट की जांच करें।'
                : 'Inspect every clinical guideline version, verification date, and report any AI answer for review.'}
            </span>
            <Link
              href="/verification"
              className="inline-flex items-center gap-1 font-bold text-teal-800 hover:underline"
            >
              <span>{language === 'hi' ? 'स्रोत सत्यापन पोर्टल खोलें' : 'Open Medical Verification Portal'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

      {/* Guided Triage, Helplines & Static Safety Directory Row */}
      <section className="grid gap-4 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate('triage')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-600"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'निर्देशित स्वास्थ्य ट्राइएज' : 'Guided Health Triage'}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {language === 'hi'
                ? 'सीने में दर्द, बुखार, चोट या मातृ/शिशु स्वास्थ्य की संरचित जांच करें और डॉक्टर सारांश बनाएं।'
                : 'Step-by-step clinician-reviewed symptom pathways with instant doctor summary.'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('helplines')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-red-500"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'सत्यापित सरकारी हेल्पलाइन' : 'Verified Govt. Helplines'}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {language === 'hi'
                ? '112, 102, 108, 1098, 181, 14416 (Tele-MANAS) और अन्य राष्ट्रीय आपातकालीन नंबर।'
                : '112, 102, 108, 1098, 181, Tele-MANAS (14416), and national disaster numbers.'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('offline')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-500"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'आपातकालीन सुरक्षा निर्देशिका' : 'Emergency Safety Directory'}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {language === 'hi'
                ? 'प्रमुख सरकारी अस्पताल निर्देशिका और WHO प्राथमिक उपचार गाइड (नेटवर्क न होने पर भी उपलब्ध)।'
                : 'Public tertiary hospital directory & WHO first-aid guides kept available as backup.'}
            </p>
          </div>
        </button>
      </section>

      {/* Account & Saved Sessions Summary Row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <BookmarkCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>{t.navSaved}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('saved')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              {language === 'hi' ? 'सभी देखें' : 'View all'}
            </button>
          </div>
          {savedSessions.length === 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {language === 'hi'
                ? 'अभी कोई सत्र सहेजा नहीं गया है। केवल आपकी स्पष्ट सहमति से ही सारांश सहेजे जाते हैं।'
                : 'No saved session summaries yet. Summaries are only saved when you explicitly consent.'}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {savedSessions.slice(0, 3).map((s) => (
                <li key={s.sessionId} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="min-w-0 pr-3">
                    <div className="truncate font-semibold text-slate-800">{s.title}</div>
                    <div className="truncate text-slate-500">{s.summary}</div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] uppercase text-slate-500">
                    {s.urgencyLevel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>{t.navProfile}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              {language === 'hi' ? 'प्रबंधित करें' : 'Manage'}
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            {user
              ? language === 'hi'
                ? `${user.email} के रूप में साइन इन। भाषा प्राथमिकता, वैकल्पिक चिकित्सा इतिहास सहमति और डेटा हटाने के विकल्प यहाँ उपलब्ध हैं।`
                : `Signed in as ${user.email}. Manage language preferences, optional consented medical history, retention period, or delete all stored data.`
              : language === 'hi'
                ? 'साइन इन वैकल्पिक है। अपनी भाषा और सत्र सारांश सुरक्षित रूप से सहेजने के लिए Google से साइन इन करें।'
                : 'Signing in is optional. Sign in with Google only if you want to save language preferences, optional medical context, or consented session summaries.'}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <Activity className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
            <span>
              {language === 'hi'
                ? 'कच्ची चिकित्सा तस्वीरें कभी स्थायी रूप से संग्रहीत नहीं की जातीं।'
                : 'Raw medicine or injury photos are never permanently stored.'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
