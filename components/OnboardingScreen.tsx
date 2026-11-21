'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Droplets,
  FileSearch,
  FileText,
  Globe,
  HeartPulse,
  Hospital,
  Pause,
  PhoneCall,
  Play,
  Route,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Language } from '@/lib/triage-engine';
import type { AssistantSubMode, SahaayTab } from './HomeDashboard';
import { EmergencySOSModal } from './EmergencySOSModal';

export interface LandingDestination {
  tab: SahaayTab;
  assistantMode?: AssistantSubMode;
  mapCategory?: string;
}

interface OnboardingScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: (destination?: LandingDestination) => void;
}

const VIDEO_SRC = '/assets/aistudio/Showcasing_AI_healthcare_emergen__ce427a73_50f15f10.mp4';

const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function OnboardingScreen({
  language,
  onLanguageChange,
  onComplete,
}: OnboardingScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroContainerRef = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [sosOpen, setSosOpen] = useState(false);
  const [inlineLatch, setInlineLatch] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroContainerRef,
    offset: ['start start', 'end start'],
  });
  const videoY = useTransform(heroProgress, [0, 1], [0, 44]);
  const videoScale = useTransform(heroProgress, [0, 1], [1, 0.97]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      void vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  const handleInlineLatch = (val: number) => {
    setInlineLatch(val);
    if (val >= 95) {
      setInlineLatch(100);
      setSosOpen(true);
      setTimeout(() => setInlineLatch(0), 400);
    }
  };

  const isHi = language === 'hi';

  const capabilities = [
    {
      num: '01.',
      title: isHi ? 'AI लैब रिपोर्ट विश्लेषक' : 'AI Lab Report Analyzer',
      desc: isHi
        ? 'ब्लड टेस्ट, यूरिन या अन्य लैब रिपोर्ट अपलोड करें। सामान्य भाषा में शब्द समझें और सीमा से बाहर के मान पहचानें।'
        : 'Upload blood, urine, or pathology reports. Plain-language term explanations with values outside displayed reference ranges highlighted for doctor review.',
      action: isHi ? 'लैब रिपोर्ट जांचें' : 'Analyze Lab Report',
      span: 'lg:col-span-2',
      accent: 'cyan' as const,
      icon: FileSearch,
      onClick: () => onComplete({ tab: 'assistant', assistantMode: 'lab_report' }),
    },
    {
      num: '02.',
      title: isHi ? 'AI प्रिस्क्रिप्शन रीडर' : 'AI Prescription Reader',
      desc: isHi
        ? 'डॉक्टर के पर्चे से पढ़ने योग्य दवा के नाम, निर्देश और दिनांक निकालें — बिना किसी उपचार में बदलाव किए।'
        : 'Extract readable medicine names, timing instructions, and dates from doctor prescriptions while explicitly flagging unclear handwriting.',
      action: isHi ? 'पर्चा स्कैन करें' : 'Scan Prescription',
      span: 'lg:col-span-1',
      accent: 'teal' as const,
      icon: FileText,
      onClick: () => onComplete({ tab: 'assistant', assistantMode: 'prescription' }),
    },
    {
      num: '03.',
      title: isHi ? 'दवा सुरक्षा एवं इंटरैक्शन जांच' : 'Medicine Safety Checker',
      desc: isHi
        ? 'सत्यापित OpenFDA और क्लिनिकल डेटाबेस से दवाओं के संभावित इंटरैक्शन और डुप्लिकेट तत्वों की जांच करें।'
        : 'Cross-check listed medicines against clinician-reviewed interaction rules and live U.S. FDA OpenFDA labels for pharmacist or physician review.',
      action: isHi ? 'दवा सुरक्षा जांचें' : 'Check Interactions',
      span: 'lg:col-span-1',
      accent: 'cyan' as const,
      icon: ShieldCheck,
      onClick: () => onComplete({ tab: 'assistant', assistantMode: 'safety_check' }),
    },
    {
      num: '04.',
      title: isHi ? 'स्मार्ट अस्पताल मैचर' : 'Smart Hospital Matcher',
      desc: isHi
        ? 'केवल निकटतम नहीं — विशेषज्ञता, आपातकालीन सेवा, सरकारी/निजी श्रेणी और दूरी के आधार पर सबसे उपयुक्त अस्पताल चुनें।'
        : 'Match nearby facilities by medical specialty, emergency services, public/private sector listing, operating status, and proximity on live Google Maps.',
      action: isHi ? 'उपयुक्त अस्पताल खोजें' : 'Match Hospitals',
      span: 'lg:col-span-2',
      accent: 'teal' as const,
      icon: Hospital,
      onClick: () => onComplete({ tab: 'map', mapCategory: 'emergency_hospital' }),
    },
    {
      num: '05.',
      title: isHi ? 'ट्रैफिक-आधारित आपातकालीन रूटिंग' : 'Traffic-Aware Emergency Routing',
      desc: isHi
        ? 'लाइव ट्रैफिक के अनुसार यात्रा समय और वैकल्पिक मार्गों की तुलना करें।'
        : 'Compare primary and alternative road routes with live traffic-aware travel-time estimates directly on the hospital map.',
      action: isHi ? 'लाइव मार्ग देखें' : 'Open Route Navigator',
      span: 'lg:col-span-1',
      accent: 'cyan' as const,
      icon: Route,
      onClick: () => onComplete({ tab: 'map', mapCategory: 'emergency_hospital' }),
    },
    {
      num: '06.',
      title: isHi ? 'ब्लड बैंक फाइंडर' : 'Blood Bank Finder',
      desc: isHi
        ? 'नजदीकी ब्लड बैंक, सीधा फोन संपर्क और भारत सरकार के आधिकारिक e-RaktKosh स्टॉक लिंक तक तुरंत पहुँचें।'
        : 'Locate nearby blood banks with direct phone contacts and official MoHFW e-RaktKosh blood-group availability lookup.',
      action: isHi ? 'ब्लड बैंक खोजें' : 'Find Blood Banks',
      span: 'lg:col-span-1',
      accent: 'red' as const,
      icon: Droplets,
      onClick: () => onComplete({ tab: 'map', mapCategory: 'blood_bank' }),
    },
    {
      num: '07.',
      title: isHi ? 'आपातकालीन SOS और विश्वसनीय संपर्क' : 'Emergency SOS & Trusted Contacts',
      desc: isHi
        ? 'स्लाइड-लैच SOS से तुरंत 112 कॉल करें और परिवार को अपनी लाइव Google Maps लोकेशन भेजें।'
        : 'Initiate verified 112/108/102 emergency calls and optionally share a live Google Maps pin with saved family or caregiver contacts.',
      action: isHi ? 'SOS पैनल खोलें' : 'Open Emergency SOS',
      span: 'lg:col-span-1',
      accent: 'red' as const,
      icon: ShieldAlert,
      onClick: () => setSosOpen(true),
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: isHi ? 'पूछें, बोलें या रिपोर्ट अपलोड करें' : 'Ask, Speak, or Upload',
      body: isHi
        ? 'हिन्दी या अंग्रेज़ी में प्रश्न पूछें, दवा का पर्चा, लैब रिपोर्ट या पैकेजिंग स्कैन करें।'
        : 'Type or speak in English or Hindi, or upload lab reports, prescriptions, and medicine strips.',
    },
    {
      step: '02',
      title: isHi ? 'सत्यापित स्रोतों से मिलान' : 'Grounded Clinical Verification',
      body: isHi
        ? 'प्रत्येक उत्तर MoHFW, WHO, ICMR, OpenFDA और MedlinePlus संदर्भों व दिनांक के साथ आता है।'
        : 'Every explanation cites MoHFW, WHO, ICMR, OpenFDA, and MedlinePlus provenance with explicit limits.',
    },
    {
      step: '03',
      title: isHi ? 'सही विशेषज्ञ और अस्पताल चुनें' : 'Match Appropriate Care',
      body: isHi
        ? 'लक्षणों के अनुसार उपयुक्त विशेषज्ञता, सरकारी/निजी अस्पताल या ब्लड बैंक से जुड़ें।'
        : 'Bridge directly from AI guidance into specialty-matched hospitals, clinics, or blood banks.',
    },
    {
      step: '04',
      title: isHi ? 'ट्रैफिक-आधारित नेविगेशन और SOS' : 'Navigate & Alert Family',
      body: isHi
        ? 'लाइव ट्रैफिक रूट देखें, डॉक्टर सारांश डाउनलोड करें या परिवार को लाइव पिन साझा करें।'
        : 'Follow traffic-aware routes, bring a structured Doctor Summary, or share live GPS with trusted contacts.',
    },
  ];

  return (
    <div className="clinical-precision-surface relative min-h-screen overflow-x-hidden">
      {/* Subtle Top Scroll Progress Line */}
      {mounted && (
        <motion.div
          style={{ scaleX: smoothProgress, transformOrigin: '0% 50%' }}
          className="fixed top-0 right-0 left-0 z-50 h-[2px] bg-[#06B6D4]"
        />
      )}

      {/* Architectural Coordinate Backdrop */}
      <div
        aria-hidden="true"
        className="clinical-grid-backdrop pointer-events-none fixed inset-0 z-0 opacity-75"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[540px] bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.12),transparent_68%)]"
      />

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0f131d]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-8">
          {/* Zone 1: Single Clean Brand Wordmark */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#06B6D4]/15 text-[#4cd7f6] ring-1 ring-[#06B6D4]/30">
              <HeartPulse className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="clinical-precision-display text-lg font-bold tracking-tight text-[#dfe2f1]">
              SAHAAY
            </span>
          </button>

          {/* Zone 2: 4 Clean Single-Line Nav Links */}
          <nav
            aria-label="Landing navigation"
            className="hidden items-center gap-7 text-sm font-medium text-[#bcc9cd] md:flex"
          >
            <a
              href="#capabilities"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#4cd7f6]"
            >
              {isHi ? 'क्षमताएं' : 'Capabilities'}
            </a>
            <a
              href="#workflow"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#4cd7f6]"
            >
              {isHi ? 'कार्यप्रणाली' : 'Workflow'}
            </a>
            <Link
              href="/verification"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#4cd7f6]"
            >
              {isHi ? 'स्रोत सत्यापन' : 'Verification'}
            </Link>
            <a
              href="#emergency-sos"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#4cd7f6]"
            >
              {isHi ? 'आपातकालीन SOS' : 'Emergency SOS'}
            </a>
          </nav>

          {/* Zone 3: Single Primary AI Action */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onComplete({ tab: 'home' })}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded bg-[#06B6D4] px-4 py-2 text-xs font-bold text-[#0B0F19] transition-colors hover:bg-[#22D3EE]"
            >
              <span>{isHi ? 'SAHAAY खोलें' : 'Launch Assistant'}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ==================== SECTION 1: HERO + CINEMATIC VIDEO SHOWCASE ==================== */}
        <section
          ref={heroContainerRef}
          className="mx-auto max-w-[1440px] px-4 pt-10 pb-16 sm:px-8 lg:pt-14 lg:pb-24"
        >
          {/* Quiet Bilingual Control Strip Below Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: REVEAL_EASE }}
            className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/70 pb-4 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2.5 text-[#bcc9cd]">
              <span className="font-medium text-[#4cd7f6]">Clinical Precision AI</span>
              <span aria-hidden="true">·</span>
              <span>
                {isHi
                  ? 'द्विभाषी चिकित्सा मार्गदर्शन एवं लाइव आपातकालीन नेविगेशन'
                  : 'Bilingual Medical Intelligence & Live Emergency Navigation'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                role="group"
                aria-label="Choose language"
                className="inline-flex items-center gap-1 rounded border border-slate-700/70 bg-[#171b26] p-0.5"
              >
                <Globe className="ml-2 h-3.5 w-3.5 text-[#6bd8cb]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`rounded-xs px-2.5 py-1 text-xs font-semibold transition ${
                    language === 'en'
                      ? 'bg-[#262a35] text-[#4cd7f6]'
                      : 'text-[#bcc9cd] hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('hi')}
                  className={`rounded-xs px-2.5 py-1 text-xs font-semibold transition ${
                    language === 'hi'
                      ? 'bg-[#262a35] text-[#4cd7f6]'
                      : 'text-[#bcc9cd] hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          </motion.div>

          {/* 12-Column Asymmetric Hero Split */}
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left Proposition Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: REVEAL_EASE }}
              className="lg:col-span-5"
            >
              <h1 className="text-balance text-4xl leading-[1.12] font-bold tracking-[-0.03em] text-[#dfe2f1] sm:text-5xl lg:text-[3.35rem]">
                {isHi
                  ? 'जब हर सेकंड महत्वपूर्ण हो, सही चिकित्सा मार्गदर्शन सबसे पहले।'
                  : 'When every second matters, clinical clarity comes first.'}
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#bcc9cd]">
                {isHi
                  ? 'SAHAAY आपके मेडिकल प्रश्नों, लैब रिपोर्ट्स, प्रिस्क्रिप्शन और दवा सुरक्षा को सत्यापित चिकित्सा स्रोतों से जोड़ता है — और लाइव Google Maps पर सही विशेषज्ञ अस्पताल व ब्लड बैंक तक पहुँचाता है।'
                  : 'SAHAAY pairs bilingual Gemini medical intelligence with clinician-reviewed references, lab report & prescription analysis, drug safety checks, and live traffic-aware hospital navigation across India.'}
              </p>

              {/* Primary + Isolated Emergency Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onComplete({ tab: 'assistant', assistantMode: 'chat' })}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded bg-[#06B6D4] px-6 py-3.5 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#22D3EE]"
                >
                  <span>{isHi ? 'AI चिकित्सा सहायक शुरू करें' : 'Start AI Medical Assistant'}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onComplete({ tab: 'map', mapCategory: 'emergency_hospital' })}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded border border-slate-700 bg-[#1c1f2a] px-5 py-3.5 text-sm font-semibold text-[#dfe2f1] transition-colors hover:border-[#4cd7f6] hover:text-[#4cd7f6]"
                >
                  <span>{isHi ? 'लाइव अस्पताल मानचित्र' : 'Open Live Hospital Map'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSosOpen(true)}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded bg-[#EF4444] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-red-600"
                >
                  <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  <span>{isHi ? 'आपातकाल 112 / SOS' : 'Emergency 112 / SOS'}</span>
                </button>
              </div>

              {/* Clean Tabular Scope Readout (Zero Pills) */}
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                <div>
                  <div className="clinical-precision-display text-2xl font-bold text-[#4cd7f6] tabular-nums">
                    24/7
                  </div>
                  <div className="mt-0.5 text-xs text-[#bcc9cd]">
                    {isHi ? 'हिन्दी और अंग्रेज़ी AI' : 'Hindi & English AI'}
                  </div>
                </div>
                <div>
                  <div className="clinical-precision-display text-2xl font-bold text-[#6bd8cb] tabular-nums">
                    10+
                  </div>
                  <div className="mt-0.5 text-xs text-[#bcc9cd]">
                    {isHi ? 'MoHFW / WHO प्रोटोकॉल' : 'MoHFW / WHO Sources'}
                  </div>
                </div>
                <div>
                  <div className="clinical-precision-display text-2xl font-bold text-[#dfe2f1] tabular-nums">
                    112
                  </div>
                  <div className="mt-0.5 text-xs text-[#bcc9cd]">
                    {isHi ? 'त्वरित आपातकालीन SOS' : 'Instant SOS Escalation'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Dominant Focal Anchor: Parallax Video Showcase */}
            <motion.div
              style={mounted ? { y: videoY, scale: videoScale } : undefined}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: REVEAL_EASE }}
              className="lg:col-span-7"
            >
              <div className="relative overflow-hidden rounded-lg border border-slate-700/70 bg-[#0a0e18] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)]">
                {/* Razor-thin top inner highlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#4cd7f6]/40 to-transparent"
                />

                <div className="relative aspect-video w-full bg-[#0a0e18]">
                  <video
                    ref={videoRef}
                    src={VIDEO_SRC}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    suppressHydrationWarning
                    aria-label="SAHAAY AI Healthcare and Emergency Navigation product showcase video"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Dedicated Obsidian Bezel Control Strip (Zero Caption Overlap) */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/90 bg-[#111622] px-4 py-3">
                  <div className="text-xs font-medium text-[#bcc9cd]">
                    {isHi
                      ? 'SAHAAY प्लेटफ़ॉर्म प्रीव्यू · AI चैट, स्कैन और लाइव मानचित्र'
                      : 'SAHAAY Platform Overview · AI Guidance, Scans & Live Maps'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause showcase video' : 'Play showcase video'}
                      className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#171b26] px-3 py-1.5 text-xs font-semibold text-[#dfe2f1] transition hover:border-[#4cd7f6] hover:text-[#4cd7f6]"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                      className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#171b26] px-3 py-1.5 text-xs font-semibold text-[#dfe2f1] transition hover:border-[#4cd7f6] hover:text-[#4cd7f6]"
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5 text-[#4cd7f6]" aria-hidden="true" />
                          <span>Unmute</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-[#6bd8cb]" aria-hidden="true" />
                          <span>Sound On</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== SECTION 2: TOP-8 CAPABILITIES ASYMMETRIC BENTO ==================== */}
        <section
          id="capabilities"
          className="border-t border-slate-800/80 bg-[#0a0e18]/60 py-16 lg:py-24"
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: REVEAL_EASE }}
              className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
            >
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-[#4cd7f6]">
                  {isHi ? 'शीर्ष 8 उच्च-प्राथमिकता क्षमताएं' : 'Core Clinical & Emergency Capabilities'}
                </div>
                <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-[#dfe2f1] sm:text-4xl">
                  {isHi
                    ? 'एक एकीकृत मंच में रिपोर्ट विश्लेषण, दवा सुरक्षा और लाइव अस्पताल नेविगेशन'
                    : 'Built for diagnostic clarity, medication safety, and rapid care routing'}
                </h2>
              </div>
              <Link
                href="/verification"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#6bd8cb] transition hover:text-[#4cd7f6]"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>{isHi ? 'सत्यापित स्रोत पोर्टल देखें' : 'Inspect Verified Sources Portal'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((cap, index) => {
                const Icon = cap.icon;
                const iconColor =
                  cap.accent === 'red'
                    ? 'text-[#FCA5A5] bg-[#EF4444]/15 border-[#EF4444]/30'
                    : cap.accent === 'teal'
                      ? 'text-[#6bd8cb] bg-[#0D9488]/15 border-[#0D9488]/30'
                      : 'text-[#4cd7f6] bg-[#06B6D4]/15 border-[#06B6D4]/30';
                const ctaColor =
                  cap.accent === 'red'
                    ? 'text-[#FCA5A5]'
                    : cap.accent === 'teal'
                      ? 'text-[#6bd8cb]'
                      : 'text-[#4cd7f6]';

                return (
                  <motion.button
                    key={cap.num}
                    type="button"
                    onClick={cap.onClick}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.45,
                      delay: Math.min(index * 0.05, 0.25),
                      ease: REVEAL_EASE,
                    }}
                    className={`group flex flex-col justify-between rounded-lg border border-slate-800 bg-[#171b26] p-6 text-left transition-colors hover:border-[#06B6D4]/50 hover:bg-[#1c1f2a] ${cap.span}`}
                  >
                    <span className="block w-full">
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-semibold text-[#bcc9cd] tabular-nums">
                          {cap.num}
                        </span>
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded border ${iconColor}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </span>
                      <span className="mt-4 block text-lg font-semibold text-[#dfe2f1]">
                        {cap.title}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-[#bcc9cd]">
                        {cap.desc}
                      </span>
                    </span>

                    <span
                      className={`mt-6 inline-flex items-center gap-1.5 text-xs font-semibold ${ctaColor}`}
                    >
                      <span>{cap.action}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </motion.button>
                );
              })}

              {/* 08. Dedicated Card Linking Directly to /verification Page */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: 0.2, ease: REVEAL_EASE }}
                className="flex flex-col justify-between rounded-lg border border-[#06B6D4]/40 bg-[#1c1f2a] p-6 lg:col-span-3"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#4cd7f6]">
                      <span className="font-mono tabular-nums">08.</span>
                      <span>
                        {isHi ? 'सत्यापित चिकित्सा स्रोत एवं गुणवत्ता ऑडिट' : 'Medical Answer Verification with Sources'}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-[#dfe2f1]">
                      {isHi
                        ? 'प्रत्येक AI उत्तर के साथ आधिकारिक स्रोत, प्रकाशन दिनांक और त्रुटि रिपोर्टिंग'
                        : 'Transparent citations, publication dates, evidence limits, and public error reporting'}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#bcc9cd]">
                      {isHi
                        ? 'MoHFW भारत, WHO, ICMR, NLEM, OpenFDA और NIH MedlinePlus के सभी सत्यापित दस्तावेज़ों की समीक्षा करें और किसी भी संदिग्ध AI उत्तर को सीधे हमारे समर्पित सत्यापन पृष्ठ पर रिपोर्ट करें।'
                        : 'Explore our dedicated Medical Answer Verification Portal to inspect every MoHFW, WHO, ICMR, OpenFDA, and MedlinePlus source version, verification date, and report any answer for clinical audit.'}
                    </p>
                  </div>
                  <Link
                    href="/verification"
                    className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded bg-[#06B6D4] px-5 py-3 text-xs font-bold text-[#0B0F19] transition hover:bg-[#22D3EE]"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isHi ? 'सत्यापन पोर्टल खोलें' : 'Open Verification Portal'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ==================== SECTION 3: 4-STEP CLINICAL WORKFLOW ==================== */}
        <section id="workflow" className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: REVEAL_EASE }}
            className="max-w-2xl"
          >
            <div className="text-xs font-semibold text-[#6bd8cb]">
              {isHi ? 'एंड-टू-एंड कार्यप्रणाली' : 'End-to-End Clinical Flow'}
            </div>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-[#dfe2f1] sm:text-4xl">
              {isHi
                ? 'पहले प्रश्न से लेकर सही अस्पताल के दरवाज़े तक'
                : 'From initial health question to the right specialist door'}
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((ws, idx) => (
              <motion.div
                key={ws.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.07, ease: REVEAL_EASE }}
                className="rounded-lg border border-slate-800 bg-[#171b26] p-6"
              >
                <div className="font-mono text-2xl font-bold text-[#4cd7f6] tabular-nums">
                  {ws.step}
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#dfe2f1]">{ws.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#bcc9cd]">{ws.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ==================== SECTION 4: INTERACTIVE EMERGENCY PANIC OVERRIDE SWITCH ==================== */}
        <section
          id="emergency-sos"
          className="border-t border-slate-800/80 bg-[#0a0e18]/75 py-16 lg:py-20"
        >
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: REVEAL_EASE }}
              className="grid gap-8 rounded-lg border border-slate-800 bg-[#171b26] p-6 sm:p-8 lg:grid-cols-12 lg:items-center"
            >
              <div className="lg:col-span-7">
                <div className="text-xs font-semibold text-[#FCA5A5]">
                  {isHi ? 'तत्काल आपातकालीन सुरक्षा' : 'Isolated Emergency Override'}
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#dfe2f1] sm:text-3xl">
                  {isHi
                    ? 'गलत कॉल से सुरक्षा के साथ 1-सेकंड SOS सक्रियण'
                    : 'Zero-accidental-trigger SOS latch with instant 112 & family GPS alert'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#bcc9cd]">
                  {isHi
                    ? 'आपात स्थिति में स्लाइडर को दाईं ओर खींचें। यह 112, 108 और 102 हेल्पलाइन के साथ-साथ आपके सहेजे गए विश्वसनीय संपर्कों को लाइव Google Maps लोकेशन भेजने का विकल्प तुरंत खोलता है।'
                    : 'Designed for high-stress moments: slide the panic override switch right to immediately unlock 112 / 108 / 102 direct calls and optional live GPS pin sharing with your saved trusted contacts.'}
                </p>
              </div>

              <div className="rounded-lg border border-[#EF4444]/40 bg-[#0f131d] p-5 lg:col-span-5">
                <div className="mb-2.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#FCA5A5]">
                    {isHi ? 'SOS पैनल खोलने के लिए स्लाइड करें' : 'Slide Latch to Activate Emergency SOS'}
                  </span>
                  <span className="font-mono text-[#bcc9cd] tabular-nums">{inlineLatch}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={inlineLatch}
                  aria-label="Slide emergency panic override switch"
                  onChange={(e) => handleInlineLatch(Number(e.target.value))}
                  className="h-3 w-full cursor-pointer appearance-none rounded bg-slate-800 accent-[#EF4444]"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 rounded bg-[#EF4444] px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                  >
                    <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Direct Call 112</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onComplete({ tab: 'profile' })}
                    className="text-xs font-semibold text-[#4cd7f6] hover:underline"
                  >
                    {isHi ? 'विश्वसनीय संपर्क जोड़ें →' : 'Configure Trusted Contacts →'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== SECTION 5: FINAL CONVERSION & QUIET FOOTER ==================== */}
        <section className="mx-auto max-w-[1440px] px-4 py-16 text-center sm:px-8 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: REVEAL_EASE }}
            className="mx-auto max-w-2xl"
          >
            <h2 className="text-balance text-3xl font-bold tracking-tight text-[#dfe2f1] sm:text-4xl">
              {isHi
                ? 'तैयार हैं? अभी SAHAAY क्लिनिकल वर्कस्पेस खोलें।'
                : 'Ready to explore SAHAAY Clinical Workspace?'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#bcc9cd]">
              {isHi
                ? 'साइन-इन वैकल्पिक है। सामान्य स्वास्थ्य चैट, लैब रिपोर्ट विश्लेषण, दवा सुरक्षा जांच और लाइव Google Maps बिना खाते के भी तुरंत उपयोग करें।'
                : 'Sign-in is completely optional. Start using the bilingual AI medical assistant, lab & prescription tools, and live hospital navigator immediately.'}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onComplete({ tab: 'home' })}
                className="inline-flex items-center gap-2 rounded bg-[#06B6D4] px-7 py-3.5 text-sm font-bold text-[#0B0F19] transition hover:bg-[#22D3EE]"
              >
                <span>{isHi ? 'SAHAAY वर्कस्पेस खोलें' : 'Enter SAHAAY Workspace'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link
                href="/verification"
                className="inline-flex items-center gap-2 rounded border border-slate-700 bg-[#171b26] px-5 py-3.5 text-sm font-semibold text-[#dfe2f1] transition hover:border-[#6bd8cb] hover:text-[#6bd8cb]"
              >
                <span>{isHi ? 'स्रोत सत्यापन पृष्ठ' : 'Medical Verification Portal'}</span>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#0a0e18] py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 text-xs text-[#bcc9cd] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="max-w-2xl leading-relaxed">
            <strong className="text-[#dfe2f1]">SAHAAY</strong> — Informational healthcare guidance and live emergency resource navigation. Not a medical diagnostician, pharmacist, or emergency dispatch service. In a medical emergency, call <a href="tel:112" className="font-bold text-[#FCA5A5] underline">112</a> immediately.
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-5 font-medium">
            <Link href="/verification" className="hover:text-[#4cd7f6]">
              Verification Portal
            </Link>
            <Link href="/admin" className="hover:text-[#4cd7f6]">
              Admin Portal
            </Link>
            <a href="tel:112" className="font-bold text-[#FCA5A5] hover:underline">
              112 Helpline
            </a>
          </div>
        </div>
      </footer>

      <EmergencySOSModal
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        language={language}
        onManageContacts={() => onComplete({ tab: 'profile' })}
      />
    </div>
  );
}
