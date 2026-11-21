import type { EmergencyCategoryId, NormalizedEmergencyPlace } from '@/app/api/maps/nearby/route';

export const DEFAULT_MAP_CENTER = { lat: 28.6139, lng: 77.209 } as const;

export const CATEGORY_OPTIONS: Array<{
  id: EmergencyCategoryId;
  en: string;
  hi: string;
  pinColor: string;
}> = [
  { id: 'all', en: 'All Emergency', hi: 'सभी सेवाएं', pinColor: '#0F766E' },
  { id: 'emergency_hospital', en: 'Emergency Hospitals', hi: 'आपातकालीन अस्पताल', pinColor: '#DC2626' },
  { id: 'blood_bank', en: 'Blood Banks', hi: 'ब्लड बैंक', pinColor: '#BE123C' },
  { id: 'government_hospital', en: 'Govt. Hospitals', hi: 'सरकारी अस्पताल', pinColor: '#0F766E' },
  { id: 'general_hospital', en: 'General Hospitals', hi: 'सामान्य अस्पताल', pinColor: '#0284C7' },
  { id: 'phc', en: 'PHCs', hi: 'प्राथमिक स्वास्थ्य केंद्र', pinColor: '#0D9488' },
  { id: 'chc', en: 'CHCs', hi: 'सामुदायिक स्वास्थ्य केंद्र', pinColor: '#0D9488' },
  { id: 'medical_clinic', en: 'Medical Clinics', hi: 'मेडिकल क्लिनिक', pinColor: '#2563EB' },
  { id: 'doctor', en: 'Doctors', hi: 'डॉक्टर', pinColor: '#4F46E5' },
  { id: 'pharmacy', en: 'Pharmacies', hi: 'फ़ार्मेसी', pinColor: '#16A34A' },
  { id: 'ambulance', en: 'Ambulance', hi: 'एम्बुलेंस', pinColor: '#E11D48' },
  { id: 'police', en: 'Police Stations', hi: 'पुलिस स्टेशन', pinColor: '#1D4ED8' },
  { id: 'fire_station', en: 'Fire Stations', hi: 'अग्निशमन केंद्र', pinColor: '#EA580C' },
  { id: 'govt_emergency', en: 'Govt. Emergency', hi: 'सरकारी आपातकाल', pinColor: '#B91C1C' },
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const SPECIALTY_FILTERS: Array<{
  query: string;
  en: string;
  hi: string;
}> = [
  { query: '', en: 'All Specialties (Category Default)', hi: 'सभी विशेषज्ञताएं' },
  { query: 'emergency trauma hospital', en: 'Emergency & Trauma', hi: 'आपातकाल और ट्रॉमा' },
  { query: 'cardiology heart hospital', en: 'Cardiology / Heart', hi: 'हृदय रोग (कार्डियोलॉजी)' },
  { query: 'pediatric hospital child specialist', en: 'Pediatrics / Child', hi: 'बाल रोग (पीडियाट्रिक्स)' },
  { query: 'maternity hospital gynecologist', en: 'Maternity / OB-GYN', hi: 'प्रसूति / स्त्री रोग' },
  { query: 'orthopedic trauma hospital', en: 'Orthopedics / Bone', hi: 'हड्डी रोग (आर्थोपेडिक्स)' },
  { query: 'pulmonology chest specialist clinic', en: 'Respiratory / Chest', hi: 'श्वसन / चेस्ट रोग' },
  { query: 'psychiatry mental health clinic', en: 'Mental Health', hi: 'मानसिक स्वास्थ्य' },
  { query: 'eye hospital ophthalmologist', en: 'Eye / Ophthalmology', hi: 'नेत्र रोग (आंख)' },
  { query: 'general physician medical clinic', en: 'General Physician', hi: 'सामान्य चिकित्सक' },
];

export const RADIUS_OPTIONS = [
  { meters: 2000, label: '2 km' },
  { meters: 5000, label: '5 km' },
  { meters: 10000, label: '10 km' },
  { meters: 25000, label: '25 km' },
  { meters: 50000, label: '50 km' },
] as const;

export type SectorFilterMode = 'all' | 'public_named' | 'other';
export type FacilitySortMode = 'best_match' | 'distance' | 'open_first';

export function getPinColor(cat: EmergencyCategoryId): string {
  return CATEGORY_OPTIONS.find((c) => c.id === cat)?.pinColor || '#0F766E';
}

export function isValidEmergencyCategory(value: string): value is EmergencyCategoryId {
  return CATEGORY_OPTIONS.some((c) => c.id === value);
}

/**
 * Pure Smart Hospital Matcher scoring & filtering function.
 * Never mutates the input array.
 */
export function filterAndRankFacilities(
  places: readonly NormalizedEmergencyPlace[],
  options: {
    sectorFilter: SectorFilterMode;
    sortMode: FacilitySortMode;
  }
): NormalizedEmergencyPlace[] {
  const filtered = places.filter((p) => {
    if (options.sectorFilter === 'all') return true;
    const sector = p.ownershipSector || 'other';
    return sector === options.sectorFilter;
  });

  const sorted = [...filtered];
  if (options.sortMode === 'distance') {
    sorted.sort((a, b) => a.straightLineKm - b.straightLineKm);
  } else if (options.sortMode === 'open_first') {
    sorted.sort((a, b) => {
      const aOpen = a.openNowKnown === true ? 0 : a.openNowKnown === false ? 2 : 1;
      const bOpen = b.openNowKnown === true ? 0 : b.openNowKnown === false ? 2 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return a.straightLineKm - b.straightLineKm;
    });
  } else {
    // Smart Hospital Matcher ranking: open status + emergency/specialty fit + contactability + proximity
    const score = (p: NormalizedEmergencyPlace) =>
      p.straightLineKm -
      (p.openNowKnown === true ? 2.5 : 0) -
      (p.category === 'emergency_hospital' || p.category === 'blood_bank' ? 1.5 : 0) -
      (p.phone ? 0.5 : 0);
    sorted.sort((a, b) => score(a) - score(b));
  }

  return sorted;
}
