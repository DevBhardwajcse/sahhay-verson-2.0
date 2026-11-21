import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  searchClinicalKnowledgeBase,
  analyzeCareRecommendation,
  generateFollowUpSuggestions,
} from './clinical-knowledge-base';
import { isLikelyRealGoogleApiKey, resolveGoogleMapsApiKey } from './maps-key';

describe('Clinical Knowledge Base & Care Bridge', () => {
  it('retrieves MoHFW fever/dengue reference with full provenance metadata', () => {
    const matches = searchClinicalKnowledgeBase('I have had a high fever and severe headache for 3 days');
    assert.ok(matches.length > 0, 'Expected at least one clinical match');
    const top = matches[0].entry;
    assert.equal(top.id, 'mohfw-fever-vector');
    assert.ok(top.version.length > 0, 'Expected non-empty version');
    assert.ok(top.lastVerifiedDate.length > 0, 'Expected non-empty lastVerifiedDate');
    assert.equal(top.reviewStatus, 'Clinician-Reviewed Reference');
    assert.ok(top.sourceUrl.startsWith('https://'), 'Expected valid https sourceUrl');
  });

  it('does NOT recommend a hospital lookup for purely educational definition questions', () => {
    const query = 'What is the meaning of expiry date on medicine packaging?';
    const matches = searchClinicalKnowledgeBase(query);
    const care = analyzeCareRecommendation(query, false, matches);
    assert.equal(care.shouldRecommend, false);
  });

  it('recommends a pediatric hospital / child specialist when child symptoms are reported', () => {
    const query = 'My 2 year old child has high fever and body ache since yesterday';
    const matches = searchClinicalKnowledgeBase(query);
    const care = analyzeCareRecommendation(query, false, matches);
    assert.equal(care.shouldRecommend, true);
    assert.equal(care.urgency, 'urgent');
    assert.ok(care.specialtyQuery?.includes('pediatric'));
  });

  it('recommends emergency hospital immediately when isEmergency is true', () => {
    const query = 'Severe crushing chest pain spreading to my left arm';
    const matches = searchClinicalKnowledgeBase(query);
    const care = analyzeCareRecommendation(query, true, matches);
    assert.equal(care.shouldRecommend, true);
    assert.equal(care.urgency, 'emergency');
    assert.equal(care.facilityCategory, 'emergency_hospital');
  });

  it('generates context-aware bilingual follow-up suggestions', () => {
    const matches = searchClinicalKnowledgeBase('high fever and chills');
    const enSuggestions = generateFollowUpSuggestions('en', matches, false);
    const hiSuggestions = generateFollowUpSuggestions('hi', matches, false);
    assert.equal(enSuggestions.length, 3);
    assert.equal(hiSuggestions.length, 3);
    assert.ok(enSuggestions[0].toLowerCase().includes('fever'));
    assert.ok(hiSuggestions[0].includes('बुखार'));
  });
});

describe('Google Maps API Key Resolution', () => {
  it('ignores short dummy placeholder values and selects a real AIza key', () => {
    const fakePlaceholder = '123456#db';
    const validKey = 'AIzaSyTestRealKeyExample123456789012345';
    assert.equal(isLikelyRealGoogleApiKey(fakePlaceholder), false);
    assert.equal(isLikelyRealGoogleApiKey('MY_GOOGLE_MAPS_API_KEY'), false);
    assert.equal(isLikelyRealGoogleApiKey(validKey), true);

    const resolved = resolveGoogleMapsApiKey({
      GOOGLE_MAPS_API_KEY: fakePlaceholder,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: fakePlaceholder,
      VITE_GOOGLE_MAPS_API_KEY: validKey,
    });
    assert.equal(resolved, validKey);
  });

  it('returns empty string when no valid AIza key is configured', () => {
    const resolved = resolveGoogleMapsApiKey({
      GOOGLE_MAPS_API_KEY: 'placeholder',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '',
    });
    assert.equal(resolved, '');
  });
});
