/* =====================================================
 * Synthetic PureLab demo fixtures — CLEARLY FAKE DATA.
 * Layout mimics a LIS report (header, patient block, accession,
 * collected/reported dates, Name: value table) so the PURE_LAB
 * parser path, matching ladder, and stale-report rule can be
 * demonstrated end to end. NEVER real patient data.
 * ===================================================== */

export interface PureLabDemoEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  receivedAtIso: string;
  attachmentName: string;
  /** Synthetic report body (stands in for the PDF attachment text). */
  reportText: string;
  note: string;
}

const FATIMA_REPORT = `PureLab — A PureHealth Company | ISO 15189:2022, CAP Accredited
Central Reference Laboratory, Abu Dhabi, UAE | customercare@purelab.com | 800700LAB
LABORATORY REPORT — Accession: PUL-2026-88121
Patient: Fatima Al-Mansoor | MRN: DHA-892144-AE | DOB: 1978-03-14 | Sex: F | Age: 48Y
Ordering Physician: Dr. Tariq Al-Hashimi | Collected on: 2026-09-10 08:15 | Reported on: 2026-09-10 14:40
TEST                                     RESULT   FLAG   UNITS      REFERENCE RANGE
Hemoglobin: 13.1 g/dL [12.0 - 15.5]
WBC: 6.8 10^3/uL [4.5 - 11.0]
Platelets: 248 10^3/uL [150 - 450]
Sodium: 139 mmol/L [135 - 145]
Potassium: 3.2 L mmol/L [3.5 - 5.1]
Creatinine: 72 umol/L [45 - 90]
Fasting Glucose: 112 H mg/dL [70 - 100]
HbA1c: 7.1 H % [4.0 - 5.6]
INR: 1.02 ratio [0.85 - 1.15]
Authorised by: Dr. L. Nair, Consultant Pathologist | Page 1 of 1 | purelab.com`;

const UNKNOWN_REPORT = `PureLab — A PureHealth Company | ISO 15189:2022, CAP Accredited
Central Reference Laboratory, Abu Dhabi, UAE | customercare@purelab.com | 800700LAB
LABORATORY REPORT — Accession: PUL-2026-88133
Patient: Layla Haddad | MRN: DHA-000077-XX | DOB: 1990-06-02 | Sex: F | Age: 36Y
Ordering Physician: Dr. S. Iyer | Collected on: 2026-09-11 09:02 | Reported on: 2026-09-11 15:20
TEST                                     RESULT   FLAG   UNITS      REFERENCE RANGE
Hemoglobin: 12.4 g/dL [12.0 - 15.5]
Potassium: 4.1 mmol/L [3.5 - 5.1]
Creatinine: 68 umol/L [45 - 90]
INR: 1.00 ratio [0.85 - 1.15]
Authorised by: Dr. L. Nair, Consultant Pathologist | Page 1 of 1 | purelab.com`;

const STALE_REPORT = `PureLab — A PureHealth Company | ISO 15189:2022, CAP Accredited
Central Reference Laboratory, Abu Dhabi, UAE | customercare@purelab.com | 800700LAB
LABORATORY REPORT — Accession: PUL-2026-84002
Patient: Rajesh Sharma | MRN: APL-440192-IN | DOB: 1962-01-25 | Sex: M | Age: 64Y
Ordering Physician: Dr. V. Reddy | Collected on: 2026-07-02 08:40 | Reported on: 2026-07-02 13:55
TEST                                     RESULT   FLAG   UNITS      REFERENCE RANGE
Hemoglobin: 10.2 L g/dL [13.0 - 17.5]
Potassium: 4.1 mmol/L [3.5 - 5.1]
Creatinine: 104 umol/L [60 - 110]
INR: 1.10 ratio [0.85 - 1.15]
Authorised by: Dr. L. Nair, Consultant Pathologist | Page 1 of 1 | purelab.com
Note: Supersedes preliminary report PUL-2026-83990.`;

export const PURELAB_DEMO_EMAILS: PureLabDemoEmail[] = [
  {
    id: 'mail-pul-88121',
    from: 'results@purelab.com',
    to: 'pac-labs@demo-clinic.ae',
    subject: 'Lab Report PUL-2026-88121 — DHA-892144-AE (Fatima Al-Mansoor)',
    receivedAtIso: '2026-09-10T15:02:00+04:00',
    attachmentName: 'PUL-2026-88121_Fatima.pdf',
    reportText: FATIMA_REPORT,
    note: 'SYNTHETIC DEMO: MRN matches the mock roster → exact auto-match candidate.',
  },
  {
    id: 'mail-pul-88133',
    from: 'results@purelab.com',
    to: 'pac-labs@demo-clinic.ae',
    subject: 'Lab Report PUL-2026-88133 — DHA-000077-XX (Layla Haddad)',
    receivedAtIso: '2026-09-11T15:44:00+04:00',
    attachmentName: 'PUL-2026-88133_Layla.pdf',
    reportText: UNKNOWN_REPORT,
    note: 'SYNTHETIC DEMO: MRN not on roster → lands in the review queue, never auto-attached.',
  },
  {
    id: 'mail-pul-84002',
    from: 'results@purelab.com',
    to: 'pac-labs@demo-clinic.ae',
    subject: 'Lab Report PUL-2026-84002 — APL-440192-IN (Rajesh Sharma)',
    receivedAtIso: '2026-07-02T14:10:00+04:00',
    attachmentName: 'PUL-2026-84002_Rajesh.pdf',
    reportText: STALE_REPORT,
    note: 'SYNTHETIC DEMO: matches roster but report is >30 days old → stale-lab warning demo.',
  },
];
