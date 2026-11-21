export type LabRangeStatus = 'low' | 'normal' | 'high' | 'borderline' | 'unclear';

export interface ParsedLabParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: LabRangeStatus;
  plainExplanation: string;
}

/**
 * Deterministically checks a numeric lab measurement against a displayed numeric reference range
 * (e.g., "12.0 - 15.5", "70-100", "< 200", "> 40"). Never diagnoses — purely compares printed numbers.
 */
export function evaluateLabValueStatus(
  rawValue: string,
  rawRange: string
): LabRangeStatus {
  const numMatch = rawValue.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!numMatch) return 'unclear';
  const val = Number.parseFloat(numMatch[0]);
  if (!Number.isFinite(val)) return 'unclear';

  const cleanedRange = rawRange.replace(/,/g, '').trim();
  if (!cleanedRange) return 'unclear';

  // Pattern 1: "low - high" or "low to high"
  const betweenMatch = cleanedRange.match(/(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (betweenMatch) {
    const low = Number.parseFloat(betweenMatch[1]);
    const high = Number.parseFloat(betweenMatch[2]);
    if (Number.isFinite(low) && Number.isFinite(high) && high >= low) {
      if (val < low) return 'low';
      if (val > high) return 'high';
      return 'normal';
    }
  }

  // Pattern 2: "< 200" or "<= 200"
  const upperOnly = cleanedRange.match(/^(?:<|<=|up to|less than)\s*(-?\d+(?:\.\d+)?)/i);
  if (upperOnly) {
    const max = Number.parseFloat(upperOnly[1]);
    if (Number.isFinite(max)) {
      return val > max ? 'high' : 'normal';
    }
  }

  // Pattern 3: "> 40" or ">= 40"
  const lowerOnly = cleanedRange.match(/^(?:>|>=|above|greater than)\s*(-?\d+(?:\.\d+)?)/i);
  if (lowerOnly) {
    const min = Number.parseFloat(lowerOnly[1]);
    if (Number.isFinite(min)) {
      return val < min ? 'low' : 'normal';
    }
  }

  return 'unclear';
}

export function summarizeOutOfRangeCount(
  parameters: readonly Pick<ParsedLabParameter, 'status'>[]
): {
  total: number;
  outOfRange: number;
  highCount: number;
  lowCount: number;
  borderlineCount: number;
} {
  let highCount = 0;
  let lowCount = 0;
  let borderlineCount = 0;

  for (const p of parameters) {
    if (p.status === 'high') highCount += 1;
    else if (p.status === 'low') lowCount += 1;
    else if (p.status === 'borderline') borderlineCount += 1;
  }

  return {
    total: parameters.length,
    outOfRange: highCount + lowCount + borderlineCount,
    highCount,
    lowCount,
    borderlineCount,
  };
}
