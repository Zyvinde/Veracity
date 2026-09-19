import { describe, expect, it } from 'vitest';
import {
  creatinineUmolToMgDl,
  detectLabSource,
  parseLabReport,
} from '../lib/lab-parser';
import { MOCK_PATIENT_LIST } from '../lib/mock-data';
import { PURELAB_DEMO_EMAILS } from '../lib/purelab-demo';
import {
  extractReportMeta,
  hashReport,
  isStaleReport,
  matchPatient,
} from '../lib/report-match';

const fatimaMail = PURELAB_DEMO_EMAILS[0];
const unknownMail = PURELAB_DEMO_EMAILS[1];
const staleMail = PURELAB_DEMO_EMAILS[2];

function labByName(labs: { name: string; value: number; status: string }[], part: string) {
  const hit = labs.find((l) => l.name.toLowerCase().includes(part));
  if (!hit) throw new Error(`missing analyte: ${part}`);
  return hit;
}

describe('PureLab source detection', () => {
  it('detects PURE_LAB from headers, accession, and filename', () => {
    expect(detectLabSource(fatimaMail.reportText, fatimaMail.attachmentName)).toBe('PURE_LAB');
    expect(detectLabSource('random text', 'scan.pdf')).toBe('GENERIC');
  });

  it('converts creatinine µmol/L → mg/dL', () => {
    expect(creatinineUmolToMgDl(72)).toBe(0.81);
    expect(creatinineUmolToMgDl(104)).toBe(1.18);
  });
});

describe('PureLab fixture parse accuracy (Fatima)', () => {
  const labs = parseLabReport(fatimaMail.reportText, 'PURE_LAB', [], fatimaMail.attachmentName, {
    age: 48,
    gender: 'F',
  });

  it('extracts all 9 analytes', () => {
    expect(labs).toHaveLength(9);
  });

  it('flags the low potassium (demo AMBER story)', () => {
    const k = labByName(labs, 'potassium');
    expect(k.value).toBe(3.2);
    expect(k.status).toBe('BORDERLINE_LOW');
  });

  it('normalizes creatinine units and reads normal', () => {
    const cr = labByName(labs, 'creatinine');
    expect(cr.value).toBe(0.81);
    expect(cr.status).toBe('NORMAL');
  });

  it('reads remaining panel correctly', () => {
    expect(labByName(labs, 'hemoglobin (hgb)').value).toBe(13.1);
    expect(labByName(labs, 'platelet').value).toBe(248000);
    expect(labByName(labs, 'inr').value).toBe(1.02);
    expect(labByName(labs, 'sodium').value).toBe(139);
    expect(labByName(labs, 'white blood').value).toBe(6.8);
    expect(labByName(labs, 'glucose').value).toBe(112);
    expect(labByName(labs, 'a1c').status).toBe('BORDERLINE_HIGH');
  });
});

describe('report identity + match ladder', () => {
  it('extracts MRN, accession, and dates', () => {
    const meta = extractReportMeta(fatimaMail.reportText);
    expect(meta.mrn).toBe('DHA-892144-AE');
    expect(meta.accession).toBe('PUL-2026-88121');
    expect(meta.reportedAtIso).toContain('2026-09-10');
    expect(meta.hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('hashes deterministically for dedupe', () => {
    expect(hashReport('abc')).toBe(hashReport('abc'));
    expect(hashReport('abc')).not.toBe(hashReport('abd'));
  });

  it('exact-MRN matches Fatima and allows auto-bind', () => {
    const meta = extractReportMeta(fatimaMail.reportText);
    const m = matchPatient(meta, MOCK_PATIENT_LIST);
    expect(m.level).toBe('EXACT_MRN');
    expect(m.patient?.name).toBe('Fatima Al-Mansoor');
    expect(m.autoBindAllowed).toBe(true);
  });

  it('unknown MRN goes to review, never auto-binds', () => {
    const meta = extractReportMeta(unknownMail.reportText);
    const m = matchPatient(meta, MOCK_PATIENT_LIST);
    expect(m.level).toBe('REVIEW');
    expect(m.patient).toBeNull();
    expect(m.autoBindAllowed).toBe(false);
  });

  it('flags the old Rajesh report as stale, keeps Fatima fresh', () => {
    const stale = extractReportMeta(staleMail.reportText);
    const fresh = extractReportMeta(fatimaMail.reportText);
    expect(isStaleReport(stale)).toBe(true);
    expect(isStaleReport(fresh)).toBe(false);
    expect(isStaleReport({ ...fresh, reportedAtIso: null, collectedAtIso: null })).toBe(true);
  });
});
