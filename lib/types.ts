export type ClearanceStatus = 'GREEN_CLEARED' | 'AMBER_CONDITIONAL' | 'RED_HARD_STOP';
export type ASATier = 'ASA I' | 'ASA II' | 'ASA III' | 'ASA IV' | 'ASA V' | 'ASA E';
export type PACSwimLane = 'LANE_1_VIRTUAL' | 'LANE_2_TELEPHONIC' | 'LANE_3_IN_PERSON';
export type NeckMobility = 'Full' | 'Restricted' | 'Fusion';
export type Dentition = 'Intact' | 'Loose Teeth' | 'Caps/Crowns' | 'Dentures';
export type MallampatiClass = 'Class I' | 'Class II' | 'Class III' | 'Class IV';
export type LabStatus = 'NORMAL' | 'BORDERLINE_LOW' | 'BORDERLINE_HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
export type MedicationCategory = 'GLP1' | 'DOAC' | 'ACE_ARB' | 'SGLT2I' | 'ANTIPLATELET' | 'BETA_BLOCKER' | 'STEROID' | 'NSAID' | 'OTHER';
export type MedStatus = 'CLEARED' | 'HOLD_REQUIRED' | 'HARD_STOP';
export type Jurisdiction = 'UAE_MOHAP_DHA' | 'NMC_INDIA' | 'GCC_COUNCIL';

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ExtractedLabItem {
  id: string;
  name: string;
  loinc: string;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  status: LabStatus;
  directive: string;
  provenance: {
    documentName: string;
    page: number;
    bbox: BoundingBox;
    rawOcrText: string;
    confidence: number;
  };
}

export interface MedicationHoldClock {
  id: string;
  drugName: string;
  category: MedicationCategory;
  dosageSchedule: string;
  lastDoseHoursAgo: number;
  requiredHoldHours: number;
  status: MedStatus;
  guidelineBasis: string;
  clinicalAction: string;
  isWeekly?: boolean;
}

export interface AirwayExam {
  mallampati: MallampatiClass;
  mouthOpeningCm: number;
  thyromentalDistanceCm: number;
  neckMobility: NeckMobility;
  dentition: Dentition;
  riskTier: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';
  category: 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'CONTRAST_DYE' | 'LATEX';
  documentedDate: string;
}

export interface VitalsTrend {
  timestamp: string;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  spo2: number;
  temperatureC: number;
  respiratoryRate: number;
}

export interface PatientCase {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  weightKg: number;
  heightCm: number;
  bmi: number;
  scheduledTimeIso: string;
  procedureName: string;
  cptCode: string;
  invasivenessTier: 1 | 2 | 3 | 4;
  facility: string;
  surgeon: string;
  anesthesiologist: string;
  asaStatus: ASATier;
  rcriClass: 'Class I (<0.4%)' | 'Class II (0.9%)' | 'Class III (6.6%)' | 'Class IV (>11%)';
  stopBangScore: number;
  swimLane: PACSwimLane;
  airway: AirwayExam;
  medications: MedicationHoldClock[];
  labs: ExtractedLabItem[];
  allergies: Allergy[];
  vitals: VitalsTrend[];
  isPregnant?: boolean;
  pregnancyWeeks?: number;
  hasActiveInfection?: boolean;
  infectionType?: string;
  phoneNumber?: string;
  preferredLanguage?: 'en' | 'ar' | 'hi' | 'ur' | 'ml';
  overallStatus: ClearanceStatus;
  primaryActionDirective: string;
  questionnaire?: PatientPreOpQuestionnaire;
  questionnaireUpdatedAtIso?: string;
  intakeLinkToken?: string;
  intakeLinkExpiresAtIso?: string;
  fitnessReferrals?: SpecialistReferral[];
  // Concise PAC interview (patient self-fill + clinician verify) — see /pac
  pacInterview?: PACInterview;
  pacInterviewUpdatedAtIso?: string;
  pacCompleted?: boolean;
}

export type FitnessReferralStatus = 'REQUESTED' | 'RECEIVED' | 'CLEARED' | 'NOT_CLEARED';

export interface SpecialistReferral {
  id: string;
  specialty: string;
  reason: string;
  status: FitnessReferralStatus;
  requestedAtIso: string;
  decidedBy?: string;
  decidedAtIso?: string;
  notes?: string;
}

export interface AttestationRecord {
  patientId: string;
  anesthesiologistName: string;
  licenseNumber: string;
  timestampIso: string;
  signatureHash: string;
  jurisdiction: Jurisdiction;
  acceptedClauses: string[];
  rulesEngineVersion: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'PATIENT_VIEWED' | 'LAB_INSPECTED' | 'ATTESTATION_SIGNED' | 'PAC_PRINTED' | 'PAC_WHATSAPP_SENT' | 'INGESTION_STARTED' | 'INGESTION_COMPLETE' | 'AIRWAY_MODIFIED' | 'OVERRIDE_APPLIED' | 'PAC_INTERVIEW_COMPLETED' | 'PAC_INTERVIEW_VERIFIED' | 'CLINICIAN_SWITCHED';
  patientId: string;
  userId: string;
  details: string;
  ipAddress?: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CONTRAINDICATED';
  description: string;
  clinicalAction: string;
}

export interface FHIRBundle {
  resourceType: string;
  type: string;
  timestamp: string;
  entry: unknown[];
}

// Pillar 2 Feature #9: Neuraxial Feasibility
export interface NeuraxialEligibilityResult {
  eligible: boolean;
  hardStopReasons: string[];
  recommendation: string;
  plateletThreshold: number;
  inrThreshold: number;
  doacHoldHours: number;
}

// Pillar 2 Feature #10: Serology & Blood Bank
export interface SerologyPanel {
  hiv1_2: 'NEGATIVE' | 'POSITIVE' | 'NOT_TESTED';
  hbsAg: 'NEGATIVE' | 'POSITIVE' | 'NOT_TESTED';
  antiHCV: 'NEGATIVE' | 'POSITIVE' | 'NOT_TESTED';
  bloodGroup: string;
  rhFactor: 'POSITIVE' | 'NEGATIVE';
  crossmatchStatus: 'COMPATIBLE' | 'INCOMPATIBLE' | 'NOT_CHECKED';
  screenedDate: string;
}

// Pillar 4 Feature #18: PRBC Prediction
export interface PRBCPrediction {
  predictedUnits: number;
  confidenceInterval: [number, number];
  riskFactors: string[];
  recommendation: string;
}

// Pillar 4 Feature #19: ASC Exclusion
export interface ASCExclusionRisk {
  excluded: boolean;
  reasons: string[];
  recommendation: string;
  riskScore: number;
}

// Pillar 4 Feature #20: Anemia Optimization
export interface AnemiaOptimization {
  isAnemic: boolean;
  hemoglobin: number;
  severity: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  ironProtocol: string;
  timeline: string;
  expectedImprovement: string;
}

// Pillar 4 Feature #21: Penicillin Delabeling
export interface PenicillinDelabeling {
  eligibleForDelabeling: boolean;
  trueAllergyRisk: string;
  recommendation: string;
  alternativeAntibiotics: string[];
}

// Pillar 4 Feature #22: Post-Op Risk
export interface PostOpRiskAssessment {
  akiRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  akiScore: number;
  vteRisk: 'LOW' | 'MODERATE' | 'HIGH';
  vteScore: number;
  capriniScore: number;
  riskFactors: string[];
  recommendations: string[];
}

// Pillar 5 Feature #23-26: ERAS Timeline
export interface ERASTimelineEvent {
  timeLabel: string;
  hoursBeforeSurgery: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'SKIPPED';
  category: 'FASTING' | 'MEDICATION' | 'HYGIENE' | 'EDUCATION' | 'PROMS';
}

// Pillar 6 Feature #28: OR Kanban
export interface ORCaseSlot {
  patientId: string;
  patientName: string;
  procedureName: string;
  scheduledTime: string;
  surgeon: string;
  orRoom: string;
  clearanceStatus: ClearanceStatus;
  swimLane: PACSwimLane;
  asaStatus: ASATier;
  invasivenessTier: 1 | 2 | 3 | 4;
}

// Pillar 3: Biomarker Safety Cutoffs display
export interface BiomarkerCutoff {
  name: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'BORDERLINE' | 'CRITICAL';
  color: string;
  directive: string;
}

// Pillar 5 Feature #24: Morning Medication Directives
export interface MorningMedDirective {
  drugName: string;
  action: 'TAKE_WITH_SIP' | 'HOLD' | 'OMIT' | 'MODIFIED_DOSE';
  reason: string;
  timing: string;
  critical: boolean;
}

// Medical Questionnaire & Patient History Types
export type SmokingStatus = 'NON_SMOKER' | 'EX_SMOKER' | 'ACTIVE_SMOKER' | 'VAPING' | 'SHISHA';
export type MedicalIssueKey =
  | 'COMMON_COLD'
  | 'COUGH'
  | 'FEVER'
  | 'ASTHMA'
  | 'RESPIRATORY_INFECTION'
  | 'DIABETES'
  | 'HYPERTENSION'
  | 'HEART_ISSUES'
  | 'LIVER_PROBLEM'
  | 'KIDNEY_ISSUES';
export type FamilyAnesthesiaIssueKey =
  | 'MH_FAMILY'
  | 'DIFFICULT_INTUBATION_FAMILY'
  | 'PROLONGED_RECOVERY_FAMILY'
  | 'ANESTHESIA_ALLERGY_FAMILY'
  | 'SEVERE_PONV_FAMILY'
  | 'UNEXPLAINED_DEATH_ANESTHESIA_FAMILY';
export type DentalIssueKey =
  | 'DENTURES'
  | 'VENEERS'
  | 'BRACES'
  | 'LOOSE_TOOTH'
  | 'CAPS_CROWNS';
export type DrugAllergyKey =
  | 'PENICILLIN'
  | 'SULFA'
  | 'NSAID'
  | 'OPIOID'
  | 'LATEX'
  | 'CONTRAST'
  | 'NMB_ANESTHESIA'
  | 'OTHER';
export type ContraceptiveType = 'COMBINED_ORAL_PILL' | 'PROGESTIN_ONLY' | 'PATCH_RING' | 'INJECTION' | 'IUD' | 'HRT' | 'NONE';
export type CardiacCondition = 'MYOCARDIAL_INFARCTION' | 'CORONARY_STENT_DES' | 'CORONARY_STENT_BMS' | 'HEART_FAILURE' | 'ARRHYTHMIA_AFIB' | 'PACEMAKER_ICD' | 'HYPERTENSION' | 'VALVE_DISEASE' | 'ANGINA';

export interface PsychiatricMedication {
  name: string;
  category: 'TYPICAL_ANTIPSYCHOTIC' | 'ATYPICAL_ANTIPSYCHOTIC' | 'SSRI_SNRI' | 'MAOI' | 'LITHIUM' | 'BENZODIAZEPINE' | 'OTHER';
  dose?: string;
  qtcProlongationRisk: boolean;
  sedationInteraction: boolean;
  hypotensionRisk: boolean;
  recommendation: string;
}

export interface PreviousSurgeryRecord {
  procedure: string;
  year?: number;
  anesthesiaType?: 'GENERAL' | 'SPINAL' | 'LOCAL' | 'UNKNOWN';
  complications?: string;
}
export type CurrentMedCategory =
  | 'BP'
  | 'DIABETES'
  | 'THYROID'
  | 'ANXIETY'
  | 'CONTRACEPTIVE'
  | 'WEIGHT_LOSS'
  | 'OTHER';
export interface CurrentMedication {
  name: string;
  category: CurrentMedCategory;
  dose?: string;
  lastDoseHoursAgo?: number;
}

export interface PatientPreOpQuestionnaire {
  id: string;
  patientId: string;
  completedAtIso: string;
  source: 'PATIENT_MOBILE_LINK' | 'COORDINATOR_ASSISTED' | 'CLINICAL_INTAKE';
  // 0. Medical issues checklist (patient-reported)
  medicalIssues?: MedicalIssueKey[];
  medicalIssueNotes?: string;
  // 0a. Current daily medications (patient-reported)
  currentMedications?: CurrentMedication[];
  currentMedNotes?: string;
  // 0b. Previous surgery history
  hadPreviousSurgery?: boolean;
  previousSurgeries?: PreviousSurgeryRecord[];
  previousSurgeryNotes?: string;
  // 0c. Family anesthesia history + G6PD
  familyAnesthesiaIssues?: FamilyAnesthesiaIssueKey[];
  familyAnesthesiaNotes?: string;
  hasG6pd?: boolean;
  g6pdDetails?: string;
  // 0d. Dental / teeth (airway risk)
  dentalIssues?: DentalIssueKey[];
  dentalNotes?: string;
  // 0e. Airway screening (patient-reported neck + mouth opening)
  neckMovement?: 'NORMAL' | 'STIFF' | 'VERY_LIMITED' | 'FUSION';
  mouthOpening?: 'NORMAL_3FINGERS' | 'LIMITED_2FINGERS' | 'VERY_LIMITED_1FINGER';
  airwayScreenNotes?: string;
  // 0f. Drug allergies (structured checklist + free text)
  hasDrugAllergy?: boolean;
  drugAllergyKeys?: DrugAllergyKey[];
  drugAllergyDetails?: string;
  // 1. Smoking & Inhalation
  smokingStatus: SmokingStatus;
  packYears?: number;
  cessationMonths?: number;
  usesVapeOrShisha: boolean;
  // 2. Contraceptive & Hormones
  contraceptiveType: ContraceptiveType;
  contraceptiveDrugName?: string;
  contraceptiveDurationMonths?: number;
  hasVteRiskAlert: boolean;
  // 3. Psychiatric & Antipsychotic Drugs
  takesPsychiatricMeds: boolean;
  psychiatricMeds: PsychiatricMedication[];
  // 4. Cardiac & Cardiovascular
  hasCardiacHistory: boolean;
  cardiacConditions: CardiacCondition[];
  stentPlacementMonthsAgo?: number;
  stentType?: 'DES' | 'BMS';
  ejectionFraction?: number;
  metsExerciseTolerance: number; // e.g. < 4 METs (cannot climb 2 flights) vs >= 4 METs
  cardiologyClearanceOnRecord: boolean;
  // 5. Diabetes & GLP-1
  hasDiabetes: boolean;
  diabetesType?: 'TYPE_1' | 'TYPE_2' | 'GESTATIONAL';
  takesGlp1: boolean;
  glp1DrugName?: string;
  lastGlp1DoseHoursAgo?: number;
  // 6. Respiratory & Airway
  hasAsthmaCopd: boolean;
  usesInhaler: boolean;
  hasSleepApnea: boolean;
  usesCpap: boolean;
  recentUrtiWithin2Weeks: boolean;
  // 7. Fasting NPO
  lastSolidFoodHoursAgo: number;
  lastClearFluidHoursAgo: number;
  isNpoFastingAdequate: boolean;
  // 8. Anesthesia Complications
  personalMhHistory: boolean;
  familyMhHistory: boolean;
  difficultAirwayHistory: boolean;
  severePonvHistory: boolean;
  // 9. Allergies
  allergiesList: string[];
  // Summary
  riskFlags: string[];
  clearanceStatus: ClearanceStatus;
}

// Concise PAC interview — plain-language ask-the-questions flow (/pac).
// Kept intentionally short (~22 inputs, 5 steps) so patients actually finish it.
export type PACMedCategory =
  | 'BLOOD_THINNER'
  | 'BP'
  | 'DIABETES'
  | 'THYROID'
  | 'PAINKILLER_NSAID'
  | 'PSYCH_NEURO'
  | 'STEROID'
  | 'CONTRACEPTIVE_HRT'
  | 'GLP1_WEIGHTLOSS'
  | 'OTHER';

export interface PACInterview {
  id: string;
  patientId: string;
  completedAtIso: string;
  mode: 'SELF' | 'CLINIC';
  source: 'PAC_QUICK_LINK' | 'CLINIC_VERIFY';
  // Step 1 — you + surgery
  escortName?: string;
  escortPhone?: string;
  weightKg?: number;
  heightCm?: number;
  // Step 2 — meds
  takesAnyMeds: boolean;
  medCategories: PACMedCategory[];
  medsFreeText?: string;
  takesHerbalsOTC: boolean;
  herbalsFreeText?: string;
  medsLast24h?: string;
  // Step 3 — body check
  recentFeverColdCough: boolean;
  chestPainOrBreathless: boolean;
  loudSnoring: boolean;
  chronicFlags: string[]; // e.g. HEART, BP, DIABETES, KIDNEY, LIVER, THYROID, SEIZURE
  bleedingOrTransfusionHx: boolean;
  pregnancyStatus?: 'NOT_APPLICABLE' | 'NOT_PREGNANT' | 'POSSIBLY_PREGNANT' | 'PREGNANT' | 'BREASTFEEDING';
  lmpOrWeeks?: string;
  allergySummary?: string;
  hasAllergyAlert: boolean;
  // Step 4 — mouth/teeth + fasting
  dentalFlags: string[]; // DENTURES, LOOSE_TOOTH, BRACES, CAPS_CROWNS, NONE
  mouthOpensWide: boolean;
  neckMovesFully: boolean;
  lastFoodIso?: string;
  lastFluidIso?: string;
  glp1LastDoseText?: string;
  // Step 5 — do's + confirm
  ackFasting: boolean;
  ackDiabetesHold: boolean;
  ackThyroidTake: boolean;
  ackBringList: boolean;
  ackEscort: boolean;
  teachBackName?: string;
  // Clinic verify (mode=CLINIC only)
  clinicVerified?: {
    npoVerified: boolean;
    airwaySeen: boolean;
    medsReconciled: boolean;
    allergyBanded: boolean;
    consentExplained: boolean;
    planSelected?: 'GA' | 'SPINAL' | 'REGIONAL' | 'MAC' | 'COMBINED' | 'UNDECIDED';
    verifierName?: string;
    notes?: string;
  };
}

