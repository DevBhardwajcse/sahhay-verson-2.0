'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  LogIn,
  LogOut,
  PhoneCall,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  loadEmergencyContacts,
  saveEmergencyContacts,
  type TrustedEmergencyContact,
} from '@/lib/emergency-contact';
import type { Language } from '@/lib/triage-engine';
import { useAuth } from './AuthProvider';
import { PWAInstallButton } from './PWABootstrap';

interface ProfilePrivacyViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function ProfilePrivacyView({
  language,
  onLanguageChange,
}: ProfilePrivacyViewProps) {
  const {
    user,
    profile,
    authError,
    signInWithGoogle,
    signOut,
    saveProfileChanges,
    deleteAllData,
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [consentMedicalHistory, setConsentMedicalHistory] = useState(false);
  const [consentSaveSessions, setConsentSaveSessions] = useState(false);
  const [consentVoiceTranscripts, setConsentVoiceTranscripts] = useState(false);
  const [retentionDays, setRetentionDays] = useState(30);
  const [ageGroup, setAgeGroup] = useState('');
  const [allergiesSummary, setAllergiesSummary] = useState('');
  const [conditionsSummary, setConditionsSummary] = useState('');
  const [medicationsSummary, setMedicationsSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Trusted Emergency Contacts (up to 3, browser-local so it works for all users, signed-in or guest)
  const [contacts, setContacts] = useState<TrustedEmergencyContact[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSavedNotice, setContactSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadEmergencyContacts();
    if (existing.length > 0) {
      queueMicrotask(() => setContacts(existing));
    }
  }, []);

  const handleSaveEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setContactSavedNotice(
        language === 'hi'
          ? 'कृपया संपर्क का नाम और फ़ोन नंबर दोनों दर्ज करें।'
          : 'Please enter both a contact name and phone number.'
      );
      return;
    }
    if (contacts.length >= 3) {
      setContactSavedNotice(
        language === 'hi'
          ? 'अधिकतम 3 विश्वसनीय संपर्क सहेजे जा सकते हैं। नया जोड़ने से पहले एक हटाएं।'
          : 'Maximum 3 trusted contacts allowed. Remove one before adding another.'
      );
      return;
    }
    const next: TrustedEmergencyContact[] = [
      ...contacts,
      {
        id: `contact-${Date.now()}`,
        name: contactName.trim(),
        relationship: contactRelation.trim(),
        phone: contactPhone.trim(),
      },
    ];
    saveEmergencyContacts(next);
    setContacts(loadEmergencyContacts());
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setContactSavedNotice(
      language === 'hi'
        ? 'विश्वसनीय आपातकालीन संपर्क इस डिवाइस पर सुरक्षित रूप से जोड़ा गया।'
        : 'Trusted emergency contact saved locally on this device for SOS & GPS pin sharing.'
    );
  };

  const handleRemoveEmergencyContact = (id?: string) => {
    const next = contacts.filter((c) => c.id !== id);
    saveEmergencyContacts(next);
    setContacts(loadEmergencyContacts());
    setContactSavedNotice(
      language === 'hi' ? 'आपातकालीन संपर्क हटाया गया।' : 'Trusted emergency contact removed.'
    );
  };

  const [syncedProfileKey, setSyncedProfileKey] = useState<string | null>(null);
  const currentProfileKey = profile
    ? `${profile.uid}:${profile.displayName}:${profile.consentMedicalHistory}:${profile.consentSaveSessions}:${profile.consentVoiceTranscripts}:${profile.retentionDays}`
    : null;

  if (profile && currentProfileKey !== syncedProfileKey) {
    setSyncedProfileKey(currentProfileKey);
    setDisplayName(profile.displayName || '');
    setConsentMedicalHistory(Boolean(profile.consentMedicalHistory));
    setConsentSaveSessions(Boolean(profile.consentSaveSessions));
    setConsentVoiceTranscripts(Boolean(profile.consentVoiceTranscripts));
    setRetentionDays(profile.retentionDays || 30);
    setAgeGroup(profile.ageGroup || '');
    setAllergiesSummary(profile.allergiesSummary || '');
    setConditionsSummary(profile.conditionsSummary || '');
    setMedicationsSummary(profile.medicationsSummary || '');
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await saveProfileChanges({
        displayName,
        preferredLanguage: language,
        consentMedicalHistory,
        consentSaveSessions,
        consentVoiceTranscripts,
        retentionDays,
        ageGroup: consentMedicalHistory ? ageGroup : '',
        allergiesSummary: consentMedicalHistory ? allergiesSummary : '',
        conditionsSummary: consentMedicalHistory ? conditionsSummary : '',
        medicationsSummary: consentMedicalHistory ? medicationsSummary : '',
      });
      setStatusMessage(
        language === 'hi'
          ? 'प्रोफ़ाइल और गोपनीयता प्राथमिकताएं सहेजी गईं।'
          : 'Profile and privacy preferences saved securely.'
      );
    } catch {
      setStatusMessage(
        language === 'hi'
          ? 'परिवर्तन सहेजने में त्रुटि हुई।'
          : 'Could not save changes right now. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>DPDP Act 2023 · Explicit Consent Controls</span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              {language === 'hi' ? 'उपयोगकर्ता प्रोफ़ाइल और गोपनीयता' : 'User Profile & Privacy Controls'}
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-600">
              {language === 'hi'
                ? 'आप तय करते हैं कि कौन सी जानकारी सहेजी जाए। आप किसी भी समय अपनी सहमति वापस ले सकते हैं या पूरा डेटा हटा सकते हैं।'
                : 'You stay in complete control of what is saved. Withdraw consent or permanently delete all your stored data at any time.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <PWAInstallButton compact />
            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{language === 'hi' ? 'साइन आउट' : 'Sign Out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle(language)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>{language === 'hi' ? 'Google से साइन इन करें' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900">
            {authError}
          </p>
        )}
      </div>

      {/* Language Preference (Works even without account) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900">
          {language === 'hi' ? 'पसंदीदा भाषा' : 'Preferred Assistant Language'}
        </h2>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
              language === 'en'
                ? 'border-teal-700 bg-teal-50 text-teal-900'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('hi')}
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
              language === 'hi'
                ? 'border-teal-700 bg-teal-50 text-teal-900'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Trusted Emergency Contacts (Up to 3 — Works even without Google sign-in) */}
      <form
        onSubmit={handleSaveEmergencyContact}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <PhoneCall className="h-4 w-4 text-red-600" aria-hidden="true" />
              <span>
                {language === 'hi'
                  ? `विश्वसनीय आपातकालीन संपर्क (${contacts.length}/3)`
                  : `Trusted Emergency Contacts (${contacts.length}/3)`}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {language === 'hi'
                ? 'SOS और लाइव मानचित्र से अपनी GPS लोकेशन तुरंत साझा करने के लिए अधिकतम 3 परिवार या देखभालकर्ता संपर्क सहेजें। यह केवल इसी डिवाइस में रहता है और आपकी पुष्टि के बिना कभी संदेश नहीं भेजा जाता।'
                : 'Save up to 3 family members or caregivers for instant 1-tap calling and GPS location pin sharing in Emergency SOS and Live Maps. Stored only on this device and never messaged automatically.'}
            </p>
          </div>
        </div>

        {contacts.length > 0 && (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/70">
            {contacts.map((c, idx) => (
              <div
                key={c.id || idx}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {c.name}{' '}
                    {c.relationship && (
                      <span className="font-normal text-slate-500">({c.relationship})</span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-teal-800">{c.phone}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveEmergencyContact(c.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  <span>{language === 'hi' ? 'हटाएं' : 'Remove'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {contacts.length < 3 && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="ec-name" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'संपर्क का नाम' : 'Contact Name'}
                </label>
                <input
                  id="ec-name"
                  type="text"
                  maxLength={80}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: आरती शर्मा' : 'e.g. Aarti Sharma'}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ec-rel" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'संबंध (वैकल्पिक)' : 'Relationship (Optional)'}
                </label>
                <input
                  id="ec-rel"
                  type="text"
                  maxLength={50}
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  placeholder={
                    language === 'hi' ? 'जैसे: माता / भाई / जीवनसाथी' : 'e.g. Spouse / Parent / Caregiver'
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ec-phone" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}
                </label>
                <input
                  id="ec-phone"
                  type="tel"
                  maxLength={24}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {language === 'hi' ? 'आपातकालीन संपर्क जोड़ें' : 'Add Trusted Contact'}
                </span>
              </button>
              {contactSavedNotice && (
                <span className="text-xs font-semibold text-teal-800">{contactSavedNotice}</span>
              )}
            </div>
          </>
        )}

        {contacts.length >= 3 && contactSavedNotice && (
          <p className="text-xs font-semibold text-teal-800">{contactSavedNotice}</p>
        )}
      </form>

      {/* Signed-in Profile & Medical History Consent Form */}
      {user && profile && (
        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-teal-700" aria-hidden="true" />
              <div>
                <div className="text-sm font-bold text-slate-900">{user.email}</div>
                <div className="font-mono text-[11px] text-slate-500">
                  Patient Reference ID: {profile.patientRefId}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-700">
                {language === 'hi' ? 'प्रदर्शित नाम' : 'Display Name'}
              </label>
              <input
                id="profile-name"
                type="text"
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="retention-days" className="block text-xs font-semibold text-slate-700">
                {language === 'hi' ? 'डेटा प्रतिधारण अवधि (दिन)' : 'Data Retention Preference'}
              </label>
              <select
                id="retention-days"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days (Recommended)</option>
                <option value={90}>90 days</option>
                <option value={365}>365 days</option>
              </select>
            </div>
          </div>

          {/* Explicit Consent Checkboxes */}
          <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <legend className="px-1 text-xs font-bold text-slate-800">
              {language === 'hi' ? 'स्पष्ट गोपनीयता सहमति' : 'Explicit Privacy Consent Controls'}
            </legend>

            <label className="flex items-start gap-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={consentSaveSessions}
                onChange={(e) => setConsentSaveSessions(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <span>
                {language === 'hi'
                  ? 'मैं अपनी स्पष्ट पुष्टि के बाद ही चैट, दवा स्कैन या ट्राइएज के टेक्स्ट सारांश सहेजने की अनुमति देता/देती हूँ।'
                  : 'Allow saving text summaries of conversations, medicine scans, or triage reports when I explicitly tap Save.'}
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={consentVoiceTranscripts}
                onChange={(e) => setConsentVoiceTranscripts(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <span>
                {language === 'hi'
                  ? 'मैं सहेजे गए सत्रों के साथ वॉइस ट्रांसक्रिप्ट सहेजने की अनुमति देता/देती हूँ (मूल ऑडियो कभी नहीं सहेजा जाता)।'
                  : 'Allow saving text transcripts of voice sessions when requested (raw voice audio is never stored).'}
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={consentMedicalHistory}
                onChange={(e) => setConsentMedicalHistory(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <span>
                {language === 'hi'
                  ? 'मैं बेहतर सामान्य सुरक्षा सावधानियों के लिए अपना वैकल्पिक स्वास्थ्य संदर्भ (उम्र वर्ग, एलर्जी, पुरानी बीमारी) सहेजने की स्पष्ट सहमति देता/देती हूँ।'
                  : 'I explicitly consent to storing an optional health context summary (age group, allergies, chronic conditions) solely to personalize safety reminders.'}
              </span>
            </label>
          </fieldset>

          {consentMedicalHistory && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="age-group" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'आयु वर्ग (वैकल्पिक)' : 'Age Group (Optional)'}
                </label>
                <select
                  id="age-group"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Under 18">Under 18</option>
                  <option value="18-39">18–39 years</option>
                  <option value="40-59">40–59 years</option>
                  <option value="60+">60+ years</option>
                </select>
              </div>
              <div>
                <label htmlFor="allergies" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'ज्ञात एलर्जी' : 'Known Allergies'}
                </label>
                <input
                  id="allergies"
                  type="text"
                  maxLength={300}
                  value={allergiesSummary}
                  onChange={(e) => setAllergiesSummary(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="conditions" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'स्थायी स्वास्थ्य स्थितियां' : 'Chronic Conditions'}
                </label>
                <input
                  id="conditions"
                  type="text"
                  maxLength={300}
                  value={conditionsSummary}
                  onChange={(e) => setConditionsSummary(e.target.value)}
                  placeholder="e.g. Asthma, Type 2 Diabetes, Hypertension"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="meds" className="block text-xs font-semibold text-slate-700">
                  {language === 'hi' ? 'वर्तमान नियमित दवाएं' : 'Current Regular Medications'}
                </label>
                <input
                  id="meds"
                  type="text"
                  maxLength={300}
                  value={medicationsSummary}
                  onChange={(e) => setMedicationsSummary(e.target.value)}
                  placeholder="e.g. Metformin, Inhaler (for awareness only)"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>
                {saving
                  ? language === 'hi'
                    ? 'सहेजा जा रहा है...'
                    : 'Saving...'
                  : language === 'hi'
                    ? 'प्राथमिकताएं सहेजें'
                    : 'Save Profile & Consent'}
              </span>
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{language === 'hi' ? 'मेरा सारा डेटा हटाएं' : 'Delete All My Data'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-700">
                  {language === 'hi' ? 'स्थायी रूप से हटाएं?' : 'Permanently erase?'}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteAllData();
                    setConfirmDelete(false);
                    setStatusMessage('All profile records and saved sessions have been deleted.');
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {statusMessage && (
            <p className="text-xs font-semibold text-teal-800">{statusMessage}</p>
          )}
        </form>
      )}
    </div>
  );
}
