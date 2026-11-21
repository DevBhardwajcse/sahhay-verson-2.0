import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveGoogleMapsApiKey } from '@/lib/maps-key';
import { checkApiRateLimit } from '@/lib/security-utils';
import { calculateHaversineKm } from '@/lib/triage-engine';

export type EmergencyCategoryId =
  | 'all'
  | 'emergency_hospital'
  | 'government_hospital'
  | 'general_hospital'
  | 'blood_bank'
  | 'phc'
  | 'chc'
  | 'medical_clinic'
  | 'doctor'
  | 'pharmacy'
  | 'ambulance'
  | 'police'
  | 'fire_station'
  | 'govt_emergency';

const NearbyRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().min(1000).max(50000).default(5000),
  specialtyQuery: z.string().trim().max(120).optional(),
  category: z
    .enum([
      'all',
      'emergency_hospital',
      'government_hospital',
      'general_hospital',
      'blood_bank',
      'phc',
      'chc',
      'medical_clinic',
      'doctor',
      'pharmacy',
      'ambulance',
      'police',
      'fire_station',
      'govt_emergency',
    ])
    .default('all'),
});

interface GooglePlaceItem {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  googleMapsUri?: string;
  businessStatus?: string;
}

export interface NormalizedEmergencyPlace {
  id: string;
  name: string;
  category: EmergencyCategoryId;
  categoryLabel: string;
  address: string;
  lat: number;
  lng: number;
  straightLineKm: number;
  phone: string | null;
  openingHoursText: string | null;
  openingHoursFull: string[] | null;
  openNowKnown: boolean | null;
  ownershipLabel: string;
  ownershipSector: 'public_named' | 'other';
  googleMapsUri: string | null;
  businessStatus: string | null;
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
  'places.googleMapsUri',
  'places.businessStatus',
].join(',');

const GMP_SOLUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

function getServerMapsKey(): string {
  return resolveGoogleMapsApiKey();
}

interface SearchSpec {
  mode: 'nearby' | 'text';
  category: EmergencyCategoryId;
  categoryLabel: string;
  includedTypes?: string[];
  textQuery?: string;
}

function getSearchSpecs(category: EmergencyCategoryId): SearchSpec[] {
  switch (category) {
    case 'emergency_hospital':
      return [
        {
          mode: 'text',
          category: 'emergency_hospital',
          categoryLabel: 'Emergency Hospital',
          textQuery: 'emergency hospital trauma center',
        },
      ];
    case 'government_hospital':
      return [
        {
          mode: 'text',
          category: 'government_hospital',
          categoryLabel: 'Government Hospital',
          textQuery: 'government hospital district hospital civil hospital',
        },
      ];
    case 'general_hospital':
      return [
        {
          mode: 'nearby',
          category: 'general_hospital',
          categoryLabel: 'General Hospital',
          includedTypes: ['hospital'],
        },
      ];
    case 'phc':
      return [
        {
          mode: 'text',
          category: 'phc',
          categoryLabel: 'Primary Health Centre (PHC)',
          textQuery: 'Primary Health Centre PHC',
        },
      ];
    case 'chc':
      return [
        {
          mode: 'text',
          category: 'chc',
          categoryLabel: 'Community Health Centre (CHC)',
          textQuery: 'Community Health Centre CHC',
        },
      ];
    case 'medical_clinic':
      return [
        {
          mode: 'nearby',
          category: 'medical_clinic',
          categoryLabel: 'Medical Clinic',
          includedTypes: ['medical_clinic'],
        },
      ];
    case 'doctor':
      return [
        {
          mode: 'nearby',
          category: 'doctor',
          categoryLabel: 'Doctor / Physician',
          includedTypes: ['doctor'],
        },
      ];
    case 'pharmacy':
      return [
        {
          mode: 'nearby',
          category: 'pharmacy',
          categoryLabel: 'Pharmacy / Medical Store',
          includedTypes: ['pharmacy'],
        },
      ];
    case 'ambulance':
      return [
        {
          mode: 'text',
          category: 'ambulance',
          categoryLabel: 'Ambulance Service',
          textQuery: 'ambulance service emergency ambulance',
        },
      ];
    case 'police':
      return [
        {
          mode: 'nearby',
          category: 'police',
          categoryLabel: 'Police Station',
          includedTypes: ['police'],
        },
      ];
    case 'fire_station':
      return [
        {
          mode: 'nearby',
          category: 'fire_station',
          categoryLabel: 'Fire Station',
          includedTypes: ['fire_station'],
        },
      ];
    case 'blood_bank':
      return [
        {
          mode: 'text',
          category: 'blood_bank',
          categoryLabel: 'Blood Bank / Transfusion Centre',
          textQuery: 'blood bank hospital red cross',
        },
      ];
    case 'govt_emergency':
      return [
        {
          mode: 'text',
          category: 'govt_emergency',
          categoryLabel: 'Government Emergency Service',
          textQuery: 'disaster management emergency response center civil defence',
        },
      ];
    case 'all':
    default:
      return [
        {
          mode: 'nearby',
          category: 'general_hospital',
          categoryLabel: 'Hospital',
          includedTypes: ['hospital', 'medical_clinic'],
        },
        {
          mode: 'nearby',
          category: 'pharmacy',
          categoryLabel: 'Pharmacy',
          includedTypes: ['pharmacy'],
        },
        {
          mode: 'nearby',
          category: 'police',
          categoryLabel: 'Police / Fire',
          includedTypes: ['police', 'fire_station'],
        },
      ];
  }
}

function classifyFromTypes(types: string[] = [], fallback: EmergencyCategoryId): EmergencyCategoryId {
  if (types.includes('police')) return 'police';
  if (types.includes('fire_station')) return 'fire_station';
  if (types.includes('pharmacy') || types.includes('drugstore')) return 'pharmacy';
  if (types.includes('doctor')) return 'doctor';
  if (types.includes('medical_clinic')) return 'medical_clinic';
  if (types.includes('hospital')) return fallback === 'all' ? 'general_hospital' : fallback;
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    if (!checkApiRateLimit(`maps-nearby:${clientIp}`, 35, 60_000)) {
      return NextResponse.json(
        { error: 'Too many map searches. Please wait a few seconds.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = NearbyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Valid latitude, longitude, and radius are required.' },
        { status: 400 }
      );
    }

    const apiKey = getServerMapsKey();
    if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY') {
      return NextResponse.json(
        {
          error:
            'Google Maps Platform API key is not configured in the server environment yet. Use the Offline Assistance Centre or call 112 for immediate help.',
          places: [],
        },
        { status: 503 }
      );
    }

    const { lat, lng, radiusMeters, category, specialtyQuery } = parsed.data;
    const specs: SearchSpec[] = specialtyQuery
      ? [
          {
            mode: 'text',
            category: category === 'all' ? 'general_hospital' : category,
            categoryLabel: specialtyQuery,
            textQuery: specialtyQuery,
          },
        ]
      : getSearchSpecs(category);

    const placeMap = new Map<string, NormalizedEmergencyPlace>();
    let quotaExceeded = false;
    let upstreamErrorMessage: string | null = null;

    await Promise.all(
      specs.map(async (spec) => {
        const endpoint =
          spec.mode === 'nearby'
            ? 'https://places.googleapis.com/v1/places:searchNearby'
            : 'https://places.googleapis.com/v1/places:searchText';

        const payload =
          spec.mode === 'nearby'
            ? {
                includedTypes: spec.includedTypes,
                maxResultCount: 15,
                rankPreference: 'DISTANCE',
                locationRestriction: {
                  circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: radiusMeters,
                  },
                },
              }
            : {
                textQuery: spec.textQuery,
                maxResultCount: 15,
                locationBias: {
                  circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: radiusMeters,
                  },
                },
              };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': FIELD_MASK,
            'X-Goog-Maps-Solution-ID': GMP_SOLUTION_ID,
          },
          body: JSON.stringify(payload),
        });

        if (res.status === 429) {
          quotaExceeded = true;
          return;
        }

        const data = (await res.json().catch(() => ({}))) as {
          places?: GooglePlaceItem[];
          error?: { status?: string; message?: string };
        };

        if (data.error?.status === 'RESOURCE_EXHAUSTED') {
          quotaExceeded = true;
          return;
        }

        if (!res.ok) {
          upstreamErrorMessage =
            data.error?.message || `Places API returned HTTP ${res.status}`;
          return;
        }
        if (!Array.isArray(data.places)) {
          return;
        }

        for (const p of data.places) {
          const pLat = p.location?.latitude;
          const pLng = p.location?.longitude;
          if (!p.id || typeof pLat !== 'number' || typeof pLng !== 'number') continue;

          const straightLineKm = calculateHaversineKm(lat, lng, pLat, pLng);
          // For text search with locationBias, keep results within a reasonable margin of requested radius
          if (spec.mode === 'text' && straightLineKm * 1000 > Math.max(radiusMeters * 1.4, 8000)) {
            continue;
          }

          if (placeMap.has(p.id)) continue;

          const resolvedCat =
            spec.mode === 'text'
              ? spec.category
              : classifyFromTypes(p.types, spec.category);

          const openNow =
            typeof p.currentOpeningHours?.openNow === 'boolean'
              ? p.currentOpeningHours.openNow
              : typeof p.regularOpeningHours?.openNow === 'boolean'
                ? p.regularOpeningHours.openNow
                : null;

          const hoursList =
            p.currentOpeningHours?.weekdayDescriptions ||
            p.regularOpeningHours?.weekdayDescriptions ||
            null;

          const displayName = p.displayName?.text || 'Unnamed Facility';
          const isPublicNamed =
            resolvedCat === 'government_hospital' ||
            resolvedCat === 'phc' ||
            resolvedCat === 'chc' ||
            /\b(aiims|safdarjung|rml|ram manohar lohia|lady hardinge|lok nayak|lnjp|kalawati|government|govt\.?|district hospital|civil hospital|esic|cghs|municipal|red cross|primary health|community health|phc|chc)\b/i.test(
              displayName
            );

          placeMap.set(p.id, {
            id: p.id,
            name: displayName,
            category: resolvedCat,
            categoryLabel: p.primaryTypeDisplayName?.text || spec.categoryLabel,
            address: p.formattedAddress || 'Address not listed in Google Maps',
            lat: pLat,
            lng: pLng,
            straightLineKm,
            phone: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
            openingHoursText: hoursList ? hoursList.slice(0, 2).join(' · ') : null,
            openingHoursFull: hoursList,
            openNowKnown: openNow,
            ownershipSector: isPublicNamed ? 'public_named' : 'other',
            ownershipLabel: isPublicNamed
              ? 'Public / Govt.-named listing (confirm directly with facility)'
              : 'General / Private listing (confirm ownership directly)',
            googleMapsUri: p.googleMapsUri || null,
            businessStatus: p.businessStatus || null,
          });
        }
      })
    );

    if (quotaExceeded) {
      return NextResponse.json(
        {
          quotaExceeded: true,
          error:
            'Google Maps Platform demo quota exceeded temporarily. Use verified 112 helplines or Emergency Safety Directory.',
          places: [],
        },
        { status: 429 }
      );
    }

    const places = Array.from(placeMap.values()).sort(
      (a, b) => a.straightLineKm - b.straightLineKm
    );

    if (places.length === 0 && upstreamErrorMessage) {
      return NextResponse.json(
        {
          error: `Live facility search could not complete (${upstreamErrorMessage}). Try again or call 112 for emergencies.`,
          places: [],
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      places,
      radiusMeters,
      count: places.length,
      distanceNote:
        'Distances shown in the list are approximate straight-line distances until a live road route is computed.',
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not fetch nearby places right now. Please try again, expand radius, or open Offline Assistance Centre.',
        places: [],
      },
      { status: 502 }
    );
  }
}
