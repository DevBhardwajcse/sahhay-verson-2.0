import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateEmergencyRedFlags,
  classifyInteractionIntent,
  GUIDED_TRIAGE_PATHWAYS,
  evaluateTriageResponses,
  calculateHaversineKm,
  enforceMedicineSafetyGuard,
} from './triage-engine';

test('emergency detector flags English cardiac and breathing red flags immediately', () => {
  const res = evaluateEmergencyRedFlags('My father has severe chest pain and difficulty breathing');
  assert.equal(res.isEmergency, true);
  assert.equal(res.recommendedNumber, '112');
  assert.ok(res.matchedSignals.includes('chest_pain_or_cardiac'));
  assert.ok(res.matchedSignals.includes('severe_breathing_difficulty'));
});

test('emergency detector flags Hindi emergency red flags', () => {
  const res = evaluateEmergencyRedFlags('मरीज को सीने में तेज दर्द और सांस लेने में तकलीफ हो रही है');
  assert.equal(res.isEmergency, true);
  assert.equal(res.recommendedNumber, '112');
});

test('emergency detector does not falsely escalate routine questions', () => {
  const res = evaluateEmergencyRedFlags('What is paracetamol generally used for?');
  assert.equal(res.isEmergency, false);
  assert.equal(res.matchedSignals.length, 0);
});

test('intent classifier routes emergency above image or voice modes', () => {
  assert.equal(
    classifyInteractionIntent({
      text: 'He is unconscious after a fall',
      hasImage: true,
      imageMode: 'injury',
    }),
    'emergency'
  );
  assert.equal(
    classifyInteractionIntent({
      text: 'Check this tablet strip',
      hasImage: true,
      imageMode: 'medicine',
    }),
    'medicine_analysis'
  );
  assert.equal(
    classifyInteractionIntent({
      text: 'How long does mild cold last?',
      isVoice: true,
    }),
    'voice_conversation'
  );
});

test('guided triage escalates immediately on red flag and stays conservative on uncertainty', () => {
  const chestPathway = GUIDED_TRIAGE_PATHWAYS[0];
  const emergencyEval = evaluateTriageResponses(chestPathway, {
    bc_redflag: 'yes',
    bc_onset: 'sudden',
    bc_risk: 'no',
  });
  assert.equal(emergencyEval.urgency, 'emergency');
  assert.equal(emergencyEval.escalateTo112, true);

  const uncertainEval = evaluateTriageResponses(chestPathway, {
    bc_redflag: 'unsure',
    bc_onset: 'days',
    bc_risk: 'no',
  });
  assert.equal(uncertainEval.hasUncertainty, true);
  assert.ok(uncertainEval.urgency === 'urgent' || uncertainEval.urgency === 'soon');

  const routineEval = evaluateTriageResponses(chestPathway, {
    bc_redflag: 'no',
    bc_onset: 'days',
    bc_risk: 'no',
  });
  assert.equal(routineEval.urgency, 'routine');
});

test('Haversine distance computes accurate approximate straight-line kilometers', () => {
  // AIIMS New Delhi (28.5672, 77.2100) to Safdarjung Hospital (28.5680, 77.2066) ~ 0.34 km
  const km = calculateHaversineKm(28.5672, 77.21, 28.568, 77.2066);
  assert.ok(km > 0.25 && km < 0.5, `Expected ~0.34 km, got ${km}`);
});

test('medicine safety guard rejects loose pills and unclear labels', () => {
  const loosePill = enforceMedicineSafetyGuard({
    isLoosePillOnly: true,
    packagingLegibility: 'clear',
    productName: 'Unknown White Tablet',
  });
  assert.equal(loosePill.allowIdentification, false);
  assert.equal(loosePill.isUncertain, true);

  const unclear = enforceMedicineSafetyGuard({
    isLoosePillOnly: false,
    packagingLegibility: 'unclear',
    productName: '',
  });
  assert.equal(unclear.allowIdentification, false);

  const clear = enforceMedicineSafetyGuard({
    isLoosePillOnly: false,
    packagingLegibility: 'clear',
    productName: 'Paracetamol 500mg',
    activeIngredients: ['Paracetamol'],
  });
  assert.equal(clear.allowIdentification, true);
  assert.equal(clear.isUncertain, false);
});
