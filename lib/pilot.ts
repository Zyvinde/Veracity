import type { AttestationRecord, AuditLogEntry, PatientCase } from './types';
import { countDemoFlags, evaluateOverallClearance, evaluatePopulationScope } from './rules-engine';

/* =====================================================
 * Pilot toolkit (MVP demo): baseline metrics, coordinator
 * call queue, day-before checklist, OT-list cross-check.
 * Demo-grade storage (localStorage) — labeled as such in UI.
 * Real pilot needs server-side storage + PDPL consent handling.
 * ===================================================== */

export interface PilotBaseline {
  periodLabel: string;
  scheduled: number;
  cancelledDayOf: number;
  delayedCases: number;
  delayedMinutesTotal: number;
  triageMinutesPerCase: number;
}

export const EMPTY_BASELINE: PilotBaseline = {
  periodLabel: 'Baseline (4–6 weeks pre-pilot)',
  scheduled: 0,
  cancelledDayOf: 0,
  delayedCases: 0,
  delayedMinutesTotal: 0,
  triageMinutesPerCase: 0,
};

const BASELINE_KEY = 'hh-pilot-baseline-v1';
const DAYBEFORE_KEY = 'hh-daybefore-checklist-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // demo storage full/unavailable — non-blocking
  }
}

export function loadBaseline(): PilotBaseline {
  return readJson<PilotBaseline>(BASELINE_KEY, EMPTY_BASELINE);
}

export function saveBaseline(b: PilotBaseline): void {
  writeJson(BASELINE_KEY, b);
}

export interface DayBeforeCheck {
  npoConfirmed: boolean;
  medsConfirmed: boolean;
  escortConfirmed: boolean;
  updatedAtIso?: string;
}

export type DayBeforeMap = Record<string, DayBeforeCheck>;

export function loadDayBefore(): DayBeforeMap {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(DAYBEFORE_KEY);
    return raw ? (JSON.parse(raw) as DayBeforeMap) : {};
  } catch {
    return {};
  }
}

export function saveDayBefore(map: DayBeforeMap): void {
  writeJson(DAYBEFORE_KEY, map);
}

/* ---------------- Call queue ---------------- */

export interface CallQueueEntry {
  patient: PatientCase;
  priority: number;
  reasons: string[];
  outOfScope: string[];
  script: string[];
  hoursToSurgery: number;
}

function hoursUntil(iso: string, nowMs: number): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 9999;
  return Math.max(0, (t - nowMs) / 3600000);
}

export function buildCallQueue(patients: PatientCase[], nowMs = Date.now()): CallQueueEntry[] {
  const entries: CallQueueEntry[] = patients.map((p) => {
    const scope = evaluatePopulationScope(p);
    const flags = countDemoFlags(p);
    const reasons: string[] = [];
    let priority = 0;

    if (!scope.inScope) {
      priority += 1000;
      reasons.push('Out of demo scope — senior review, do not phone-triage');
    }
    if (p.overallStatus === 'RED_HARD_STOP') {
      priority += 500;
      reasons.push('Demo RED hard-stop items to review');
    } else if (p.overallStatus === 'AMBER_CONDITIONAL') {
      priority += 200;
      reasons.push(`Demo AMBER: ${flags.total} flag(s) to confirm`);
    }
    const hrs = hoursUntil(p.scheduledTimeIso, nowMs);
    if (hrs < 24) {
      priority += 100;
      reasons.push('Surgery within 24h — day-before check due');
    } else if (hrs < 72) {
      priority += 50;
      reasons.push('Surgery within 72h');
    }
    if ((p.medications || []).some((m) => m.status === 'HARD_STOP')) {
      priority += 150;
      reasons.push('Medication hold violation in demo data');
    }
    if (!p.pacCompleted) {
      priority += 20;
      reasons.push('Quick PAC interview not completed');
    }
    if (reasons.length === 0) reasons.push('Routine demo confirmation call');

    const holdMeds = (p.medications || [])
      .filter((m) => m.status !== 'CLEARED')
      .map((m) => m.drugName);
    const script = [
      `Confirm fasting: no food 8h, no clear liquids 2h+ before ${p.procedureName}.`,
      holdMeds.length > 0
        ? `Confirm holds: ${holdMeds.slice(0, 3).join('; ')}.`
        : 'Confirm no medication holds outstanding in the demo list.',
      'Confirm escort arranged and patient brings medication list + reports.',
      p.preferredLanguage && p.preferredLanguage !== 'en'
        ? `Patient prefers ${p.preferredLanguage.toUpperCase()} — use interpreter/translated script.`
        : 'Offer WhatsApp demo summary link after the call.',
    ];

    return { patient: p, priority, reasons, outOfScope: scope.flags, script, hoursToSurgery: hrs };
  });

  return entries.sort((a, b) => b.priority - a.priority || a.hoursToSurgery - b.hoursToSurgery);
}

/* ---------------- Pilot metrics ---------------- */

export interface PilotMetrics {
  total: number;
  cleared: number;
  conditional: number;
  hardStop: number;
  outOfScope: number;
  avgFlagsPerCase: number;
  maxFlags: number;
  overloadedCases: number; // >5 demo flags — alert-fatigue risk
  attested: number;
  overridesOnRed: number; // demo attestations signed on RED cases
  checklistComplete: number;
  baseline: PilotBaseline;
}

export function computePilotMetrics(
  patients: PatientCase[],
  attestations: Record<string, AttestationRecord>,
  auditLogs: AuditLogEntry[],
  dayBefore: DayBeforeMap,
  baseline: PilotBaseline
): PilotMetrics {
  let cleared = 0;
  let conditional = 0;
  let hardStop = 0;
  let outOfScope = 0;
  let flagSum = 0;
  let maxFlags = 0;
  let overloaded = 0;
  let checklistComplete = 0;

  for (const p of patients) {
    if (p.overallStatus === 'GREEN_CLEARED') cleared += 1;
    else if (p.overallStatus === 'AMBER_CONDITIONAL') conditional += 1;
    else hardStop += 1;
    if (!evaluatePopulationScope(p).inScope) outOfScope += 1;
    const f = countDemoFlags(p);
    flagSum += f.total;
    maxFlags = Math.max(maxFlags, f.total);
    if (f.total > 5) overloaded += 1;
    const c = dayBefore[p.id];
    if (c?.npoConfirmed && c?.medsConfirmed && c?.escortConfirmed) checklistComplete += 1;
  }

  const attestedIds = new Set(Object.keys(attestations));
  const attested = patients.filter((p) => attestedIds.has(p.id)).length;
  const overridesOnRed = patients.filter(
    (p) => p.overallStatus === 'RED_HARD_STOP' && attestedIds.has(p.id)
  ).length;
  void auditLogs;

  return {
    total: patients.length,
    cleared,
    conditional,
    hardStop,
    outOfScope,
    avgFlagsPerCase: patients.length ? Math.round((flagSum / patients.length) * 10) / 10 : 0,
    maxFlags,
    overloadedCases: overloaded,
    attested,
    overridesOnRed,
    checklistComplete,
    baseline,
  };
}

/** Recompute demo status client-side (engine truth) for the pilot board. */
export function recomputeDemoStatus(patient: PatientCase): PatientCase['overallStatus'] {
  try {
    return evaluateOverallClearance(patient).status;
  } catch {
    return patient.overallStatus;
  }
}

/* ---------------- OT schedule CSV cross-check ---------------- */

export interface OTScheduleRow {
  mrn: string;
  name: string;
  procedure: string;
  date: string;
}

export function parseOTScheduleCsv(text: string): OTScheduleRow[] {
  const rows: OTScheduleRow[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const start = lines[0] && /mrn/i.test(lines[0]) ? 1 : 0;
  for (let i = start; i < lines.length; i += 1) {
    // Minimal CSV: split on comma, strip quotes. Demo-grade parser.
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;
    rows.push({ mrn: cols[0] || '', name: cols[1] || '', procedure: cols[2] || '', date: cols[3] || '' });
  }
  return rows.slice(0, 500);
}

function normMrn(m: string): string {
  return (m || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function crossCheckSchedule(
  rows: OTScheduleRow[],
  patients: PatientCase[]
): { matched: OTScheduleRow[]; unmatched: OTScheduleRow[] } {
  const roster = new Set(patients.map((p) => normMrn(p.mrn)));
  const matched: OTScheduleRow[] = [];
  const unmatched: OTScheduleRow[] = [];
  for (const r of rows) {
    if (r.mrn && roster.has(normMrn(r.mrn))) matched.push(r);
    else unmatched.push(r);
  }
  return { matched, unmatched };
}
