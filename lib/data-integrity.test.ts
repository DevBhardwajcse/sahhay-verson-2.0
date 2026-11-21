import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ESSENTIAL_MEDICINES_REFERENCE,
  INDEPENDENT_OFFLINE_FACILITIES,
  OFFLINE_CLINICAL_GUIDES,
  VERIFIED_HELPLINES,
} from './helplines-data';
import { INITIAL_GREETING, UI_STRINGS } from './i18n';
import { cn } from './utils';

test('VERIFIED_HELPLINES contains all critical national Indian emergency numbers with bilingual metadata', () => {
  const requiredNumbers = ['112', '102', '108', '100', '101', '1098', '181', '14416'];
  const presentNumbers = new Set(VERIFIED_HELPLINES.map((h) => h.number));

  for (const num of requiredNumbers) {
    assert.ok(presentNumbers.has(num), `Missing critical verified India helpline: ${num}`);
  }

  for (const helpline of VERIFIED_HELPLINES) {
    assert.ok(/^[0-9-]+$/.test(helpline.number), `Invalid dialable number: ${helpline.number}`);
    assert.ok(helpline.nameEn.trim().length > 0);
    assert.ok(helpline.nameHi.trim().length > 0);
    assert.ok(helpline.descriptionEn.trim().length > 0);
    assert.ok(helpline.descriptionHi.trim().length > 0);
    assert.ok(helpline.source.trim().length > 0);
  }
});

test('INDEPENDENT_OFFLINE_FACILITIES, OFFLINE_CLINICAL_GUIDES, and ESSENTIAL_MEDICINES_REFERENCE are complete', () => {
  assert.ok(INDEPENDENT_OFFLINE_FACILITIES.length >= 6);
  for (const facility of INDEPENDENT_OFFLINE_FACILITIES) {
    assert.ok(facility.name.length > 3);
    assert.ok(facility.phone.length >= 6);
    assert.ok(facility.source.length > 3);
  }

  assert.ok(OFFLINE_CLINICAL_GUIDES.length >= 4);
  for (const guide of OFFLINE_CLINICAL_GUIDES) {
    assert.ok(guide.stepsEn.length >= 2);
    assert.ok(guide.stepsHi.length >= 2);
    assert.ok(guide.redFlagsEn.length > 10);
    assert.ok(guide.redFlagsHi.length > 10);
  }

  assert.ok(ESSENTIAL_MEDICINES_REFERENCE.length >= 6);
  for (const med of ESSENTIAL_MEDICINES_REFERENCE) {
    assert.ok(med.genericName.length > 2);
    assert.ok(med.commonBrandsIndia.length >= 1);
    assert.ok(med.generalPrecautionsEn.length > 10);
    assert.ok(med.generalPrecautionsHi.length > 10);
  }
});

test('UI_STRINGS maintains 100% key parity and non-empty bilingual values between EN and HI', () => {
  const enKeys = Object.keys(UI_STRINGS.en).sort();
  const hiKeys = Object.keys(UI_STRINGS.hi).sort();
  assert.deepEqual(enKeys, hiKeys);

  for (const key of enKeys as Array<keyof typeof UI_STRINGS.en>) {
    assert.ok(UI_STRINGS.en[key].trim().length > 0, `Empty EN string for key: ${key}`);
    assert.ok(UI_STRINGS.hi[key].trim().length > 0, `Empty HI string for key: ${key}`);
  }

  assert.ok(INITIAL_GREETING.en.includes('SAHAAY AI Health Assistant'));
  assert.ok(INITIAL_GREETING.hi.includes('SAHAAY AI'));
});

test('cn utility merges Tailwind classes and handles conditional inputs cleanly', () => {
  assert.equal(cn('px-2 py-1', 'px-4'), 'py-1 px-4');
  assert.equal(cn('text-sm', false && 'hidden', undefined, 'font-bold'), 'text-sm font-bold');
});
