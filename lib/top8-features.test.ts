import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkMedicineSafety,
  extractActiveIngredients,
  normalizeMedicineName,
} from './drug-interactions';
import { evaluateLabValueStatus, summarizeOutOfRangeCount } from './lab-report-utils';

describe('Top-8 Clinical Utilities — Medicine Safety Checker', () => {
  it('normalizes medicine brand names and extracts active ingredients accurately', () => {
    assert.equal(normalizeMedicineName('Dolo-650 mg Tablet'), 'dolo-650 mg tablet');
    const doloIngredients = extractActiveIngredients('Dolo 650');
    assert.ok(doloIngredients.includes('paracetamol'));

    const combiflamIngredients = extractActiveIngredients('Combiflam');
    assert.ok(combiflamIngredients.includes('ibuprofen'));
    assert.ok(combiflamIngredients.includes('paracetamol'));
  });

  it('flags major bleeding interaction between Warfarin and Ibuprofen', () => {
    const result = checkMedicineSafety(['Warfarin 5mg', 'Ibuprofen 400mg']);
    assert.ok(result.flaggedInteractions.length >= 1);
    assert.equal(result.flaggedInteractions[0].severity, 'major');
    assert.match(result.flaggedInteractions[0].summaryEn, /bleeding/i);
  });

  it('flags duplicate active ingredient Paracetamol across Dolo 650 and Combiflam', () => {
    const result = checkMedicineSafety(['Dolo 650', 'Combiflam']);
    assert.ok(result.duplicateIngredients.length >= 1);
    assert.equal(result.duplicateIngredients[0].generic, 'paracetamol');
    assert.equal(result.duplicateIngredients[0].matchedInputs.length, 2);
  });

  it('flags major CYP2C19 interaction between Clopidogrel and Omeprazole', () => {
    const result = checkMedicineSafety(['Clopidogrel 75mg', 'Omeprazole 20mg']);
    assert.ok(
      result.flaggedInteractions.some(
        (i) => i.severity === 'major' && /clopidogrel/i.test(i.matchedPair.join(' '))
      )
    );
  });

  it('returns clear non-guarantee caveat even when no curated rule matches', () => {
    const result = checkMedicineSafety(['Vitamin C', 'Cetirizine']);
    assert.equal(result.flaggedInteractions.length, 0);
    assert.match(result.neverSafeGuaranteeNoticeEn, /pharmacist|doctor/i);
  });
});

describe('Top-8 Clinical Utilities — Lab Report Reference Range Evaluator', () => {
  it('detects low, normal, and high values against low-high ranges', () => {
    assert.equal(evaluateLabValueStatus('10.4', '12.0 - 15.5'), 'low');
    assert.equal(evaluateLabValueStatus('13.5', '12.0 - 15.5'), 'normal');
    assert.equal(evaluateLabValueStatus('138 mg/dL', '70 - 99'), 'high');
  });

  it('handles upper-bound (<) and lower-bound (>) reference expressions', () => {
    assert.equal(evaluateLabValueStatus('210', '< 200'), 'high');
    assert.equal(evaluateLabValueStatus('165', '< 200'), 'normal');
    assert.equal(evaluateLabValueStatus('55', '> 40'), 'normal');
    assert.equal(evaluateLabValueStatus('32', '> 40'), 'low');
  });

  it('returns unclear when numeric value or range cannot be parsed reliably', () => {
    assert.equal(evaluateLabValueStatus('Reactive', 'Non-reactive'), 'unclear');
    assert.equal(evaluateLabValueStatus('12.5', 'See clinician note'), 'unclear');
  });

  it('summarizes out-of-range counts accurately', () => {
    const summary = summarizeOutOfRangeCount([
      { status: 'low' },
      { status: 'high' },
      { status: 'normal' },
      { status: 'unclear' },
      { status: 'high' },
    ]);
    assert.deepEqual(summary, {
      total: 5,
      outOfRange: 3,
      highCount: 2,
      lowCount: 1,
      borderlineCount: 0,
    });
  });
});
