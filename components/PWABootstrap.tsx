'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Download, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextValue {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  triggerInstall: () => Promise<void>;
  mapsQuotaExceeded: boolean;
  reportMapsQuotaExceeded: () => void;
}

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  canInstall: false,
  isInstalled: false,
  triggerInstall: async () => {},
  mapsQuotaExceeded: false,
  reportMapsQuotaExceeded: () => {},
});

export function usePWA() {
  return useContext(PWAContext);
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function PWABootstrap({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const reportMapsQuotaExceeded = useCallback(() => {
    setMapsQuotaExceeded(true);
    setBannerDismissed(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Online / Offline status tracking
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // 2. Service Worker registration (PWA offline shell)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-fatal in preview iframes where SW scope may be restricted
      });
    }

    // 3. Install prompt listener & initial browser status sync
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    queueMicrotask(() => {
      setIsOnline(navigator.onLine);
      setIsInstalled(Boolean(standalone));
    });

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Case A Google Maps Demo Key Quota Defense:
    // Register gm_authFailure, gmp-quota-exceeded event, and console.error tap
    const onQuotaEvent = () => {
      setMapsQuotaExceeded(true);
      setBannerDismissed(false);
    };
    window.addEventListener('gmp-quota-exceeded', onQuotaEvent);

    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      if (typeof prevAuthFailure === 'function') prevAuthFailure();
    };

    const origConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      try {
        const joined = args.map((a) => String(a)).join(' ');
        if (
          joined.includes('OverQuotaMapError') ||
          joined.includes('QuotaExceededError') ||
          joined.includes('OVER_QUERY_LIMIT')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } catch {
        // ignore serialization edge cases
      }
      origConsoleError.apply(console, args);
    };

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('gmp-quota-exceeded', onQuotaEvent);
      console.error = origConsoleError;
      window.gm_authFailure = prevAuthFailure;
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        canInstall: Boolean(deferredPrompt) && !isInstalled,
        isInstalled,
        triggerInstall,
        mapsQuotaExceeded,
        reportMapsQuotaExceeded,
      }}
    >
      {/* Case A Mandatory Sticky Amber Top Banner when Maps Quota Exceeded */}
      {mapsQuotaExceeded && !bannerDismissed && (
        <div
          role="alert"
          className="sticky top-0 z-50 w-full border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <p className="leading-snug">
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-amber-950 underline underline-offset-2 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account. Offline Assistance Centre and 112
                Helplines remain fully available.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss maps quota notice"
              className="rounded-lg p-1 text-amber-800 hover:bg-amber-200/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Connectivity Banner */}
      {!isOnline && (
        <div
          role="status"
          className="sticky top-0 z-40 w-full border-b border-slate-300 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
            <WifiOff className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>
              You are currently offline. Guided Triage, Verified 112 Helplines, and the Offline
              Assistance Centre remain accessible. Live AI &amp; Google Maps require connectivity.
            </span>
          </div>
        </div>
      )}

      {children}
    </PWAContext.Provider>
  );
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { canInstall, isInstalled, triggerInstall } = usePWA();

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Installed as App
      </span>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => void triggerInstall()}
      className={
        compact
          ? 'inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 transition hover:bg-teal-100'
          : 'inline-flex items-center gap-2 rounded-xl border border-teal-700 bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800'
      }
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      <span>{compact ? 'Install App' : 'Install SAHAAY for Offline Access'}</span>
    </button>
  );
}
