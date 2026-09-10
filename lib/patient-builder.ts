import {
  PatientCase,
  ExtractedLabItem,
  AirwayExam,
  Allergy,
  MedicationHoldClock,
  ASATier,
  ClearanceStatus,
  PACSwimLane,
} from './types';
import {
  evaluateOverallClearance,
  determinePACSwimLane,
  evaluateAirwayRisk,
} from './rules-engine';

export interface CoordinatorPatientMetadata {
  name: string;
  mrn?: string;
  age: number;
  gender: 'M' | 'F';
  procedureName: string;
  cptCode?: string;
  invasivenessTier?: 1 | 2 | 3 | 4;
  facility?: string;
  surgeon?: string;
  anesthesiologist?: string;
  scheduledTimeIso?: string;
  heightCm?: number;
  weightKg?: number;
  allergies?: Allergy[];
  medications?: MedicationHoldClock[];
  phoneNumber?: string;
}

/**
 * Dynamically constructs a fully qualified PatientCase from extracted lab items and coordinator metadata.
 */
export function buildPatientFromLabs(
  parsedLabs: ExtractedLabItem[],
  metadata: CoordinatorPatientMetadata
): PatientCase {
  const heightCm = metadata.heightCm || 172;
  const weightKg = metadata.weightKg || 74;
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  // Auto-generate MRN if not provided
  const mrn =
    metadata.mrn?.trim() ||
    `DHA-PAC-${Math.floor(100000 + Math.random() * 900000)}`;

  const id = `patient-${mrn.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Default airway examination
  const defaultAirway: AirwayExam = {
    mallampati: 'Class II',
    mouthOpeningCm: 4.5,
    thyromentalDistanceCm: 6.5,
    neckMobility: 'Full',
    dentition: 'Intact',
    riskTier: 'LOW',
  };
  const airwayRisk = evaluateAirwayRisk(defaultAirway);
  defaultAirway.riskTier = airwayRisk;

  // Determine ASA status based on labs & demographics
  const hasCriticalLab = parsedLabs.some(
    (l) => l.status === 'CRITICAL_LOW' || l.status === 'CRITICAL_HIGH'
  );
  const hasBorderlineLab = parsedLabs.some(
    (l) => l.status === 'BORDERLINE_LOW' || l.status === 'BORDERLINE_HIGH'
  );
  const isObese = bmi >= 35;

  let asaStatus: ASATier = 'ASA I';
  if (hasCriticalLab) {
    asaStatus = 'ASA III';
  } else if (hasBorderlineLab || isObese || metadata.age >= 65) {
    asaStatus = 'ASA II';
  }

  // Calculate STOP-Bang score
  let stopBang = 0;
  if (bmi > 35) stopBang += 1; // Body mass
  if (metadata.age > 50) stopBang += 1; // Age
  if (metadata.gender === 'M') stopBang += 1; // Gender

  // Calculate RCRI class
  const invasiveness = metadata.invasivenessTier || 2;
  const crLab = parsedLabs.find((l) => l.name.toLowerCase().includes('creatinine'));
  const isHighCreatinine = (crLab?.value || 0) > 2.0;
  let rcriPoints = 0;
  if (invasiveness >= 3) rcriPoints += 1;
  if (isHighCreatinine) rcriPoints += 1;

  let rcriClass: 'Class I (<0.4%)' | 'Class II (0.9%)' | 'Class III (6.6%)' | 'Class IV (>11%)' = 'Class I (<0.4%)';
  if (rcriPoints === 1) rcriClass = 'Class II (0.9%)';
  else if (rcriPoints === 2) rcriClass = 'Class III (6.6%)';
  else if (rcriPoints >= 3) rcriClass = 'Class IV (>11%)';

  // Tomorrow morning default schedule
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(7, 30, 0, 0);
  const scheduledTimeIso = metadata.scheduledTimeIso || tomorrow.toISOString();

  // Baseline vital trends
  const vitals = [
    {
      timestamp: new Date().toISOString(),
      systolicBp: 124,
      diastolicBp: 78,
      heartRate: 72,
      spo2: 99,
      temperatureC: 36.7,
      respiratoryRate: 14,
    },
  ];

  // Default allergies
  const allergies: Allergy[] = metadata.allergies || [
    {
      id: 'all-nkda',
      allergen: 'No Known Drug Allergies (NKDA)',
      reaction: 'None',
      severity: 'MILD',
      category: 'MEDICATION',
      documentedDate: new Date().toISOString().split('T')[0],
    },
  ];

  // Temporary draft patient case for rules evaluation
  const draftPatient: PatientCase = {
    id,
    mrn,
    name: metadata.name.trim(),
    age: metadata.age,
    gender: metadata.gender,
    weightKg,
    heightCm,
    bmi,
    scheduledTimeIso,
    procedureName: metadata.procedureName.trim() || 'Elective Outpatient Surgery',
    cptCode: metadata.cptCode || '47562',
    invasivenessTier: invasiveness,
    facility: metadata.facility || 'American Hospital Dubai · Day Surgery Center',
    surgeon: metadata.surgeon || 'Dr. Zaid Al-Sayed, FRCS',
    anesthesiologist: metadata.anesthesiologist || 'Dr. Tariq Mansoor, MD (DHA-99014)',
    asaStatus,
    rcriClass,
    stopBangScore: stopBang,
    swimLane: 'LANE_1_VIRTUAL',
    airway: defaultAirway,
    medications: metadata.medications || [],
    labs: parsedLabs,
    allergies,
    vitals,
    overallStatus: 'GREEN_CLEARED',
    primaryActionDirective: '',
    phoneNumber: metadata.phoneNumber || '+971 50 123 4567',
  };

  // Run authoritative rules engine
  const clearance = evaluateOverallClearance(draftPatient);
  const swimLane = determinePACSwimLane(draftPatient);

  return {
    ...draftPatient,
    overallStatus: clearance.status,
    primaryActionDirective: clearance.primaryDirective,
    swimLane,
  };
}
