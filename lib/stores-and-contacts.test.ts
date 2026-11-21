import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLocationShareMessage,
  loadEmergencyContact,
  loadEmergencyContacts,
  saveEmergencyContact,
  saveEmergencyContacts,
} from './emergency-contact';
import {
  addAnswerReport,
  listAnswerReports,
  markAnswerReportReviewed,
} from './answer-reports-store';
import {
  addFacilityReport,
  listFacilityReports,
  markFacilityReportReviewed,
} from './facility-reports-store';
import { extractBearerToken, getClientIp, sanitizeTextSnippet } from './api-helpers';

function withMockLocalStorage(fn: (storage: Map<string, string>) => void) {
  const storage = new Map<string, string>();
  const mockWindow = {
    localStorage: {
      getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
      setItem: (key: string, val: string) => {
        storage.set(key, String(val));
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  };
  const prevWindow = (globalThis as unknown as { window?: unknown }).window;
  (globalThis as unknown as { window?: unknown }).window = mockWindow;
  try {
    fn(storage);
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window?: unknown }).window = prevWindow;
    }
  }
}

test('buildLocationShareMessage formats English and Hindi location messages with Google Maps URL', () => {
  const en = buildLocationShareMessage(28.613939, 77.209021, 'Connaught Place, Delhi', 'en');
  assert.equal(en.mapsUrl, 'https://www.google.com/maps?q=28.613939,77.209021');
  assert.ok(en.message.includes('SAHAAY Emergency Location Share'));
  assert.ok(en.message.includes('Connaught Place, Delhi'));
  assert.ok(en.message.includes(en.mapsUrl));

  const hi = buildLocationShareMessage(28.613939, 77.209021, 'नई दिल्ली', 'hi');
  assert.equal(hi.mapsUrl, en.mapsUrl);
  assert.ok(hi.message.includes('SAHAAY आपातकालीन लोकेशन शेयर'));
  assert.ok(hi.message.includes('नई दिल्ली'));
});

test('emergency contacts storage enforces max 3 contacts, trims fields, syncs legacy key, and cleans up when empty', () => {
  withMockLocalStorage(() => {
    assert.deepEqual(loadEmergencyContacts(), []);
    assert.equal(loadEmergencyContact(), null);

    saveEmergencyContacts([
      { name: '  Anita Sharma  ', relationship: ' Mother ', phone: ' +91 98111 22233 ' },
      { name: 'Rajesh Sharma', relationship: 'Father', phone: '+91 98111 44455' },
      { name: 'Dr. Mehta', relationship: 'Family Doctor', phone: '011-22334455' },
      { name: 'Overflow Contact', relationship: 'Friend', phone: '9999999999' },
    ]);

    const loaded = loadEmergencyContacts();
    assert.equal(loaded.length, 3, 'Should cap trusted contacts at 3');
    assert.equal(loaded[0].name, 'Anita Sharma');
    assert.equal(loaded[0].relationship, 'Mother');
    assert.equal(loaded[0].phone, '+91 98111 22233');

    const legacy = loadEmergencyContact();
    assert.ok(legacy);
    assert.equal(legacy.name, 'Anita Sharma');

    // Empty save clears both v2 and legacy keys
    saveEmergencyContacts([]);
    assert.deepEqual(loadEmergencyContacts(), []);
    assert.equal(loadEmergencyContact(), null);
  });
});

test('loadEmergencyContacts falls back gracefully to legacy single-contact key', () => {
  withMockLocalStorage((storage) => {
    storage.set(
      'sahaay_emergency_contact',
      JSON.stringify({ name: 'Priya', relationship: 'Sister', phone: '+919988776655' })
    );
    const contacts = loadEmergencyContacts();
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].name, 'Priya');

    saveEmergencyContact({ name: 'Karan', relationship: 'Brother', phone: '+919900112233' });
    const updated = loadEmergencyContacts();
    assert.equal(updated[0].name, 'Karan');
  });
});

test('answer-reports-store adds, lists, and marks reports reviewed cleanly', () => {
  const initialCount = listAnswerReports().length;
  assert.ok(initialCount >= 1, 'Seeded sample audit entry should exist');

  const added = addAnswerReport({
    questionSnippet: 'Is paracetamol safe with liver disease?',
    answerSnippet: 'Consult a physician before taking paracetamol with liver disease.',
    issueCategory: 'missing_warning',
    details: 'Suggest highlighting maximum daily dose guidance from clinician.',
    sourceCited: 'WHO EML',
  });

  assert.equal(added.reviewed, false);
  assert.ok(added.id.startsWith('ans-rep-'));
  assert.equal(listAnswerReports()[0].id, added.id);

  const reviewed = markAnswerReportReviewed(added.id);
  assert.ok(reviewed);
  assert.equal(reviewed.reviewed, true);
  assert.equal(markAnswerReportReviewed('non-existent-id'), null);
});

test('facility-reports-store adds, lists, marks reviewed, and enforces 100-item retention cap', () => {
  const created = addFacilityReport({
    placeId: 'place-test-1',
    facilityName: 'City Trauma Center',
    facilityAddress: 'Sector 14, Gurugram',
    issueType: 'wrong_phone',
    details: 'Landline number updated to 0124-2222222.',
  });

  assert.equal(created.status, 'open');
  assert.equal(listFacilityReports()[0].id, created.id);

  const reviewed = markFacilityReportReviewed(created.id);
  assert.ok(reviewed);
  assert.equal(reviewed.status, 'reviewed');
  assert.equal(markFacilityReportReviewed('missing-facility-report'), null);
});

test('api-helpers safely extract client IP, Bearer tokens, and sanitize text snippets', () => {
  const reqWithForwarded = {
    headers: new Headers({
      'x-forwarded-for': '203.0.113.42, 10.0.0.1',
      authorization: 'Bearer   my-secret-token-123  ',
    }),
  };
  assert.equal(getClientIp(reqWithForwarded), '203.0.113.42');
  assert.equal(extractBearerToken(reqWithForwarded), 'my-secret-token-123');

  const reqWithRealIp = {
    headers: new Headers({
      'x-real-ip': '198.51.100.7',
      authorization: 'Basic dXNlcjpwYXNz',
    }),
  };
  assert.equal(getClientIp(reqWithRealIp), '198.51.100.7');
  assert.equal(extractBearerToken(reqWithRealIp), null);

  const reqEmpty = { headers: new Headers() };
  assert.equal(getClientIp(reqEmpty), 'local');
  assert.equal(extractBearerToken(reqEmpty), null);

  assert.equal(sanitizeTextSnippet('  hello   world \n\t test  ', 11), 'hello world');
  assert.equal(sanitizeTextSnippet('abc', 0), '');
});
