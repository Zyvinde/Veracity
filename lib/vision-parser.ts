import type { BoundingBox as InternalBoundingBox, ExtractedLabItem, LabStatus } from './types';
import { LOINC_COMMON } from './constants';
import {
  evaluateBloodGlucose,
  evaluateCreatinine,
  evaluateHbA1c,
  evaluateHemoglobin,
  evaluateINR,
  evaluatePlateletCount,
  evaluatePotassium,
} from './rules-engine';
import type { ExtractedLine } from './pdf-parser';

export interface BoundingBox {
  page: number;
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  confidence: number;
}

export type VisionSourceLab = 'AL_BORG' | 'MEDSOL' | 'DR_LAL' | 'ASTER' | 'PURE_LAB' | 'UNKNOWN';
export type VisionBiomarkerStatus = 'NORMAL' | 'CONDITIONAL' | 'PANIC';

export interface ExtractedBiomarker {
  code: string;
  canonicalName: string;
  rawValue: string;
  normalizedValue: number;
  normalizedUnit: string;
  referenceInterval: { low: number; high: number };
  status: VisionBiomarkerStatus;
  sourceLab: VisionSourceLab;
  provenance: BoundingBox;
}

export interface VisionMedication {
  name: string;
  lastDoseTimestamp: string | null;
  rawText: string;
  provenance: BoundingBox;
}

export interface DocumentExtractionResult {
  patientName: string;
  mrn: string;
  collectionTimestamp: string;
  biomarkers: ExtractedBiomarker[];
  activeMedications: VisionMedication[];
  quarantineFlags: string[];
}

export interface DocumentQuality {
  ocrConfidence: number;
  rotationDegrees: number;
  hasRotationMetadata: boolean;
  blurScore: number;
}

export interface VisionDocumentInput {
  fullText: string;
  lines: ExtractedLine[];
  filename?: string;
  quality?: Partial<DocumentQuality>;
}

const DEFAULT_QUALITY: DocumentQuality = {
  ocrConfidence: 0.94,
  rotationDegrees: 0,
  hasRotationMetadata: true,
  blurScore: 0.9,
};

const GLUCOSE_MGDL_PER_MMOLL = 18.01559;
const CREATININE_UMOLL_PER_MGDL = 88.4;
const HGB_GDL_PER_MMOLL = 1.611;
const HBA1C_IFCC_SLOPE = 10.929;
const HBA1C_IFCC_INTERCEPT = 2.15;
const QUALITY_CONFIDENCE_FLOOR = 0.88;

interface BiomarkerDefinition {
  code: string;
  canonicalName: string;
  standardUnit: string;
  refLow: number;
  refHigh: number;
  aliases: RegExp[];
  panicLow: number;
  panicHigh: number;
  normalize: (value: number, unit: string) => number;
  standardizeUnit: (unit: string) => string;
  toLabStatus: (normalized: number, meta?: { age?: number; gender?: 'M' | 'F' }) => { status: LabStatus; directive: string };
}

function cleanUnitToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[µμ]/g, 'u')
    .replace(/\s+/g, '')
    .replace(/\/l$/, '/l');
}

function normalizeDecimalToken(raw: string): string {
  const t = raw.trim().replace(/,/g, '');
  if (/^\d+,\d+$/.test(raw.trim()) && !raw.includes('.')) return raw.trim().replace(',', '.');
  return t;
}

function parseNumberToken(raw: string): number | null {
  const cleaned = normalizeDecimalToken(raw.replace(/[Oo]/g, '0').replace(/[lI](?=\d)/g, '1'));
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function glucoseNormalize(value: number, unit: string): number {
  const u = cleanUnitToken(unit);
  if (u.includes('mmol')) return value * GLUCOSE_MGDL_PER_MMOLL;
  if (u === 'g/l' || u === 'g/dl' && value < 30) return value * 100;
  return value;
}

function creatinineNormalize(value: number, unit: string): number {
  const u = cleanUnitToken(unit);
  if (u.includes('umol')) return value / CREATININE_UMOLL_PER_MGDL;
  if (u.includes('mmol')) return (value * 1000) / CREATININE_UMOLL_PER_MGDL;
  return value;
}

function potassiumNormalize(value: number, unit: string): number {
  void unit;
  return value;
}

function hemoglobinNormalize(value: number, unit: string): number {
  const u = cleanUnitToken(unit);
  if (u === 'g/l') return value / 10;
  if (u.includes('mmol')) return value * HGB_GDL_PER_MMOLL;
  return value;
}

function plateletNormalize(value: number, unit: string): number {
  const u = cleanUnitToken(unit);
  if (u.includes('10*3') || u.includes('10^3') || u.includes('x10')) return value * 1000;
  if (u.includes('10*9') || u.includes('10^9')) return value * 1000;
  if (value < 3000) return value * 1000;
  return value;
}

function inrNormalize(value: number, unit: string): number {
  void unit;
  return value;
}

function hba1cNormalize(value: number, unit: string): number {
  const u = cleanUnitToken(unit);
  if (u.includes('mmol')) return value / HBA1C_IFCC_SLOPE + HBA1C_IFCC_INTERCEPT;
  return value;
}

function sodiumNormalize(value: number, unit: string): number {
  void unit;
  return value;
}

const BIOMARKER_DEFINITIONS: BiomarkerDefinition[] = [
  {
    code: LOINC_COMMON.POTASSIUM || '2823-3',
    canonicalName: 'Potassium (Serum)',
    standardUnit: 'mEq/L',
    refLow: 3.5,
    refHigh: 5.0,
    aliases: [/potassium/i, /\bk\s*\+/i, /serum\s*k\b/i, /بوتاسيوم/],
    panicLow: 3.0,
    panicHigh: 5.5,
    normalize: potassiumNormalize,
    standardizeUnit: () => 'mEq/L',
    toLabStatus: (v) => {
      const r = evaluatePotassium(v);
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.CREATININE || '2160-0',
    canonicalName: 'Creatinine (Serum)',
    standardUnit: 'mg/dL',
    refLow: 0.6,
    refHigh: 1.2,
    aliases: [/creatinine/i, /\bs\.?\s*creat\b/i, /كرياتينين/],
    panicLow: 0.4,
    panicHigh: 4.0,
    normalize: creatinineNormalize,
    standardizeUnit: () => 'mg/dL',
    toLabStatus: (v, meta) => {
      const r = evaluateCreatinine(v, meta?.age ?? 50, meta?.gender ?? 'M');
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.GLUCOSE || '1558-6',
    canonicalName: 'Glucose (Serum)',
    standardUnit: 'mg/dL',
    refLow: 70,
    refHigh: 100,
    aliases: [/glucose/i, /blood\s*sugar/i, /\bfbs\b/i, /\brbs\b/i, /سكر/],
    panicLow: 54,
    panicHigh: 300,
    normalize: glucoseNormalize,
    standardizeUnit: () => 'mg/dL',
    toLabStatus: (v) => {
      const r = evaluateBloodGlucose(v, false);
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.HEMOGLOBIN || '718-7',
    canonicalName: 'Hemoglobin',
    standardUnit: 'g/dL',
    refLow: 12.0,
    refHigh: 15.5,
    aliases: [/hemoglobin/i, /haemoglobin/i, /\bhgb?\b/i, /هيموجلوبين/],
    panicLow: 7.0,
    panicHigh: 18.0,
    normalize: hemoglobinNormalize,
    standardizeUnit: () => 'g/dL',
    toLabStatus: (v, meta) => {
      const r = evaluateHemoglobin(v, meta?.gender ?? 'M');
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.PLATELETS || '777-3',
    canonicalName: 'Platelets',
    standardUnit: '/µL',
    refLow: 150000,
    refHigh: 450000,
    aliases: [/platelet/i, /\bplt\b/i, /صفائح/],
    panicLow: 50000,
    panicHigh: 500000,
    normalize: plateletNormalize,
    standardizeUnit: () => '/µL',
    toLabStatus: (v) => {
      const r = evaluatePlateletCount(v, false);
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.INR || '6301-6',
    canonicalName: 'INR',
    standardUnit: 'ratio',
    refLow: 0.85,
    refHigh: 1.15,
    aliases: [/\binr\b/i, /prothrombin.*inr/i],
    panicLow: 0.85,
    panicHigh: 1.5,
    normalize: inrNormalize,
    standardizeUnit: () => 'ratio',
    toLabStatus: (v) => {
      const r = evaluateINR(v, false);
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.HBA1C || '4548-4',
    canonicalName: 'Hemoglobin A1c',
    standardUnit: '%',
    refLow: 4.0,
    refHigh: 5.6,
    aliases: [/hba1c/i, /\ba1c\b/i, /glycated/i],
    panicLow: 4.0,
    panicHigh: 9.0,
    normalize: hba1cNormalize,
    standardizeUnit: () => '%',
    toLabStatus: (v) => {
      const r = evaluateHbA1c(v);
      return { status: r.status, directive: r.directive };
    },
  },
  {
    code: LOINC_COMMON.SODIUM || '2951-2',
    canonicalName: 'Sodium (Serum)',
    standardUnit: 'mEq/L',
    refLow: 135,
    refHigh: 145,
    aliases: [/sodium/i, /\bna\s*\+/i, /صوديوم/],
    panicLow: 130,
    panicHigh: 150,
    normalize: sodiumNormalize,
    standardizeUnit: () => 'mEq/L',
    toLabStatus: (v) => {
      if (v < 130) return { status: 'CRITICAL_LOW', directive: `HYPONATREMIA (Na ${v} mEq/L): evaluate volume status before anesthesia.` };
      if (v > 150) return { status: 'CRITICAL_HIGH', directive: `HYPERNATREMIA (Na ${v} mEq/L): correct free-water deficit before elective anesthesia.` };
      if (v < 135) return { status: 'BORDERLINE_LOW', directive: 'Mild hyponatremia. Prefer isotonic fluids perioperatively.' };
      if (v > 145) return { status: 'BORDERLINE_HIGH', directive: 'Mild hypernatremia. Ensure adequate hydration.' };
      return { status: 'NORMAL', directive: 'Normal serum sodium.' };
    },
  },
];

const MEDICATION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Apixaban (Eliquis)', pattern: /apixaban|eliquis/i },
  { name: 'Rivaroxaban (Xarelto)', pattern: /rivaroxaban|xarelto/i },
  { name: 'Dabigatran (Pradaxa)', pattern: /dabigatran|pradaxa/i },
  { name: 'Enoxaparin', pattern: /enoxaparin|clexane|lovenox/i },
  { name: 'Clopidogrel (Plavix)', pattern: /clopidogrel|plavix/i },
  { name: 'Ticagrelor (Brilinta)', pattern: /ticagrelor|brilinta/i },
  { name: 'Aspirin', pattern: /aspirin|ecospirin|aspilet/i },
  { name: 'Semaglutide (Ozempic/Wegovy/Rybelsus)', pattern: /semaglutide|ozempic|wegovy|rybelsus/i },
  { name: 'Tirzepatide (Mounjaro/Zepbound)', pattern: /tirzepatide|mounjaro|zepbound/i },
  { name: 'Dulaglutide (Trulicity)', pattern: /dulaglutide|trulicity/i },
  { name: 'Liraglutide', pattern: /liraglutide|victoza|saxenda/i },
  { name: 'Empagliflozin', pattern: /empagliflozin|jardiance/i },
  { name: 'Metformin', pattern: /metformin|glucophage/i },
  { name: 'Warfarin', pattern: /warfarin|coumadin|marevan/i },
];

const VALUE_UNIT_PATTERN =
  /(-?\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d+)?|-?\d+(?:[.,]\d+)?)\s*([a-zA-Zµμ%\/^0-9\-–.]*)(?:\s*(?:\(|\[))?/;

export function detectSourceLab(fullText: string, filename?: string): VisionSourceLab {
  const hay = `${fullText}\n${filename ?? ''}`.toLowerCase();
  if (hay.includes('purelab') || hay.includes('pure lab') || hay.includes('purehealth') || /pul-\d+/i.test(hay)) return 'PURE_LAB';
  if (hay.includes('al borg') || hay.includes('alborg') || hay.includes('al-borg')) return 'AL_BORG';
  if (hay.includes('medsol')) return 'MEDSOL';
  if (hay.includes('lal path') || hay.includes('lalpath') || hay.includes('dr lal') || hay.includes('dr. lal')) return 'DR_LAL';
  if (hay.includes('aster')) return 'ASTER';
  return 'UNKNOWN';
}

export function toVisionBox(page: number, box: InternalBoundingBox, confidence: number): BoundingBox {
  const clamp = (n: number): number => Math.max(0, Math.min(100, n));
  const scale = box.xmax <= 1 && box.ymax <= 1 && box.xmin <= 1 && box.ymin <= 1 ? 100 : 1;
  const xMin = clamp(box.xmin * scale);
  const yMin = clamp(box.ymin * scale);
  const xMax = clamp(Math.max(box.xmax * scale, xMin + 0.5));
  const yMax = clamp(Math.max(box.ymax * scale, yMin + 0.5));
  return {
    page,
    xMin: Math.round(xMin * 100) / 100,
    yMin: Math.round(yMin * 100) / 100,
    xMax: Math.round(xMax * 100) / 100,
    yMax: Math.round(yMax * 100) / 100,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

function fallbackBox(index: number, page: number, confidence: number): BoundingBox {
  const yMin = Math.min(90, 12 + index * 6);
  return { page, xMin: 8, yMin, xMax: 92, yMax: Math.min(96, yMin + 4.5), confidence };
}

function extractField(text: string, patterns: RegExp[]): string {
  for (const line of text.split('\n')) {
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (m && m[1]) {
        const v = m[1].trim().replace(/\s{2,}/g, ' ');
        if (v.length >= 2) return v;
      }
    }
  }
  return '';
}

function extractCollectionTimestamp(text: string): string {
  const patterns = [
    /(?:collection|collected|sampled|sample date|report date|date of collection)[^0-9]*([0-3]?\d[\/\-.][01]?\d[\/\-.](?:19|20)\d{2}(?:\s+\d{1,2}:\d{2})?)/i,
    /((?:19|20)\d{2}-[01]\d-[0-3]\d(?:[T ]\d{2}:\d{2})?)/,
    /([0-3]?\d[\/\-.][01]?\d[\/\-.](?:19|20)\d{2})/,
  ];
  for (const line of text.split('\n')) {
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (m && m[1]) {
        const parsed = new Date(m[1].replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3'));
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
        return m[1].trim();
      }
    }
  }
  return '';
}

function mapLabStatusToVision(status: LabStatus): VisionBiomarkerStatus {
  if (status === 'CRITICAL_LOW' || status === 'CRITICAL_HIGH') return 'PANIC';
  if (status === 'BORDERLINE_LOW' || status === 'BORDERLINE_HIGH') return 'CONDITIONAL';
  return 'NORMAL';
}

interface LineMatch {
  line: ExtractedLine;
  valueRaw: string;
  unitRaw: string;
  value: number;
  confidence: number;
}

function findLineMatch(
  def: BiomarkerDefinition,
  lines: ExtractedLine[],
  baseConfidence: number
): LineMatch | null {
  for (const line of lines) {
    const aliasHit = def.aliases.some((a) => a.test(line.text));
    if (!aliasHit) continue;
    const afterAlias = line.text.slice(Math.max(0, line.text.search(def.aliases.find((a) => a.test(line.text)) as RegExp)));
    const m = afterAlias.match(VALUE_UNIT_PATTERN) ?? line.text.match(VALUE_UNIT_PATTERN);
    if (!m) continue;
    const parsed = parseNumberToken(m[1]);
    if (parsed === null) continue;
    const unitRaw = (m[2] ?? '').trim();
    const normalized = def.normalize(parsed, unitRaw);
    if (!Number.isFinite(normalized)) continue;
    const lineConfidence = (line as ExtractedLine & { confidence?: number }).confidence ?? baseConfidence;
    return { line, valueRaw: m[1].trim(), unitRaw, value: normalized, confidence: lineConfidence };
  }
  return null;
}

export function extractVisionDocument(input: VisionDocumentInput): DocumentExtractionResult {
  const fullText = input.fullText ?? '';
  const lines = Array.isArray(input.lines) ? input.lines : [];
  const quality: DocumentQuality = { ...DEFAULT_QUALITY, ...(input.quality ?? {}) };
  const sourceLab = detectSourceLab(fullText, input.filename);
  const quarantineFlags: string[] = [];
  const biomarkers: ExtractedBiomarker[] = [];
  const activeMedications: VisionMedication[] = [];

  const rotation = Math.abs(quality.rotationDegrees);
  if (rotation > 45 && !quality.hasRotationMetadata) {
    quarantineFlags.push(
      `Document rotation ${rotation.toFixed(1)}° exceeds 45° without deskew metadata: spatial coordinates are unreliable; queue for manual review.`
    );
  }
  if (quality.blurScore < 0.35) {
    quarantineFlags.push(
      `Image quality gate failed (blur score ${quality.blurScore.toFixed(2)} < 0.35): all values require manual clinician review.`
    );
  }
  if (quality.ocrConfidence < QUALITY_CONFIDENCE_FLOOR) {
    quarantineFlags.push(
      `OCR confidence ${quality.ocrConfidence.toFixed(2)} below ${QUALITY_CONFIDENCE_FLOOR.toFixed(2)} floor: extracted values are quarantined pending review.`
    );
  }

  const globallyQuarantined = quarantineFlags.length > 0;
  const searchableLines = lines.length > 0
    ? lines
    : fullText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((text, idx, arr) => ({
          text,
          page: 1,
          bbox: { xmin: 0.08, ymin: idx / Math.max(1, arr.length), xmax: 0.92, ymax: (idx + 1) / Math.max(1, arr.length) },
        }));

  BIOMARKER_DEFINITIONS.forEach((def, defIndex) => {
    const match = findLineMatch(def, searchableLines, quality.ocrConfidence);
    if (!match) return;
    const effectiveConfidence = Math.max(
      0,
      Math.min(1, Math.min(match.confidence, quality.ocrConfidence) - (quality.blurScore < 0.5 ? 0.04 : 0))
    );
    const box = match.line?.bbox
      ? toVisionBox(match.line.page, match.line.bbox, effectiveConfidence)
      : fallbackBox(defIndex, 1, effectiveConfidence);
    if (globallyQuarantined || effectiveConfidence < QUALITY_CONFIDENCE_FLOOR) {
      quarantineFlags.push(
        `${def.canonicalName} (${def.code}) quarantined: confidence ${effectiveConfidence.toFixed(2)} from "${match.line.text.slice(0, 90)}".`
      );
      return;
    }
    const labEval = def.toLabStatus(match.value);
    biomarkers.push({
      code: def.code,
      canonicalName: def.canonicalName,
      rawValue: `${match.valueRaw}${match.unitRaw ? ` ${match.unitRaw}` : ''}`,
      normalizedValue: Math.round(match.value * 10000) / 10000,
      normalizedUnit: def.standardizeUnit(match.unitRaw),
      referenceInterval: { low: def.refLow, high: def.refHigh },
      status: mapLabStatusToVision(labEval.status),
      sourceLab,
      provenance: box,
    });
  });

  searchableLines.forEach((line, idx) => {
    for (const med of MEDICATION_PATTERNS) {
      if (!med.pattern.test(line.text)) continue;
      const dateMatch = line.text.match(/([0-3]?\d[\/\-.][01]?\d[\/\-.](?:19|20)\d{2})/);
      const box = line.bbox ? toVisionBox(line.page, line.bbox, quality.ocrConfidence) : fallbackBox(idx, line.page, quality.ocrConfidence);
      activeMedications.push({
        name: med.name,
        lastDoseTimestamp: dateMatch ? dateMatch[1] : null,
        rawText: line.text.slice(0, 160),
        provenance: box,
      });
      break;
    }
  });

  return {
    patientName: extractField(fullText, [/patient\s*name\s*[:=\-]\s*(.+)/i, /name\s*[:=\-]\s*([A-Za-z][A-Za-z .'-]{2,})/]),
    mrn: extractField(fullText, [/\bMRN\b\s*[:=\-]\s*([A-Za-z0-9\-/]+)/i, /(?:file|reg(?:istration)?|hospital)\s*no\.?\s*[:=\-]\s*([A-Za-z0-9\-/]+)/i]),
    collectionTimestamp: extractCollectionTimestamp(fullText),
    biomarkers,
    activeMedications,
    quarantineFlags,
  };
}

export function visionBiomarkerToLabItem(
  biomarker: ExtractedBiomarker,
  documentName: string,
  meta?: { age?: number; gender?: 'M' | 'F' }
): ExtractedLabItem {
  const def = BIOMARKER_DEFINITIONS.find((d) => d.code === biomarker.code);
  const evalResult = def
    ? def.toLabStatus(biomarker.normalizedValue, meta)
    : { status: 'BORDERLINE_HIGH' as LabStatus, directive: 'Review manually against reference interval.' };
  const toInternal = (box: BoundingBox): InternalBoundingBox => ({
    xmin: Math.max(0, Math.min(1, box.xMin / 100)),
    ymin: Math.max(0, Math.min(1, box.yMin / 100)),
    xmax: Math.max(0, Math.min(1, box.xMax / 100)),
    ymax: Math.max(0, Math.min(1, box.yMax / 100)),
  });
  return {
    id: `vision-${biomarker.code}-${Math.round(biomarker.provenance.yMin * 10)}-${biomarker.provenance.page}`,
    name: biomarker.canonicalName,
    loinc: biomarker.code,
    value: biomarker.normalizedValue,
    unit: biomarker.normalizedUnit,
    refLow: biomarker.referenceInterval.low,
    refHigh: biomarker.referenceInterval.high,
    status: evalResult.status,
    directive: evalResult.directive,
    provenance: {
      documentName,
      page: biomarker.provenance.page,
      bbox: toInternal(biomarker.provenance),
      rawOcrText: `${biomarker.canonicalName} ${biomarker.rawValue}`,
      confidence: biomarker.provenance.confidence,
    },
  };
}

export const VISION_QUALITY_FLOOR = QUALITY_CONFIDENCE_FLOOR;
export const VISION_BIOMARKER_CODES = BIOMARKER_DEFINITIONS.map((d) => d.code);
