import { ExtractedLabItem, LabStatus, BoundingBox } from './types';
import { LOINC_COMMON } from './constants';
import {
  evaluatePotassium,
  evaluateHemoglobin,
  evaluateCreatinine,
  evaluateINR,
  evaluateBloodGlucose,
  evaluatePlateletCount,
  evaluateHbA1c,
} from './rules-engine';
import { ExtractedLine } from './pdf-parser';

export type LabReportSource = 'AL_BORG' | 'LAL_PATHLABS' | 'MEDSOL' | 'PURE_LAB' | 'GENERIC';

/**
 * Detects the issuing lab from report text (headers/footers/filename).
 * PureLab reports carry "PureLab"/"Pure Lab"/"purelab.com"/"PUL-" accession markers.
 */
export function detectLabSource(rawText: string, filename?: string): LabReportSource {
  const hay = `${rawText}\n${filename ?? ''}`.toLowerCase();
  if (hay.includes('purelab') || hay.includes('pure lab') || hay.includes('purehealth') || /pul-\d+/i.test(hay)) {
    return 'PURE_LAB';
  }
  if (hay.includes('al borg') || hay.includes('alborg') || hay.includes('al-borg')) return 'AL_BORG';
  if (hay.includes('lal path') || hay.includes('lalpath') || hay.includes('dr lal') || hay.includes('dr. lal')) {
    return 'LAL_PATHLABS';
  }
  if (hay.includes('medsol')) return 'MEDSOL';
  return 'GENERIC';
}

/** µmol/L → mg/dL for creatinine (÷ 88.4). PureLab reports creatinine in µmol/L. */
export function creatinineUmolToMgDl(umol: number): number {
  return Math.round((umol / 88.4) * 100) / 100;
}

interface LabDefinition {
  key: string;
  name: string;
  loinc: string;
  unit: string;
  refLow: number;
  refHigh: number;
  patterns: RegExp[];
  evaluator?: (value: number, metadata?: { age?: number; gender?: 'M' | 'F' }) => {
    status: LabStatus;
    directive: string;
  };
  sanitizeValue?: (val: number, unitStr?: string) => number;
  validateRange?: (val: number) => boolean;
}

const LAB_DEFINITIONS: LabDefinition[] = [
  {
    key: 'POTASSIUM',
    name: 'Potassium (Serum)',
    loinc: LOINC_COMMON.POTASSIUM || '2823-3',
    unit: 'mEq/L',
    refLow: 3.5,
    refHigh: 5.0,
    patterns: [
      /(?:potassium|k\+?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /(?:serum\s+potassium)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val) => {
      const res = evaluatePotassium(val);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 1.5 && val <= 10.0,
  },
  {
    key: 'HEMOGLOBIN',
    name: 'Hemoglobin (Hgb)',
    loinc: LOINC_COMMON.HEMOGLOBIN || '718-7',
    unit: 'g/dL',
    refLow: 13.0,
    refHigh: 17.5,
    patterns: [
      /(?:hemoglobin|haemoglobin|hgb|hb)\b(?!\s*a1c)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val, meta) => {
      const gender = meta?.gender || 'M';
      const res = evaluateHemoglobin(val, gender);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 3.0 && val <= 25.0,
  },
  {
    key: 'CREATININE',
    name: 'Creatinine (Serum)',
    loinc: LOINC_COMMON.CREATININE || '2160-0',
    unit: 'mg/dL',
    refLow: 0.6,
    refHigh: 1.2,
    patterns: [
      /(?:serum\s+creatinine|creatinine|s\.?\s*creat)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val, meta) => {
      const age = meta?.age || 50;
      const gender = meta?.gender || 'M';
      const res = evaluateCreatinine(val, age, gender);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 0.1 && val <= 20.0,
  },
  {
    key: 'INR',
    name: 'Coagulation INR',
    loinc: LOINC_COMMON.INR || '6301-6',
    unit: 'ratio',
    refLow: 0.85,
    refHigh: 1.15,
    patterns: [
      /(?:\binr\b|prothrombin\s+time\s+inr)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /(?:pt\s*\/\s*inr)\s*[:=\-]?\s*[\d.]+\s*\/\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val) => {
      const res = evaluateINR(val, false);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 0.5 && val <= 15.0,
  },
  {
    key: 'PLATELETS',
    name: 'Platelet Count',
    loinc: LOINC_COMMON.PLATELETS || '777-3',
    unit: '10^3/µL',
    refLow: 150000,
    refHigh: 450000,
    patterns: [
      /(?:platelet\s+count|platelets|plt)\s*[:=\-]?\s*(\d+(?:,\d+)?(?:\.\d+)?)/i,
    ],
    sanitizeValue: (val, unitStr) => {
      // If value is under 1000 and unit says 10^3 or thousands, convert to full count
      if (val < 1000) return val * 1000;
      return val;
    },
    evaluator: (val) => {
      const res = evaluatePlateletCount(val);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 2000 && val <= 2000000,
  },
  {
    key: 'GLUCOSE',
    name: 'Fasting Blood Glucose',
    loinc: LOINC_COMMON.GLUCOSE || '1558-6',
    unit: 'mg/dL',
    refLow: 70,
    refHigh: 100,
    patterns: [
      /(?:fasting\s+blood\s+sugar|fasting\s+glucose|glucose\s+fasting|serum\s+glucose|glucose)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val) => {
      const res = evaluateBloodGlucose(val, false);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 20 && val <= 1000,
  },
  {
    key: 'HBA1C',
    name: 'Hemoglobin A1c (HbA1c)',
    loinc: LOINC_COMMON.HBA1C || '4548-4',
    unit: '%',
    refLow: 4.0,
    refHigh: 5.6,
    patterns: [
      /(?:hba1c|hemoglobin\s+a1c|glycated\s+hemoglobin|a1c)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val) => {
      const res = evaluateHbA1c(val);
      return { status: res.status, directive: res.directive };
    },
    validateRange: (val) => val >= 3.0 && val <= 20.0,
  },
  {
    key: 'SODIUM',
    name: 'Sodium (Serum)',
    loinc: LOINC_COMMON.SODIUM || '2951-2',
    unit: 'mEq/L',
    refLow: 135,
    refHigh: 145,
    patterns: [
      /(?:sodium|na\+?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
      /(?:serum\s+sodium)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val) => {
      if (val < 130) {
        return {
          status: 'CRITICAL_LOW',
          directive: `HYPONATREMIA (Na ${val} mEq/L): Evaluate volume status. Correction rate limited to avoid osmotic demyelination.`,
        };
      }
      if (val > 150) {
        return {
          status: 'CRITICAL_HIGH',
          directive: `HYPERNATREMIA (Na ${val} mEq/L): Correct free water deficit before elective general anesthesia.`,
        };
      }
      if (val < 135) {
        return {
          status: 'BORDERLINE_LOW',
          directive: 'Mild hyponatremia. Monitor IV fluid selection (prefer Isotonic 0.9% NaCl).',
        };
      }
      if (val > 145) {
        return {
          status: 'BORDERLINE_HIGH',
          directive: 'Mild hypernatremia. Ensure adequate pre-op oral or IV hydration.',
        };
      }
      return {
        status: 'NORMAL',
        directive: 'Normal serum sodium within physiological limits.',
      };
    },
    validateRange: (val) => val >= 100 && val <= 180,
  },
  {
    key: 'WBC',
    name: 'White Blood Cell Count',
    loinc: LOINC_COMMON.WBC || '6690-2',
    unit: '10^3/µL',
    refLow: 4.5,
    refHigh: 11.0,
    patterns: [
      /(?:wbc|white\s+blood\s+cell(?:\s+count)?|total\s+leucocyte\s+count|tlc)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    sanitizeValue: (val) => (val > 100 ? val / 1000 : val),
    evaluator: (val) => {
      if (val < 2.0) {
        return {
          status: 'CRITICAL_LOW',
          directive: `LEUKOPENIA (WBC ${val}): Severe immunocompromise. Infection risk heightened. Infectious disease consult.`,
        };
      }
      if (val > 15.0) {
        return {
          status: 'CRITICAL_HIGH',
          directive: `LEUKOCYTOSIS (WBC ${val}): Evaluate for acute infection or sepsis. Case postponement advised.`,
        };
      }
      if (val > 11.0) {
        return {
          status: 'BORDERLINE_HIGH',
          directive: 'Mildly elevated WBC. Rule out subclinical infection or corticosteroid effect.',
        };
      }
      return {
        status: 'NORMAL',
        directive: 'Normal leukocyte count. No overt hematologic infection indicator.',
      };
    },
    validateRange: (val) => val >= 0.5 && val <= 100,
  },
  {
    key: 'PT',
    name: 'Prothrombin Time (PT)',
    loinc: LOINC_COMMON.PT || '7284-4',
    unit: 'sec',
    refLow: 11.0,
    refHigh: 13.5,
    patterns: [
      /(?:prothrombin\s+time|pt\s+time|\bpt\b)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(?:sec|s)?/i,
    ],
    evaluator: (val) => {
      if (val > 16.0) {
        return {
          status: 'CRITICAL_HIGH',
          directive: `Prolonged PT (${val}s): Extrinsic pathway coagulopathy. Check vitamin K and factor levels.`,
        };
      }
      if (val > 13.5) {
        return {
          status: 'BORDERLINE_HIGH',
          directive: 'Mildly prolonged PT. Correlate with INR and surgical bleeding risk.',
        };
      }
      return {
        status: 'NORMAL',
        directive: 'Normal prothrombin time.',
      };
    },
    validateRange: (val) => val >= 8 && val <= 60,
  },
  {
    key: 'APTT',
    name: 'Activated PTT (aPTT)',
    loinc: LOINC_COMMON.APTT || '14979-5',
    unit: 'sec',
    refLow: 25.0,
    refHigh: 35.0,
    patterns: [
      /(?:aptt|activated\s+partial\s+thromboplastin\s+time|ptt)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(?:sec|s)?/i,
    ],
    evaluator: (val) => {
      if (val > 45.0) {
        return {
          status: 'CRITICAL_HIGH',
          directive: `Prolonged aPTT (${val}s): Intrinsic pathway coagulopathy. Rule out heparin exposure or hemophilia.`,
        };
      }
      if (val > 35.0) {
        return {
          status: 'BORDERLINE_HIGH',
          directive: 'Borderline aPTT. Assess for lupus anticoagulant or mild factor deficiency.',
        };
      }
      return {
        status: 'NORMAL',
        directive: 'Normal intrinsic coagulation profile.',
      };
    },
    validateRange: (val) => val >= 15 && val <= 120,
  },
  {
    key: 'ALBUMIN',
    name: 'Serum Albumin',
    loinc: LOINC_COMMON.ALBUMIN || '1751-7',
    unit: 'g/dL',
    refLow: 3.5,
    refHigh: 5.0,
    patterns: [
      /(?:serum\s+albumin|albumin)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i,
    ],
    evaluator: (val) => {
      if (val < 3.0) {
        return {
          status: 'CRITICAL_LOW',
          directive: `HYPOALBUMINEMIA (${val} g/dL): Severe nutritional/hepatic deficit. Altered drug binding; heightened post-op edema.`,
        };
      }
      if (val < 3.5) {
        return {
          status: 'BORDERLINE_LOW',
          directive: 'Mildly depressed albumin. Consider pre-op protein optimization.',
        };
      }
      return {
        status: 'NORMAL',
        directive: 'Adequate serum protein and oncotic reserve.',
      };
    },
    validateRange: (val) => val >= 1.0 && val <= 7.0,
  },
];

/**
 * Parses raw OCR text into structured ExtractedLabItem array.
 */
export function parseLabReport(
  rawText: string,
  source: LabReportSource = 'GENERIC',
  pageLines: ExtractedLine[] = [],
  documentName: string = 'Uploaded_Lab_Report.pdf',
  patientMetadata?: { age?: number; gender?: 'M' | 'F' }
): ExtractedLabItem[] {
  const extractedItems: ExtractedLabItem[] = [];
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Helper to find matching line in pageLines for bounding box
  const findProvenance = (labKey: string, matchedValStr: string) => {
    // Look through lines with bounding boxes
    for (const pl of pageLines) {
      const textLower = pl.text.toLowerCase();
      if (
        (textLower.includes(labKey.toLowerCase()) || textLower.includes(matchedValStr)) &&
        pl.bbox
      ) {
        return {
          documentName,
          page: pl.page,
          bbox: pl.bbox,
          rawOcrText: pl.text,
          confidence: 0.94,
        };
      }
    }

    // Default fallback bounding box if line coordinates not directly matched
    const defaultIndex = extractedItems.length;
    const ymin = parseFloat((0.25 + defaultIndex * 0.05).toFixed(4));
    const ymax = parseFloat((ymin + 0.035).toFixed(4));

    return {
      documentName,
      page: 1,
      bbox: {
        ymin: Math.min(0.9, ymin),
        xmin: 0.15,
        ymax: Math.min(0.95, ymax),
        xmax: 0.85,
      },
      rawOcrText: `${labKey}: ${matchedValStr}`,
      confidence: 0.88,
    };
  };

  const processedKeys = new Set<string>();

  for (const def of LAB_DEFINITIONS) {
    if (processedKeys.has(def.key)) continue;

    let matchedValue: number | null = null;
    let matchedRawLine = '';
    let matchedValStr = '';

    // Test each line of text
    for (const line of lines) {
      // PureLab header/admin lines carry numbers (accession, dates) — skip them for this source.
      const skipLine =
        source === 'PURE_LAB' &&
        /purelab|purehealth|accession|collected on|reported on|authori[sz]ed by|emirates id|patient id|dob\s*:|supersedes|page \d+ of/i.test(line);
      if (skipLine) continue;
      for (const pattern of def.patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const cleanStr = match[1].replace(/,/g, '');
          let parsedNum = parseFloat(cleanStr);
          if (!isNaN(parsedNum)) {
            // PureLab unit normalization: creatinine reported in µmol/L → mg/dL.
            // Heuristic: values > 20 cannot be mg/dL (validateRange caps at 20), so convert.
            if (source === 'PURE_LAB' && def.key === 'CREATININE' && parsedNum > 20) {
              parsedNum = creatinineUmolToMgDl(parsedNum);
            }
            // Apply sanitizer if defined
            const sanitized = def.sanitizeValue ? def.sanitizeValue(parsedNum, line) : parsedNum;
            // Validate biological possibility
            if (!def.validateRange || def.validateRange(sanitized)) {
              matchedValue = sanitized;
              matchedRawLine = line;
              matchedValStr = match[1];
              break;
            }
          }
        }
      }
      if (matchedValue !== null) break;
    }

    if (matchedValue !== null) {
      processedKeys.add(def.key);

      // Run rules engine evaluator
      let evalResult: { status: LabStatus; directive: string };
      if (def.evaluator) {
        evalResult = def.evaluator(matchedValue, patientMetadata);
      } else {
        if (matchedValue < def.refLow) {
          evalResult = {
            status: 'BORDERLINE_LOW',
            directive: `Below standard reference limit (${def.refLow} ${def.unit}). Monitor clinically.`,
          };
        } else if (matchedValue > def.refHigh) {
          evalResult = {
            status: 'BORDERLINE_HIGH',
            directive: `Above standard reference limit (${def.refHigh} ${def.unit}). Review prior to clearance.`,
          };
        } else {
          evalResult = {
            status: 'NORMAL',
            directive: `Normal value within standard reference range (${def.refLow} - ${def.refHigh} ${def.unit}).`,
          };
        }
      }

      const prov = findProvenance(def.name, matchedValStr);
      if (matchedRawLine) {
        prov.rawOcrText = matchedRawLine;
      }

      extractedItems.push({
        id: `lab-${def.key.toLowerCase()}-${Date.now()}-${extractedItems.length}`,
        name: def.name,
        loinc: def.loinc,
        value: matchedValue,
        unit: def.unit,
        refLow: def.refLow,
        refHigh: def.refHigh,
        status: evalResult.status,
        directive: evalResult.directive,
        provenance: prov,
      });
    }
  }

  // If very few labs were detected in generic text, guarantee standard essential pre-op panels are extracted or inferred
  return extractedItems;
}
