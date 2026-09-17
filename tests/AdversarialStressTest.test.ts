import { describe, expect, it } from 'vitest';
import {
  evaluateAdversarialCase,
  evaluateGLP1Hold,
  evaluateNeuraxialEligibility,
  evaluatePotassium,
  type AdversarialAnticoag,
  type AdversarialCase,
  type AdversarialGlp1,
  type AdversarialModality,
} from '../lib/rules-engine';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MODALITIES: AdversarialModality[] = ['SPINAL', 'EPIDURAL', 'DEEP_PNB', 'GENERAL', 'MAC'];
const ANTICOAGS: AdversarialAnticoag[] = [
  'APIXABAN',
  'RIVAROXABAN',
  'DABIGATRAN',
  'ENOXAPARIN_PROPHYLAXIS',
  'ENOXAPARIN_THERAPEUTIC',
  'CLOPIDOGREL',
  'TICAGRELOR',
  'ASPIRIN',
  'NONE',
];
const GLP1S: AdversarialGlp1[] = ['WEEKLY_SEMAGLUTIDE', 'WEEKLY_TIRZEPATIDE', 'WEEKLY_DULAGLUTIDE', 'DAILY_RYBELSUS', 'NONE'];
const DOACS: ReadonlySet<AdversarialAnticoag> = new Set(['APIXABAN', 'RIVAROXABAN', 'DABIGATRAN']);
const WEEKLIES: ReadonlySet<AdversarialGlp1> = new Set(['WEEKLY_SEMAGLUTIDE', 'WEEKLY_TIRZEPATIDE', 'WEEKLY_DULAGLUTIDE']);

function scale(rand: number, min: number, max: number): number {
  return min + rand * (max - min);
}

function buildCohort(size: number, seed: number): AdversarialCase[] {
  const rand = mulberry32(seed);
  const cohort: AdversarialCase[] = [];
  for (let i = 0; i < size; i += 1) {
    const modality = MODALITIES[i % MODALITIES.length];
    const anticoag = ANTICOAGS[(i * 7 + 3) % ANTICOAGS.length];
    const glp1 = GLP1S[(i * 5 + 1) % GLP1S.length];
    let anticoagHoldHours = Math.round(scale(rand(), 1, 168) * 100) / 100;
    let glp1HoldHours = Math.round(scale(rand(), 0, 336) * 100) / 100;
    let potassiumMeqL = Math.round(scale(rand(), 2.1, 7.2) * 100) / 100;
    let plateletsPerMicroL = Math.round(scale(rand(), 15000, 450000));
    let inr = Math.round(scale(rand(), 0.9, 4.5) * 100) / 100;
    const hemoglobinGDl = Math.round(scale(rand(), 5.8, 16.5) * 10) / 10;
    const crClMlMin = Math.round(scale(rand(), 15, 120));

    const snap = i % 10;
    if (snap === 0) anticoagHoldHours = [1, 11.9, 23.9, 71.99, 72, 72.01, 167.99, 168][i % 8];
    if (snap === 1) glp1HoldHours = [12, 23.9, 24, 167.99, 168, 168.01, 336][i % 7];
    if (snap === 2) potassiumMeqL = [2.1, 2.99, 3.0, 3.01, 5.49, 5.5, 5.51, 5.79, 5.8, 5.81, 7.2][i % 11];
    if (snap === 3) plateletsPerMicroL = [15000, 49999, 50000, 69999, 70000, 70001, 150000, 450000][i % 8];
    if (snap === 4) inr = [0.9, 1.39, 1.4, 1.41, 1.5, 1.51, 4.5][i % 7];

    cohort.push({
      modality,
      anticoag,
      anticoagHoldHours,
      crClMlMin,
      glp1,
      glp1HoldHours,
      potassiumMeqL,
      plateletsPerMicroL,
      inr,
      hemoglobinGDl,
    });
  }
  return cohort;
}

interface Oracle {
  mustStopDoacNeuraxial: boolean;
  mustFlagWeeklyGlp1: boolean;
  mustStopSpinalPlatelets: boolean;
  mustStopPotassium: boolean;
  mustStopAny: boolean;
}

function oracleFor(c: AdversarialCase): Oracle {
  const neuraxial = c.modality === 'SPINAL' || c.modality === 'EPIDURAL';
  const mustStopDoacNeuraxial = neuraxial && DOACS.has(c.anticoag) && c.anticoagHoldHours < 72;
  const mustFlagWeeklyGlp1 = WEEKLIES.has(c.glp1) && c.glp1HoldHours < 168;
  const mustStopSpinalPlatelets = c.modality === 'SPINAL' && c.plateletsPerMicroL < 70000;
  const mustStopPotassium = c.potassiumMeqL < 3.0 || c.potassiumMeqL > 5.8;
  return {
    mustStopDoacNeuraxial,
    mustFlagWeeklyGlp1,
    mustStopSpinalPlatelets,
    mustStopPotassium,
    mustStopAny: mustStopDoacNeuraxial || mustStopSpinalPlatelets || mustStopPotassium,
  };
}

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

describe('5,000-case adversarial clinical stress benchmark (synthetic, non-clinical)', () => {
  it('holds zero missed catastrophes on the synthetic cohort within the time budget', () => {
    const cohort = buildCohort(5000, 20260917);
    expect(cohort).toHaveLength(5000);

    let fnDoac = 0;
    let fnGlp1 = 0;
    let fnPlatelets = 0;
    let fnPotassium = 0;
    let stopped = 0;
    let flagged = 0;

    const start = performance.now();
    for (const c of cohort) {
      const decision = evaluateAdversarialCase(c);
      const oracle = oracleFor(c);
      if (!decision.cleared) stopped += 1;
      if (decision.conditionals.length > 0) flagged += 1;
      if (oracle.mustStopDoacNeuraxial && decision.cleared) fnDoac += 1;
      if (oracle.mustStopSpinalPlatelets && decision.cleared) fnPlatelets += 1;
      if (oracle.mustStopPotassium && decision.cleared) fnPotassium += 1;
      if (oracle.mustFlagWeeklyGlp1) {
        const hasAspirationFlag = decision.conditionals.some((d) => /GLP-1|aspiration|POCUS/i.test(d));
        if (!hasAspirationFlag) fnGlp1 += 1;
      }
    }
    const durationMs = performance.now() - start;
    const fnTotal = fnDoac + fnPlatelets + fnPotassium + fnGlp1;

    const table =
      `\nSYNTHETIC BENCHMARK (non-clinical, non-regulatory): 5,000 deterministic multimorbid cases\n` +
      `Policy: local conservative perioperative policy; legacy ASA 2023-inspired GLP-1 wording is historical.\n` +
      `Rule                                     | Cases flagged by oracle | Missed (false negatives)\n` +
      `DOAC <72h neuraxial (spec oracle)         | see cohort              | ${fnDoac}\n` +
      `Weekly GLP-1 <168h unflagged             | see cohort              | ${fnGlp1}\n` +
      `Platelets <70k spinal (spec oracle)       | see cohort              | ${fnPlatelets}\n` +
      `K+ <3.0 or >5.8 (spec oracle)             | see cohort              | ${fnPotassium}\n` +
      `Total false negatives                    | —                       | ${fnTotal}\n` +
      `Engine hard stops                        | —                       | ${stopped}\n` +
      `Engine conditionals                      | —                       | ${flagged}\n` +
      `Evaluation-only time                     | —                       | ${durationMs.toFixed(1)} ms\n`;
    console.log(table);

    expect(fnDoac).toBe(0);
    expect(fnPlatelets).toBe(0);
    expect(fnPotassium).toBe(0);
    expect(fnGlp1).toBe(0);
    expect(fnTotal).toBe(0);
    expect(durationMs).toBeLessThan(2500);
  });

  it('holds exact specification boundaries', () => {
    const base: AdversarialCase = {
      modality: 'SPINAL',
      anticoag: 'APIXABAN',
      anticoagHoldHours: 72,
      crClMlMin: 90,
      glp1: 'WEEKLY_SEMAGLUTIDE',
      glp1HoldHours: 168,
      potassiumMeqL: 4.2,
      plateletsPerMicroL: 200000,
      inr: 1.0,
      hemoglobinGDl: 13.5,
    };
    expect(evaluateAdversarialCase({ ...base, anticoagHoldHours: 71.99 }).cleared).toBe(false);
    expect(evaluateAdversarialCase({ ...base, anticoagHoldHours: 72 }).cleared).toBe(true);
    expect(evaluateAdversarialCase({ ...base, glp1HoldHours: 167.99 }).conditionals.some((d) => /GLP-1/i.test(d))).toBe(true);
    expect(evaluateAdversarialCase({ ...base, glp1HoldHours: 168 }).conditionals.some((d) => /GLP-1/i.test(d))).toBe(false);
    expect(evaluateAdversarialCase({ ...base, plateletsPerMicroL: 69999 }).cleared).toBe(false);
    expect(evaluateAdversarialCase({ ...base, plateletsPerMicroL: 70000 }).cleared).toBe(true);
    expect(evaluateAdversarialCase({ ...base, potassiumMeqL: 2.99 }).cleared).toBe(false);
    expect(evaluateAdversarialCase({ ...base, potassiumMeqL: 5.81 }).cleared).toBe(false);
    expect(evaluateAdversarialCase({ ...base, potassiumMeqL: 5.51 }).cleared).toBe(false);
    expect(
      evaluateAdversarialCase({
        ...base,
        modality: 'GENERAL',
        anticoag: 'NONE',
        glp1: 'NONE',
        potassiumMeqL: NaN,
      }).cleared
    ).toBe(false);
  });
});
