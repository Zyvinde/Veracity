import type { PatientCase } from './types';

/* =====================================================
 * Report identity + patient matching ladder (demo-grade).
 * Safety rule: below HIGH confidence, reports go to the
 * coordinator review queue — NEVER silently auto-attached.
 * A wrong-patient lab bind is the catastrophic failure mode.
 * ===================================================== */

export interface ReportMeta {
  mrn: string | null;
  patientName: string | null;
  dob: string | null;
  accession: string | null;
  collectedAtIso: string | null;
  reportedAtIso: string | null;
  hash: string;
}

/** Deterministic non-crypto hash for demo dedupe (FNV-1a hex). */
export function hashReport(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function toIso(datePart: string, timePart?: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart || '');
  if (!m) return null;
  const t = timePart && /^\d{2}:\d{2}/.test(timePart) ? timePart.slice(0, 5) : '00:00';
  return `${m[1]}-${m[2]}-${m[3]}T${t}:00+04:00`;
}

export function extractReportMeta(reportText: string): ReportMeta {
  const mrn = /MRN:\s*([A-Za-z0-9][\w-]*)/i.exec(reportText)?.[1]?.trim() || null;
  const patientName = /Patient:\s*([^|\n]+)/i.exec(reportText)?.[1]?.trim() || null;
  const dobRaw = /DOB:\s*(\d{4}-\d{2}-\d{2})/i.exec(reportText)?.[1] || null;
  const accession = /Accession:\s*(PUL[\w-]*)/i.exec(reportText)?.[1]?.trim().toUpperCase() || null;
  const collected = /Collected on:\s*(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})?/i.exec(reportText);
  const reported = /Reported on:\s*(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})?/i.exec(reportText);
  return {
    mrn,
    patientName,
    dob: dobRaw,
    accession,
    collectedAtIso: collected ? toIso(collected[1], collected[2]) : null,
    reportedAtIso: reported ? toIso(reported[1], reported[2]) : null,
    hash: hashReport(reportText),
  };
}

export type MatchLevel = 'EXACT_MRN' | 'NAME_DOB' | 'REVIEW' | 'UNMATCHED';

export interface MatchResult {
  level: MatchLevel;
  patient: PatientCase | null;
  basis: string;
  /** Auto-bind allowed only for EXACT_MRN (demo policy). */
  autoBindAllowed: boolean;
}

function normMrn(m: string): string {
  return (m || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normName(n: string): string {
  return (n || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

export function matchPatient(meta: ReportMeta, patients: PatientCase[]): MatchResult {
  // Level 1: exact MRN — the only auto-bindable match.
  const mrn = meta.mrn;
  if (mrn) {
    const hit = patients.find((p) => normMrn(p.mrn) === normMrn(mrn));
    if (hit) {
      return {
        level: 'EXACT_MRN',
        patient: hit,
        basis: `MRN exact match (${mrn})`,
        autoBindAllowed: true,
      };
    }
  }
  // Level 2: name + DOB — high signal but coordinator confirms (names collide).
  const pname = meta.patientName;
  if (pname) {
    const cands = patients.filter((p) => normName(p.name) === normName(pname));
    if (cands.length === 1) {
      return {
        level: 'NAME_DOB',
        patient: cands[0],
        basis: `Name match (${pname}) — confirm DOB/MRN before binding`,
        autoBindAllowed: false,
      };
    }
    if (cands.length > 1) {
      return {
        level: 'REVIEW',
        patient: null,
        basis: `Name collision: ${cands.length} roster cases named ${pname} — manual pick required`,
        autoBindAllowed: false,
      };
    }
  }
  // Level 3: nothing matched.
  if (meta.mrn || meta.patientName) {
    return {
      level: 'REVIEW',
      patient: null,
      basis: `No roster match for ${meta.mrn || meta.patientName} — review queue`,
      autoBindAllowed: false,
    };
  }
  return {
    level: 'UNMATCHED',
    patient: null,
    basis: 'No patient identifiers found on report — cannot match',
    autoBindAllowed: false,
  };
}

/** Reports older than `maxAgeDays` are stale: warn loudly, never silently drive flags. */
export function isStaleReport(meta: ReportMeta, nowMs = Date.now(), maxAgeDays = 30): boolean {
  const ref = meta.reportedAtIso || meta.collectedAtIso;
  if (!ref) return true; // no date = treat as stale (fail closed)
  const t = new Date(ref).getTime();
  if (!Number.isFinite(t)) return true;
  return nowMs - t > maxAgeDays * 86400000;
}
