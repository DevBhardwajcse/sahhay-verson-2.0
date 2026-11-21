import type { CareRecommendation } from '@/lib/clinical-knowledge-base';
import type { EmergencyCheckResult, Language } from '@/lib/triage-engine';

export interface ClinicalRefCard {
  source: string;
  verified: boolean;
  title: string;
  documentTitle?: string;
  category?: string;
  commonUses: string;
  precautions: string;
  url?: string;
  publicationDate?: string;
  version?: string;
  reviewStatus?: string;
  lastVerifiedDate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  emergency?: EmergencyCheckResult;
  references?: ClinicalRefCard[];
  groundingSources?: Array<{ title: string; uri: string }>;
  recommendedCare?: CareRecommendation;
  followUpSuggestions?: string[];
}

export interface MedicineResult {
  emergency?: EmergencyCheckResult;
  unidentified: boolean;
  isUncertain?: boolean;
  safetyReason?: string;
  safetyNotice?: string;
  extraction?: {
    isLoosePillOnly: boolean;
    packagingLegibility: string;
    productName: string;
    activeIngredients: string[];
    strength: string;
    dosageForm: string;
    manufacturer: string;
    expiryDate: string;
    packagingWarnings: string[];
    category: string;
    generalUses: string;
    whyPrescribed: string;
    doctorPharmacistGuidance: string;
    missingOrUnclearDetails: string;
  };
  clinicalReferences?: ClinicalRefCard[];
  mandatorySafetyReminders?: string[];
}

export interface InjuryResult {
  emergency?: EmergencyCheckResult;
  stoppedForEmergency?: boolean;
  recommendHospitalVisit?: boolean;
  result?: {
    imageQuality: string;
    visibleObservations: string[];
    cannotDetermineFromImage: string[];
    limitationsExplanation: string;
    followUpQuestions: string[];
    generalNextSteps: string[];
    whenToSeeDoctor: string[];
    whenEmergencyNeeded: string[];
    recommendHospitalVisit: boolean;
  };
}

export interface VoiceTurn {
  role: 'user' | 'model';
  text: string;
  lang: Language;
  emergency?: EmergencyCheckResult;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read audio'));
    reader.readAsDataURL(blob);
  });
}
