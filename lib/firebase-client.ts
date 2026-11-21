'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'devbhardwaj95.gmail.com@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;
export async function testFirestoreConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email: string;
  preferredLanguage: 'en' | 'hi';
  consentMedicalHistory: boolean;
  consentSaveSessions: boolean;
  consentVoiceTranscripts: boolean;
  retentionDays: number;
  ageGroup: string;
  allergiesSummary: string;
  conditionsSummary: string;
  medicationsSummary: string;
  patientRefId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SavedSessionRecord {
  sessionId: string;
  userId: string;
  patientRefId: string;
  sessionType: 'general_chat' | 'medicine_scan' | 'injury_analysis' | 'guided_triage' | 'voice_session';
  language: 'en' | 'hi';
  title: string;
  summary: string;
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
  consentedTranscript?: string;
  explicitConsent: true;
  status: 'active' | 'archived';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminAuditLogRecord {
  logId: string;
  adminUid: string;
  adminLabel: string;
  action: 'view_dashboard' | 'view_patient' | 'update_record' | 'delete_record' | 'export_record' | 'login' | 'logout';
  targetRefId: string;
  details: string;
  createdAt?: Timestamp;
}

export function generatePatientRefId(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'USER0001';
  return `SHY-${clean}`;
}

export function generateSafeDocId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function getOrCreateUserProfile(
  user: User,
  defaultLanguage: 'en' | 'hi' = 'en'
): Promise<UserProfileRecord> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfileRecord;
    }
    const newProfile = {
      uid: user.uid,
      displayName: (user.displayName || 'SAHAAY Member').slice(0, 100),
      email: (user.email || '').slice(0, 200),
      preferredLanguage: defaultLanguage,
      consentMedicalHistory: false,
      consentSaveSessions: false,
      consentVoiceTranscripts: false,
      retentionDays: 30,
      ageGroup: '',
      allergiesSummary: '',
      conditionsSummary: '',
      medicationsSummary: '',
      patientRefId: generatePatientRefId(user.uid),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, newProfile);
    const createdSnap = await getDoc(ref);
    return (createdSnap.data() as UserProfileRecord) || (newProfile as unknown as UserProfileRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
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
): Promise<void> {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  const sanitized: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.displayName !== undefined) sanitized.displayName = updates.displayName.slice(0, 100);
  if (updates.preferredLanguage !== undefined) sanitized.preferredLanguage = updates.preferredLanguage;
  if (updates.consentMedicalHistory !== undefined) sanitized.consentMedicalHistory = Boolean(updates.consentMedicalHistory);
  if (updates.consentSaveSessions !== undefined) sanitized.consentSaveSessions = Boolean(updates.consentSaveSessions);
  if (updates.consentVoiceTranscripts !== undefined) sanitized.consentVoiceTranscripts = Boolean(updates.consentVoiceTranscripts);
  if (updates.retentionDays !== undefined) {
    sanitized.retentionDays = Math.min(365, Math.max(1, Math.round(updates.retentionDays)));
  }
  if (updates.ageGroup !== undefined) sanitized.ageGroup = updates.ageGroup.slice(0, 40);
  if (updates.allergiesSummary !== undefined) sanitized.allergiesSummary = updates.allergiesSummary.slice(0, 500);
  if (updates.conditionsSummary !== undefined) sanitized.conditionsSummary = updates.conditionsSummary.slice(0, 500);
  if (updates.medicationsSummary !== undefined) sanitized.medicationsSummary = updates.medicationsSummary.slice(0, 500);

  try {
    await updateDoc(ref, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveConsentedSession(input: {
  userId: string;
  patientRefId: string;
  sessionType: SavedSessionRecord['sessionType'];
  language: 'en' | 'hi';
  title: string;
  summary: string;
  urgencyLevel: SavedSessionRecord['urgencyLevel'];
  consentedTranscript?: string;
}): Promise<SavedSessionRecord> {
  const sessionId = generateSafeDocId('sess');
  const path = `saved_sessions/${sessionId}`;
  const payload: Record<string, unknown> = {
    sessionId,
    userId: input.userId,
    patientRefId: input.patientRefId.slice(0, 40),
    sessionType: input.sessionType,
    language: input.language,
    title: input.title.trim().slice(0, 160) || 'Saved Health Session',
    summary: input.summary.trim().slice(0, 4000) || 'Summary saved with explicit user consent.',
    urgencyLevel: input.urgencyLevel,
    explicitConsent: true,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.consentedTranscript && input.consentedTranscript.trim().length > 0) {
    payload.consentedTranscript = input.consentedTranscript.trim().slice(0, 6000);
  }
  try {
    await setDoc(doc(db, 'saved_sessions', sessionId), payload);
    const snap = await getDoc(doc(db, 'saved_sessions', sessionId));
    return (snap.data() as SavedSessionRecord) || (payload as unknown as SavedSessionRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchUserSavedSessions(userId: string): Promise<SavedSessionRecord[]> {
  const path = 'saved_sessions';
  try {
    const q = query(
      collection(db, 'saved_sessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SavedSessionRecord);
  } catch (error) {
    // Fallback without orderBy in case composite index is still provisioning
    try {
      const qFallback = query(collection(db, 'saved_sessions'), where('userId', '==', userId));
      const snap = await getDocs(qFallback);
      const rows = snap.docs.map((d) => d.data() as SavedSessionRecord);
      return rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    } catch (innerErr) {
      handleFirestoreError(innerErr ?? error, OperationType.LIST, path);
    }
  }
}

export async function deleteSavedSession(sessionId: string): Promise<void> {
  const path = `saved_sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'saved_sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAllUserAccountData(userId: string): Promise<void> {
  const sessions = await fetchUserSavedSessions(userId);
  for (const s of sessions) {
    await deleteSavedSession(s.sessionId);
  }
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Authorized Admin Firestore Operations (guarded by Firestore Security Rules `isAdmin()`) ---

export async function adminFetchAllProfiles(): Promise<UserProfileRecord[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfileRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminFetchAllSessions(): Promise<SavedSessionRecord[]> {
  const path = 'saved_sessions';
  try {
    const snap = await getDocs(collection(db, 'saved_sessions'));
    const rows = snap.docs.map((d) => d.data() as SavedSessionRecord);
    return rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function adminWriteAuditLog(input: {
  adminUid: string;
  adminLabel: string;
  action: AdminAuditLogRecord['action'];
  targetRefId: string;
  details: string;
}): Promise<void> {
  const logId = generateSafeDocId('audit');
  const path = `admin_audit_logs/${logId}`;
  try {
    await setDoc(doc(db, 'admin_audit_logs', logId), {
      logId,
      adminUid: input.adminUid,
      adminLabel: input.adminLabel.slice(0, 100),
      action: input.action,
      targetRefId: input.targetRefId.slice(0, 128),
      details: input.details.slice(0, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function adminFetchAuditLogs(): Promise<AdminAuditLogRecord[]> {
  const path = 'admin_audit_logs';
  try {
    const snap = await getDocs(collection(db, 'admin_audit_logs'));
    const rows = snap.docs.map((d) => d.data() as AdminAuditLogRecord);
    return rows.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
