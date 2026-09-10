export const RULES_ENGINE_VERSION = '2.5.0';

export const ASA_DESCRIPTIONS: Record<string, string> = {
  'ASA I': 'Healthy patient',
  'ASA II': 'Mild systemic disease',
  'ASA III': 'Severe systemic disease',
  'ASA IV': 'Severe systemic disease, constant threat to life',
  'ASA V': 'Moribund, not expected to survive without surgery',
  'ASA E': 'Emergency',
};

export const STOP_BANG_INTERPRETATION: Record<number, string> = {
  0: 'Low risk OSA',
  1: 'Low risk OSA',
  2: 'Low risk OSA',
  3: 'Moderate risk OSA',
  4: 'High risk OSA',
  5: 'High risk OSA',
  6: 'High risk OSA',
  7: 'High risk OSA',
  8: 'High risk OSA',
};

export const INVASIVENESS_TIERS: Record<number, { label: string; description: string; examples: string[] }> = {
  1: {
    label: 'Minor / Superficial',
    description: 'Minimal physiological stress, low bleeding risk',
    examples: ['Skin biopsy', 'Cataract surgery', 'Minor dermatologic'],
  },
  2: {
    label: 'Intermediate / Laparoscopic',
    description: 'Moderate physiological stress, controlled bleeding',
    examples: ['Laparoscopic cholecystectomy', 'Arthroscopy', 'Hernia repair'],
  },
  3: {
    label: 'Major / Arthroplasty',
    description: 'Significant physiological stress, notable blood loss',
    examples: ['Total knee arthroplasty', 'Colectomy', 'Laminectomy'],
  },
  4: {
    label: 'Complex / Cardiothoracic',
    description: 'Extreme physiological stress, hemodynamic instability',
    examples: ['CABG', 'Aortic aneurysm repair', 'Craniotomy'],
  },
};

export const LOINC_COMMON: Record<string, string> = {
  POTASSIUM: '2823-3',
  SODIUM: '2951-2',
  CHLORIDE: '2075-0',
  BICARBONATE: '1963-8',
  BUN: '3094-0',
  CREATININE: '2160-0',
  GLUCOSE: '1558-6',
  HBA1C: '4548-4',
  WBC: '6690-2',
  HEMOGLOBIN: '718-7',
  HEMATOCRIT: '4544-3',
  PLATELETS: '777-3',
  INR: '6301-6',
  PT: '7284-4',
  APTT: '14979-5',
  ALBUMIN: '1751-7',
  CALCIUM: '17861-6',
  MAGNESIUM: '21039-7',
  PHOSPHORUS: '2777-1',
  TSH: '3016-3',
  AST: '1920-8',
  ALT: '1742-6',
  ALP: '6768-6',
  BILIRUBIN: '1975-2',
  TROPONIN_I: '10839-9',
  BNP: '30934-4',
};

export const DRUG_INTERACTION_MAP: Array<{
  drug1Pattern: string;
  drug2Pattern: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CONTRAINDICATED';
  description: string;
  clinicalAction: string;
}> = [
  {
    drug1Pattern: 'ace',
    drug2Pattern: 'arb',
    severity: 'CONTRAINDICATED',
    description: 'Dual RAAS blockade significantly increases risk of hyperkalemia, renal failure, and hypotension.',
    clinicalAction: 'Do not co-prescribe ACE inhibitor + ARB. Discontinue one perioperatively.',
  },
  {
    drug1Pattern: 'glp1',
    drug2Pattern: 'sulfonylurea',
    severity: 'MAJOR',
    description: 'Additive hypoglycemia risk with GLP-1 RA and sulfonylurea combination.',
    clinicalAction: 'Hold sulfonylurea 24h pre-op. Monitor POC glucose q1h intra-op.',
  },
  {
    drug1Pattern: 'doac',
    drug2Pattern: 'antiplatelet',
    severity: 'MAJOR',
    description: 'Dual antithrombotic therapy increases major bleeding risk 3-5x.',
    clinicalAction: 'Coordinate hold times between DOAC and antiplatelet. Regional anesthesia contraindicated.',
  },
  {
    drug1Pattern: 'nsaid',
    drug2Pattern: 'ace',
    severity: 'MODERATE',
    description: 'NSAIDs blunt antihypertensive effect of ACE inhibitors and increase renal injury risk.',
    clinicalAction: 'Hold NSAIDs perioperatively. ACEi may be held morning of surgery if hypotension risk.',
  },
  {
    drug1Pattern: 'beta',
    drug2Pattern: 'calcium channel',
    severity: 'MODERATE',
    description: 'Additive bradycardia and AV conduction blockade risk.',
    clinicalAction: 'Continuous cardiac monitoring. Have atropine/glycopyrrolate available.',
  },
  {
    drug1Pattern: 'metformin',
    drug2Pattern: 'contrast',
    severity: 'MAJOR',
    description: 'Metformin with iodinated contrast increases lactic acidosis risk.',
    clinicalAction: 'Hold metformin 48h before and after contrast administration.',
  },
  {
    drug1Pattern: 'statin',
    drug2Pattern: 'fibrate',
    severity: 'MODERATE',
    description: 'Increased risk of rhabdomyolysis with statin + fibrate combination.',
    clinicalAction: 'Continue statin perioperatively. Monitor CK if muscle pain reported.',
  },
  {
    drug1Pattern: 'warfarin',
    drug2Pattern: 'nsaid',
    severity: 'CONTRAINDICATED',
    description: 'Synergistic GI bleeding and coagulopathy risk.',
    clinicalAction: 'Discontinue NSAIDs completely while on warfarin. Use acetaminophen for pain.',
  },
];

export const NPO_GUIDELINES = {
  solids: { minHours: 8, maxHours: 8, rule: 'Midnight NPO for solids (8h)' },
  clearLiquids: { minHours: 3, maxHours: 3, rule: 'Clear carbohydrates up to 200ml until 3h pre-op' },
  breastMilk: { minHours: 4, maxHours: 4, rule: 'Breast milk 4h, formula 6h' },
};

export const CLINICAL_OVERRIDE_REASONS = [
  'URGENT_CASE',
  'PATIENT_REFUSAL',
  'MEDICAL_NECESSITY',
  'ALTERNATIVE_ANESTHESIA',
  'SECOND_OPINION',
  'GUIDELINE_EXCEPTION',
];

export const TIMEZONE_MAP: Record<string, string> = {
  'UAE_MOHAP_DHA': 'Asia/Dubai',
  'NMC_INDIA': 'Asia/Kolkata',
  'GCC_COUNCIL': 'Asia/Riyadh',
};
