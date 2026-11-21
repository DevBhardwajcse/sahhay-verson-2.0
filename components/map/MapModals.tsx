'use client';

import React, { useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, PhoneCall, Share2, X } from 'lucide-react';
import type { NormalizedEmergencyPlace } from '@/app/api/maps/nearby/route';
import type { TrustedEmergencyContact } from '@/lib/emergency-contact';
import type { Language } from '@/lib/triage-engine';

interface ShareLocationModalProps {
  language: Language;
  locationLabel: string;
  sharePayload: { mapsUrl: string; message: string };
  trustedContacts: TrustedEmergencyContact[];
  onClose: () => void;
}

export function ShareLocationModal({
  language,
  locationLabel,
  sharePayload,
  trustedContacts,
  onClose,
}: ShareLocationModalProps) {
  const [shareCopied, setShareCopied] = useState(false);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(sharePayload.message);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      setShareCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share current location"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {language === 'hi' ? 'मेरी लोकेशन साझा करें' : 'Share My Location'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {language === 'hi'
                ? 'आपकी पुष्टि के बिना कोई संदेश स्वतः नहीं भेजा जाता।'
                : 'Nothing is ever sent automatically — choose how to share your Google Maps pin.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share location modal"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {trustedContacts.length > 0 ? (
          <div className="mt-3 space-y-2">
            {trustedContacts.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs"
              >
                <div className="font-bold text-teal-900">
                  {contact.name}
                  {contact.relationship ? ` (${contact.relationship})` : ''}
                </div>
                <div className="mt-0.5 font-mono text-teal-800">{contact.phone}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={`sms:${contact.phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(
                      sharePayload.message
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 font-bold text-white hover:bg-teal-800"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{language === 'hi' ? 'SMS द्वारा भेजें' : 'Send via SMS'}</span>
                  </a>
                  <a
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700 bg-white px-3 py-1.5 font-bold text-teal-800 hover:bg-teal-50"
                  >
                    <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{language === 'hi' ? 'कॉल करें' : 'Call'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {language === 'hi'
              ? 'त्वरित SMS साझाकरण के लिए आप Profile & Privacy में अधिकतम 3 विश्वसनीय आपातकालीन संपर्क सहेज सकते हैं।'
              : 'Tip: Save up to 3 Trusted Emergency Contacts in Profile & Privacy for one-tap SOS & SMS location sharing.'}
          </div>
        )}

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">{locationLabel}</div>
          <div className="mt-1 break-all font-mono text-[11px] text-teal-800">
            {sharePayload.mapsUrl}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCopyShareLink()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            {shareCopied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {shareCopied
                ? language === 'hi'
                  ? 'कॉपी हो गया!'
                  : 'Copied!'
                : language === 'hi'
                  ? 'लोकेशन संदेश कॉपी करें'
                  : 'Copy Location Message'}
            </span>
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(sharePayload.message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

interface FacilityReportModalProps {
  language: Language;
  place: NormalizedEmergencyPlace;
  onClose: () => void;
}

export function FacilityReportModal({ language, place, onClose }: FacilityReportModalProps) {
  const [reportIssueType, setReportIssueType] = useState<
    'closed' | 'wrong_phone' | 'wrong_address' | 'wrong_hours' | 'wrong_specialty' | 'other'
  >('wrong_phone');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const handleSubmitFacilityReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportSubmitting) return;
    setReportSubmitting(true);
    setReportFeedback(null);
    try {
      const res = await fetch('/api/maps/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.id,
          facilityName: place.name,
          facilityAddress: place.address,
          issueType: reportIssueType,
          details: reportDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReportFeedback(data.error || 'Could not submit report.');
      } else {
        setReportFeedback(
          language === 'hi'
            ? 'धन्यवाद! आपकी रिपोर्ट समीक्षा के लिए दर्ज कर ली गई है।'
            : data.message || 'Thank you! Your report has been logged for review.'
        );
        setReportDetails('');
      }
    } catch {
      setReportFeedback('Network error while submitting report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report incorrect facility information"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <form
        onSubmit={handleSubmitFacilityReport}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {language === 'hi'
                ? 'अस्पताल/सुविधा जानकारी सुधार रिपोर्ट'
                : 'Report Incorrect Facility Information'}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-teal-800">{place.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report modal"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label htmlFor="report-issue-type" className="block text-xs font-semibold text-slate-700">
            {language === 'hi' ? 'समस्या का प्रकार' : 'Issue Type'}
          </label>
          <select
            id="report-issue-type"
            value={reportIssueType}
            onChange={(e) =>
              setReportIssueType(
                e.target.value as
                  | 'closed'
                  | 'wrong_phone'
                  | 'wrong_address'
                  | 'wrong_hours'
                  | 'wrong_specialty'
                  | 'other'
              )
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
          >
            <option value="wrong_phone">Incorrect phone number</option>
            <option value="closed">Facility permanently or temporarily closed</option>
            <option value="wrong_address">Wrong address or map pin location</option>
            <option value="wrong_hours">Incorrect operating / emergency hours</option>
            <option value="wrong_specialty">Medical specialty not available here</option>
            <option value="other">Other correction</option>
          </select>
        </div>

        <div>
          <label htmlFor="report-details" className="block text-xs font-semibold text-slate-700">
            {language === 'hi' ? 'संक्षिप्त विवरण' : 'Brief Details'}
          </label>
          <textarea
            id="report-details"
            rows={3}
            required
            minLength={3}
            maxLength={500}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'कृपया बताएं कि क्या जानकारी गलत है...'
                : 'Describe what needs correction (e.g. phone disconnected, moved location)...'
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        {reportFeedback && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-2.5 text-xs font-semibold text-teal-900">
            {reportFeedback}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
          <button
            type="submit"
            disabled={reportSubmitting || reportDetails.trim().length < 3}
            className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {reportSubmitting
              ? 'Submitting...'
              : language === 'hi'
                ? 'रिपोर्ट भेजें'
                : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
