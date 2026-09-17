import { describe, expect, it } from 'vitest';
import { evaluatePotassium, evaluateGLP1Hold, evaluateNeuraxialEligibility } from '../lib/rules-engine';

describe('local clinical safety policy', () => {
  it('stops inadequate neuraxial DOAC washout', () => {
    const result = evaluateNeuraxialEligibility(200000, 1, 71.99);
    expect(result.eligible).toBe(false);
    expect(result.hardStopReasons.some((reason) => reason.includes('DOAC hold'))).toBe(true);
    expect(evaluateNeuraxialEligibility(200000, 1, 72).eligible).toBe(true);
  });

  it('closes the potassium gap and rejects nonfinite values', () => {
    for (const value of [3, 3.05, 3.1, 3.4, 3.49]) expect(evaluatePotassium(value).status).toBe('BORDERLINE_LOW');
    for (const value of [NaN, Infinity, -Infinity]) expect(() => evaluatePotassium(value)).toThrow(RangeError);
  });

  it('fails closed in legacy helpers', () => {
    expect(evaluateGLP1Hold(NaN, true).status).toBe('HARD_STOP');
    expect(evaluateNeuraxialEligibility(NaN, 1, 72).eligible).toBe(false);
  });
});
