import test from 'node:test';
import assert from 'node:assert/strict';
import type { NormalizedEmergencyPlace } from '@/app/api/maps/nearby/route';
import {
  BLOOD_GROUPS,
  CATEGORY_OPTIONS,
  RADIUS_OPTIONS,
  SPECIALTY_FILTERS,
  filterAndRankFacilities,
  getPinColor,
  isValidEmergencyCategory,
} from './hospital-matcher';

function makePlace(overrides: Partial<NormalizedEmergencyPlace>): NormalizedEmergencyPlace {
  return {
    id: overrides.id ?? 'p-1',
    name: overrides.name ?? 'Sample Facility',
    category: overrides.category ?? 'general_hospital',
    categoryLabel: overrides.categoryLabel ?? 'General Hospital',
    address: overrides.address ?? 'New Delhi, India',
    lat: overrides.lat ?? 28.6139,
    lng: overrides.lng ?? 77.209,
    straightLineKm: overrides.straightLineKm ?? 2.0,
    phone: overrides.phone ?? null,
    openingHoursText: overrides.openingHoursText ?? null,
    openingHoursFull: overrides.openingHoursFull ?? null,
    openNowKnown: overrides.openNowKnown ?? null,
    ownershipLabel: overrides.ownershipLabel ?? 'Private / General Listed',
    ownershipSector: overrides.ownershipSector ?? 'other',
    googleMapsUri: overrides.googleMapsUri ?? null,
    businessStatus: overrides.businessStatus ?? 'OPERATIONAL',
  };
}

test('filterAndRankFacilities filters by public_named vs other sector cleanly', () => {
  const input: NormalizedEmergencyPlace[] = [
    makePlace({ id: 'pub-1', name: 'District Govt Hospital', ownershipSector: 'public_named' }),
    makePlace({ id: 'priv-1', name: 'City Care Clinic', ownershipSector: 'other' }),
    makePlace({ id: 'pub-2', name: 'AIIMS Emergency', ownershipSector: 'public_named' }),
  ];

  const pubOnly = filterAndRankFacilities(input, {
    sectorFilter: 'public_named',
    sortMode: 'distance',
  });
  assert.deepEqual(
    pubOnly.map((p) => p.id),
    ['pub-1', 'pub-2']
  );

  const otherOnly = filterAndRankFacilities(input, {
    sectorFilter: 'other',
    sortMode: 'distance',
  });
  assert.deepEqual(
    otherOnly.map((p) => p.id),
    ['priv-1']
  );
});

test('filterAndRankFacilities sorts strictly by distance in distance mode without mutating input', () => {
  const input: NormalizedEmergencyPlace[] = [
    makePlace({ id: 'far', straightLineKm: 6.4 }),
    makePlace({ id: 'near', straightLineKm: 1.1 }),
    makePlace({ id: 'mid', straightLineKm: 3.2 }),
  ];
  const originalOrder = input.map((p) => p.id);

  const ranked = filterAndRankFacilities(input, {
    sectorFilter: 'all',
    sortMode: 'distance',
  });

  assert.deepEqual(
    ranked.map((p) => p.id),
    ['near', 'mid', 'far']
  );
  assert.deepEqual(
    input.map((p) => p.id),
    originalOrder,
    'Input array must not be mutated'
  );
});

test('filterAndRankFacilities places listed-open facilities ahead of unknown and closed in open_first mode', () => {
  const input: NormalizedEmergencyPlace[] = [
    makePlace({ id: 'closed-near', openNowKnown: false, straightLineKm: 0.5 }),
    makePlace({ id: 'unknown-mid', openNowKnown: null, straightLineKm: 1.0 }),
    makePlace({ id: 'open-far', openNowKnown: true, straightLineKm: 4.5 }),
    makePlace({ id: 'open-near', openNowKnown: true, straightLineKm: 1.8 }),
  ];

  const ranked = filterAndRankFacilities(input, {
    sectorFilter: 'all',
    sortMode: 'open_first',
  });

  assert.deepEqual(
    ranked.map((p) => p.id),
    ['open-near', 'open-far', 'unknown-mid', 'closed-near']
  );
});

test('filterAndRankFacilities best_match rewards open status, emergency/blood bank category, and phone contact', () => {
  const input: NormalizedEmergencyPlace[] = [
    makePlace({
      id: 'clinic-unverified',
      category: 'medical_clinic',
      straightLineKm: 2.0,
      openNowKnown: null,
      phone: null,
    }),
    makePlace({
      id: 'emergency-open',
      category: 'emergency_hospital',
      straightLineKm: 3.5,
      openNowKnown: true,
      phone: '011-26588500',
    }),
  ];

  // emergency-open score: 3.5 - 2.5 - 1.5 - 0.5 = -1.0 vs clinic-unverified: 2.0
  const ranked = filterAndRankFacilities(input, {
    sectorFilter: 'all',
    sortMode: 'best_match',
  });

  assert.equal(ranked[0].id, 'emergency-open');
});

test('hospital-matcher metadata tables and pin lookup helpers are complete and valid', () => {
  assert.equal(BLOOD_GROUPS.length, 8);
  assert.ok(BLOOD_GROUPS.includes('O-'));
  assert.ok(BLOOD_GROUPS.includes('AB+'));
  assert.ok(CATEGORY_OPTIONS.length >= 13);
  assert.ok(SPECIALTY_FILTERS.length >= 8);
  assert.equal(RADIUS_OPTIONS[0].meters, 2000);
  assert.equal(RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1].meters, 50000);

  assert.equal(getPinColor('blood_bank'), '#BE123C');
  assert.equal(getPinColor('emergency_hospital'), '#DC2626');
  assert.equal(isValidEmergencyCategory('blood_bank'), true);
  assert.equal(isValidEmergencyCategory('nonexistent_cat'), false);
});
