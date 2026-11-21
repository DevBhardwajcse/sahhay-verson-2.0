'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookmarkCheck,
  HeartPulse,
  Home,
  Lock,
  MapPin,
  MessageSquareHeart,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { UI_STRINGS } from '@/lib/i18n';
import type { Language } from '@/lib/triage-engine';
import { useAuth } from './AuthProvider';
import { LandingDestination, OnboardingScreen } from './OnboardingScreen';
import { AssistantSubMode, HomeDashboard, SahaayTab } from './HomeDashboard';
import { MedicalAssistant } from './MedicalAssistant';
import { GuidedTriage } from './GuidedTriage';
import { EmergencyMapView } from './EmergencyMapView';
import { HelplinesDirectory } from './HelplinesDirectory';
import { OfflineCentre } from './OfflineCentre';
import { SavedSessionsView } from './SavedSessionsView';
import { ProfilePrivacyView } from './ProfilePrivacyView';
import { EmergencySOSModal } from './EmergencySOSModal';

interface SahaayShellProps {
  mapsApiKey: string;
  initialOnboarded?: boolean;
  initialTab?: SahaayTab;
}

export function SahaayShell({
  mapsApiKey,
  initialOnboarded = false,
  initialTab = 'home',
}: SahaayShellProps) {
  const { profile, saveProfileChanges } = useAuth();
  const [language, setLanguage] = useState<Language>('en');
  const [onboarded, setOnboarded] = useState(initialOnboarded);
  const [activeTab, setActiveTab] = useState<SahaayTab>(initialTab);
  const [assistantMode, setAssistantMode] = useState<AssistantSubMode>('chat');
  const [mapCategory, setMapCategory] = useState<string>('emergency_hospital');
  const [mapSpecialtyQuery, setMapSpecialtyQuery] = useState<string>('');
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const [syncedProfileLang, setSyncedProfileLang] = useState<Language | null>(null);
  if (
    profile?.preferredLanguage &&
    (profile.preferredLanguage === 'en' || profile.preferredLanguage === 'hi') &&
    profile.preferredLanguage !== syncedProfileLang
  ) {
    setSyncedProfileLang(profile.preferredLanguage);
    setLanguage(profile.preferredLanguage);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLang = window.localStorage.getItem('sahaay_lang');
    if (storedLang === 'hi' || storedLang === 'en') {
      queueMicrotask(() => setLanguage(storedLang));
    }
  }, []);

  const handleLanguageChange = (nextLang: Language) => {
    setLanguage(nextLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sahaay_lang', nextLang);
    }
    if (profile) {
      void saveProfileChanges({ preferredLanguage: nextLang });
    }
  };

  const handleCompleteOnboarding = (destination?: LandingDestination) => {
    setOnboarded(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sahaay_onboarded', '1');
    }
    if (destination) {
      if (destination.assistantMode) setAssistantMode(destination.assistantMode);
      if (destination.mapCategory) setMapCategory(destination.mapCategory);
      setActiveTab(destination.tab);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigate = (
    tab: SahaayTab,
    options?: { assistantMode?: AssistantSubMode; mapCategory?: string; mapSpecialtyQuery?: string }
  ) => {
    if (options?.assistantMode) setAssistantMode(options.assistantMode);
    if (options?.mapCategory) setMapCategory(options.mapCategory);
    if (options?.mapSpecialtyQuery !== undefined) {
      setMapSpecialtyQuery(options.mapSpecialtyQuery);
    } else if (tab === 'map' && !options?.mapSpecialtyQuery) {
      setMapSpecialtyQuery('');
    }
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const t = UI_STRINGS[language];

  if (!onboarded) {
    return (
      <OnboardingScreen
        language={language}
        onLanguageChange={handleLanguageChange}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  const navItems: Array<{
    id: SahaayTab;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: t.navHome, mobileLabel: language === 'hi' ? 'होम' : 'Home', icon: Home },
    {
      id: 'assistant',
      label: t.navAssistant,
      mobileLabel: language === 'hi' ? 'AI चैट' : 'AI Chat',
      icon: MessageSquareHeart,
    },
    {
      id: 'triage',
      label: t.navTriage,
      mobileLabel: language === 'hi' ? 'ट्राइएज' : 'Triage',
      icon: Stethoscope,
    },
    { id: 'map', label: t.navMap, mobileLabel: language === 'hi' ? 'मानचित्र' : 'Map', icon: MapPin },
    {
      id: 'helplines',
      label: t.navHelplines,
      mobileLabel: language === 'hi' ? 'हेल्पलाइन' : 'Helplines',
      icon: PhoneCall,
    },
    {
      id: 'offline',
      label: t.navOffline,
      mobileLabel: language === 'hi' ? 'निर्देशिका' : 'Safety',
      icon: BookOpen,
    },
    {
      id: 'saved',
      label: t.navSaved,
      mobileLabel: language === 'hi' ? 'सहेजे गए' : 'Saved',
      icon: BookmarkCheck,
    },
    {
      id: 'profile',
      label: t.navProfile,
      mobileLabel: language === 'hi' ? 'प्रोफ़ाइल' : 'Profile',
      icon: UserCheck,
    },
  ];

  const mobileNavItems = navItems.slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Zone 1: Brand */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900">SAHAAY</div>
              <div className="hidden text-[11px] text-slate-500 sm:block">{t.brandTagline}</div>
            </div>
          </button>

          {/* Zone 2: Desktop Quick Mode Indicator */}
          <div className="hidden items-center gap-1.5 lg:flex">
            {(['home', 'assistant', 'triage', 'map', 'helplines'] as SahaayTab[]).map((tabId) => {
              const item = navItems.find((n) => n.id === tabId)!;
              const active = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => handleNavigate(tabId)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Zone 3: Language Toggle + 112 CTA */}
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold"
            >
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`rounded-md px-2 py-1 transition ${
                  language === 'en'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('hi')}
                className={`rounded-md px-2 py-1 transition ${
                  language === 'hi'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-red-700"
            >
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="tabular-nums">SOS / 112</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Desktop Sidebar + Content Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
        {/* Desktop Sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="Primary navigation" className="sticky top-20 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                    active
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="mt-5 space-y-1 border-t border-slate-200 pt-4">
              <Link
                href="/verification"
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-50"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
                <span>{language === 'hi' ? 'स्रोत सत्यापन पोर्टल' : 'Source Verification'}</span>
              </Link>
              <button
                type="button"
                onClick={() => setOnboarded(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>{language === 'hi' ? 'लैंडिंग शोकेस देखें' : 'Landing Showcase'}</span>
              </button>
              <Link
                href="/admin"
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
              >
                <Lock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span>{t.navAdmin}</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Active View Surface */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              {activeTab === 'home' && (
                <HomeDashboard language={language} onNavigate={handleNavigate} />
              )}
              {activeTab === 'assistant' && (
                <MedicalAssistant
                  language={language}
                  initialMode={assistantMode}
                  onFindHospital={(cat, specialtyQuery) =>
                    handleNavigate('map', {
                      mapCategory: cat || 'emergency_hospital',
                      mapSpecialtyQuery: specialtyQuery || '',
                    })
                  }
                  onOpenOffline={() => handleNavigate('offline')}
                />
              )}
              {activeTab === 'triage' && (
                <GuidedTriage
                  language={language}
                  onFindHospital={(cat) =>
                    handleNavigate('map', {
                      mapCategory: cat || 'emergency_hospital',
                      mapSpecialtyQuery: '',
                    })
                  }
                />
              )}
              {activeTab === 'map' && (
                <EmergencyMapView
                  language={language}
                  mapsApiKey={mapsApiKey}
                  initialCategory={mapCategory}
                  initialSpecialtyQuery={mapSpecialtyQuery}
                  onOpenOffline={() => handleNavigate('offline')}
                />
              )}
              {activeTab === 'helplines' && <HelplinesDirectory language={language} />}
              {activeTab === 'offline' && (
                <OfflineCentre
                  language={language}
                  onStartOfflineTriage={() => handleNavigate('triage')}
                />
              )}
              {activeTab === 'saved' && <SavedSessionsView language={language} />}
              {activeTab === 'profile' && (
                <ProfilePrivacyView
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Compact Persistent Clinical Boundary Footer */}
          <footer className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-600">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
                <span>{t.disclaimerBanner}</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3 font-semibold text-slate-700">
                <Link href="/verification" className="text-teal-800 hover:underline">
                  {language === 'hi' ? 'स्रोत सत्यापन' : 'Verification Portal'}
                </Link>
                <button
                  type="button"
                  onClick={() => handleNavigate('offline')}
                  className="hover:text-teal-800 hover:underline"
                >
                  {t.navOffline}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('profile')}
                  className="hover:text-teal-800 hover:underline"
                >
                  {t.navProfile}
                </button>
                <Link href="/admin" className="hover:text-teal-800 hover:underline">
                  {t.navAdmin}
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Compact Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xs lg:hidden"
      >
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${
                  active ? 'text-teal-800' : 'text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <EmergencySOSModal
        open={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        language={language}
        onManageContacts={() => handleNavigate('profile')}
      />
    </div>
  );
}
