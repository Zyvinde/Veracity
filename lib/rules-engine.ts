import {
  ExtractedLabItem,
  MedicationHoldClock,
  AirwayExam,
  PatientCase,
  ClearanceStatus,
  PACSwimLane,
  DrugInteraction,
  NeuraxialEligibilityResult,
  PRBCPrediction,
  ASCExclusionRisk,
  AnemiaOptimization,
  PenicillinDelabeling,
  PostOpRiskAssessment,
  ERASTimelineEvent,
  MorningMedDirective,
  SerologyPanel,
  SmokingStatus,
  ContraceptiveType,
  PsychiatricMedication,
  CardiacCondition,
  PatientPreOpQuestionnaire,
  MedicalIssueKey,
  FamilyAnesthesiaIssueKey,
  DentalIssueKey,
  DrugAllergyKey,
  CurrentMedication,
} from './types';
import { RULES_ENGINE_VERSION, DRUG_INTERACTION_MAP } from './constants';

/**
 * Deterministic rules engine for Pre-Operative Assessment (PAC) and Surgical Clearance.
 * Implements ASA (2023), ASRA Pain Medicine (2025), and sovereign perioperative guidelines.
 * Version: 2.5.0
 */

export interface PotassiumEvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluatePotassium(value: number): PotassiumEvaluation {
  if (!Number.isFinite(value)) throw new RangeError('Potassium must be a finite number');
  if (value < 3.0) {
    return {
      status: 'CRITICAL_LOW',
      severity: 'RED',
      directive: 'CRITICAL HYPOKALEMIA (<3.0 mEq/L): Immediate IV Potassium infusion required. Case delayed until K+ ≥ 3.5 mEq/L.',
    };
  }
  if (value > 5.5) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: 'CRITICAL HYPERKALEMIA (>5.5 mEq/L): Urgent ECG, hold all K+ retaining drugs, stat nephrology/endocrine consult.',
    };
  }
  if (value >= 3.0 && value < 3.5) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: 'Oral KCl 20mEq on arrival; recheck POC K+ prior to induction.',
    };
  }
  if (value >= 5.2 && value <= 5.5) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: 'Borderline elevated K+; avoid potassium-containing IV solutions (e.g. Plasmalyte/LR) and recheck pre-op.',
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: 'Normal potassium level. Proceed with standard perioperative electrolyte management.',
  };
}

export interface HemoglobinEvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluateHemoglobin(value: number, gender: 'M' | 'F'): HemoglobinEvaluation {
  const refLow = gender === 'M' ? 13.0 : 12.0;
  const refHigh = gender === 'M' ? 17.5 : 15.5;

  if (value < 7.0) {
    return {
      status: 'CRITICAL_LOW',
      severity: 'RED',
      directive: `CRITICAL ANEMIA (Hb ${value} g/dL < 7.0): Transfusion trigger reached. Type & crossmatch ${gender === 'M' ? '2U' : '2U'} pRBC. Consider case postponement for optimization.`,
    };
  }
  if (value > 18.0) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `CRITICAL POLYCYTHEMIA (Hb ${value} g/dL > 18.0): Evaluate for hyperviscosity syndrome. Hold anticoagulation. Stat phlebotomy consult if symptomatic.`,
    };
  }
  if (value < refLow - 1.5) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: `Pre-operative anemia pathway: Consider IV iron infusion (ferric carboxymaltose 750mg x2). Order reticulocyte count, iron studies, and B12/folate.`,
    };
  }
  if (value < refLow) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: `Mildly below reference range. Consider pre-op iron supplementation. Ensure type & screen on file for surgical blood loss.`,
    };
  }
  if (value > refHigh + 1.0) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: 'Mildly elevated hemoglobin. Evaluate for dehydration or polycythemia. Ensure adequate hydration perioperatively.',
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: `Hemoglobin within ${gender === 'M' ? 'male' : 'female'} reference range. Adequate red cell reserve for surgical blood loss.`,
  };
}

export interface CreatinineEvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
  egfr: number;
}

export function evaluateCreatinine(value: number, age: number, gender: 'M' | 'F'): CreatinineEvaluation {
  const kappa = gender === 'F' ? 0.7 : 0.9;
  const alpha = gender === 'F' ? -0.241 : -0.302;
  const minVal = Math.min(value / kappa, 1);
  const maxVal = Math.max(value / kappa, 1);
  const sexMultiplier = gender === 'F' ? 1.012 : 1;
  const egfr = Math.round(142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexMultiplier);

  if (value > 4.0) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `CRITICAL RENAL FAILURE (Cr ${value} mg/dL, eGFR ${egfr}): Stat nephrology consult. Case delay unless emergent. Adjust all renally-cleared medications.`,
      egfr,
    };
  }
  if (value > 1.5) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Renal insufficiency detected (eGFR ${egfr} mL/min). Avoid nephrotoxins (NSAIDs, contrast). Ensure adequate hydration. Adjust renally-dosed medications.`,
      egfr,
    };
  }
  if (value < 0.4) {
    return {
      status: 'CRITICAL_LOW',
      severity: 'RED',
      directive: `CRITICALLY LOW CREATININE (Cr ${value} mg/dL): May indicate severe muscle wasting or hepatic failure. Evaluate for rhabdomyolysis and liver function.`,
      egfr,
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: `Normal renal clearance (eGFR ${egfr} mL/min). Standard perioperative fluid management.`,
    egfr,
  };
}

export interface INREvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluateINR(value: number, isOnAnticoagulant: boolean = false): INREvaluation {
  if (value > 1.5 && isOnAnticoagulant) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `ELEVATED INR (${value.toFixed(2)}) on anticoagulation: Neuraxial anesthesia contraindicated. Regional block requires INR < 1.4. Consider factor replacement.`,
    };
  }
  if (value > 1.5) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `COAGULOPATHY (INR ${value.toFixed(2)} > 1.5): Evaluate for liver disease, vitamin K deficiency, or occult anticoagulant use. Hematology consult recommended.`,
    };
  }
  if (value > 1.4 && value <= 1.5) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Borderline elevated INR (${value.toFixed(2)}). Neuraxial puncture threshold at INR 1.4 per ASRA 2025. Consider delaying regional block.`,
    };
  }
  if (value < 0.85) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: 'Supratherapeutic coagulation may indicate test error or recent anticoagulant. Verify sample quality and recheck.',
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: 'Normal coagulation. Standard perioperative bleeding risk.',
  };
}

export interface TroponinEvaluation {
  status: 'NORMAL' | 'BORDERLINE_HIGH' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluateTroponin(valueNgMl: number): TroponinEvaluation {
  if (valueNgMl >= 0.04) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `CRITICAL TROPONIN ELEVATION (${valueNgMl} ng/mL ≥ 0.04): Suspected acute myocardial injury. 12-lead ECG + cardiology consult now. Postpone elective surgery, activate ACS protocol.`,
    };
  }
  if (valueNgMl >= 0.014) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Borderline hs-Troponin I (${valueNgMl} ng/mL, cutoff 0.014): Repeat in 1–3h with ECG delta. Rule out demand ischemia before induction. Maintain MAP > 65, avoid tachycardia.`,
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: 'Within normal limits (<0.014 ng/mL). No active acute myocardial injury.',
  };
}

export interface GlucoseEvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluateBloodGlucose(value: number, isDiabetic: boolean = false): GlucoseEvaluation {
  if (value < 54) {
    return {
      status: 'CRITICAL_LOW',
      severity: 'RED',
      directive: `SEVERE HYPOGLYCEMIA (Glucose ${value} mg/dL): Immediate IV dextrose (D50W 25ml IV push). Recheck POC glucose q15min until >100 mg/dL.`,
    };
  }
  if (value < 70) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: `Mild hypoglycemia (Glucose ${value} mg/dL). Oral glucose gel if conscious. Hold all insulin. Recheck in 30 minutes.`,
    };
  }
  if (value > 300) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `SEVERE HYPERGLYCEMIA (Glucose ${value} mg/dL): Check ketones. If DKA/HHS suspected, urgent endocrine consult. Insulin infusion protocol. Delay elective case.`,
    };
  }
  if (isDiabetic && value > 180) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Perioperative hyperglycemia (Glucose ${value} mg/dL). Target 140-180 mg/dL. Consider insulin sliding scale. Ensure BGL monitoring q2h intra-op.`,
    };
  }
  if (!isDiabetic && value > 140) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Elevated fasting glucose (${value} mg/dL). Consider HbA1c if not recent. Monitor perioperative glycemic control.`,
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: isDiabetic
      ? 'Diabetic glucose within acceptable perioperative range. Continue current management.'
      : 'Normal blood glucose. Standard perioperative glycemic monitoring.',
  };
}

export interface PlateletEvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluatePlateletCount(value: number, isNeuraxialPlanned: boolean = false): PlateletEvaluation {
  if (value < 50000) {
    return {
      status: 'CRITICAL_LOW',
      severity: 'RED',
      directive: `CRITICAL THROMBOCYTOPENIA (Plt ${value.toLocaleString()}/µL < 50,000): Spontaneous bleeding risk. Consider platelet transfusion. Neuraxial anesthesia absolutely contraindicated. Delay case.`,
    };
  }
  if (value < 70000 && isNeuraxialPlanned) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: `Platelets ${value.toLocaleString()}/µL below ASRA 2025 neuraxial threshold (70,000). Consider general anesthesia with peripheral nerve block instead.`,
    };
  }
  if (value < 100000) {
    return {
      status: 'BORDERLINE_LOW',
      severity: 'AMBER',
      directive: `Mild thrombocytopenia (Plt ${value.toLocaleString()}/µL). Evaluate for cause (ITP, DIC, medication). Peripheral nerve blocks still safe >50,000.`,
    };
  }
  if (value > 500000) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `SEVERE THROMBOCYTOSIS (Plt ${value.toLocaleString()}/µL > 500,000): Evaluate for essential thrombocythemia. Risk of thrombosis and paradoxical bleeding.`,
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: 'Platelet count within acceptable range for all anesthetic techniques.',
  };
}

export interface HbA1cEvaluation {
  status: 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  severity: 'GREEN' | 'AMBER' | 'RED';
  directive: string;
}

export function evaluateHbA1c(value: number): HbA1cEvaluation {
  if (value > 9.0) {
    return {
      status: 'CRITICAL_HIGH',
      severity: 'RED',
      directive: `POOR DIABETIC CONTROL (HbA1c ${value}% > 9.0%): Elective surgery postponed. Endocrine optimization required. Wound healing and infection risk severely elevated.`,
    };
  }
  if (value > 8.0) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Suboptimal diabetic control (HbA1c ${value}% > 8.0%). Consider optimizing before elective surgery. Enhanced perioperative glucose monitoring required.`,
    };
  }
  if (value > 5.7) {
    return {
      status: 'BORDERLINE_HIGH',
      severity: 'AMBER',
      directive: `Elevated HbA1c (${value}%) above normal. Monitor perioperative glycemia closely. Consider diabetes management referral post-op.`,
    };
  }
  return {
    status: 'NORMAL',
    severity: 'GREEN',
    directive: `HbA1c ${value}% within acceptable range. Glycemic control adequate for elective surgery.`,
  };
}

export interface GLP1Evaluation {
  status: 'CLEARED' | 'HOLD_REQUIRED' | 'HARD_STOP';
  hoursRemaining: number;
  clinicalAction: string;
  guidelineBasis: string;
}

export const LEGACY_GLP1_POLICY = 'Legacy ASA 2023 GLP-1 consensus-inspired local policy; historical, not current guidance';

export function evaluateGLP1Hold(hoursElapsed: number, isWeekly: boolean): GLP1Evaluation {
  if (!Number.isFinite(hoursElapsed) || hoursElapsed < 0 || typeof isWeekly !== 'boolean') {
    return {
      status: 'HARD_STOP',
      hoursRemaining: 0,
      clinicalAction: 'Unknown GLP-1 exposure: stop automated clearance, verify dose timing and aspiration risk with the anesthesia team; consider gastric POCUS.',
      guidelineBasis: LEGACY_GLP1_POLICY,
    };
  }
  const targetHoldHours = isWeekly ? 168 : 24;
  const hoursRemaining = Math.max(0, targetHoldHours - hoursElapsed);

  if (isWeekly) {
    if (hoursElapsed < 168) {
      return {
        status: 'HOLD_REQUIRED',
        hoursRemaining,
        clinicalAction: `Legacy ASA 2023 local policy: ${targetHoldHours}h (7 days) hold unmet; aspiration risk requires anesthesia review. Consider gastric POCUS by a qualified clinician; if unavailable or inconclusive, use full-stomach precautions or delay.`,
        guidelineBasis: LEGACY_GLP1_POLICY,
      };
    }
    return {
      status: 'CLEARED',
      hoursRemaining: 0,
      clinicalAction: '7-day GLP-1 hold period satisfied. Standard NPO guidelines apply.',
      guidelineBasis: LEGACY_GLP1_POLICY,
    };
  } else {
    if (hoursElapsed < 24) {
      return {
        status: 'HOLD_REQUIRED',
        hoursRemaining,
        clinicalAction: 'Omit morning dose on day of surgery. Assess for gastrointestinal symptoms.',
        guidelineBasis: LEGACY_GLP1_POLICY,
      };
    }
    return {
      status: 'CLEARED',
      hoursRemaining: 0,
      clinicalAction: 'Daily GLP-1 hold satisfied. Standard fasting protocol.',
      guidelineBasis: LEGACY_GLP1_POLICY,
    };
  }
}

export interface NeuraxialEvaluation {
  eligible: boolean;
  hardStopReasons: string[];
  recommendation: string;
}

export function evaluateNeuraxialEligibility(
  platelets: number,
  inr: number,
  activeDoacHours: number
): NeuraxialEvaluation {
  const reasons: string[] = [];

  if (!Number.isFinite(platelets) || platelets < 0 || !Number.isFinite(inr) || inr <= 0 || !Number.isFinite(activeDoacHours) || activeDoacHours < 0) {
    reasons.push('Missing or invalid coagulation/DOAC inputs: stop automated clearance and verify values');
  }
  if (platelets < 70000) {
    reasons.push(`Thrombocytopenia (Platelets ${platelets.toLocaleString()} /µL < 70,000 /µL)`);
  }
  if (inr > 1.4) {
    reasons.push(`Coagulopathy (INR ${inr.toFixed(2)} > 1.40 threshold)`);
  }
  if (activeDoacHours < 72) {
    reasons.push(`Inadequate DOAC hold (${activeDoacHours}h elapsed vs 72h minimum for neuraxial puncture)`);
  }

  if (reasons.length > 0) {
    return {
      eligible: false,
      hardStopReasons: reasons,
      recommendation: 'Neuraxial (Spinal/Epidural) Anesthesia CONTRAINDICATED per ASRA 2025. Switch to General Anesthesia with peripheral nerve block or postpone neuraxial intervention until washout complete.',
    };
  }

  return {
    eligible: true,
    hardStopReasons: [],
    recommendation: 'Neuraxial Anesthesia Cleared. Coagulation markers and anticoagulant hold times within ASRA 2025 safety thresholds.',
  };
}

export function evaluateAirwayRisk(airway: AirwayExam): 'LOW' | 'MODERATE' | 'HIGH' {
  let riskPoints = 0;
  if (airway.mallampati === 'Class III' || airway.mallampati === 'Class IV') riskPoints += 2;
  if (airway.mouthOpeningCm < 3.5) riskPoints += 2;
  if (airway.thyromentalDistanceCm < 6.0) riskPoints += 2;
  if (airway.neckMobility === 'Fusion' || airway.neckMobility === 'Restricted') riskPoints += 2;
  if (airway.dentition === 'Loose Teeth') riskPoints += 1;

  if (riskPoints >= 4) return 'HIGH';
  if (riskPoints >= 2) return 'MODERATE';
  return 'LOW';
}

export function checkDrugInteractions(medications: MedicationHoldClock[]): DrugInteraction[] {
  const found: DrugInteraction[] = [];
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      // Brand-aware matching so UAE prescriptions (Augmentin, Brufen, Plavix…) hit generic patterns.
      const drug1 = normalizeDrugName(medications[i].drugName);
      const drug2 = normalizeDrugName(medications[j].drugName);
      for (const interaction of DRUG_INTERACTION_MAP) {
        const matches =
          (drug1.includes(interaction.drug1Pattern) && drug2.includes(interaction.drug2Pattern)) ||
          (drug1.includes(interaction.drug2Pattern) && drug2.includes(interaction.drug1Pattern));
        if (matches) {
          found.push({
            drug1: medications[i].drugName,
            drug2: medications[j].drugName,
            severity: interaction.severity,
            description: interaction.description,
            clinicalAction: interaction.clinicalAction,
          });
        }
      }
    }
  }
  return found;
}

export function determinePACSwimLane(patient: PatientCase): PACSwimLane {
  const hasCriticalLab = patient.labs.some(
    (l) => l.status === 'CRITICAL_LOW' || l.status === 'CRITICAL_HIGH'
  );
  const hasHardStopMed = patient.medications.some((m) => m.status === 'HARD_STOP');
  const isHighASA = patient.asaStatus === 'ASA III' || patient.asaStatus === 'ASA IV' || patient.asaStatus === 'ASA V' || patient.asaStatus === 'ASA E';
  const isHighAirway = patient.airway.riskTier === 'HIGH';
  const isHighInvasiveness = patient.invasivenessTier >= 3;
  const hasAllergySevere = patient.allergies?.some((a) => a.severity === 'SEVERE' || a.severity === 'ANAPHYLAXIS');
  const hasInfection = patient.hasActiveInfection;

  if (hasCriticalLab || hasHardStopMed || isHighASA || isHighAirway || isHighInvasiveness || hasAllergySevere || hasInfection) {
    return 'LANE_3_IN_PERSON';
  }

  const hasBorderlineLab = patient.labs.some(
    (l) => l.status === 'BORDERLINE_LOW' || l.status === 'BORDERLINE_HIGH'
  );
  const hasHoldRequiredMed = patient.medications.some((m) => m.status === 'HOLD_REQUIRED');
  const isModerateASA = patient.asaStatus === 'ASA II';

  if (hasBorderlineLab || hasHoldRequiredMed || isModerateASA) {
    return 'LANE_2_TELEPHONIC';
  }

  return 'LANE_1_VIRTUAL';
}

export function evaluateOverallClearance(patient: PatientCase): {
  status: ClearanceStatus;
  primaryDirective: string;
  directiesCount: number;
} {
  const hardStopMeds = patient.medications.filter((m) => m.status === 'HARD_STOP');
  const criticalLabs = patient.labs.filter(
    (l) => l.status === 'CRITICAL_LOW' || l.status === 'CRITICAL_HIGH'
  );

  if (hardStopMeds.length > 0 || criticalLabs.length > 0) {
    const reasons = [
      ...hardStopMeds.map((m) => `${m.drugName} Hold Violation (${m.clinicalAction})`),
      ...criticalLabs.map((l) => `${l.name} Critical Level (${l.value} ${l.unit})`),
    ];
    return {
      status: 'RED_HARD_STOP',
      primaryDirective: `CASE DELAY / ANESTHESIA HARD STOP: ${reasons[0]}`,
      directiesCount: reasons.length,
    };
  }

  const conditionalMeds = patient.medications.filter((m) => m.status === 'HOLD_REQUIRED');
  const borderlineLabs = patient.labs.filter(
    (l) => l.status === 'BORDERLINE_LOW' || l.status === 'BORDERLINE_HIGH'
  );
  const hasSevereAllergy = patient.allergies?.some((a) => a.severity === 'SEVERE' || a.severity === 'ANAPHYLAXIS');
  const hasDrugInteraction = checkDrugInteractions(patient.medications).some(
    (d) => d.severity === 'MAJOR' || d.severity === 'CONTRAINDICATED'
  );

  if (conditionalMeds.length > 0 || borderlineLabs.length > 0 || hasSevereAllergy || hasDrugInteraction) {
    const directives = [
      ...conditionalMeds.map((m) => `${m.drugName}: ${m.clinicalAction}`),
      ...borderlineLabs.map((l) => `${l.name}: ${l.directive}`),
      ...(hasSevereAllergy ? ['SEVERE ALLERGY ALERT: Ensure anaphylaxis kit and epinephrine available'] : []),
      ...(hasDrugInteraction ? ['DRUG INTERACTION ALERT: Review co-prescribed medications for contraindications'] : []),
    ];
    return {
      status: 'AMBER_CONDITIONAL',
      primaryDirective: `CONDITIONAL CLEARANCE (${directives.length} Clinical Directives): ${directives.slice(0, 2).join(' | ')}`,
      directiesCount: directives.length,
    };
  }

  return {
    status: 'GREEN_CLEARED',
    primaryDirective: 'CLEARED FOR SURGERY: All biomarkers, medication holds, and airway parameters within acceptable perioperative risk thresholds.',
    directiesCount: 0,
  };
}

/* =====================================================
 * Pillar 2 Feature #9: Spine & Neuraxial Feasibility
 * ===================================================== */
export function evaluateNeuraxialFeasibility(patient: PatientCase): NeuraxialEligibilityResult {
  const plt = patient.labs.find(l => l.name.toLowerCase().includes('platelet'));
  const inr = patient.labs.find(l => l.name.toLowerCase().includes('inr'));
  const doac = patient.medications.find(m => m.category === 'DOAC');

  const plateletValue = plt?.value ?? 200000;
  const inrValue = inr?.value ?? 1.0;
  const doacHours = doac ? doac.lastDoseHoursAgo : 999;

  const reasons: string[] = [];
  if (plateletValue < 70000) reasons.push(`Thrombocytopenia (Platelets ${plateletValue.toLocaleString()}/µL < 70,000)`);
  if (inrValue > 1.4) reasons.push(`Coagulopathy (INR ${inrValue.toFixed(2)} > 1.40)`);
  if (doac && doacHours < 72) reasons.push(`Inadequate DOAC hold (${doacHours}h vs 72h required)`);
  if (patient.airway.neckMobility === 'Fusion') reasons.push('Cervical spine fusion — neuraxial positioning may be difficult');

  if (reasons.length > 0) {
    return {
      eligible: false,
      hardStopReasons: reasons,
      recommendation: 'Neuraxial Anesthesia CONTRAINDICATED per ASRA 2025. Switch to General Anesthesia with peripheral nerve block or postpone.',
      plateletThreshold: 70000,
      inrThreshold: 1.4,
      doacHoldHours: 72,
    };
  }

  return {
    eligible: true,
    hardStopReasons: [],
    recommendation: 'Neuraxial Anesthesia Cleared per ASRA 2025. Coagulation markers and anticoagulant hold times within safety thresholds.',
    plateletThreshold: 70000,
    inrThreshold: 1.4,
    doacHoldHours: 72,
  };
}

/* =====================================================
 * Pillar 2 Feature #10: Mandatory Serology & Blood Bank
 * ===================================================== */
export function evaluateSerology(patient: PatientCase): SerologyPanel {
  const findLabValue = (namePart: string): string | undefined => {
    const lab = patient.labs.find(
      l => l.name.toLowerCase().includes(namePart.toLowerCase()) || l.loinc.toLowerCase().includes(namePart.toLowerCase())
    );
    if (!lab) return undefined;
    return lab.value > 0 ? 'POSITIVE' : 'NEGATIVE';
  };
  const findBloodGroup = (): string => {
    const groupLab = patient.labs.find(
      l => l.name.toLowerCase().includes('blood group') || l.name.toLowerCase().includes('abo')
    );
    return groupLab?.name.includes('O') ? 'O' : groupLab?.name.includes('A') ? 'A' : groupLab?.name.includes('B') ? 'B' : groupLab?.name.includes('AB') ? 'AB' : (patient.gender === 'F' ? 'O' : 'O');
  };
  const findRh = (): 'POSITIVE' | 'NEGATIVE' => {
    const rhLab = patient.labs.find(l => l.name.toLowerCase().includes('rh'));
    return rhLab && rhLab.name.toLowerCase().includes('neg') ? 'NEGATIVE' : 'POSITIVE';
  };

  return {
    hiv1_2: (findLabValue('hiv') as SerologyPanel['hiv1_2']) || 'NOT_TESTED',
    hbsAg: (findLabValue('hbsag') as SerologyPanel['hbsAg']) || 'NOT_TESTED',
    antiHCV: (findLabValue('anti-hcv') as SerologyPanel['antiHCV']) || 'NOT_TESTED',
    bloodGroup: findBloodGroup() + findRh(),
    rhFactor: findRh(),
    crossmatchStatus: patient.invasivenessTier >= 3 ? 'COMPATIBLE' : 'NOT_CHECKED',
    screenedDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
  };
}

/* =====================================================
 * Pillar 4 Feature #18: PRBC Transfusion Volume Predictor
 * ===================================================== */
export function predictPRBCUnits(patient: PatientCase): PRBCPrediction {
  const hgbLab = patient.labs.find(l => l.name.toLowerCase().includes('hemoglobin'));
  const hgb = hgbLab?.value ?? 13.0;
  const factors: string[] = [];
  let baseUnits = 0;

  // Invasiveness tier factor
  if (patient.invasivenessTier >= 3) { baseUnits += 1.5; factors.push('Major surgery (Tier ≥3)'); }
  else if (patient.invasivenessTier >= 2) { baseUnits += 0.5; factors.push('Intermediate surgery (Tier 2)'); }

  // Baseline anemia factor
  if (hgb < 10) { baseUnits += 1.0; factors.push(`Pre-existing anemia (Hb ${hgb} g/dL)`); }
  else if (hgb < 12) { baseUnits += 0.5; factors.push(`Mild anemia (Hb ${hgb} g/dL)`); }

  // Age factor
  if (patient.age > 70) { baseUnits += 0.5; factors.push('Age >70'); }

  // BMI factor
  if (patient.bmi > 35) { baseUnits += 0.5; factors.push('Obesity (BMI >35)'); }

  // ASA factor
  if (patient.asaStatus === 'ASA III' || patient.asaStatus === 'ASA IV') { baseUnits += 0.5; factors.push(`Elevated ASA (${patient.asaStatus})`); }

  const predictedUnits = Math.min(6, Math.max(0, Math.round(baseUnits * 2) / 2));
  const low = Math.max(0, predictedUnits - 1);
  const high = predictedUnits + 1;

  let recommendation = '';
  if (predictedUnits === 0) recommendation = 'Type & Screen sufficient. No transfusion anticipated.';
  else if (predictedUnits <= 1) recommendation = 'Type & Screen recommended. Crossmatch 1 unit PRBC standby.';
  else recommendation = `Crossmatch ${predictedUnits} units PRBC recommended. Blood bank notified.`;

  return {
    predictedUnits,
    confidenceInterval: [low, high],
    riskFactors: factors,
    recommendation,
  };
}

/* =====================================================
 * Pillar 4 Feature #19: ASC Exclusion Classifier
 * ===================================================== */
export function evaluateASCExclusion(patient: PatientCase): ASCExclusionRisk {
  const reasons: string[] = [];
  let score = 0;

  if (patient.bmi >= 45) { reasons.push(`Extreme obesity (BMI ${patient.bmi.toFixed(1)} ≥ 45)`); score += 3; }
  else if (patient.bmi >= 40) { reasons.push(`Severe obesity (BMI ${patient.bmi.toFixed(1)} ≥ 40) with metabolic comorbidities`); score += 2; }

  if (patient.stopBangScore >= 5) { reasons.push(`Severe OSA (STOP-Bang ${patient.stopBangScore} ≥ 5) without CPAP compliance documentation`); score += 2; }

  if (patient.asaStatus === 'ASA IV' || patient.asaStatus === 'ASA V') { reasons.push(`High ASA status (${patient.asaStatus})`); score += 3; }

  if (patient.rcriClass === 'Class IV (>11%)') { reasons.push('High cardiac risk (RCRI Class IV)'); score += 2; }

  if (patient.airway.riskTier === 'HIGH') { reasons.push('Difficult airway — requires tertiary hospital backup'); score += 2; }

  const excluded = score >= 3;
  const recommendation = excluded
    ? 'ASSESSMENT: Patient requires tertiary hospital with on-site ICU. Transfer from freestanding ASC recommended.'
    : 'ASSESSMENT: Patient is suitable for ambulatory surgery center (ASC). Standard day-surgery protocols apply.';

  return { excluded, reasons, recommendation, riskScore: score };
}

/* =====================================================
 * Pillar 4 Feature #20: Pre-Op Anemia Optimization
 * ===================================================== */
export function evaluateAnemiaOptimization(patient: PatientCase): AnemiaOptimization {
  const hgbLab = patient.labs.find(l => l.name.toLowerCase().includes('hemoglobin'));
  const hgb = hgbLab?.value ?? 13.0;
  const refLow = patient.gender === 'F' ? 12.0 : 13.0;

  if (hgb >= refLow) {
    return {
      isAnemic: false,
      hemoglobin: hgb,
      severity: 'NONE',
      ironProtocol: 'No iron supplementation required.',
      timeline: 'N/A',
      expectedImprovement: 'N/A',
    };
  }

  const deficit = refLow - hgb;
  let severity: AnemiaOptimization['severity'];
  let ironProtocol: string;
  let timeline: string;
  let expectedImprovement: string;

  if (hgb < 8.0) {
    severity = 'SEVERE';
    ironProtocol = 'URGENT: IV iron sucrose 200mg x5 doses over 2 weeks. Consider pre-op transfusion (Hb <8.0 g/dL is transfusion trigger). Endocrine/hematology consult.';
    timeline = 'Minimum 14-21 days pre-op optimization window.';
    expectedImprovement = 'Expect 1-2 g/dL improvement with IV iron over 14 days.';
  } else if (hgb < 10.0) {
    severity = 'MODERATE';
    ironProtocol = 'IV ferric carboxymaltose 750mg x2 doses (days 0 and 7). Oral ferrous sulfate 325mg TID if IV not available. Reticulocyte count and iron studies.';
    timeline = 'Begin 14-21 days before surgery for optimal effect.';
    expectedImprovement = 'Expect 1.5-2.5 g/dL improvement with IV iron over 14-21 days.';
  } else {
    severity = 'MILD';
    ironProtocol = 'Oral ferrous sulfate 325mg daily with vitamin C 250mg. Consider IV iron if surgery within 7 days.';
    timeline = 'Begin immediately. Minimum 7-14 days pre-op.';
    expectedImprovement = 'Expect 0.5-1.0 g/dL improvement over 14 days.';
  }

  return { isAnemic: true, hemoglobin: hgb, severity, ironProtocol, timeline, expectedImprovement };
}

/* =====================================================
 * Pillar 4 Feature #21: Penicillin Allergy Delabeling Engine
 * ===================================================== */
export function evaluatePenicillinDelabeling(patient: PatientCase): PenicillinDelabeling {
  const pcnAllergy = patient.allergies.find(
    a => a.allergen.toLowerCase().includes('penicillin') || a.allergen.toLowerCase().includes('amoxicillin')
  );

  if (!pcnAllergy) {
    return {
      eligibleForDelabeling: false,
      trueAllergyRisk: 'No penicillin allergy documented.',
      recommendation: 'Standard cephalosporin prophylaxis (Cefazolin 2g IV) appropriate.',
      alternativeAntibiotics: ['Cefazolin 2g IV'],
    };
  }

  const isIgEMediated = pcnAllergy.severity === 'ANAPHYLAXIS' || pcnAllergy.severity === 'SEVERE';
  const isMildGI = pcnAllergy.reaction.toLowerCase().includes('nausea') || pcnAllergy.reaction.toLowerCase().includes('gi');

  if (isMildGI || (pcnAllergy.severity === 'MILD' && !pcnAllergy.reaction.toLowerCase().includes('rash'))) {
    return {
      eligibleForDelabeling: true,
      trueAllergyRisk: 'LOW — Reaction is consistent with drug intolerance, not true IgE-mediated allergy. Up to 90% of PCN-reported allergies are false positives.',
      recommendation: 'DELABELING RECOMMENDED: Patient may receive Cefazolin for surgical prophylaxis. Low cross-reactivity risk (<2%). Document delabeling in chart.',
      alternativeAntibiotics: ['Cefazolin 2g IV (first-line)', 'Clindamycin 900mg IV (if confirmed allergy)'],
    };
  }

  if (pcnAllergy.severity === 'MODERATE' && pcnAllergy.reaction.toLowerCase().includes('rash')) {
    return {
      eligibleForDelabeling: true,
      trueAllergyRisk: 'MODERATE — Maculopapular rash suggests possible delayed hypersensitivity, not anaphylaxis. Skin testing may clarify.',
      recommendation: 'CAUTION: Consider penicillin skin testing before delabeling. If skin test negative, Cefazolin is safe. If testing unavailable, use Clindamycin.',
      alternativeAntibiotics: ['Clindamycin 900mg IV', 'Vancomycin 1g IV (last resort)'],
    };
  }

  return {
    eligibleForDelabeling: false,
    trueAllergyRisk: 'HIGH — Reaction suggests possible IgE-mediated allergy. Do NOT delabel without formal allergist evaluation.',
    recommendation: 'Use non-beta-lactam prophylaxis. Vancomycin or Clindamycin per surgical antibiotic guidelines. Allergist referral recommended.',
    alternativeAntibiotics: ['Vancomycin 1g IV (60 min infusion)', 'Clindamycin 900mg IV'],
  };
}

/* =====================================================
 * Pillar 4 Feature #22: Post-Op Complication Risk (AKI & VTE)
 * ===================================================== */
export function evaluatePostOpRisk(patient: PatientCase): PostOpRiskAssessment {
  let akiScore = 0;
  let vteScore = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // AKI Risk Factors
  const crLab = patient.labs.find(l => l.name.toLowerCase().includes('creatinine'));
  const cr = crLab?.value ?? 0.9;
  if (cr > 1.2) { akiScore += 2; riskFactors.push(`Elevated creatinine (${cr} mg/dL)`); }
  if (patient.age > 65) { akiScore += 1; riskFactors.push('Age >65'); }
  if (patient.hasActiveInfection) { akiScore += 2; riskFactors.push('Active infection'); }
  if (patient.bmi > 35) { akiScore += 1; riskFactors.push('Obesity'); }
  if (patient.invasivenessTier >= 3) { akiScore += 1; riskFactors.push('Major surgery'); }
  const hasNSAID = patient.medications.some(m => m.category === 'NSAID');
  if (hasNSAID) { akiScore += 1; riskFactors.push('NSAID use'); }

  // VTE Risk — Caprini Score (simplified)
  if (patient.age > 40) vteScore += 1;
  if (patient.age > 60) vteScore += 1;
  if (patient.bmi > 25) vteScore += 1;
  if (patient.bmi > 35) vteScore += 1;
  if (patient.invasivenessTier >= 3) vteScore += 2;
  if (patient.invasivenessTier >= 2) vteScore += 1;
  if (patient.hasActiveInfection) vteScore += 1;
  if (patient.asaStatus !== 'ASA I') vteScore += 1;
  if (patient.medications.some(m => m.category === 'DOAC' || m.category === 'ANTIPLATELET')) vteScore += 1;

  const akiLevel = akiScore >= 5 ? 'VERY_HIGH' : akiScore >= 3 ? 'HIGH' : akiScore >= 2 ? 'MODERATE' : 'LOW';
  const vteLevel = vteScore >= 5 ? 'HIGH' : vteScore >= 3 ? 'MODERATE' : 'LOW';

  if (akiLevel !== 'LOW') recommendations.push('Maintain MAP >65 mmHg intra-operatively. Avoid nephrotoxins. Ensure IV fluid optimization.');
  if (vteLevel !== 'LOW') recommendations.push('DVT prophylaxis: LMWH (enoxaparin 40mg SC daily) starting 6-12h post-op. Mechanical prophylaxis (TEDs + IPC) intra-op.');
  if (vteLevel === 'HIGH') recommendations.push('Consider extended VTE prophylaxis (28 days) for major orthopaedic surgery.');

  return {
    akiRisk: akiLevel,
    akiScore,
    vteRisk: vteLevel,
    vteScore,
    capriniScore: vteScore,
    riskFactors,
    recommendations,
  };
}

/* =====================================================
 * Pillar 5 Features #23-26: ERAS Timeline Generator
 * ===================================================== */
export function generateERASTimeline(patient: PatientCase): ERASTimelineEvent[] {
  const surgeryTime = new Date(patient.scheduledTimeIso);
  const events: ERASTimelineEvent[] = [
    {
      timeLabel: 'T-7 Days',
      hoursBeforeSurgery: 168,
      title: 'Stop Weekly GLP-1 RA',
      description: patient.medications.some(m => m.category === 'GLP1' && m.isWeekly)
        ? 'Hold Semaglutide/Ozempic weekly injection. Confirm last dose ≥7 days before surgery.'
        : 'No weekly GLP-1 RA in current medication list.',
      status: 'UPCOMING',
      category: 'MEDICATION',
    },
    {
      timeLabel: 'T-3 Days',
      hoursBeforeSurgery: 72,
      title: 'Stop SGLT2 Inhibitors',
      description: patient.medications.some(m => m.category === 'SGLT2I')
        ? 'Hold Empagliflozin/Dapagliflozin. Prevent perioperative euglycemic DKA.'
        : 'No SGLT2 inhibitors in current medication list.',
      status: 'UPCOMING',
      category: 'MEDICATION',
    },
    {
      timeLabel: 'T-2 Days',
      hoursBeforeSurgery: 48,
      title: 'DOAC Hold Window Opens',
      description: patient.medications.some(m => m.category === 'DOAC')
        ? 'Begin DOAC washout period. 48h minimum for GA, 72h for neuraxial block.'
        : 'No DOAC in current medication list.',
      status: 'UPCOMING',
      category: 'MEDICATION',
    },
    {
      timeLabel: 'T-12h',
      hoursBeforeSurgery: 12,
      title: 'CHG Skin Prep (Night Before)',
      description: 'Chlorhexidine gluconate shower: 4% CHG soap. Scrub from neck to toes. Pay attention to axillae, groin, and surgical site. Pat dry.',
      status: 'UPCOMING',
      category: 'HYGIENE',
    },
    {
      timeLabel: 'T-8h',
      hoursBeforeSurgery: 8,
      title: 'Midnight NPO — Stop All Food',
      description: 'No solid food, milk, or non-clear liquids after midnight. 8h solids / 2h minimum clears (3h preferred); clear water only in the window.',
      status: 'UPCOMING',
      category: 'FASTING',
    },
    {
      timeLabel: 'T-4h',
      hoursBeforeSurgery: 4,
      title: 'Hold Morning Medications',
      description: 'Hold ACEi/ARBs (Lisinopril, Losartan). Do NOT take any diabetes medicine on day of surgery. TAKE thyroid pills with a sip of water. Take beta-blockers with sip of water.',
      status: 'UPCOMING',
      category: 'MEDICATION',
    },
    {
      timeLabel: 'T-2h',
      hoursBeforeSurgery: 2,
      title: 'Clear Carb Drink + CHG Prep',
      description: 'Drink 200ml clear carbohydrate beverage (e.g. pre-surgery drink). CHG wipe of surgical site. 2h minimum NPO cutoff for clear liquids (3h preferred).',
      status: 'UPCOMING',
      category: 'FASTING',
    },
    {
      timeLabel: 'T-0',
      hoursBeforeSurgery: 0,
      title: 'Arrival & Wheel-In to OR',
      description: 'Patient arrives at surgical facility. Identity verification, IV access, monitors applied. Ready for anesthesia induction.',
      status: 'UPCOMING',
      category: 'EDUCATION',
    },
  ];

  // Determine current position on timeline
  const now = new Date();
  const hoursUntilSurgery = (surgeryTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return events.map(e => {
    if (hoursUntilSurgery > e.hoursBeforeSurgery + 2) return { ...e, status: 'COMPLETED' as const };
    if (hoursUntilSurgery <= e.hoursBeforeSurgery + 2 && hoursUntilSurgery >= e.hoursBeforeSurgery - 2) return { ...e, status: 'CURRENT' as const };
    return { ...e, status: 'UPCOMING' as const };
  });
}

/* =====================================================
 * Pillar 5 Feature #24: Morning-of-Surgery Medication Directives
 * ===================================================== */
export function generateMorningMedDirectives(patient: PatientCase): MorningMedDirective[] {
  const directives: MorningMedDirective[] = [];

  for (const med of patient.medications) {
    switch (med.category) {
      case 'ACE_ARB':
        directives.push({
          drugName: med.drugName,
          action: 'HOLD',
          reason: 'ACEi/ARBs cause perioperative vasoplegia and refractory hypotension under anesthesia.',
          timing: 'Hold morning of surgery. Resume when oral intake tolerated post-op.',
          critical: true,
        });
        break;
      case 'BETA_BLOCKER':
        directives.push({
          drugName: med.drugName,
          action: 'TAKE_WITH_SIP',
          reason: 'Continue beta-blockers to prevent rebound tachycardia and hypertension.',
          timing: 'Take with sip of water on morning of surgery.',
          critical: false,
        });
        break;
      case 'SGLT2I':
        directives.push({
          drugName: med.drugName,
          action: 'OMIT',
          reason: 'SGLT2 inhibitors increase risk of euglycemic DKA under surgical stress.',
          timing: 'Hold 3-4 days pre-op. Resume when eating normally post-op.',
          critical: true,
        });
        break;
      case 'GLP1':
        directives.push({
          drugName: med.drugName,
          action: 'OMIT',
          reason: 'GLP-1 RAs cause delayed gastric emptying — aspiration risk under GA.',
          timing: `Hold ${med.isWeekly ? '7 days' : '1 day'} pre-op.`,
          critical: true,
        });
        break;
      case 'DOAC':
        directives.push({
          drugName: med.drugName,
          action: 'OMIT',
          reason: 'Anticoagulant — active washout period. Bleeding risk.',
          timing: `Hold ${med.requiredHoldHours}h before surgery.`,
          critical: true,
        });
        break;
      case 'OTHER':
        if (med.drugName.toLowerCase().includes('metformin')) {
          directives.push({
            drugName: med.drugName,
            action: 'OMIT',
            reason: 'Metformin — do NOT take on day of surgery (lactic acidosis risk under surgical stress / contrast).',
            timing: 'Hold morning of surgery. Resume when eating normally post-op.',
            critical: true,
          });
        } else if (
          /insulin|glipizide|gliclazide|glyburide|glimepiride|sitagliptin|januvia|linagliptin|saxagliptin|exenatide|liraglutide|dulaglutide|semaglutide|tirzepatide|mounjaro|wegovy|ozempic|rybelsus|jardiance|empagliflozin|dapagliflozin|farxiga|canagliflozin|ertugliflozin|pioglitazone|rosiglitazone|acarbose|repaglinide|nateglinide/i.test(
            med.drugName
          )
        ) {
          directives.push({
            drugName: med.drugName,
            action: 'OMIT',
            reason: 'Diabetes medicine — do NOT take on day of surgery (hypoglycemia / DKA risk while fasting under anesthesia).',
            timing: 'Hold morning of surgery. Anesthesia team will manage glucose with insulin infusion if needed. Resume when eating normally post-op.',
            critical: true,
          });
        } else if (
          /levothyroxine|thyroxine|eltroxin|euthyrox|synthroid|carbimazole|methimazole|carbimazol|propylthiouracil|thyroid/i.test(
            med.drugName
          )
        ) {
          directives.push({
            drugName: med.drugName,
            action: 'TAKE_WITH_SIP',
            reason: 'Thyroid medicine — TAKE on day of surgery with a sip of water (prevents thyroid imbalance under anesthesia).',
            timing: 'Take with a small sip of water on morning of surgery.',
            critical: false,
          });
        } else {
          directives.push({
            drugName: med.drugName,
            action: 'TAKE_WITH_SIP',
            reason: 'Continue routine medication with sip of water.',
            timing: 'Take with sip of water on morning of surgery.',
            critical: false,
          });
        }
        break;
      default:
        directives.push({
          drugName: med.drugName,
          action: 'TAKE_WITH_SIP',
          reason: 'Continue routine medication.',
          timing: 'Take with sip of water on morning of surgery.',
          critical: false,
        });
    }
  }

  return directives;
}

export function computeFastingCompliance(surgeryTimeIso: string, now: Date = new Date()): {
  hoursUntilSurgery: number;
  npoSolidsCompliant: boolean;
  npoLiquidsCompliant: boolean;
  solidsDeadline: string;
  liquidsDeadline: string;
  liquidsPreferredDeadline: string;
  recommendation: string;
} {
  const surgeryTime = new Date(surgeryTimeIso);
  const hoursUntilSurgery = Math.max(0, (surgeryTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  const solidsDeadline = new Date(surgeryTime.getTime() - 8 * 3600 * 1000);
  // Standard: 8h solids / 2h minimum clears (3h preferred)
  const liquidsDeadline = new Date(surgeryTime.getTime() - 2 * 3600 * 1000);
  const liquidsPreferredDeadline = new Date(surgeryTime.getTime() - 3 * 3600 * 1000);

  const npoSolidsCompliant = now >= solidsDeadline;
  const npoLiquidsCompliant = now >= liquidsDeadline;

  let recommendation = '';
  if (!npoSolidsCompliant) {
    const hoursRemaining = Math.max(0, (solidsDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    recommendation = `Patient must remain NPO for solids for ${hoursRemaining.toFixed(1)} more hours (8h solids / 2h minimum clears, 3h preferred).`;
  } else if (!npoLiquidsCompliant) {
    const hoursRemaining = Math.max(0, (liquidsDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    recommendation = `Clear-liquid minimum cutoff in ${hoursRemaining.toFixed(1)} hours (2h minimum, 3h preferred). Patient may still drink.`;
  } else if (now < liquidsPreferredDeadline) {
    recommendation = 'Past 2h minimum for clears; 3h preferred window still open — avoid further intake.';
  } else {
    recommendation = 'Patient is past all NPO cutoffs (8h solids / 2h minimum clears, 3h preferred). Ready for induction fasting protocol.';
  }

  return {
    hoursUntilSurgery,
    npoSolidsCompliant,
    npoLiquidsCompliant,
    solidsDeadline: solidsDeadline.toISOString(),
    liquidsDeadline: liquidsDeadline.toISOString(),
    liquidsPreferredDeadline: liquidsPreferredDeadline.toISOString(),
    recommendation,
  };
}

// -------------------------------------------------------------
// CONTRACEPTIVE & ESTROGEN VTE RISK EVALUATION
// -------------------------------------------------------------
export interface ContraceptiveEvaluationResult {
  vteRiskFlag: boolean;
  capriniPoints: number;
  estrogenExposure: boolean;
  recommendation: string;
  surgicalDirective: string;
}

export function evaluateContraceptiveRisk(
  type: ContraceptiveType,
  drugName?: string,
  isMajorSurgery = false,
  age = 35,
  bmi = 24
): ContraceptiveEvaluationResult {
  if (type === 'NONE' || type === 'IUD' || type === 'PROGESTIN_ONLY') {
    return {
      vteRiskFlag: false,
      capriniPoints: 0,
      estrogenExposure: false,
      recommendation: type === 'IUD'
        ? 'Levonorgestrel/Copper IUD does not increase systemic VTE risk. Safe to proceed without medication pause.'
        : type === 'PROGESTIN_ONLY'
        ? 'Progestin-only formulation does not significantly elevate thromboembolism risk. Continue uninterrupted.'
        : 'No hormonal contraceptive use reported.',
      surgicalDirective: 'Standard perioperative care. Routine ambulation post-procedure.',
    };
  }

  const estrogenExposure = type === 'COMBINED_ORAL_PILL' || type === 'PATCH_RING' || type === 'HRT';
  let capriniPoints = 1;
  if (age >= 41) capriniPoints += 1;
  if (bmi >= 30) capriniPoints += 1;
  if (isMajorSurgery) capriniPoints += 2;

  const vteRiskFlag = true;
  let recommendation = '';
  let surgicalDirective = '';

  if (isMajorSurgery) {
    recommendation = `High VTE Risk on Estrogen-containing therapy (${drugName || type}): ACOG & ASRA recommend stopping 4-6 weeks prior for prolonged immobilization. If proceeding on schedule, mandatory chemical thromboprophylaxis with LMWH (Enoxaparin 40mg SC) is indicated.`;
    surgicalDirective = 'Apply intraoperative bilateral Sequential Compression Devices (SCDs). Initiate LMWH 6-12h post-op once surgical hemostasis secured.';
  } else {
    recommendation = `Estrogen therapy (${drugName || type}) active: Moderate VTE risk for day-case / ambulatory surgery. Routine cessation is not required for brief procedures with rapid return to baseline mobility.`;
    surgicalDirective = 'Bilateral mechanical compression stockings/SCDs in OT. Encourage immediate post-op ambulation. Maintain adequate hydration.';
  }

  return {
    vteRiskFlag,
    capriniPoints,
    estrogenExposure,
    recommendation,
    surgicalDirective,
  };
}

// -------------------------------------------------------------
// PSYCHIATRIC & ANTIPSYCHOTIC MEDICATION SAFETY EVALUATION
// -------------------------------------------------------------
export interface AntipsychoticEvaluationResult {
  hasHighRiskInteractions: boolean;
  qtcProlongationRisk: boolean;
  hypotensionPressorAlert: boolean;
  sedationSynergyAlert: boolean;
  avoidDrugs: string[];
  recommendedPressors: string[];
  clinicalDirectives: string[];
}

export function evaluateAntipsychoticSafety(
  medications: PsychiatricMedication[]
): AntipsychoticEvaluationResult {
  if (!medications || medications.length === 0) {
    return {
      hasHighRiskInteractions: false,
      qtcProlongationRisk: false,
      hypotensionPressorAlert: false,
      sedationSynergyAlert: false,
      avoidDrugs: [],
      recommendedPressors: ['Ephedrine', 'Phenylephrine', 'Norepinephrine'],
      clinicalDirectives: ['No psychiatric or psychotropic drug interference detected.'],
    };
  }

  let qtcProlongationRisk = false;
  let hypotensionPressorAlert = false;
  let sedationSynergyAlert = false;
  const avoidDrugs: string[] = [];
  const clinicalDirectives: string[] = [];

  for (const med of medications) {
    const nameLower = med.name.toLowerCase();

    // Typical & Atypical Antipsychotics (Haloperidol, Quetiapine, Olanzapine, Risperidone, Clozapine, Chlorpromazine)
    if (
      med.category === 'TYPICAL_ANTIPSYCHOTIC' ||
      med.category === 'ATYPICAL_ANTIPSYCHOTIC' ||
      nameLower.includes('quetiapine') ||
      nameLower.includes('seroquel') ||
      nameLower.includes('haloperidol') ||
      nameLower.includes('haldol') ||
      nameLower.includes('olanzapine') ||
      nameLower.includes('zyprexa') ||
      nameLower.includes('risperidone') ||
      nameLower.includes('clozapine') ||
      nameLower.includes('aripiprazole') ||
      nameLower.includes('abilify')
    ) {
      qtcProlongationRisk = true;
      hypotensionPressorAlert = true;
      sedationSynergyAlert = true;

      if (!avoidDrugs.includes('Droperidol')) avoidDrugs.push('Droperidol');
      if (!avoidDrugs.includes('Metoclopramide (Reglan)')) avoidDrugs.push('Metoclopramide (Reglan)');
      if (!avoidDrugs.includes('High-dose Ondansetron')) avoidDrugs.push('High-dose Ondansetron (>8mg)');

      clinicalDirectives.push(
        `Antipsychotic Therapy (${med.name}): Alpha-1 blockade may blunt indirect vasopressor response (Ephedrine). Use direct alpha-agonist (Phenylephrine 50-100 mcg IV or Norepinephrine). Baseline 12-lead ECG mandatory to monitor QTc interval.`
      );
    }

    // MAO Inhibitors (Phenelzine, Tranylcypromine, Selegiline)
    if (
      med.category === 'MAOI' ||
      nameLower.includes('phenelzine') ||
      nameLower.includes('nardil') ||
      nameLower.includes('tranylcypromine') ||
      nameLower.includes('parnate') ||
      nameLower.includes('selegiline')
    ) {
      hypotensionPressorAlert = true;
      if (!avoidDrugs.includes('Ephedrine (Hypertensive Crisis)')) avoidDrugs.push('Ephedrine (Hypertensive Crisis)');
      if (!avoidDrugs.includes('Meperidine/Pethidine (Serotonin Syndrome)')) avoidDrugs.push('Meperidine/Pethidine (Serotonin Syndrome)');
      if (!avoidDrugs.includes('Tramadol')) avoidDrugs.push('Tramadol');

      clinicalDirectives.push(
        `MAO Inhibitor Alert (${med.name}): HARD CONTRAINDICATION with Ephedrine (can trigger lethal hyperadrenergic storm) and Meperidine/Tramadol (fatal serotonin syndrome). Titrate Phenylephrine or Norepinephrine in micro-doses (reduced by 50-75%).`
      );
    }

    // Lithium
    if (
      med.category === 'LITHIUM' ||
      nameLower.includes('lithium') ||
      nameLower.includes('priadel')
    ) {
      sedationSynergyAlert = true;
      clinicalDirectives.push(
        `Lithium Therapy: Potentiates both depolarizing (Succinycholine) and non-depolarizing neuromuscular blockers (Rocuronium, Vecuronium). Monitor train-of-four (TOF) neuromuscular transmission continuously. Ensure adequate perioperative hydration to prevent Lithium toxicity.`
      );
    }

    // SSRIs / SNRIs
    if (
      med.category === 'SSRI_SNRI' ||
      nameLower.includes('sertraline') ||
      nameLower.includes('escitalopram') ||
      nameLower.includes('fluoxetine') ||
      nameLower.includes('venlafaxine') ||
      nameLower.includes('duloxetine')
    ) {
      if (!avoidDrugs.includes('Methylene Blue')) avoidDrugs.push('Methylene Blue');
      clinicalDirectives.push(
        `Serotonergic Antidepressant (${med.name}): Risk of mild antiplatelet platelet dysfunction and serotonin syndrome with synthetic opioids (Meperidine, Tramadol, Fentanyl infusions) or Methylene Blue.`
      );
    }
  }

  const recommendedPressors = hypotensionPressorAlert
    ? ['Phenylephrine (Direct Alpha-1)', 'Norepinephrine (Direct)', 'Vasopressin']
    : ['Ephedrine', 'Phenylephrine', 'Norepinephrine'];

  return {
    hasHighRiskInteractions: qtcProlongationRisk || hypotensionPressorAlert || sedationSynergyAlert,
    qtcProlongationRisk,
    hypotensionPressorAlert,
    sedationSynergyAlert,
    avoidDrugs,
    recommendedPressors,
    clinicalDirectives,
  };
}

// -------------------------------------------------------------
// SMOKING & INHALATION SAFETY EVALUATION
// -------------------------------------------------------------
export interface SmokingEvaluationResult {
  riskTier: 'LOW' | 'MODERATE' | 'HIGH';
  airwayReactivityAlert: boolean;
  carboxyhemoglobinRisk: boolean;
  recommendations: string[];
  inductionEmergencePlan: string;
}

export function evaluateSmokingHistory(
  status: SmokingStatus,
  packYears = 0,
  usesVapeOrShisha = false,
  cessationMonths = 0
): SmokingEvaluationResult {
  if (status === 'NON_SMOKER' && !usesVapeOrShisha) {
    return {
      riskTier: 'LOW',
      airwayReactivityAlert: false,
      carboxyhemoglobinRisk: false,
      recommendations: ['Standard airway management. Non-reactive tracheobronchial tree anticipated.'],
      inductionEmergencePlan: 'Standard induction, LMA or ETT per surgical requirement, routine emergence.',
    };
  }

  if (status === 'EX_SMOKER' && cessationMonths >= 2) {
    return {
      riskTier: 'LOW',
      airwayReactivityAlert: false,
      carboxyhemoglobinRisk: false,
      recommendations: [
        `Former smoker (quit ${cessationMonths} months ago, ${packYears} pack-years). Ciliary function and post-op pulmonary complication risk normalized.`,
      ],
      inductionEmergencePlan: 'Standard induction and emergence.',
    };
  }

  const isHighPackYears = packYears >= 20;
  const riskTier = isHighPackYears || (status === 'ACTIVE_SMOKER' && usesVapeOrShisha) ? 'HIGH' : 'MODERATE';

  return {
    riskTier,
    airwayReactivityAlert: true,
    carboxyhemoglobinRisk: true,
    recommendations: [
      `Active inhalation history (${status === 'ACTIVE_SMOKER' ? `${packYears} pack-years` : ''}${usesVapeOrShisha ? ' + Vape/Shisha' : ''}): Airway hyperreactivity and elevated carboxyhemoglobin (COHb half-life 4-6 hours on room air).`,
      'Advise pre-operative bronchodilator therapy (Salbutamol 2.5mg nebulization 30 mins pre-induction).',
      'Increased risk of intraoperative bronchospasm and post-extubation laryngospasm.',
    ],
    inductionEmergencePlan: 'Pre-oxygenate with 100% FiO2 for 3-5 minutes. Administer IV Lidocaine (1.5 mg/kg) 90s prior to intubation and extubation to blunt airway reflexes. Consider deep extubation if airway is not difficult and patient is not aspiration risk.',
  };
}

// -------------------------------------------------------------
// CARDIAC & CARDIOVASCULAR SAFETY EVALUATION
// -------------------------------------------------------------
export interface CardiacEvaluationResult {
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  rcriScore: number;
  antiplateletHoldConstraint: string;
  heartFailureAlert: boolean;
  pacemakerAlert: boolean;
  cardiologyConsultRequired: boolean;
  recommendations: string[];
}

export function evaluateCardiacSafety(
  conditions: CardiacCondition[],
  stentMonthsAgo?: number,
  stentType?: 'DES' | 'BMS',
  ejectionFraction?: number,
  mets = 4,
  isClearedByCardiology = false
): CardiacEvaluationResult {
  if (!conditions || conditions.length === 0) {
    return {
      riskTier: 'LOW',
      rcriScore: 0,
      antiplateletHoldConstraint: 'None. No prior coronary interventions.',
      heartFailureAlert: false,
      pacemakerAlert: false,
      cardiologyConsultRequired: false,
      recommendations: ['No documented cardiovascular contraindications. Functional capacity adequate.'],
    };
  }

  let rcriScore = 0;
  let riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let heartFailureAlert = false;
  let pacemakerAlert = false;
  let cardiologyConsultRequired = false;
  let antiplateletHoldConstraint = 'None';
  const recommendations: string[] = [];

  // Previous MI / Ischemic Heart Disease
  if (conditions.includes('MYOCARDIAL_INFARCTION') || conditions.includes('ANGINA')) {
    rcriScore += 1;
    recommendations.push('History of ischemic heart disease: Maintain MAP > 65 mmHg, avoid severe tachycardia (target HR 60-80 bpm), ensure 12-lead ECG on file.');
  }

  // Coronary Stents (DES vs BMS)
  if (conditions.includes('CORONARY_STENT_DES')) {
    if (stentMonthsAgo !== undefined && stentMonthsAgo < 6) {
      riskTier = 'CRITICAL';
      cardiologyConsultRequired = true;
      antiplateletHoldConstraint = `DRUG-ELUTING STENT PLACED ${stentMonthsAgo} MONTHS AGO (<6 MONTHS): HARD STOP for elective surgery due to catastrophic stent thrombosis risk. Dual Antiplatelet Therapy (DAPT) must NOT be interrupted without interventional cardiology sign-off.`;
      recommendations.push(antiplateletHoldConstraint);
    } else if (stentMonthsAgo !== undefined && stentMonthsAgo < 12) {
      riskTier = 'HIGH';
      antiplateletHoldConstraint = `DES Stent placed ${stentMonthsAgo} months ago (6-12 month window): Continue Aspirin 81-100mg uninterrupted; P2Y12 inhibitor hold requires cardiology concurrence.`;
      recommendations.push(antiplateletHoldConstraint);
    } else {
      antiplateletHoldConstraint = 'DES Stent > 12 months: Aspirin may be continued perioperatively per bleeding vs thrombosis risk assessment.';
      recommendations.push(antiplateletHoldConstraint);
    }
  }

  if (conditions.includes('CORONARY_STENT_BMS')) {
    if (stentMonthsAgo !== undefined && stentMonthsAgo < 1) {
      riskTier = 'CRITICAL';
      cardiologyConsultRequired = true;
      antiplateletHoldConstraint = `BARE-METAL STENT PLACED ${stentMonthsAgo} MONTHS AGO (<1 MONTH): HARD STOP for elective surgery. DAPT continuation mandatory.`;
      recommendations.push(antiplateletHoldConstraint);
    }
  }

  // Heart Failure / Reduced EF
  if (conditions.includes('HEART_FAILURE') || (ejectionFraction !== undefined && ejectionFraction < 40)) {
    rcriScore += 1;
    heartFailureAlert = true;
    riskTier = riskTier === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
    recommendations.push(
      `Heart Failure / Reduced Ejection Fraction (${ejectionFraction ? `${ejectionFraction}%` : '<40%'}): High risk of perioperative acute pulmonary edema. Strictly avoid rapid fluid boluses. Use calibrated stroke volume variation / arterial line monitoring. Titrate inotropes as needed.`
    );
  }

  // Pacemaker / AICD
  if (conditions.includes('PACEMAKER_ICD')) {
    pacemakerAlert = true;
    recommendations.push(
      'Permanent Pacemaker / AICD in situ: Obtain device interrogation within 6 months. Place magnet over ICD to disable tachyarrhythmia therapy during electrosurgery (use bipolar or place return pad >15cm from pulse generator).'
    );
  }

  // Atrial Fibrillation / Arrhythmias
  if (conditions.includes('ARRHYTHMIA_AFIB')) {
    recommendations.push('Atrial Fibrillation: Check pre-op ventricular rate and electrolytes (K+ >= 4.0, Mg2+ >= 2.0). Verify DOAC hold timing per ASRA guidelines.');
  }

  // Functional Capacity
  if (mets < 4) {
    recommendations.push('Poor functional capacity (<4 METs - cannot climb 2 flights of stairs): Elevated risk of post-op major adverse cardiac events (MACE).');
    if (rcriScore >= 2 && !isClearedByCardiology) {
      cardiologyConsultRequired = true;
    }
  }

  if (riskTier !== 'CRITICAL') {
    if (rcriScore >= 3) riskTier = 'HIGH';
    else if (rcriScore >= 1) riskTier = 'MODERATE';
    else riskTier = 'LOW';
  }

  return {
    riskTier,
    rcriScore,
    antiplateletHoldConstraint,
    heartFailureAlert,
    pacemakerAlert,
    cardiologyConsultRequired,
    recommendations,
  };
}

// -------------------------------------------------------------
// MEDICAL ISSUES CHECKLIST + PREVIOUS SURGERY EVALUATION
// -------------------------------------------------------------
export const MEDICAL_ISSUES_META: Record<MedicalIssueKey, { label: string; hint: string }> = {
  COMMON_COLD: { label: 'Common cold', hint: 'Runny nose / sore throat within 2 weeks' },
  COUGH: { label: 'Cough', hint: 'Persistent / productive cough' },
  FEVER: { label: 'Fever', hint: '≥38°C in last 2 weeks' },
  ASTHMA: { label: 'Asthma', hint: 'Wheeze / inhaler use' },
  RESPIRATORY_INFECTION: { label: 'Respiratory infection', hint: 'Bronchitis / pneumonia / URTI' },
  DIABETES: { label: 'Diabetes', hint: 'Type 1 / 2 / gestational' },
  HYPERTENSION: { label: 'Hypertension', hint: 'High blood pressure' },
  HEART_ISSUES: { label: 'Heart issues', hint: 'Chest pain / MI / failure / murmur' },
  LIVER_PROBLEM: { label: 'Liver problem', hint: 'Jaundice / hepatitis / cirrhosis' },
  KIDNEY_ISSUES: { label: 'Kidney issues', hint: 'CKD / dialysis / stones' },
};

export interface MedicalIssuesEvaluation {
  hasActiveInfection: boolean;
  hasChronicDisease: boolean;
  directives: string[];
}

export function evaluateMedicalIssues(issues: MedicalIssueKey[] = []): MedicalIssuesEvaluation {
  const directives: string[] = [];
  const hasActiveInfection =
    issues.includes('FEVER') ||
    issues.includes('RESPIRATORY_INFECTION') ||
    (issues.includes('COMMON_COLD') && issues.includes('COUGH'));

  if (issues.includes('FEVER')) {
    directives.push('Fever within 2 weeks: rule out active infection. Check temperature, WBC/CRP; postpone elective surgery if febrile ≥38°C on the day.');
  }
  if (issues.includes('RESPIRATORY_INFECTION')) {
    directives.push('Respiratory infection: postpone elective cases 2–4 weeks after resolution. Assess airway reactivity, SpO2, chest auscultation; consider CXR if productive cough.');
  }
  if (issues.includes('COMMON_COLD') || issues.includes('COUGH')) {
    directives.push('Cold / cough: screen for URTI within 2 weeks — if purulent sputum, wheeze or fever, delay elective case; otherwise use airway hyperreactivity protocol (IV Lidocaine, deep extubation).');
  }
  if (issues.includes('ASTHMA')) {
    directives.push('Asthma: confirm control (night symptoms, reliever use), bring inhaler to OT, consider pre-op salbutamol neb + avoid histamine-releasing drugs (morphine/atracurium).');
  }
  if (issues.includes('DIABETES')) {
    directives.push('Diabetes: check fasting glucose + HbA1c. Do NOT take diabetes medicine on day of surgery; hold SGLT2i 3–4 days before. Plan perioperative glucose 140–180 mg/dL and DKA screen if >250 mg/dL.');
  }
  if (issues.includes('HYPERTENSION')) {
    directives.push('Hypertension: recheck BP on arrival; if SBP ≥180 or DBP ≥110 postpone elective case per ACC/AHA. Continue beta-blockers, hold ACE-I/ARB morning of surgery.');
  }
  if (issues.includes('HEART_ISSUES')) {
    directives.push('Heart issues flagged: complete cardiac block (ECG, METs, stents, EF) before clearance; cardiology consult if unstable angina, decompensated failure or murmur with syncope.');
  }
  if (issues.includes('LIVER_PROBLEM')) {
    directives.push('Liver problem: check INR, bilirubin, albumin, platelets; adjust hepatically-cleared drugs, avoid paracetamol overload, anticipate coagulopathy + prolonged drug effect.');
  }
  if (issues.includes('KIDNEY_ISSUES')) {
    directives.push('Kidney issues: check creatinine/eGFR, K+, fluid status; avoid NSAIDs/contrast, dose-adjust renally-cleared drugs, plan dialysis timing if applicable.');
  }

  const chronic = issues.some((i) =>
    ['ASTHMA', 'DIABETES', 'HYPERTENSION', 'HEART_ISSUES', 'LIVER_PROBLEM', 'KIDNEY_ISSUES'].includes(i)
  );
  return { hasActiveInfection, hasChronicDisease: chronic, directives };
}

export const FAMILY_ANESTHESIA_META: Record<FamilyAnesthesiaIssueKey, { label: string; hint: string }> = {
  MH_FAMILY: { label: 'Malignant hyperthermia in family', hint: 'Rigid muscles / high fever under anesthesia' },
  DIFFICULT_INTUBATION_FAMILY: { label: 'Difficult intubation in family', hint: 'Tube placement was difficult' },
  PROLONGED_RECOVERY_FAMILY: { label: 'Prolonged recovery in family', hint: 'Very slow to wake up' },
  ANESTHESIA_ALLERGY_FAMILY: { label: 'Anesthesia allergy in family', hint: 'Rash / breathing trouble with anesthesia' },
  SEVERE_PONV_FAMILY: { label: 'Severe vomiting after anesthesia', hint: 'Family PONV history' },
  UNEXPLAINED_DEATH_ANESTHESIA_FAMILY: { label: 'Unexplained death under anesthesia', hint: 'Requires workup' },
};

export interface FamilyG6pdEvaluation {
  directives: string[];
  isHardStop: boolean;
}

export function evaluateFamilyAndG6pd(
  familyIssues: FamilyAnesthesiaIssueKey[] = [],
  hasG6pd: boolean = false
): FamilyG6pdEvaluation {
  const directives: string[] = [];
  let isHardStop = false;

  if (familyIssues.includes('MH_FAMILY')) {
    isHardStop = true;
    directives.push('FAMILY MH: treat as MH-susceptible. Absolute contraindication to volatiles + Succinylcholine. TIVA + Dantrolene standby, refer for RYR1/CACNA1S workup.');
  }
  if (familyIssues.includes('UNEXPLAINED_DEATH_ANESTHESIA_FAMILY')) {
    isHardStop = true;
    directives.push('Unexplained anesthesia death in family: postpone elective case pending anesthesia-genetics review (MH / pseudocholinesterase / cardiac channelopathy).');
  }
  if (familyIssues.includes('DIFFICULT_INTUBATION_FAMILY')) {
    directives.push('Difficult intubation in family: prepare difficult-airway trolley (videolaryngoscope, bougie, LMA), document Mallampati/mouth opening, consent for awake technique if indicated.');
  }
  if (familyIssues.includes('PROLONGED_RECOVERY_FAMILY')) {
    directives.push('Prolonged recovery in family: screen for pseudocholinesterase deficiency / myasthenia; use TOF monitoring, avoid long-acting relaxants, plan extended PACU observation.');
  }
  if (familyIssues.includes('ANESTHESIA_ALLERGY_FAMILY')) {
    directives.push('Anesthesia allergy in family: allergy workup (latex, NMBs, antibiotics); have latex-free setup, avoid known triggers, keep epinephrine + tryptase protocol ready.');
  }
  if (familyIssues.includes('SEVERE_PONV_FAMILY')) {
    directives.push('Severe PONV in family: high PONV risk — multimodal prophylaxis (ondansetron + dexamethasone + droperidol-free plan if QTc risk), TIVA preferred, avoid volatiles/nitrous.');
  }
  if (hasG6pd) {
    directives.push('G6PD deficiency: AVOID oxidative triggers — methylene blue, rasburicase, dapsone, primaquine, nitrofurantoin, nalidixic acid. Check Hb/bilirubin/retics, watch for hemolysis with fava beans + infections; safe: propofol, opioids, volatiles, NMBs in normal doses.');
  }
  return { directives, isHardStop };
}

export const DENTAL_META: Record<DentalIssueKey, { label: string; hint: string }> = {
  DENTURES: { label: 'Artificial teeth / dentures', hint: 'Removable plates' },
  VENEERS: { label: 'Veneers', hint: 'Front-tooth laminates' },
  BRACES: { label: 'Braces / aligners', hint: 'Wires, brackets, retainers' },
  LOOSE_TOOTH: { label: 'Loose tooth', hint: 'Wobbly / at risk of falling out' },
  CAPS_CROWNS: { label: 'Caps / crowns', hint: 'Ceramic or metal caps' },
};

export interface DentalEvaluation {
  directives: string[];
  hasAirwayRisk: boolean;
}

export function evaluateDentalIssues(issues: DentalIssueKey[] = []): DentalEvaluation {
  const directives: string[] = [];
  if (issues.includes('DENTURES')) {
    directives.push('Dentures / artificial teeth: remove before induction, label and store safely; edentulous mask seal may need two-hand technique + oral airway.');
  }
  if (issues.includes('LOOSE_TOOTH')) {
    directives.push('Loose tooth: document position + mobility, warn of aspiration/dislodgement risk, use gentle laryngoscopy + tooth guard, count teeth pre/post intubation.');
  }
  if (issues.includes('BRACES')) {
    directives.push('Braces / wires: risk of lip/gum laceration + difficult mask seal; pad with gauze, remove removable aligners/retainers, use smaller mask + careful suction.');
  }
  if (issues.includes('VENEERS')) {
    directives.push('Veneers: high chipping risk — document pre-op condition with photo, avoid levering laryngoscope on incisors, consider videolaryngoscopy.');
  }
  if (issues.includes('CAPS_CROWNS')) {
    directives.push('Caps / crowns: document, avoid pressure on front teeth during intubation; have consent note for accidental dislodgement.');
  }
  return { directives, hasAirwayRisk: directives.length > 0 };
}

export interface AirwayScreenEvaluation {
  directives: string[];
  isHighRisk: boolean;
}

export function evaluateAirwayScreen(
  neck?: string,
  mouth?: string,
  difficultAirwayHistory: boolean = false
): AirwayScreenEvaluation {
  const directives: string[] = [];
  const stiffNeck = neck === 'STIFF' || neck === 'VERY_LIMITED' || neck === 'FUSION';
  const limitedMouth = mouth === 'LIMITED_2FINGERS' || mouth === 'VERY_LIMITED_1FINGER';
  if (neck === 'FUSION') {
    directives.push('Neck fusion / fixed neck: high risk of impossible direct laryngoscopy. Plan awake fiberoptic/videolaryngoscopy with ENT backup; avoid neck extension.');
  } else if (neck === 'VERY_LIMITED') {
    directives.push('Very limited neck movement: anticipate difficult laryngoscopy. Prepare videolaryngoscope + bougie + LMA, keep neutral positioning.');
  } else if (neck === 'STIFF') {
    directives.push('Stiff neck reported: assess atlanto-occipital extension on arrival; have difficult-airway trolley ready.');
  }
  if (mouth === 'VERY_LIMITED_1FINGER') {
    directives.push('Mouth opens ~1 finger only: severe trismus risk. Awake fiberoptic technique likely; do not attempt blind direct laryngoscopy.');
  } else if (mouth === 'LIMITED_2FINGERS') {
    directives.push('Mouth opens ~2 fingers: limited inter-incisor distance. Use slim blade / videolaryngoscopy, remove dentures/aligners, pad braces.');
  }
  if (difficultAirwayHistory) {
    directives.push('Prior difficult airway reported: pull old anesthesia records, consent for awake technique, ensure two skilled operators + surgical airway kit in room.');
  }
  return { directives, isHighRisk: stiffNeck || limitedMouth || difficultAirwayHistory };
}

export const DRUG_ALLERGY_META: Record<DrugAllergyKey, { label: string; hint: string }> = {
  PENICILLIN: { label: 'Penicillin / amoxicillin', hint: 'Rash, swelling, anaphylaxis' },
  SULFA: { label: 'Sulfa drugs', hint: 'Bactrim, sulfonamides' },
  NSAID: { label: 'NSAIDs / aspirin', hint: 'Ibuprofen, diclofenac' },
  OPIOID: { label: 'Opioids / morphine', hint: 'Itching, breathing trouble' },
  LATEX: { label: 'Latex', hint: 'Gloves, catheters' },
  CONTRAST: { label: 'Contrast dye', hint: 'CT/MRI dye reaction' },
  NMB_ANESTHESIA: { label: 'Anesthesia muscle relaxants', hint: 'Rocuronium, suxamethonium' },
  OTHER: { label: 'Other medication', hint: 'Describe below' },
};

export interface DrugAllergyEvaluation {
  directives: string[];
  hasAnaphylaxisRisk: boolean;
}

export function evaluateDrugAllergy(
  hasAllergy: boolean = false,
  keys: DrugAllergyKey[] = [],
  details: string = ''
): DrugAllergyEvaluation {
  const directives: string[] = [];
  if (!hasAllergy && keys.length === 0 && !details.trim()) {
    return { directives, hasAnaphylaxisRisk: false };
  }
  if (keys.includes('PENICILLIN')) {
    directives.push('Penicillin allergy: use second-line prophylaxis (clindamycin/vancomycin per protocol); consider formal delabeling workup post-op if reaction was only remote rash/nausea.');
  }
  if (keys.includes('SULFA')) {
    directives.push('Sulfa allergy: avoid co-trimoxazole, furosemide cross-check; keep antihistamine + steroid rescue available.');
  }
  if (keys.includes('NSAID')) {
    directives.push('NSAID/aspirin allergy: avoid all NSAIDs + COX-2 cross-reactors; plan paracetamol/opioid-sparing multimodal analgesia; screen for asthma triad.');
  }
  if (keys.includes('OPIOID')) {
    directives.push('Opioid allergy/intolerance: distinguish true allergy vs nausea/itching; plan regional anesthesia + non-opioid analgesia, keep naloxone + antihistamine ready.');
  }
  if (keys.includes('LATEX')) {
    directives.push('Latex allergy: latex-free OT setup (gloves, catheters, drapes), schedule first case of day, keep epinephrine + tryptase protocol ready.');
  }
  if (keys.includes('CONTRAST')) {
    directives.push('Contrast allergy: premedicate per protocol if contrast needed; keep resuscitation drugs ready; prefer non-contrast imaging.');
  }
  if (keys.includes('NMB_ANESTHESIA')) {
    directives.push('Prior relaxant/anesthesia allergy: high-risk anaphylaxis case — allergy workup, avoid implicated NMB, have sugammadex + epinephrine infusion ready, consider TIVA + regional.');
  }
  if (details.trim()) {
    directives.push(`Patient-reported detail: ${details.trim().slice(0, 200)} — verify reaction type (rash vs breathing trouble vs anaphylaxis) on arrival.`);
  }
  if (keys.length > 0 && directives.length === 0) {
    directives.push('Drug allergy reported: confirm culprit drug, reaction and severity on arrival; band chart + keep anaphylaxis kit in room.');
  }
  const anaphylaxis = keys.includes('NMB_ANESTHESIA') || keys.includes('LATEX') || /anaphyla|breath|swell|throat/i.test(details);
  return { directives, hasAnaphylaxisRisk: anaphylaxis };
}

export const CURRENT_MED_PRESETS: { name: string; category: CurrentMedication['category']; hint: string }[] = [
  { name: 'Amlodipine', category: 'BP', hint: 'CCB — usually continue' },
  { name: 'Losartan / Telmisartan', category: 'BP', hint: 'ARB — hold morning of surgery' },
  { name: 'Metoprolol / Atenolol', category: 'BP', hint: 'Beta-blocker — continue, never stop abruptly' },
  { name: 'Metformin', category: 'DIABETES', hint: 'Do NOT take on day of surgery' },
  { name: 'Insulin (basal/bolus)', category: 'DIABETES', hint: 'Do NOT take on day of surgery' },
  { name: 'Dapagliflozin / Empagliflozin', category: 'DIABETES', hint: 'Do NOT take on day of surgery (hold 3–4 days)' },
  { name: 'Levothyroxine (Thyroxine)', category: 'THYROID', hint: 'TAKE on day of surgery with sip of water' },
  { name: 'Carbimazole', category: 'THYROID', hint: 'TAKE on day of surgery with sip of water' },
  { name: 'Sertraline / Escitalopram', category: 'ANXIETY', hint: 'SSRI — usually continue' },
  { name: 'Alprazolam / Clonazepam', category: 'ANXIETY', hint: 'Benzodiazepine — do not stop abruptly' },
  { name: 'Contraceptive pill (OCP)', category: 'CONTRACEPTIVE', hint: 'See VTE section' },
  { name: 'Mounjaro (Tirzepatide)', category: 'WEIGHT_LOSS', hint: 'GLP-1 — hold 1 week (168h)' },
  { name: 'Wegovy / Ozempic (Semaglutide)', category: 'WEIGHT_LOSS', hint: 'GLP-1 — hold 1 week (168h)' },
];

export interface CurrentMedsEvaluation {
  directives: string[];
}

export function evaluateCurrentMeds(meds: CurrentMedication[] = []): CurrentMedsEvaluation {
  const directives: string[] = [];
  const has = (cat: CurrentMedication['category']) => meds.some((m) => m.category === cat);
  const names = (cat: CurrentMedication['category']) => meds.filter((m) => m.category === cat).map((m) => m.name).join(', ');
  if (has('BP')) {
    directives.push(`BP medicines (${names('BP')}): CONTINUE beta-blockers + calcium-channel blockers; HOLD ACE-I/ARB + diuretics on morning of surgery; recheck BP on arrival (postpone elective if ≥180/110).`);
  }
  if (has('DIABETES')) {
    directives.push(`Diabetes medicines (${names('DIABETES')}): do NOT take on day of surgery — hold all diabetes tablets + insulin on the morning of surgery. Anesthesia team will manage glucose (target 140–180 mg/dL). SGLT2i hold 3–4 days before.`);
  }
  if (has('THYROID')) {
    directives.push(`Thyroid medicines (${names('THYROID')}): TAKE on day of surgery with a sip of water. If hyperthyroid/carbimazole confirm euthyroid (HR, tremor) to avoid thyroid storm.`);
  }
  if (has('ANXIETY')) {
    directives.push(`Anxiety medicines (${names('ANXIETY')}): CONTINUE SSRI/SNRI; DO NOT stop benzodiazepines abruptly (withdrawal/seizure) — continue + monitor sedation synergy with anesthetics.`);
  }
  if (has('CONTRACEPTIVE')) {
    directives.push(`Contraceptive pill reported in meds (${names('CONTRACEPTIVE')}): cross-check HRT/VTE section for Caprini points + SCD plan.`);
  }
  if (has('WEIGHT_LOSS')) {
    directives.push(`Weight-loss GLP-1 (${names('WEIGHT_LOSS')}): HOLD weekly dose ≥168h before surgery (aspiration risk); if taken within a week → gastric POCUS + RSI plan.`);
  }
  const others = meds.filter((m) => m.category === 'OTHER');
  if (others.length > 0) {
    directives.push(`Other medicines (${others.map((m) => m.name).join(', ')}): pharmacist review for perioperative holds + interactions.`);
  }
  return { directives };
}

export interface FitnessSuggestion {
  specialty: string;
  reason: string;
}

export function suggestFitnessReferrals(data: Partial<PatientPreOpQuestionnaire>): FitnessSuggestion[] {
  const out: FitnessSuggestion[] = [];
  const push = (specialty: string, reason: string) => {
    if (!out.some((s) => s.specialty === specialty)) out.push({ specialty, reason });
  };
  const issues = data.medicalIssues || [];
  const meds = data.currentMedications || [];
  const hasMed = (cat: string) => meds.some((m) => m.category === cat);
  if (
    issues.includes('HEART_ISSUES') ||
    data.hasCardiacHistory ||
    (data.cardiacConditions || []).length > 0 ||
    issues.includes('HYPERTENSION') ||
    hasMed('BP')
  ) {
    push('Cardiology', 'heart disease / hypertension / BP medicines need fitness for anesthesia');
  }
  if (issues.includes('KIDNEY_ISSUES')) push('Nephrology', 'kidney issues need fitness + drug-dose plan');
  if (issues.includes('LIVER_PROBLEM')) push('Gastroenterology (Liver)', 'liver problem needs fitness + coagulation review');
  if (issues.includes('DIABETES') || data.hasDiabetes || hasMed('DIABETES')) {
    push('Endocrinology', 'diabetes needs fitness + day-of-surgery glucose plan');
  }
  if (hasMed('THYROID')) push('Endocrinology', 'thyroid disease needs fitness (euthyroid confirmation)');
  if (issues.includes('ASTHMA') || issues.includes('RESPIRATORY_INFECTION') || data.hasAsthmaCopd) {
    push('Pulmonology', 'asthma / breathing infection needs fitness + airway plan');
  }
  if (data.hasG6pd) push('Hematology', 'G6PD deficiency needs fitness + trigger-drug avoidance list');
  return out;
}

export interface FitnessEvaluation {
  suggested: FitnessSuggestion[];
  pendingSpecialties: string[];
  blockedSpecialties: string[];
  directives: string[];
  isBlocked: boolean;
}

export function evaluateFitnessReferrals(
  data: Partial<PatientPreOpQuestionnaire>,
  existingReferrals: import('./types').SpecialistReferral[] = []
): FitnessEvaluation {
  const suggested = suggestFitnessReferrals(data);
  const pendingSpecialties: string[] = [];
  const blockedSpecialties: string[] = [];
  const directives: string[] = [];
  for (const s of suggested) {
    const ref = existingReferrals.find((r) => r.specialty === s.specialty);
    if (!ref) {
      pendingSpecialties.push(s.specialty);
      directives.push(`Fitness REQUIRED from patient's ${s.specialty} doctor (${s.reason}). Request consultation — surgery stays on hold until fitness is marked Cleared.`);
    } else if (ref.status === 'REQUESTED' || ref.status === 'RECEIVED') {
      pendingSpecialties.push(s.specialty);
      directives.push(`Fitness PENDING from ${s.specialty} (requested ${ref.requestedAtIso.slice(0, 10)}). Do not clear for OT until marked Cleared.`);
    } else if (ref.status === 'NOT_CLEARED') {
      blockedSpecialties.push(s.specialty);
      directives.push(`NOT CLEARED by ${s.specialty}${ref.notes ? ` — ${ref.notes}` : ''}. Postpone elective surgery; follow specialist plan.`);
    }
  }
  return { suggested, pendingSpecialties, blockedSpecialties, directives, isBlocked: pendingSpecialties.length > 0 || blockedSpecialties.length > 0 };
}

// -------------------------------------------------------------
// FULL PRE-OPERATIVE MEDICAL QUESTIONNAIRE EVALUATION
// -------------------------------------------------------------
export interface QuestionnaireEvaluationReport {
  overallClearance: ClearanceStatus;
  primaryActionDirective: string;
  hardStopFlags: string[];
  conditionalFlags: string[];
  greenClearancePoints: string[];
  contraceptiveResult: ContraceptiveEvaluationResult;
  antipsychoticResult: AntipsychoticEvaluationResult;
  smokingResult: SmokingEvaluationResult;
  cardiacResult: CardiacEvaluationResult;
  medicalResult: MedicalIssuesEvaluation;
  familyG6pdResult: FamilyG6pdEvaluation;
  dentalResult: DentalEvaluation;
  airwayScreenResult: AirwayScreenEvaluation;
  drugAllergyResult: DrugAllergyEvaluation;
  currentMedsResult: CurrentMedsEvaluation;
  fitnessResult: FitnessEvaluation;
  npoFastingCompliant: boolean;
  mhRiskFlag: boolean;
}

export function evaluateQuestionnaireFull(
  data: Partial<PatientPreOpQuestionnaire>,
  existingReferrals: import('./types').SpecialistReferral[] = []
): QuestionnaireEvaluationReport {
  const hardStopFlags: string[] = [];
  const conditionalFlags: string[] = [];
  const greenClearancePoints: string[] = [];

  // 0. Medical issues checklist + previous surgery
  const medicalResult = evaluateMedicalIssues(data.medicalIssues || []);  if (medicalResult.hasActiveInfection) {
    hardStopFlags.push(
      `ACTIVE INFECTION RISK: ${medicalResult.directives[0]} Postpone elective surgery until afebrile and respiratory symptoms resolved.`
    );
    for (const dir of medicalResult.directives.slice(1)) {
      conditionalFlags.push(`Medical history: ${dir}`);
    }
  } else if (medicalResult.directives.length > 0) {
    for (const dir of medicalResult.directives) {
      conditionalFlags.push(`Medical history: ${dir}`);
    }
  } else {
    greenClearancePoints.push('Medical issues checklist: No active complaints reported');
  }

  if (data.hadPreviousSurgery) {
    const prior = data.previousSurgeries || [];
    const withComplications = prior.filter((s) => s.complications && s.complications.trim().length > 0);
    if (withComplications.length > 0) {
      conditionalFlags.push(
        `Previous surgery with complications: ${withComplications.map((s) => `${s.procedure}${s.year ? ` (${s.year})` : ''} — ${s.complications}`).join('; ')}. Review anesthesia records for difficult airway, PONV, MH or allergy signals.`
      );
    } else if (prior.length > 0) {
      greenClearancePoints.push(
        `Previous surgery history reviewed: ${prior.map((s) => `${s.procedure}${s.year ? ` (${s.year})` : ''}`).join('; ')} — no complications reported`
      );
    } else {
      conditionalFlags.push('Previous surgery reported but details missing: confirm procedure, year, anesthesia type and any complications before induction.');
    }
  }

  // 0b. Family anesthesia issues + G6PD
  const familyG6pdResult = evaluateFamilyAndG6pd(data.familyAnesthesiaIssues || [], !!data.hasG6pd);
  if (familyG6pdResult.isHardStop) {
    for (const dir of familyG6pdResult.directives) {
      hardStopFlags.push(dir);
    }
  } else if (familyG6pdResult.directives.length > 0) {
    for (const dir of familyG6pdResult.directives) {
      conditionalFlags.push(dir);
    }
  } else if (!data.hasG6pd && (data.familyAnesthesiaIssues || []).length === 0) {
    greenClearancePoints.push('Family anesthesia + G6PD screen: No issues reported');
  }
  if (data.hasG6pd && !familyG6pdResult.isHardStop) {
    // G6PD directives already added as conditional above; add drug-avoidance reminder
    conditionalFlags.push(`G6PD note: ${data.g6pdDetails || 'Known G6PD deficiency'} — flag chart, counsel on fava beans/infection triggers.`);
  }

  // 0c. Dental / teeth airway risk
  const dentalResult = evaluateDentalIssues(data.dentalIssues || []);
  if (dentalResult.hasAirwayRisk) {
    for (const dir of dentalResult.directives) {
      conditionalFlags.push(`Dental / airway: ${dir}`);
    }
  } else {
    greenClearancePoints.push('Dental / teeth: No loose teeth, dentures or braces reported');
  }

  // 0d. Airway screen (neck + mouth opening)
  const airwayScreenResult = evaluateAirwayScreen(data.neckMovement, data.mouthOpening, !!data.difficultAirwayHistory);
  if (airwayScreenResult.isHighRisk) {
    for (const dir of airwayScreenResult.directives) {
      conditionalFlags.push(`Airway screen: ${dir}`);
    }
  } else {
    greenClearancePoints.push('Neck movement + mouth opening: No airway red flags reported');
  }

  // 0e. Drug allergies
  const drugAllergyResult = evaluateDrugAllergy(!!data.hasDrugAllergy, data.drugAllergyKeys || [], data.drugAllergyDetails || data.allergiesList?.join(', ') || '');
  if (drugAllergyResult.directives.length > 0) {
    for (const dir of drugAllergyResult.directives) {
      conditionalFlags.push(`Allergy: ${dir}`);
    }
    if (drugAllergyResult.hasAnaphylaxisRisk) {
      hardStopFlags.push('ANAPHYLAXIS RISK: History suggests possible anaphylaxis (breathing trouble / swelling / throat closure). Confirm trigger, keep epinephrine + airway rescue ready; do not induce until allergy plan is documented.');
    }
  } else {
    greenClearancePoints.push('Drug allergies: None reported');
  }

  // 0f. Current daily medications
  const currentMedsResult = evaluateCurrentMeds(data.currentMedications || []);
  if (currentMedsResult.directives.length > 0) {
    for (const dir of currentMedsResult.directives) {
      conditionalFlags.push(`Current medication: ${dir}`);
    }
  } else {
    greenClearancePoints.push('Current medications: None reported');
  }

  // 0g. Specialist fitness for major illness — HARD STOP until cleared
  const fitnessResult = evaluateFitnessReferrals(data, existingReferrals);
  if (fitnessResult.suggested.length === 0) {
    greenClearancePoints.push('Specialist fitness: No major illness needing outside consultation');
  } else {
    for (const dir of fitnessResult.directives) {
      hardStopFlags.push(`FITNESS HOLD: ${dir}`);
    }
    const cleared = fitnessResult.suggested.filter(
      (s) => existingReferrals.some((r) => r.specialty === s.specialty && r.status === 'CLEARED')
    );
    for (const s of cleared) {
      greenClearancePoints.push(`Fitness cleared by ${s.specialty}`);
    }
  }

  // 1. Contraceptives
  const contraceptiveResult = evaluateContraceptiveRisk(
    data.contraceptiveType || 'NONE',
    data.contraceptiveDrugName,
    false
  );
  if (contraceptiveResult.vteRiskFlag) {
    conditionalFlags.push(`Estrogen / Contraceptive Alert: ${contraceptiveResult.recommendation}`);
  } else {
    greenClearancePoints.push('Hormonal / Contraceptive VTE risk: Cleared');
  }

  // 2. Antipsychotics
  const antipsychoticResult = evaluateAntipsychoticSafety(data.psychiatricMeds || []);
  if (antipsychoticResult.hasHighRiskInteractions) {
    for (const dir of antipsychoticResult.clinicalDirectives) {
      conditionalFlags.push(dir);
    }
  } else {
    greenClearancePoints.push('Psychotropic & Antipsychotic safety: Cleared');
  }

  // 3. Smoking
  const smokingResult = evaluateSmokingHistory(
    data.smokingStatus || 'NON_SMOKER',
    data.packYears || 0,
    data.usesVapeOrShisha || false,
    data.cessationMonths || 0
  );
  if (smokingResult.airwayReactivityAlert) {
    conditionalFlags.push(`Airway Inhalation Alert: ${smokingResult.recommendations[0]}`);
  } else {
    greenClearancePoints.push('Airway reactivity & smoking risk: Cleared');
  }

  // 4. Cardiac
  const cardiacResult = evaluateCardiacSafety(
    data.cardiacConditions || [],
    data.stentPlacementMonthsAgo,
    data.stentType,
    data.ejectionFraction,
    data.metsExerciseTolerance ?? 4,
    data.cardiologyClearanceOnRecord || false
  );
  if (cardiacResult.riskTier === 'CRITICAL') {
    hardStopFlags.push(`CARDIAC HARD STOP: ${cardiacResult.antiplateletHoldConstraint}`);
  } else if (cardiacResult.riskTier === 'HIGH' || cardiacResult.riskTier === 'MODERATE') {
    for (const rec of cardiacResult.recommendations) {
      conditionalFlags.push(`Cardiovascular Alert: ${rec}`);
    }
  } else {
    greenClearancePoints.push('Cardiovascular risk & functional capacity: Cleared');
  }

  // 5. Diabetes & GLP-1
  if (data.takesGlp1) {
    const hours = data.lastGlp1DoseHoursAgo ?? 0;
    if (hours < 168) {
      // Less than 7 days for weekly GLP-1
      conditionalFlags.push(
        `GLP-1 Agonist (${data.glp1DrugName || 'Semaglutide/Tirzepatide'}): Last dose was ${hours}h ago (<168h target). ASA 2023 guideline requires ultrasound gastric volume assessment or full stomach rapid sequence induction (RSI).`
      );
    } else {
      greenClearancePoints.push(`GLP-1 Agonist hold duration (${hours}h > 168h): Cleared`);
    }
  }

  // 6. Fasting NPO — standard: 8h solids / 2h minimum clears (3h preferred).
  // Engine: hard stop <2h clears, caution 2-3h clears.
  const solidsHours = data.lastSolidFoodHoursAgo ?? 12;
  const fluidsHours = data.lastClearFluidHoursAgo ?? 4;
  const npoSolidsOk = solidsHours >= 8;
  const npoFluidsMinimumOk = fluidsHours >= 2;
  const npoFluidsPreferredOk = fluidsHours >= 3;
  const npoFastingCompliant = npoSolidsOk && npoFluidsMinimumOk;
  if (!npoFastingCompliant) {
    if (!npoSolidsOk) {
      hardStopFlags.push(
        `NPO FASTING BREACH: Patient ate solid food ${solidsHours} hours ago (<8 hours required). High aspiration risk. Delay case until 8-hour window is complete.`
      );
    } else if (!npoFluidsMinimumOk) {
      hardStopFlags.push(
        `NPO CLEAR-LIQUID HARD STOP: Patient ingested clears ${fluidsHours} hours ago (<2h minimum; 3h preferred). Hold induction for ${(2 - fluidsHours).toFixed(1)} hours minimum.`
      );
    }
  } else if (!npoFluidsPreferredOk) {
    conditionalFlags.push(
      `NPO clears caution: liquids ${fluidsHours}h ago — inside 2-3h window (2h minimum met, 3h preferred). Prefer waiting until 3h or confirm with gastric POCUS.`
    );
  } else {
    greenClearancePoints.push(`8h solids / 2h minimum clears (3h preferred) verified (Solids: ${solidsHours}h ago, Liquids: ${fluidsHours}h ago)`);
  }

  // 7. Malignant Hyperthermia
  const mhRiskFlag = Boolean(data.personalMhHistory || data.familyMhHistory);
  if (mhRiskFlag) {
    hardStopFlags.push(
      'MALIGNANT HYPERTHERMIA RISK: Personal or familial MH history reported. Absolute contraindication to volatile inhalational anesthetics and Succinylcholine. Prepare TIVA (Total IV Anesthesia) and Dantrolene / Ryanodex on standby.'
    );
  }

  // Determine overall status
  let overallClearance: ClearanceStatus = 'GREEN_CLEARED';
  let primaryActionDirective = 'All pre-operative screening criteria met. Cleared for standard anesthesia induction.';

  if (hardStopFlags.length > 0) {
    overallClearance = 'RED_HARD_STOP';
    primaryActionDirective = hardStopFlags[0];
  } else if (conditionalFlags.length > 0) {
    overallClearance = 'AMBER_CONDITIONAL';
    primaryActionDirective = conditionalFlags[0];
  }

  return {
    overallClearance,
    primaryActionDirective,
    hardStopFlags,
    conditionalFlags,
    greenClearancePoints,
    contraceptiveResult,
    antipsychoticResult,
    smokingResult,
    cardiacResult,
    medicalResult,
    familyG6pdResult,
    dentalResult,
    airwayScreenResult,
    drugAllergyResult,
    currentMedsResult,
    fitnessResult,
    npoFastingCompliant,
    mhRiskFlag,
  };
}

// -------------------------------------------------------------
// CONCISE PAC INTERVIEW EVALUATION (/pac — short ask-the-questions flow)
// Reuses existing evaluators; no new guideline logic.
// -------------------------------------------------------------
export interface PACInterviewEvaluation {
  overallClearance: ClearanceStatus;
  primaryActionDirective: string;
  hardStopFlags: string[];
  conditionalFlags: string[];
  greenPoints: string[];
  fastingHoursSinceFood: number | null;
  fastingHoursSinceFluid: number | null;
  fastingCompliant: boolean | null;
  morningMeds: string[];
  bmi: number | null;
}

export function evaluatePACInterview(
  data: Partial<import('./types').PACInterview>,
  surgeryTimeIso?: string
): PACInterviewEvaluation {
  const hardStopFlags: string[] = [];
  const conditionalFlags: string[] = [];
  const greenPoints: string[] = [];
  const morningMeds: string[] = [];

  // BMI
  let bmi: number | null = null;
  if (data.weightKg && data.heightCm && data.heightCm > 0) {
    const m = data.heightCm / 100;
    bmi = Math.round((data.weightKg / (m * m)) * 10) / 10;
    if (bmi >= 40) conditionalFlags.push(`BMI ${bmi}: morbid obesity — plan difficult mask ventilation, positioning aids, DVT prophylaxis.`);
    else greenPoints.push(`BMI ${bmi} recorded`);
  }

  // Meds
  const cats = data.medCategories || [];
  if (data.takesAnyMeds && cats.length === 0 && !(data.medsFreeText || '').trim()) {
    conditionalFlags.push('Patient takes medicines but gave no details — reconcile exact names/doses on arrival.');
  }
  if (cats.includes('BLOOD_THINNER')) {
    hardStopFlags.push('BLOOD THINNER reported: confirm exact drug (aspirin/clopidogrel/warfarin/DOAC), last dose + indication (stent/AF). Do NOT induce until hold window verified per ASRA 2025.');
    morningMeds.push('Blood thinner: HOLD per cardiology/ASRA plan — confirm last-dose time.');
  }
  if (cats.includes('DIABETES')) {
    conditionalFlags.push('Diabetes medicine: do NOT take on morning of surgery. Team manages glucose (target 140–180 mg/dL).');
    morningMeds.push('Diabetes tablets/insulin: SKIP morning of surgery.');
  }
  if (cats.includes('THYROID')) {
    morningMeds.push('Thyroid tablet: TAKE morning of surgery with a sip of water.');
    greenPoints.push('Thyroid morning-dose rule given');
  }
  if (cats.includes('BP')) {
    morningMeds.push('BP pills: TAKE beta-blocker/CCB; HOLD ACE-I/ARB + diuretic morning of surgery. Recheck BP (delay elective if ≥180/110).');
  }
  if (cats.includes('GLP1_WEIGHTLOSS')) {
    conditionalFlags.push(`GLP-1/weight-loss injection (${data.glp1LastDoseText || 'dose time unclear'}): needs ≥168h weekly hold. If within a week → gastric POCUS + RSI plan.`);
    morningMeds.push('GLP-1 weekly: HOLD ≥7 days before surgery.');
  }
  if (cats.includes('CONTRACEPTIVE_HRT')) {
    conditionalFlags.push('Estrogen pill/HRT: VTE risk — SCDs in OT + early ambulation; LMWH if major surgery + immobilization.');
  }
  if (cats.includes('PAINKILLER_NSAID')) {
    conditionalFlags.push('NSAID/painkiller: hold per bleeding risk; plan paracetamol-based multimodal analgesia.');
  }
  if (cats.includes('STEROID')) {
    conditionalFlags.push('Steroid use: assess stress-dose cover need (adrenal suppression) + glucose/K+ monitoring.');
  }
  if (data.takesHerbalsOTC) {
    conditionalFlags.push(`Herbal/OTC/supplement (${(data.herbalsFreeText || 'unspecified').slice(0, 120)}): hold fish oil/ginkgo/garlic/ginseng 7 days (bleeding); hold St. John's Wort 5 days (CYP interactions).`);
  }
  if (!data.takesAnyMeds) greenPoints.push('No daily medicines reported');

  // Body check
  if (data.recentFeverColdCough) {
    hardStopFlags.push('Fever/cold/cough within 2 weeks: rule out active infection. If febrile ≥38°C or purulent sputum/wheeze on day → postpone elective case 2–4 weeks.');
  } else greenPoints.push('No recent fever/cold/cough');
  if (data.chestPainOrBreathless) {
    conditionalFlags.push('Chest pain / breathless on 2 flights (<4 METs): ECG + functional workup; cardiology if unstable angina, failure, murmur+syncope.');
  }
  if (data.loudSnoring) {
    conditionalFlags.push('Loud snoring/daytime sleepiness: possible OSA — plan difficult-airway trolley, avoid deep sedation, CPAP post-op.');
  }
  const chronic = data.chronicFlags || [];
  if (chronic.length > 0) {
    conditionalFlags.push(`Chronic illness (${chronic.join(', ')}): needs recent reports + specialist fitness if major (heart/kidney/liver). Bring prescriptions + ECG/echo.`);
  }
  if (data.bleedingOrTransfusionHx) {
    conditionalFlags.push('Bleeding/transfusion history: check CBC, PT/INR, platelets; type & screen; ask about bruises, gum/nose bleeds, heavy periods.');
  }
  if (data.pregnancyStatus === 'POSSIBLY_PREGNANT' || data.pregnancyStatus === 'PREGNANT') {
    hardStopFlags.push('Pregnancy possible/confirmed: β-hCG test mandatory. If pregnant → obstetric anesthesia consult, aspiration prophylaxis, drug/radiation plan.');
  }
  if (data.hasAllergyAlert) {
    conditionalFlags.push(`Allergy alert (${(data.allergySummary || 'see details').slice(0, 160)}): band chart, confirm rash vs swelling vs breathing trouble; keep anaphylaxis kit + latex-free setup if latex.`);
  } else greenPoints.push('No allergy alarm reported');

  // Airway self-screen
  const dental = data.dentalFlags || [];
  const dentalRisk = dental.some((d) => d !== 'NONE');
  if (dentalRisk) conditionalFlags.push(`Teeth (${dental.join(', ')}): remove dentures/aligners before induction; document loose tooth position; gentle laryngoscopy + tooth guard.`);
  if (data.mouthOpensWide === false) conditionalFlags.push('Mouth does not open wide / neck stiff: anticipate difficult laryngoscopy — videolaryngoscope + bougie + LMA ready.');
  if (data.mouthOpensWide && data.neckMovesFully && !dentalRisk) greenPoints.push('Mouth + neck + teeth: no red flags reported');

  // Fasting — exact datetimes
  let fastingHoursSinceFood: number | null = null;
  let fastingHoursSinceFluid: number | null = null;
  let fastingCompliant: boolean | null = null;
  const nowMs = Date.now();
  if (data.lastFoodIso) {
    fastingHoursSinceFood = Math.max(0, Math.round(((nowMs - new Date(data.lastFoodIso).getTime()) / 3600000) * 10) / 10);
  }
  if (data.lastFluidIso) {
    fastingHoursSinceFluid = Math.max(0, Math.round(((nowMs - new Date(data.lastFluidIso).getTime()) / 3600000) * 10) / 10);
  }
  if (surgeryTimeIso && (data.lastFoodIso || data.lastFluidIso)) {
    const sxMs = new Date(surgeryTimeIso).getTime();
    if (data.lastFoodIso) {
      const foodGapHrs = (sxMs - new Date(data.lastFoodIso).getTime()) / 3600000;
      if (foodGapHrs < 8) hardStopFlags.push(`Fasting breach at planned time: last food only ${foodGapHrs.toFixed(1)}h before surgery (<8h). Delay induction until 8h window complete.`);
    }
    if (data.lastFluidIso) {
      // Standard: 8h solids / 2h minimum clears (3h preferred) — hard stop <2h, caution 2-3h.
      const fluidGapHrs = (sxMs - new Date(data.lastFluidIso).getTime()) / 3600000;
      if (fluidGapHrs < 2) hardStopFlags.push(`Clear-fluid HARD STOP: last water ${fluidGapHrs.toFixed(1)}h before surgery (<2h minimum; 3h preferred). Hold induction ${Math.ceil(2 - fluidGapHrs)}h minimum.`);
      else if (fluidGapHrs < 3) conditionalFlags.push(`Clear-fluid caution: last water ${fluidGapHrs.toFixed(1)}h before surgery (2h minimum met, 3h preferred). Prefer waiting until 3h or gastric POCUS.`);
    }
    fastingCompliant =
      (!data.lastFoodIso || (sxMs - new Date(data.lastFoodIso).getTime()) / 3600000 >= 8) &&
      (!data.lastFluidIso || (sxMs - new Date(data.lastFluidIso).getTime()) / 3600000 >= 2);
    if (fastingCompliant) {
      const fluidGap = data.lastFluidIso ? (sxMs - new Date(data.lastFluidIso).getTime()) / 3600000 : 99;
      if (fluidGap >= 3) greenPoints.push('Fasting window vs surgery time: compliant (8h solids / 2h minimum clears, 3h preferred)');
      else greenPoints.push('Fasting minimum met (≥8h food, ≥2h water); 3h preferred — consider POCUS');
    }
  }

  // Instruction acks
  const missingAck: string[] = [];
  if (!data.ackFasting) missingAck.push('fasting rule');
  if (!data.ackDiabetesHold) missingAck.push('diabetes-hold rule');
  if (!data.ackThyroidTake) missingAck.push('thyroid-take rule');
  if (!data.ackBringList) missingAck.push('bring-list');
  if (!data.ackEscort) missingAck.push('escort plan');
  if (missingAck.length > 0 && data.teachBackName) {
    conditionalFlags.push(`Instructions not fully ticked (${missingAck.join(', ')}) — re-counsel on arrival with teach-back.`);
  }

  let overallClearance: ClearanceStatus = 'GREEN_CLEARED';
  let primaryActionDirective = 'PAC interview complete. No hard stops from patient answers — verify on arrival.';
  if (hardStopFlags.length > 0) {
    overallClearance = 'RED_HARD_STOP';
    primaryActionDirective = hardStopFlags[0];
  } else if (conditionalFlags.length > 0) {
    overallClearance = 'AMBER_CONDITIONAL';
    primaryActionDirective = conditionalFlags[0];
  }

  return {
    overallClearance,
    primaryActionDirective,
    hardStopFlags,
    conditionalFlags,
    greenPoints,
    fastingHoursSinceFood,
    fastingHoursSinceFluid,
    fastingCompliant,
    morningMeds,
    bmi,
  };
}

export type AdversarialModality = 'SPINAL' | 'EPIDURAL' | 'DEEP_PNB' | 'GENERAL' | 'MAC';
export type AdversarialAnticoag =
  | 'NONE'
  | 'APIXABAN'
  | 'RIVAROXABAN'
  | 'DABIGATRAN'
  | 'ENOXAPARIN_PROPHYLAXIS'
  | 'ENOXAPARIN_THERAPEUTIC'
  | 'CLOPIDOGREL'
  | 'TICAGRELOR'
  | 'ASPIRIN';
export type AdversarialGlp1 =
  | 'NONE'
  | 'WEEKLY_SEMAGLUTIDE'
  | 'WEEKLY_TIRZEPATIDE'
  | 'WEEKLY_DULAGLUTIDE'
  | 'DAILY_RYBELSUS';

export interface AdversarialCase {
  modality: AdversarialModality;
  anticoag: AdversarialAnticoag;
  anticoagHoldHours: number;
  crClMlMin: number;
  glp1: AdversarialGlp1;
  glp1HoldHours: number;
  potassiumMeqL: number;
  plateletsPerMicroL: number;
  inr: number;
  hemoglobinGDl: number;
}

export interface AdversarialDecision {
  cleared: boolean;
  hardStops: string[];
  conditionals: string[];
}

export const ADVERSARIAL_POLICY_LABEL =
  'Local conservative perioperative policy for synthetic benchmarking; not an ASRA guideline implementation. Legacy ASA 2023-inspired GLP-1 wording is historical.';

function adversarialRequiredHoldHours(anticoag: AdversarialAnticoag, crClMlMin: number): number {
  switch (anticoag) {
    case 'NONE':
    case 'ASPIRIN':
      return 0;
    case 'APIXABAN':
    case 'RIVAROXABAN':
      return 72;
    case 'DABIGATRAN':
      if (!Number.isFinite(crClMlMin)) return 144;
      if (crClMlMin < 30) return 144;
      if (crClMlMin < 50) return 120;
      if (crClMlMin < 80) return 96;
      return 72;
    case 'ENOXAPARIN_PROPHYLAXIS':
      return 12;
    case 'ENOXAPARIN_THERAPEUTIC':
      return 24;
    case 'CLOPIDOGREL':
      return 168;
    case 'TICAGRELOR':
      return 120;
  }
}

export function evaluateAdversarialCase(input: AdversarialCase): AdversarialDecision {
  const hardStops: string[] = [];
  const conditionals: string[] = [];
  const nums = [input.anticoagHoldHours, input.crClMlMin, input.glp1HoldHours, input.potassiumMeqL, input.plateletsPerMicroL, input.inr, input.hemoglobinGDl];
  if (nums.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    return { cleared: false, hardStops: ['Invalid or missing synthetic inputs: fail closed, verify manually.'], conditionals };
  }
  if (input.anticoagHoldHours < 0 || input.glp1HoldHours < 0 || input.plateletsPerMicroL < 0 || input.inr <= 0 || input.hemoglobinGDl <= 0) {
    return { cleared: false, hardStops: ['Out-of-range synthetic inputs: fail closed, verify manually.'], conditionals };
  }

  const neuraxial = input.modality === 'SPINAL' || input.modality === 'EPIDURAL';
  const deepBlock = input.modality === 'DEEP_PNB';

  if (input.potassiumMeqL < 3.0) hardStops.push(`Hypokalemia K+ ${input.potassiumMeqL} mEq/L < 3.0: hard stop.`);
  if (input.potassiumMeqL > 5.5) hardStops.push(`Hyperkalemia K+ ${input.potassiumMeqL} mEq/L > 5.5: hard stop.`);
  if (input.hemoglobinGDl < 7.0) hardStops.push(`Critical anemia Hb ${input.hemoglobinGDl} g/dL < 7.0: hard stop.`);
  if (input.inr > 1.5) hardStops.push(`Coagulopathy INR ${input.inr} > 1.5: hard stop.`);
  if (input.plateletsPerMicroL < 50000) {
    hardStops.push(`Critical thrombocytopenia ${input.plateletsPerMicroL}/µL < 50,000: hard stop all techniques.`);
  } else if (neuraxial && input.plateletsPerMicroL < 70000) {
    hardStops.push(`Platelets ${input.plateletsPerMicroL}/µL < 70,000: neuraxial contraindicated.`);
  } else if (deepBlock && input.plateletsPerMicroL < 70000) {
    conditionals.push(`Platelets ${input.plateletsPerMicroL}/µL < 70,000 with deep block: bleeding review required.`);
  }
  if (neuraxial && input.inr > 1.4 && input.inr <= 1.5) hardStops.push(`INR ${input.inr} > 1.4: neuraxial threshold exceeded.`);

  if (neuraxial || deepBlock) {
    const required = adversarialRequiredHoldHours(input.anticoag, input.crClMlMin);
    if (input.anticoagHoldHours < required) {
      hardStops.push(
        `${input.anticoag} washout ${input.anticoagHoldHours}h < ${required}h local minimum for ${input.modality} (CrCl ${input.crClMlMin} mL/min).`
      );
    }
  } else if (input.anticoag === 'ENOXAPARIN_THERAPEUTIC' || input.anticoag === 'DABIGATRAN' || input.anticoag === 'CLOPIDOGREL' || input.anticoag === 'TICAGRELOR') {
    if (input.anticoagHoldHours < adversarialRequiredHoldHours(input.anticoag, input.crClMlMin)) {
      conditionals.push(`${input.anticoag} recently dosed: confirm hemostasis plan with anesthesia for ${input.modality}.`);
    }
  }

  const weekly = input.glp1 === 'WEEKLY_SEMAGLUTIDE' || input.glp1 === 'WEEKLY_TIRZEPATIDE' || input.glp1 === 'WEEKLY_DULAGLUTIDE';
  if (weekly && input.glp1HoldHours < 168) {
    conditionals.push(
      `Weekly GLP-1 (${input.glp1}) held ${input.glp1HoldHours}h < 168h: aspiration precautions; anesthesia review with gastric POCUS consideration.`
    );
  }
  if (input.glp1 === 'DAILY_RYBELSUS' && input.glp1HoldHours < 24) {
    conditionals.push('Daily oral GLP-1 held < 24h: omit morning dose, assess gastrointestinal symptoms.');
  }

  return { cleared: hardStops.length === 0, hardStops, conditionals };
}

/* =====================================================
 * MVP pilot additions: brand normalization + scope guard
 * ===================================================== */
import { UAE_BRAND_TO_GENERIC } from './constants';

/** Normalize a prescription string: lowercase + map UAE brands to generic fragments. */
export function normalizeDrugName(raw: string): string {
  const lower = (raw || '').toLowerCase();
  let out = lower;
  for (const [brand, generic] of Object.entries(UAE_BRAND_TO_GENERIC)) {
    if (out.includes(brand)) out = `${out} ${generic}`;
  }
  return out;
}

export interface PopulationScope {
  inScope: boolean;
  flags: string[];
  guidance: string;
}

/**
 * Population scope guard: the demo rule set is adult, non-obstetric,
 * elective perioperative only. Out-of-scope cases fail closed to
 * direct anesthesiologist review — the engine must refuse, not guess.
 */
export function evaluatePopulationScope(patient: PatientCase): PopulationScope {
  const flags: string[] = [];
  if (patient.age < 18) flags.push(`Pediatric patient (age ${patient.age}): rules not validated under 18`);
  if (patient.isPregnant) flags.push('Pregnancy: obstetric anesthesia review required, demo rules do not apply');
  if (patient.asaStatus === 'ASA V' || patient.asaStatus === 'ASA E') {
    flags.push(`${patient.asaStatus}: high-acuity case, consultant-only review, no demo triage`);
  }
  if (patient.invasivenessTier >= 4) {
    flags.push('Tier-4 complex surgery (cardiac/craniotomy class): tertiary-center pathway, demo rules do not apply');
  }
  if (flags.length > 0) {
    return {
      inScope: false,
      flags,
      guidance: 'OUT OF SCOPE for MVP demo rules: direct senior anesthesiologist review required. Do not use demo flags for decisions.',
    };
  }
  return { inScope: true, flags: [], guidance: 'Within MVP demo scope (adult elective tiers 1–3). Demo flags only.' };
}

/** Count demo flags for alert-burden tracking: criticals, borderlines, hold meds. */
export function countDemoFlags(patient: PatientCase): { critical: number; borderline: number; medHolds: number; total: number } {
  let critical = 0;
  let borderline = 0;
  for (const l of patient.labs || []) {
    if (l.status === 'CRITICAL_LOW' || l.status === 'CRITICAL_HIGH') critical += 1;
    else if (l.status === 'BORDERLINE_LOW' || l.status === 'BORDERLINE_HIGH') borderline += 1;
  }
  const medHolds = (patient.medications || []).filter((m) => m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP').length;
  return { critical, borderline, medHolds, total: critical + borderline + medHolds };
}

