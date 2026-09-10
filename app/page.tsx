'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/lib/store';
import NovaCinematicLanding from '@/components/NovaCinematicLanding';
import AttestationModal from '@/components/AttestationModal';
import { WhatsAppPACModal } from '@/components/WhatsAppPACModal';
import { logAuditEvent } from '@/lib/audit-logger';
import { AttestationRecord } from '@/lib/types';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';

function PageContent() {
  const router = useRouter();
  const {
    patients,
    getCurrentPatient,
    getCurrentAttestation,
    addAttestation,
    fetchPatientsFromApi,
    fetchAttestationsFromApi,
    selectPatientByMrn,
  } = usePatientStore();

  useEffect(() => {
    fetchPatientsFromApi();
    fetchAttestationsFromApi();
  }, [fetchPatientsFromApi, fetchAttestationsFromApi]);

  const [isAttestationOpen, setIsAttestationOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [directView, setDirectView] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const mrn = params.get('mrn');
      // The OT console lives on its own page now — forward legacy links
      if (view === 'dashboard') {
        router.replace(mrn ? `/console?mrn=${encodeURIComponent(mrn)}` : '/console');
        return;
      }
      if (view) setDirectView(view);
      if (mrn) {
        // Defer until patients hydrated from API/store
        const t = setTimeout(() => {
          try {
            selectPatientByMrn(decodeURIComponent(mrn));
          } catch {
            selectPatientByMrn(mrn);
          }
        }, 600);
        return () => clearTimeout(t);
      }
    }
  }, [selectPatientByMrn, router]);

  const currentPatient = getCurrentPatient();
  const currentAttestation = getCurrentAttestation();

  // Close any open modal with Escape + lock body scroll while a modal is open
  const anyModalOpen = isAttestationOpen || isWhatsAppOpen;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAttestationOpen(false);
        setIsWhatsAppOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyModalOpen]);

  const handleAuthorizeAttestation = (record: AttestationRecord) => {
    addAttestation(record);
    setIsAttestationOpen(false);
  };

  // Guard: store hydrates async — show branded loader instead of crashing on undefined patient
  if (!currentPatient || patients.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white font-serif italic text-2xl shadow-xl animate-pulse backdrop-blur-md">
          V
        </div>
        <p className="text-sm font-semibold text-white">Loading Veracity surgical roster…</p>
        <p className="text-xs text-white/50 font-mono">Fetching sovereign clinical cases</p>
      </div>
    );
  }

  // Patient self-assessment portal (?view=intake)
  if (directView === 'intake' || directView === 'questionnaire') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8 text-white">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setDirectView(null);
                window.history.pushState({}, '', '/');
              }}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition"
            >
              ← Back to Main Platform
            </button>
            <span className="text-xs font-mono text-white/50">Patient Self-Assessment Portal</span>
          </div>
          <PatientPreOpQuestionnaire
            patientId={currentPatient?.id}
            isStandalonePage
          />
        </div>
      </div>
    );
  }

  // In-OT mobile viewport (?view=blood)
  if (directView === 'blood' || directView === 'mobile') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 flex flex-col items-center justify-center text-white">
        <div className="w-full max-w-md space-y-3">
          <button
            type="button"
            onClick={() => {
              setDirectView(null);
              window.history.pushState({}, '', '/');
            }}
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition"
          >
            ← Back to Main Platform
          </button>
          <MobileAnesthesiaBloodView
            patientId={currentPatient?.id}
            onOpenAttestation={() => setIsAttestationOpen(true)}
            onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
            onOpenQuestionnaire={() => setDirectView('intake')}
          />
        </div>

        {isAttestationOpen && currentPatient && (
          <AttestationModal
            isOpen={isAttestationOpen}
            onClose={() => setIsAttestationOpen(false)}
            patient={currentPatient}
            onAuthorize={handleAuthorizeAttestation}
          />
        )}

        {isWhatsAppOpen && currentPatient && (
          <WhatsAppPACModal
            isOpen={isWhatsAppOpen}
            onClose={() => setIsWhatsAppOpen(false)}
            patient={currentPatient}
            attestationRecord={currentAttestation}
            onLogAudit={(action, details) => {
              logAuditEvent(action as any, currentPatient?.id || 'unknown', details);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative selection:bg-white/20" dir="ltr">
      <div className="relative z-10">
        <NovaCinematicLanding />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#223140] text-white font-bold text-xl shadow-lg animate-pulse">
            V
          </div>
          <p className="text-sm font-semibold text-white">Loading Veracity Platform…</p>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
