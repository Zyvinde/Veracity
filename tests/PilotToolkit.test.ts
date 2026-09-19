import { describe, expect, it } from 'vitest';
import {
  checkDrugInteractions,
  countDemoFlags,
  evaluatePopulationScope,
  normalizeDrugName,
} from '../lib/rules-engine';
import { buildCallQueue, crossCheckSchedule, parseOTScheduleCsv } from '../lib/pilot';
import type { MedicationHoldClock, PatientCase } from '../lib/types';

function med(name: string, status: MedicationHoldClock['status'] = 'CLEARED'): MedicationHoldClock {
  return {
    id: `m-${name}`,
    drugName: name,
    category: 'OTHER',
    dosageSchedule: 'daily',
    lastDoseHoursAgo: 12,
    requiredHoldHours: 0,
    status,
    guidelineBasis: 'demo',
    clinicalAction: 'demo',
  };
}

function patient(over: Partial<PatientCase> = {}): PatientCase {
  return {
    id: 'PAT-TEST-1',
    mrn: 'DHA-TEST-1',
    name: 'Test Patient',
    age: 40,
    gender: 'M',
    weightKg: 75,
    heightCm: 175,
    bmi: 24.5,
    scheduledTimeIso: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    procedureName: 'Demo procedure',
    cptCode: 'CPT 00000',
    invasivenessTier: 2,
    facility: 'Demo facility',
    surgeon: 'Demo surgeon',
    anesthesiologist: 'Demo anesthesiologist',
    asaStatus: 'ASA II',
    rcriClass: 'Class I (<0.4%)',
    stopBangScore: 1,
    swimLane: 'LANE_2_TELEPHONIC',
    airway: {
      mallampati: 'Class I',
      mouthOpeningCm: 5,
      thyromentalDistanceCm: 7,
      neckMobility: 'Full',
      dentition: 'Intact',
      riskTier: 'LOW',
    },
    medications: [],
    labs: [],
    allergies: [],
    vitals: [],
    overallStatus: 'GREEN_CLEARED',
    primaryActionDirective: 'demo',
    ...over,
  } as PatientCase;
}

describe('UAE brand normalization', () => {
  it('maps common UAE brands to generic fragments', () => {
    expect(normalizeDrugName('Augmentin 625mg')).toContain('amoxicillin');
    expect(normalizeDrugName('Xarelto 20mg')).toContain('rivaroxaban');
    expect(normalizeDrugName('Plavix 75mg')).toContain('clopidogrel');
    expect(normalizeDrugName('Brufen 400mg')).toContain('ibuprofen');
    expect(normalizeDrugName('Glucophage 500mg')).toContain('metformin');
  });

  it('still flags known category pairs after wiring', () => {
    const found = checkDrugInteractions([med('ACE inhibitor lisinopril'), med('ARB losartan')]);
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].severity).toBe('CONTRAINDICATED');
  });
});

describe('population scope guard', () => {
  it('passes a routine adult elective case', () => {
    const s = evaluatePopulationScope(patient());
    expect(s.inScope).toBe(true);
  });
  it('fails closed for peds, pregnancy, ASA E, tier-4', () => {
    expect(evaluatePopulationScope(patient({ age: 10 })).inScope).toBe(false);
    expect(evaluatePopulationScope(patient({ isPregnant: true })).inScope).toBe(false);
    expect(evaluatePopulationScope(patient({ asaStatus: 'ASA E' })).inScope).toBe(false);
    expect(evaluatePopulationScope(patient({ invasivenessTier: 4 })).inScope).toBe(false);
  });
});

describe('pilot toolkit', () => {
  it('orders the call queue RED before GREEN', () => {
    const red = patient({ id: 'R', mrn: 'R', overallStatus: 'RED_HARD_STOP' });
    const green = patient({ id: 'G', mrn: 'G', overallStatus: 'GREEN_CLEARED' });
    const q = buildCallQueue([green, red]);
    expect(q[0].patient.id).toBe('R');
    expect(q[0].script.length).toBeGreaterThan(0);
  });

  it('parses OT CSV and cross-checks by MRN', () => {
    const rows = parseOTScheduleCsv('mrn,name,procedure,date\nDHA-TEST-1,Test Patient,Demo,2026-09-20\nDHA-NEW-9,New Patient,Demo,2026-09-20');
    expect(rows).toHaveLength(2);
    const { matched, unmatched } = crossCheckSchedule(rows, [patient()]);
    expect(matched).toHaveLength(1);
    expect(unmatched).toHaveLength(1);
  });

  it('counts demo flags for alert-burden tracking', () => {
    const p = patient({
      labs: [
        { id: 'l1', name: 'K', loinc: '2823-3', value: 2.8, unit: 'x', refLow: 3.5, refHigh: 5, status: 'CRITICAL_LOW', directive: 'd', provenance: {} as any },
        { id: 'l2', name: 'Na', loinc: '2951-2', value: 150, unit: 'x', refLow: 135, refHigh: 145, status: 'BORDERLINE_HIGH', directive: 'd', provenance: {} as any },
      ],
      medications: [med('Lisinopril', 'HOLD_REQUIRED')],
    });
    const f = countDemoFlags(p);
    expect(f).toEqual({ critical: 1, borderline: 1, medHolds: 1, total: 3 });
  });
});
