import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import {
  GET as adminAuthGet,
  POST as adminAuthPost,
} from '@/app/api/admin/auth/route';
import {
  DELETE as adminRecordsDelete,
  GET as adminRecordsGet,
  PATCH as adminRecordsPatch,
} from '@/app/api/admin/records/route';
import { POST as answerReportPost } from '@/app/api/medical/answer-report/route';
import { POST as mapsReportPost } from '@/app/api/maps/report/route';
import { POST as safetyCheckPost } from '@/app/api/medical/safety-check/route';
import { POST as labReportPost } from '@/app/api/medical/lab-report/route';
import { POST as prescriptionPost } from '@/app/api/medical/prescription/route';
import { POST as medicineScanPost } from '@/app/api/medical/medicine/route';
import { POST as injuryScanPost } from '@/app/api/medical/injury/route';
import { POST as mapsNearbyPost } from '@/app/api/maps/nearby/route';
import { POST as mapsGeocodePost } from '@/app/api/maps/geocode/route';
import { POST as summaryPost } from '@/app/api/medical/summary/route';

function makeJsonRequest(
  url: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  const init: ConstructorParameters<typeof NextRequest>[1] = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };
  if (body !== undefined && method !== 'GET' && method !== 'DELETE') {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

test('Admin Auth & Records full security lifecycle (claim, auth, CRUD, review, logout, lockout)', async () => {
  // 1. Bootstrap check (unauthenticated)
  const initRes = await adminAuthGet(makeJsonRequest('http://localhost/api/admin/auth', 'GET'));
  assert.equal(initRes.status, 200);
  const initData = await initRes.json();
  assert.equal(initData.authenticated, false);

  // 2. Rejects unauthorized access to admin records
  const unauthRes = await adminRecordsGet(
    makeJsonRequest('http://localhost/api/admin/records', 'GET')
  );
  assert.equal(unauthRes.status, 401);

  const badTokRes = await adminRecordsGet(
    makeJsonRequest('http://localhost/api/admin/records', 'GET', undefined, {
      authorization: 'Bearer forged.invalid.token',
    })
  );
  assert.equal(badTokRes.status, 401);

  // 3. Rejects wrong username and weak password during first-run claim
  const wrongUserClaim = await adminAuthPost(
    makeJsonRequest(
      'http://localhost/api/admin/auth',
      'POST',
      { action: 'claim', username: 'root', password: 'StrongPassword99!' },
      { 'x-forwarded-for': '10.10.0.1' }
    )
  );
  assert.equal(wrongUserClaim.status, 403);

  const weakPassClaim = await adminAuthPost(
    makeJsonRequest(
      'http://localhost/api/admin/auth',
      'POST',
      { action: 'claim', username: 'dev admin', password: 'weakpassword' },
      { 'x-forwarded-for': '10.10.0.1' }
    )
  );
  assert.equal(weakPassClaim.status, 400);

  // 4. Claim strong password (or login if env configured)
  const strongPass = 'SahaayAdminTest2026!';
  const claimRes = await adminAuthPost(
    makeJsonRequest(
      'http://localhost/api/admin/auth',
      'POST',
      { action: 'claim', username: 'dev admin', password: strongPass },
      { 'x-forwarded-for': '10.10.0.2' }
    )
  );
  assert.equal(claimRes.status, 200);
  const claimData = await claimRes.json();
  assert.equal(claimData.ok, true);
  assert.ok(typeof claimData.token === 'string' && claimData.token.length > 20);
  const token = claimData.token as string;

  // 5. Authenticated GET /api/admin/records returns posture & records
  const recRes = await adminRecordsGet(
    makeJsonRequest('http://localhost/api/admin/records', 'GET', undefined, {
      authorization: `Bearer ${token}`,
    })
  );
  assert.equal(recRes.status, 200);
  const recData = await recRes.json();
  assert.equal(recData.adminUser, 'dev admin');
  assert.equal(recData.securityPosture.rawMedicalPhotosStored, false);
  assert.equal(recData.securityPosture.secretsExposedToClient, false);
  assert.equal(recData.securityPosture.dpdpConsentEnforced, true);
  assert.ok(Array.isArray(recData.records) && recData.records.length >= 1);

  // 6. PATCH archive record & verify update
  const targetId = recData.records[0].id as string;
  const archiveRes = await adminRecordsPatch(
    makeJsonRequest(
      'http://localhost/api/admin/records',
      'PATCH',
      { id: targetId, archived: true },
      { authorization: `Bearer ${token}` }
    )
  );
  assert.equal(archiveRes.status, 200);
  const archiveData = await archiveRes.json();
  assert.equal(archiveData.record.archived, true);

  // 7. Submit a public answer report & facility report, then mark both reviewed via Admin PATCH
  const ansRes = await answerReportPost(
    makeJsonRequest(
      'http://localhost/api/medical/answer-report',
      'POST',
      {
        questionSnippet: 'Test clinical citation check',
        answerSnippet: 'Sample guidance snippet',
        issueCategory: 'outdated_source',
        details: 'Please update guideline publication year to 2026.',
        sourceCited: 'WHO EML',
      },
      { 'x-forwarded-for': '10.10.0.10' }
    )
  );
  assert.equal(ansRes.status, 201);
  const ansData = await ansRes.json();

  const reviewAnsRes = await adminRecordsPatch(
    makeJsonRequest(
      'http://localhost/api/admin/records',
      'PATCH',
      { answerReportId: ansData.reportId, markReviewed: true },
      { authorization: `Bearer ${token}` }
    )
  );
  assert.equal(reviewAnsRes.status, 200);
  const reviewAnsData = await reviewAnsRes.json();
  assert.equal(reviewAnsData.answerReport.reviewed, true);

  const facRes = await mapsReportPost(
    makeJsonRequest(
      'http://localhost/api/maps/report',
      'POST',
      {
        placeId: 'place-999',
        facilityName: 'Metro General Hospital',
        facilityAddress: 'MG Road, Bengaluru',
        issueType: 'wrong_phone',
        details: 'Reception desk number has changed.',
      },
      { 'x-forwarded-for': '10.10.0.11' }
    )
  );
  assert.equal(facRes.status, 200);
  const facData = await facRes.json();

  const reviewFacRes = await adminRecordsPatch(
    makeJsonRequest(
      'http://localhost/api/admin/records',
      'PATCH',
      { reportId: facData.reportId, markReviewed: true },
      { authorization: `Bearer ${token}` }
    )
  );
  assert.equal(reviewFacRes.status, 200);
  const reviewFacData = await reviewFacRes.json();
  assert.equal(reviewFacData.report.status, 'reviewed');

  // 8. DELETE record succeeds and unknown ID returns 404
  const delRes = await adminRecordsDelete(
    makeJsonRequest(
      `http://localhost/api/admin/records?id=${encodeURIComponent(targetId)}`,
      'DELETE',
      undefined,
      { authorization: `Bearer ${token}` }
    )
  );
  assert.equal(delRes.status, 200);

  const delMissingRes = await adminRecordsDelete(
    makeJsonRequest('http://localhost/api/admin/records?id=does-not-exist', 'DELETE', undefined, {
      authorization: `Bearer ${token}`,
    })
  );
  assert.equal(delMissingRes.status, 404);

  // 9. Logout revokes Bearer token immediately
  const logoutRes = await adminAuthPost(
    makeJsonRequest(
      'http://localhost/api/admin/auth',
      'POST',
      { action: 'logout' },
      { authorization: `Bearer ${token}` }
    )
  );
  assert.equal(logoutRes.status, 200);

  const postLogoutRes = await adminRecordsGet(
    makeJsonRequest('http://localhost/api/admin/records', 'GET', undefined, {
      authorization: `Bearer ${token}`,
    })
  );
  assert.equal(postLogoutRes.status, 401);

  // 10. Brute-force protection: 5 wrong logins lock out IP with 429 on 6th attempt
  for (let i = 0; i < 5; i += 1) {
    const failRes = await adminAuthPost(
      makeJsonRequest(
        'http://localhost/api/admin/auth',
        'POST',
        { action: 'login', username: 'dev admin', password: 'WrongPassword99!' },
        { 'x-forwarded-for': '10.99.99.99' }
      )
    );
    assert.equal(failRes.status, 401);
  }
  const lockedRes = await adminAuthPost(
    makeJsonRequest(
      'http://localhost/api/admin/auth',
      'POST',
      { action: 'login', username: 'dev admin', password: strongPass },
      { 'x-forwarded-for': '10.99.99.99' }
    )
  );
  assert.equal(lockedRes.status, 429);
});

test('POST /api/medical/answer-report and /api/maps/report reject malformed payloads with 400', async () => {
  const badAns = await answerReportPost(
    makeJsonRequest(
      'http://localhost/api/medical/answer-report',
      'POST',
      { questionSnippet: 'a', issueCategory: 'other', details: 'x' },
      { 'x-forwarded-for': '10.10.0.20' }
    )
  );
  assert.equal(badAns.status, 400);

  const badMap = await mapsReportPost(
    makeJsonRequest(
      'http://localhost/api/maps/report',
      'POST',
      { placeId: '', facilityName: '', issueType: 'invalid_type', details: 'x' },
      { 'x-forwarded-for': '10.10.0.21' }
    )
  );
  assert.equal(badMap.status, 400);
});

test('POST /api/medical/safety-check validates input and flags major interactions & duplicate ingredients deterministically', async () => {
  const tooFew = await safetyCheckPost(
    makeJsonRequest(
      'http://localhost/api/medical/safety-check',
      'POST',
      { medicines: ['Paracetamol'], language: 'en' },
      { 'x-forwarded-for': '10.10.0.30' }
    )
  );
  assert.equal(tooFew.status, 400);

  // Stub external OpenFDA fetch so test is 100% offline-deterministic and instant
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ results: [] }), { status: 404 })) as typeof fetch;

  try {
    const res = await safetyCheckPost(
      makeJsonRequest(
        'http://localhost/api/medical/safety-check',
        'POST',
        { medicines: ['Warfarin', 'Ibuprofen', 'Dolo 650', 'Combiflam'], language: 'en' },
        { 'x-forwarded-for': '10.10.0.31' }
      )
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(
      data.flaggedInteractions.some((i: { severity: string }) => i.severity === 'major'),
      'Warfarin + Ibuprofen must trigger a major interaction flag'
    );
    assert.ok(
      data.duplicateIngredients.some(
        (d: { generic: string }) => d.generic === 'paracetamol'
      ),
      'Dolo 650 + Combiflam must flag duplicate paracetamol'
    );
    assert.ok(data.neverSafeGuaranteeNoticeEn.length > 10);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Medical image & report API routes strictly reject invalid inputs and unsafe MIME types with 400', async () => {
  const emptyLab = await labReportPost(
    makeJsonRequest(
      'http://localhost/api/medical/lab-report',
      'POST',
      { language: 'en', reportText: 'short' },
      { 'x-forwarded-for': '10.10.0.40' }
    )
  );
  assert.equal(emptyLab.status, 400);

  const badMimeLab = await labReportPost(
    makeJsonRequest(
      'http://localhost/api/medical/lab-report',
      'POST',
      {
        language: 'en',
        mimeType: 'application/pdf',
        imageBase64: 'data:application/pdf;base64,JVBERi0xLjQK',
      },
      { 'x-forwarded-for': '10.10.0.41' }
    )
  );
  assert.equal(badMimeLab.status, 400);

  const badRx = await prescriptionPost(
    makeJsonRequest(
      'http://localhost/api/medical/prescription',
      'POST',
      { language: 'en', imageBase64: 'short', mimeType: 'image/jpeg' },
      { 'x-forwarded-for': '10.10.0.42' }
    )
  );
  assert.equal(badRx.status, 400);

  const badRxMime = await prescriptionPost(
    makeJsonRequest(
      'http://localhost/api/medical/prescription',
      'POST',
      {
        language: 'en',
        imageBase64: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=',
        mimeType: 'image/svg+xml',
      },
      { 'x-forwarded-for': '10.10.0.43' }
    )
  );
  assert.equal(badRxMime.status, 400);

  const badMed = await medicineScanPost(
    makeJsonRequest(
      'http://localhost/api/medical/medicine',
      'POST',
      { imageBase64: '', mimeType: 'image/gif', language: 'en' },
      { 'x-forwarded-for': '10.10.0.44' }
    )
  );
  assert.equal(badMed.status, 400);

  const badInj = await injuryScanPost(
    makeJsonRequest(
      'http://localhost/api/medical/injury',
      'POST',
      { imageBase64: '', mimeType: 'text/html', language: 'en' },
      { 'x-forwarded-for': '10.10.0.45' }
    )
  );
  assert.equal(badInj.status, 400);
});

test('Maps API routes reject out-of-bounds coordinates, invalid categories, and short geocode queries', async () => {
  const badLatNearby = await mapsNearbyPost(
    makeJsonRequest(
      'http://localhost/api/maps/nearby',
      'POST',
      { lat: 120, lng: 77.2, radiusMeters: 5000, category: 'emergency_hospital' },
      { 'x-forwarded-for': '10.10.0.50' }
    )
  );
  assert.equal(badLatNearby.status, 400);

  const badCatNearby = await mapsNearbyPost(
    makeJsonRequest(
      'http://localhost/api/maps/nearby',
      'POST',
      { lat: 28.61, lng: 77.2, radiusMeters: 5000, category: 'not_a_real_category' },
      { 'x-forwarded-for': '10.10.0.51' }
    )
  );
  assert.equal(badCatNearby.status, 400);

  const badGeo = await mapsGeocodePost(
    makeJsonRequest(
      'http://localhost/api/maps/geocode',
      'POST',
      { mode: 'forward', query: 'a' },
      { 'x-forwarded-for': '10.10.0.52' }
    )
  );
  assert.equal(badGeo.status, 400);
});

test('POST /api/medical/summary rejects empty messages and generates structured fallback summary deterministically', async () => {
  const emptySummary = await summaryPost(
    makeJsonRequest(
      'http://localhost/api/medical/summary',
      'POST',
      { language: 'en', messages: [] },
      { 'x-forwarded-for': '10.10.0.60' }
    )
  );
  assert.equal(emptySummary.status, 400);

  // Temporarily clear GEMINI_API_KEY so the deterministic fallback is exercised offline without external API calls
  const prevKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';
  try {
    const okSummary = await summaryPost(
      makeJsonRequest(
        'http://localhost/api/medical/summary',
        'POST',
        {
          language: 'en',
          messages: [
            { role: 'user', text: 'I have had mild fever and fatigue for 3 days.' },
            { role: 'model', text: 'Please consult a doctor for evaluation and stay hydrated.' },
          ],
        },
        { 'x-forwarded-for': '10.10.0.61' }
      )
    );
    assert.equal(okSummary.status, 200);
    const data = await okSummary.json();
    assert.ok(data.summary.includes('SAHAAY Doctor Consultation Summary'));
    assert.ok(data.summary.includes('mild fever and fatigue'));
    assert.ok(data.summary.includes('NOT a clinical diagnosis'));
  } finally {
    if (prevKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = prevKey;
    }
  }
});
