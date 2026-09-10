import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PatientCase, AirwayExam, AttestationRecord, ExtractedLabItem, PatientPreOpQuestionnaire, SpecialistReferral } from './types';
import { MOCK_PATIENT_LIST } from './mock-data';
import { evaluateOverallClearance, determinePACSwimLane, evaluateAirwayRisk, evaluateQuestionnaireFull } from './rules-engine';
import { logAuditEvent } from './audit-logger';

export type UserRole = 'coordinator' | 'anesthesiologist';

interface PatientStore {
  patients: PatientCase[];
  currentPatientId: string;
  selectedLabId: string | null;
  attestations: Record<string, AttestationRecord>;
  isProvenanceDrawerOpen: boolean;

  // PDF Document Viewer State
  uploadedPdfDataUrl: string | null;
  uploadedPdfFilename: string | null;

  // Demo User Role State
  userRole: UserRole;

  getCurrentPatient: () => PatientCase;
  getSelectedLab: () => ExtractedLabItem | null;
  getCurrentAttestation: () => AttestationRecord | null;

  selectPatient: (id: string) => void;
  selectPatientByMrn: (mrn: string) => boolean;
  selectLab: (id: string) => void;
  updatePatient: (patientId: string, updates: Partial<PatientCase>) => void;
  saveQuestionnaire: (patientId: string, questionnaire: PatientPreOpQuestionnaire) => void;
  generateIntakeLink: (patientId: string) => string;
  requestFitness: (patientId: string, specialty: string, reason: string) => void;
  setFitnessStatus: (
    patientId: string,
    referralId: string,
    status: SpecialistReferral['status'],
    notes?: string,
    decidedBy?: string
  ) => void;
  updateAirway: (patientId: string, airway: AirwayExam) => void;
  addAttestation: (record: AttestationRecord) => void;
  addPatient: (patient: PatientCase) => void;
  toggleProvenanceDrawer: () => void;
  setProvenanceDrawerOpen: (open: boolean) => void;
  setUploadedPdf: (dataUrl: string | null, filename?: string | null) => void;
  setUserRole: (role: UserRole) => void;
  fetchPatientsFromApi: () => Promise<void>;
  fetchAttestationsFromApi: () => Promise<void>;
}

export const usePatientStore = create<PatientStore>()(
  persist(
    (set, get) => ({
      patients: MOCK_PATIENT_LIST,
      currentPatientId: MOCK_PATIENT_LIST[0]?.id || 'PAT-DXB-2026-0319',
      selectedLabId: null,
      attestations: {},
      isProvenanceDrawerOpen: true,
      uploadedPdfDataUrl: null,
      uploadedPdfFilename: null,
      userRole: 'coordinator',

      getCurrentPatient: () => {
        const state = get();
        return state.patients.find((p) => p.id === state.currentPatientId) || state.patients[0];
      },

      getSelectedLab: () => {
        const patient = get().getCurrentPatient();
        if (!patient) return null;
        const labId = get().selectedLabId;
        if (!labId) return patient.labs[0] || null;
        return patient.labs.find((l) => l.id === labId) || patient.labs[0] || null;
      },

      getCurrentAttestation: () => {
        const state = get();
        return state.attestations[state.currentPatientId] || null;
      },

      selectPatient: (id) => {
        const state = get();
        const patient = state.patients.find((p) => p.id === id);
        if (patient) {
          set({ currentPatientId: id, selectedLabId: patient.labs[0]?.id || null });
          logAuditEvent('PATIENT_VIEWED', id, `Patient ${patient.name} selected for review`);
        }
      },

      selectPatientByMrn: (mrn) => {
        const state = get();
        const normalized = mrn.trim().toLowerCase();
        const patient = state.patients.find((p) => p.mrn.trim().toLowerCase() === normalized);
        if (patient) {
          set({ currentPatientId: patient.id, selectedLabId: patient.labs[0]?.id || null });
          logAuditEvent('PATIENT_VIEWED', patient.id, `Patient ${patient.name} opened via intake link (MRN ${mrn})`);
          return true;
        }
        return false;
      },

      selectLab: (id) => {
        set({ selectedLabId: id });
        const patient = get().getCurrentPatient();
        if (patient) {
          const lab = patient.labs.find((l) => l.id === id);
          if (lab) {
            logAuditEvent('LAB_INSPECTED', patient.id, `Lab ${lab.name} (${lab.loinc}) inspected - ${lab.value} ${lab.unit}`);
          }
        }
      },

      updatePatient: (patientId, updates) => {
        let updatedPatientToSave: PatientCase | null = null;
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const updated = { ...p, ...updates };
            const lane = determinePACSwimLane(updated);
            const { status, primaryDirective } = evaluateOverallClearance(updated);
            updatedPatientToSave = {
              ...updated,
              swimLane: lane,
              overallStatus: updates.overallStatus || status,
              primaryActionDirective: updates.primaryActionDirective || primaryDirective,
            };
            return updatedPatientToSave;
          }),
        }));

        if (updatedPatientToSave) {
          fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPatientToSave),
          }).catch((err) => console.warn('Sync patient updates to DB failed:', err));
        }

        logAuditEvent('PATIENT_VIEWED', patientId, `Patient case record updated via clinical intake`);
      },

      saveQuestionnaire: (patientId, questionnaire) => {
        const existing = get().patients.find((p) => p.id === patientId);
        const report = evaluateQuestionnaireFull(questionnaire, existing?.fitnessReferrals || []);
        let updatedPatientToSave: PatientCase | null = null;
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const updated: PatientCase = {
              ...p,
              questionnaire,
              questionnaireUpdatedAtIso: new Date().toISOString(),
              overallStatus: report.overallClearance,
              primaryActionDirective: report.primaryActionDirective,
            };
            const lane = determinePACSwimLane(updated);
            updatedPatientToSave = { ...updated, swimLane: lane };
            return updatedPatientToSave;
          }),
        }));

        if (updatedPatientToSave) {
          fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPatientToSave),
          }).catch((err) => console.warn('Sync questionnaire to DB failed:', err));
        }

        logAuditEvent(
          'PATIENT_VIEWED',
          patientId,
          `Pre-op questionnaire synced (${questionnaire.source}): ${report.overallClearance} — ${report.hardStopFlags.length} hard stops, ${report.conditionalFlags.length} conditionals`
        );
      },

      requestFitness: (patientId, specialty, reason) => {
        let saved: PatientCase | null = null;
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            if ((p.fitnessReferrals || []).some((r) => r.specialty === specialty)) return p;
            const referral: SpecialistReferral = {
              id: 'FIT-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
              specialty,
              reason,
              status: 'REQUESTED',
              requestedAtIso: new Date().toISOString(),
            };
            const updated: PatientCase = { ...p, fitnessReferrals: [...(p.fitnessReferrals || []), referral] };
            if (p.questionnaire) {
              const rep = evaluateQuestionnaireFull(p.questionnaire, updated.fitnessReferrals);
              updated.overallStatus = rep.overallClearance;
              updated.primaryActionDirective = rep.primaryActionDirective;
            } else {
              updated.overallStatus = 'RED_HARD_STOP';
              updated.primaryActionDirective = `FITNESS HOLD: Fitness REQUIRED from patient's ${specialty} doctor. Request consultation — surgery stays on hold until fitness is marked Cleared.`;
            }
            saved = updated;
            return updated;
          }),
        }));
        if (saved) {
          const body = saved as PatientCase;
          fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch((err) => console.warn('Sync fitness referral to DB failed:', err));
        }
        logAuditEvent('PATIENT_VIEWED', patientId, `Fitness consultation requested from ${specialty}: ${reason}`);
      },

      setFitnessStatus: (patientId, referralId, status, notes, decidedBy) => {
        let saved: PatientCase | null = null;
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const referrals = (p.fitnessReferrals || []).map((r) =>
              r.id === referralId
                ? { ...r, status, notes: notes ?? r.notes, decidedBy: decidedBy ?? r.decidedBy, decidedAtIso: new Date().toISOString() }
                : r
            );
            const updated: PatientCase = { ...p, fitnessReferrals: referrals };
            if (p.questionnaire) {
              const rep = evaluateQuestionnaireFull(p.questionnaire, referrals);
              updated.overallStatus = rep.overallClearance;
              updated.primaryActionDirective = rep.primaryActionDirective;
            } else if (!referrals.some((r) => r.status !== 'CLEARED')) {
              const { status: s, primaryDirective } = evaluateOverallClearance(updated);
              updated.overallStatus = s;
              updated.primaryActionDirective = primaryDirective;
            }
            saved = updated;
            return updated;
          }),
        }));
        if (saved) {
          const body = saved as PatientCase;
          fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch((err) => console.warn('Sync fitness status to DB failed:', err));
        }
        logAuditEvent('PATIENT_VIEWED', patientId, `Fitness referral ${referralId} marked ${status}${notes ? `: ${notes}` : ''}`);
      },

      generateIntakeLink: (patientId) => {
        const state = get();
        const patient = state.patients.find((p) => p.id === patientId) || state.patients[0];
        const token =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? (crypto as Crypto).randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === patient.id ? { ...p, intakeLinkToken: token, intakeLinkExpiresAtIso: expiresAt } : p
          ),
        }));
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/?view=intake&mrn=${encodeURIComponent(patient.mrn)}&token=${encodeURIComponent(token)}`;
      },

      updateAirway: (patientId, airway) => {
        const riskTier = evaluateAirwayRisk(airway);
        const airwayWithRisk: AirwayExam = { ...airway, riskTier };

        let updatedPatientToSave: PatientCase | null = null;

        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const updatedPatient: PatientCase = {
              ...p,
              airway: airwayWithRisk,
            };
            const lane = determinePACSwimLane(updatedPatient);
            const { status, primaryDirective } = evaluateOverallClearance(updatedPatient);
            updatedPatientToSave = {
              ...updatedPatient,
              swimLane: lane,
              overallStatus: status,
              primaryActionDirective: primaryDirective,
            };
            return updatedPatientToSave;
          }),
        }));

        if (updatedPatientToSave) {
          fetch(`/api/patients/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPatientToSave),
          }).catch((err) => console.warn('Sync patient to DB failed:', err));
        }

        logAuditEvent('AIRWAY_MODIFIED', patientId, `Airway exam updated: Mallampati ${airway.mallampati}, Risk ${riskTier}`);
      },

      addAttestation: (record) => {
        set((state) => ({
          attestations: { ...state.attestations, [record.patientId]: record },
        }));

        // Persist to server SQLite
        fetch('/api/attestations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        }).catch((err) => console.warn('Sync attestation to DB failed:', err));

        logAuditEvent('ATTESTATION_SIGNED', record.patientId, `Attestation signed by ${record.anesthesiologistName} (${record.licenseNumber})`);
      },

      addPatient: (patient) => {
        set((state) => {
          const exists = state.patients.some((p) => p.id === patient.id);
          const patients = exists
            ? state.patients.map((p) => (p.id === patient.id ? patient : p))
            : [patient, ...state.patients];
          return { patients, currentPatientId: patient.id, selectedLabId: patient.labs[0]?.id || null };
        });

        // Persist to server SQLite
        fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patient),
        }).catch((err) => console.warn('Sync patient to DB failed:', err));

        logAuditEvent('INGESTION_COMPLETE', patient.id, `New patient ${patient.name} ingested via pipeline`);
      },

      toggleProvenanceDrawer: () => set((s) => ({ isProvenanceDrawerOpen: !s.isProvenanceDrawerOpen })),
      setProvenanceDrawerOpen: (open) => set({ isProvenanceDrawerOpen: open }),

      setUploadedPdf: (dataUrl, filename) =>
        set({
          uploadedPdfDataUrl: dataUrl,
          uploadedPdfFilename: filename || (dataUrl ? 'Uploaded_Lab_Report.pdf' : null),
        }),

      setUserRole: (role) => set({ userRole: role }),

      fetchPatientsFromApi: async () => {
        try {
          const res = await fetch('/api/patients');
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.patients) && data.patients.length > 0) {
              set((state) => {
                const currentStillExists = data.patients.some((p: PatientCase) => p.id === state.currentPatientId);
                return {
                  patients: data.patients,
                  currentPatientId: currentStillExists ? state.currentPatientId : data.patients[0].id,
                };
              });
            }
          }
        } catch (err) {
          console.warn('Failed to fetch patients from /api/patients:', err);
        }
      },

      fetchAttestationsFromApi: async () => {
        try {
          const res = await fetch('/api/attestations');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.attestations) {
              set((state) => ({
                attestations: { ...state.attestations, ...data.attestations },
              }));
            }
          }
        } catch (err) {
          console.warn('Failed to fetch attestations from /api/attestations:', err);
        }
      },
    }),
    {
      name: 'anterior-health-patient-store-v3',
      partialize: (state) => ({
        patients: state.patients,
        currentPatientId: state.currentPatientId,
        attestations: state.attestations,
        isProvenanceDrawerOpen: state.isProvenanceDrawerOpen,
        uploadedPdfDataUrl: state.uploadedPdfDataUrl,
        uploadedPdfFilename: state.uploadedPdfFilename,
        userRole: state.userRole,
      }),
    }
  )
);
