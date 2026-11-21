'use client';

import React, {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { User } from 'firebase/auth';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  SavedSessionRecord,
  UserProfileRecord,
  deleteAllUserAccountData,
  deleteSavedSession,
  fetchUserSavedSessions,
  getOrCreateUserProfile,
  saveConsentedSession,
  signInWithGooglePopup,
  signOutUser,
  subscribeToAuth,
  testFirestoreConnection,
  updateUserProfile,
} from '@/lib/firebase-client';
import type { Language, UrgencyLevel } from '@/lib/triage-engine';

interface AuthContextValue {
  user: User | null;
  profile: UserProfileRecord | null;
  savedSessions: SavedSessionRecord[];
  authLoading: boolean;
  authError: string | null;
  isFirebaseAdmin: boolean;
  signInWithGoogle: (preferredLanguage?: Language) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  saveProfileChanges: (
    updates: Partial<
      Pick<
        UserProfileRecord,
        | 'displayName'
        | 'preferredLanguage'
        | 'consentMedicalHistory'
        | 'consentSaveSessions'
        | 'consentVoiceTranscripts'
        | 'retentionDays'
        | 'ageGroup'
        | 'allergiesSummary'
        | 'conditionsSummary'
        | 'medicationsSummary'
      >
    >
  ) => Promise<void>;
  saveSessionWithConsent: (input: {
    sessionType: SavedSessionRecord['sessionType'];
    language: Language;
    title: string;
    summary: string;
    urgencyLevel: UrgencyLevel;
    consentedTranscript?: string;
  }) => Promise<SavedSessionRecord | null>;
  removeSavedSession: (sessionId: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  savedSessions: [],
  authLoading: true,
  authError: null,
  isFirebaseAdmin: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshSessions: async () => {},
  saveProfileChanges: async () => {},
  saveSessionWithConsent: async () => null,
  removeSavedSession: async () => {},
  deleteAllData: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

class SahaayErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900">
              SAHAAY encountered a temporary issue
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              In an emergency, please call <strong>112</strong> (National Emergency) or{' '}
              <strong>102</strong> (Ambulance) directly. You can reload the screen below.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="tel:112"
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Call 112 Emergency
              </a>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, message: '' });
                  if (typeof window !== 'undefined') window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Reload SAHAAY
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSessionRecord[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void testFirestoreConnection();
    const unsub = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setSavedSessions([]);
        setAuthLoading(false);
        return;
      }
      setAuthLoading(true);
      void (async () => {
        try {
          const prof = await getOrCreateUserProfile(nextUser, 'en');
          setProfile(prof);
          const sessions = await fetchUserSavedSessions(nextUser.uid);
          setSavedSessions(sessions);
          setAuthError(null);
        } catch {
          setAuthError('Could not load your saved profile right now. Offline features remain available.');
        } finally {
          setAuthLoading(false);
        }
      })();
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async (preferredLanguage: Language = 'en') => {
    setAuthError(null);
    try {
      const signedIn = await signInWithGooglePopup();
      const prof = await getOrCreateUserProfile(signedIn, preferredLanguage);
      setProfile(prof);
      const sessions = await fetchUserSavedSessions(signedIn.uid);
      setSavedSessions(sessions);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('popup-closed-by-user')) {
        setAuthError('Sign-in popup was closed before completing.');
      } else {
        setAuthError('Could not sign in with Google right now. You can continue using SAHAAY without an account.');
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
    setSavedSessions([]);
  }, []);

  const refreshSessions = useCallback(async () => {
    if (!user) return;
    const rows = await fetchUserSavedSessions(user.uid);
    setSavedSessions(rows);
  }, [user]);

  const saveProfileChanges = useCallback(
    async (
      updates: Partial<
        Pick<
          UserProfileRecord,
          | 'displayName'
          | 'preferredLanguage'
          | 'consentMedicalHistory'
          | 'consentSaveSessions'
          | 'consentVoiceTranscripts'
          | 'retentionDays'
          | 'ageGroup'
          | 'allergiesSummary'
          | 'conditionsSummary'
          | 'medicationsSummary'
        >
      >
    ) => {
      if (!user) return;
      await updateUserProfile(user.uid, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [user]
  );

  const saveSessionWithConsent = useCallback(
    async (input: {
      sessionType: SavedSessionRecord['sessionType'];
      language: Language;
      title: string;
      summary: string;
      urgencyLevel: UrgencyLevel;
      consentedTranscript?: string;
    }) => {
      if (!user || !profile) return null;
      const saved = await saveConsentedSession({
        userId: user.uid,
        patientRefId: profile.patientRefId,
        ...input,
      });
      setSavedSessions((prev) => [saved, ...prev]);
      return saved;
    },
    [user, profile]
  );

  const removeSavedSession = useCallback(async (sessionId: string) => {
    await deleteSavedSession(sessionId);
    setSavedSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  }, []);

  const deleteAllData = useCallback(async () => {
    if (!user) return;
    await deleteAllUserAccountData(user.uid);
    setProfile(null);
    setSavedSessions([]);
  }, [user]);

  const isFirebaseAdmin = Boolean(
    user?.email &&
      user.emailVerified &&
      user.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );

  return (
    <SahaayErrorBoundary>
      <AuthContext.Provider
        value={{
          user,
          profile,
          savedSessions,
          authLoading,
          authError,
          isFirebaseAdmin,
          signInWithGoogle,
          signOut,
          refreshSessions,
          saveProfileChanges,
          saveSessionWithConsent,
          removeSavedSession,
          deleteAllData,
        }}
      >
        {children}
      </AuthContext.Provider>
    </SahaayErrorBoundary>
  );
}
