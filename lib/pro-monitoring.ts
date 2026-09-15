/**
 * Deterministic post-op PRO (Patient-Reported Outcome) monitor — Day 0-7.
 * SeamlessMD-lite: traffic-light triage + escalation directive.
 * Style matches lib/rules-engine.ts: pure functions, no I/O, versioned.
 */

export const PRO_MONITOR_VERSION = '1.0.0';

export interface PostOpPRO {
  /** Post-op day 0-7 */
  postOpDay: number;
  /** Pain score 0-10 */
  pain0_10: number;
  /** Nausea / vomiting present */
  nausea: boolean;
  /** Temperature in Celsius */
  feverC: number;
  /** Wound redness / spreading erythema present */
  woundRedness: boolean;
  /** Wound discharge / pus present */
  woundDischarge?: boolean;
  /** Opioid tablets taken in last 24h */
  opioidUse: number;
  /** Patient ambulated / mobilised today */
  ambulated: boolean;
}

export type PROSeverity = 'GREEN' | 'AMBER' | 'RED';

export interface PROEvaluation {
  severity: PROSeverity;
  directive: string;
  flags: string[];
  postOpDay: number;
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export function evaluatePRO(input: PostOpPRO): PROEvaluation {
  const postOpDay = clamp(Math.round(input.postOpDay ?? 0), 0, 7);
  const pain = clamp(Math.round(input.pain0_10 ?? 0), 0, 10);
  const fever = typeof input.feverC === 'number' ? input.feverC : 37.0;
  const opioids = Math.max(0, Math.round(input.opioidUse ?? 0));

  const redFlags: string[] = [];
  const amberFlags: string[] = [];

  // RED — fever ≥38.5°C
  if (fever >= 38.5) {
    redFlags.push(`Fever ${fever.toFixed(1)}°C ≥ 38.5°C — possible surgical-site / systemic infection`);
  }
  // RED — severe pain ≥8/10
  if (pain >= 8) {
    redFlags.push(`Severe pain ${pain}/10 — uncontrolled despite analgesia`);
  }
  // RED — wound redness + discharge (spreading infection signal)
  if (input.woundRedness && input.woundDischarge) {
    redFlags.push('Wound redness WITH discharge/pus — suspected surgical-site infection');
  }
  // RED — heavy opioid use (≥6 tabs/24h) with high pain
  if (opioids >= 6 && pain >= 6) {
    redFlags.push(`Heavy opioid use (${opioids} tabs/24h) with pain ${pain}/10 — escalation needed`);
  }

  // AMBER — moderate pain 5-7
  if (pain >= 5 && pain <= 7) {
    amberFlags.push(`Moderate pain ${pain}/10 — review analgesia plan`);
  }
  // AMBER — low-grade fever 37.8-38.4
  if (fever >= 37.8 && fever < 38.5) {
    amberFlags.push(`Low-grade fever ${fever.toFixed(1)}°C — observe, repeat temp in 6h`);
  }
  // AMBER — isolated wound redness (no discharge)
  if (input.woundRedness && !input.woundDischarge) {
    amberFlags.push('Wound redness without discharge — mark edge, photo, daily review');
  }
  // AMBER — nausea/vomiting (dehydration / ileus / opioid effect)
  if (input.nausea) {
    amberFlags.push('Nausea/vomiting reported — antiemetic + hydration review');
  }
  // AMBER — not mobilising after Day 1 (VTE / chest risk)
  if (!input.ambulated && postOpDay >= 2) {
    amberFlags.push(`Not ambulated on Day ${postOpDay} — VTE/chest risk, physio push`);
  }
  // AMBER — moderate opioid use 3-5 tabs
  if (opioids >= 3 && opioids <= 5) {
    amberFlags.push(`Moderate opioid use (${opioids} tabs/24h) — bowel + wean plan`);
  }

  if (redFlags.length > 0) {
    return {
      severity: 'RED',
      directive: `RED — Day ${postOpDay} escalation: contact surgical team TODAY (same-day review). ${redFlags[0]}. Do not wait for routine follow-up; if rigors, chest pain, breathlessness, or wound dehiscence, attend ED.`,
      flags: [...redFlags, ...amberFlags],
      postOpDay,
    };
  }

  if (amberFlags.length > 0) {
    return {
      severity: 'AMBER',
      directive: `AMBER — Day ${postOpDay} caution: nurse callback within 24h. ${amberFlags[0]}. Repeat PRO tomorrow; escalate to RED pathway if fever ≥38.5°C, pain ≥8/10, or discharge appears.`,
      flags: amberFlags,
      postOpDay,
    };
  }

  return {
    severity: 'GREEN',
    directive: `GREEN — Day ${postOpDay} on track: pain ${pain}/10 controlled, afebrile, wound settled. Continue ERAS plan (early ambulation, incentive spirometry, paracetamol-first analgesia). Repeat PRO daily to Day 7.`,
    flags: [],
    postOpDay,
  };
}

export const PRO_STORAGE_KEY_PREFIX = 'veracity-pro-day07:';

export function proStorageKey(patientId: string): string {
  return `${PRO_STORAGE_KEY_PREFIX}${patientId}`;
}
