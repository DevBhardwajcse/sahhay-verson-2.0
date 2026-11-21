'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Crosshair,
  Loader2,
  MessageSquare,
  PhoneCall,
  Share2,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  buildLocationShareMessage,
  loadEmergencyContacts,
  type TrustedEmergencyContact,
} from '@/lib/emergency-contact';
import type { Language } from '@/lib/triage-engine';

interface EmergencySOSModalProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  onManageContacts?: () => void;
}

export function EmergencySOSModal({
  open,
  onClose,
  language,
  onManageContacts,
}: EmergencySOSModalProps) {
  const [latchProgress, setLatchProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [contacts, setContacts] = useState<TrustedEmergencyContact[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setLatchProgress(0);
        setUnlocked(false);
        setLocError(null);
      });
      return;
    }
    const list = loadEmergencyContacts();
    queueMicrotask(() => setContacts(list));
  }, [open]);

  if (!open) return null;

  const handleLatchChange = (val: number) => {
    setLatchProgress(val);
    if (val >= 95) {
      setUnlocked(true);
      setLatchProgress(100);
    }
  };

  const handleGetLiveLocation = () => {
    setLocError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocError('Browser geolocation is not available on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: `Live GPS (${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`,
        });
        setLocating(false);
      },
      () => {
        setLocError('Location permission denied or unavailable. You can still call 112 immediately.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sharePayload = coords
    ? buildLocationShareMessage(coords.lat, coords.lng, coords.label, language)
    : {
        mapsUrl: '',
        message:
          language === 'hi'
            ? 'SAHAAY आपातकालीन सहायता: मुझे तत्काल सहायता की आवश्यकता है। कृपया अभी संपर्क करें।'
            : 'SAHAAY Emergency Alert: I need urgent assistance right now. Please contact me immediately.',
      };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sharePayload.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Emergency SOS and Trusted Contacts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e18]/85 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-lg border border-slate-700/70 bg-[#171b26] p-6 text-[#dfe2f1] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#EF4444]/15 text-[#EF4444]">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#FCA5A5]">
                {language === 'hi' ? 'आपातकालीन SOS और विश्वसनीय संपर्क' : 'Emergency SOS & Trusted Contacts'}
              </div>
              <h2 className="mt-0.5 text-lg font-bold text-[#dfe2f1]">
                {language === 'hi'
                  ? 'तत्काल सहायता एवं लोकेशन शेयर'
                  : 'Rapid Emergency Call & Location Share'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Emergency SOS dialog"
            className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Multi-Step Sliding Latch Panic Override */}
        {!unlocked ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs leading-relaxed text-[#bcc9cd]">
              {language === 'hi'
                ? 'गलती से कॉल लगने से बचाने के लिए नीचे स्लाइडर को दाईं ओर खींचें और आपातकालीन 112 कॉल व विश्वसनीय संपर्क संदेश तुरंत सक्रिय करें।'
                : 'Slide the override latch all the way right to unlock direct emergency calling and instant trusted-contact location alerts.'}
            </p>

            <div className="rounded-lg border border-[#EF4444]/50 bg-[#0f131d] p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-[#FCA5A5]">
                  {language === 'hi' ? 'SOS लॉक खोलने के लिए स्लाइड करें' : 'Slide to Unlock Emergency SOS'}
                </span>
                <span className="font-mono text-[#bcc9cd] tabular-nums">{latchProgress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={latchProgress}
                aria-label="Slide to unlock Emergency SOS actions"
                onChange={(e) => handleLatchChange(Number(e.target.value))}
                className="h-3 w-full cursor-pointer appearance-none rounded bg-slate-800 accent-[#EF4444]"
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  {language === 'hi' ? 'या तुरंत 112 डायल करें:' : 'Or dial directly right now:'}
                </span>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 rounded bg-[#EF4444] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Call 112 Now</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 rounded border border-[#EF4444]/60 bg-[#EF4444]/15 px-3.5 py-2.5 text-xs font-semibold text-[#FCA5A5]">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {language === 'hi'
                  ? 'SOS सक्रिय — सीधे कॉल करें या परिवार को अपनी लोकेशन भेजें।'
                  : 'Emergency SOS Unlocked — Place a direct call or alert your trusted contacts.'}
              </span>
            </div>

            {/* Direct Verified Emergency Numbers */}
            <div className="grid grid-cols-3 gap-2.5">
              <a
                href="tel:112"
                className="flex flex-col items-center justify-center rounded-lg bg-[#EF4444] p-3 text-center text-white transition hover:bg-red-600"
              >
                <span className="font-mono text-lg font-bold tabular-nums">112</span>
                <span className="text-[11px] font-medium text-red-100">National SOS</span>
              </a>
              <a
                href="tel:108"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-[#262a35] p-3 text-center text-[#dfe2f1] transition hover:border-[#4cd7f6]"
              >
                <span className="font-mono text-lg font-bold tabular-nums">108</span>
                <span className="text-[11px] text-[#bcc9cd]">Ambulance</span>
              </a>
              <a
                href="tel:102"
                className="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-[#262a35] p-3 text-center text-[#dfe2f1] transition hover:border-[#4cd7f6]"
              >
                <span className="font-mono text-lg font-bold tabular-nums">102</span>
                <span className="text-[11px] text-[#bcc9cd]">Maternal / Med</span>
              </a>
            </div>

            {/* Live GPS Location Attachment */}
            <div className="rounded-lg border border-slate-700/60 bg-[#0f131d] p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-[#dfe2f1]">
                  {coords ? coords.label : 'Attach Live GPS Location (Optional)'}
                </div>
                <button
                  type="button"
                  disabled={locating}
                  onClick={handleGetLiveLocation}
                  className="inline-flex items-center gap-1.5 rounded bg-[#06B6D4] px-3 py-1.5 text-xs font-bold text-[#0B0F19] transition hover:bg-[#22D3EE] disabled:opacity-60"
                >
                  {locating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{coords ? 'Refresh GPS' : 'Fetch My GPS'}</span>
                </button>
              </div>
              {locError && <p className="mt-1.5 text-[11px] text-[#FCA5A5]">{locError}</p>}
            </div>

            {/* Trusted Contacts Quick Alert */}
            <div className="space-y-2 rounded-lg border border-slate-700/60 bg-[#0f131d] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dfe2f1]">
                  Trusted Emergency Contacts ({contacts.length})
                </span>
                {onManageContacts && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onManageContacts();
                    }}
                    className="text-[11px] font-semibold text-[#4cd7f6] hover:underline"
                  >
                    Manage Contacts
                  </button>
                )}
              </div>

              {contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((c, idx) => {
                    const dial = c.phone.replace(/[^0-9+]/g, '');
                    return (
                      <div
                        key={c.id || idx}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 bg-[#171b26] px-3 py-2 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#dfe2f1]">
                            {c.name}
                            {c.relationship ? ` (${c.relationship})` : ''}
                          </div>
                          <div className="font-mono text-[11px] text-[#bcc9cd] tabular-nums">
                            {c.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${dial}`}
                            className="inline-flex items-center gap-1 rounded bg-[#0D9488] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-teal-700"
                          >
                            <PhoneCall className="h-3 w-3" aria-hidden="true" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`sms:${dial}?body=${encodeURIComponent(sharePayload.message)}`}
                            className="inline-flex items-center gap-1 rounded border border-slate-600 bg-[#262a35] px-2.5 py-1.5 text-[11px] font-semibold text-[#dfe2f1] hover:border-[#4cd7f6]"
                          >
                            <MessageSquare className="h-3 w-3" aria-hidden="true" />
                            <span>SMS Pin</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-[#bcc9cd]">
                  No trusted contacts saved yet. Add up to 3 family/caregiver numbers in Profile &amp; Privacy for 1-tap SOS sharing.
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(sharePayload.message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#1c1f2a] px-3 py-1.5 text-xs font-semibold text-[#6bd8cb] hover:border-[#6bd8cb]"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Share via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-[#1c1f2a] px-3 py-1.5 text-xs font-semibold text-[#dfe2f1] hover:border-[#4cd7f6]"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{copied ? 'Alert Copied' : 'Copy Alert Message'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
