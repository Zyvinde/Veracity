'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const directView = searchParams.get('view');
  const mrnParam = searchParams.get('mrn');

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

  useEffect(() => {
    if (directView === 'dashboard') {
      router.replace(mrnParam ? `/console?mrn=${encodeURIComponent(mrnParam)}` : '/console');
      return;
    }
    if (mrnParam) {
      const t = setTimeout(() => {
        try {
          selectPatientByMrn(decodeURIComponent(mrnParam));
        } catch {
          selectPatientByMrn(mrnParam);
        }
      }, 600);
      return () => clearTimeout(t);
    }
  }, [directView, mrnParam, selectPatientByMrn, router]);

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

  // Guard: for patient-specific sub-views, wait for patient store hydration
  if ((directView === 'intake' || directView === 'questionnaire' || directView === 'blood' || directView === 'mobile') && (!currentPatient || patients.length === 0)) {
    return (
      <div className="veracity-canvas min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl text-white font-serif italic text-2xl shadow-xl">
          V
        </div>
        <p className="text-sm font-semibold text-white">Loading House Health surgical roster…</p>
        <p className="text-xs text-white/50 font-mono">Fetching sovereign clinical cases</p>
      </div>
    );
  }

  // Patient self-assessment portal (?view=intake)
  if (directView === 'intake' || directView === 'questionnaire') {
    return (
      <div className="veracity-canvas min-h-screen px-3 py-4 sm:p-8 text-white w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4 w-full">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                router.push('/');
              }}
              className="text-xs font-mono text-sky-300 hover:text-sky-200 transition shrink-0"
            >
              ← Back to Main Platform
            </button>
            <span className="text-[11px] sm:text-xs font-mono text-white/50 truncate">Patient Self-Assessment Portal</span>
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
      <div className="veracity-canvas min-h-screen px-3 py-4 sm:p-6 flex flex-col items-center justify-center text-white w-full overflow-x-hidden">
        <div className="w-full max-w-md space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                router.push('/');
              }}
              className="text-xs font-mono text-sky-300 hover:text-sky-200 transition shrink-0"
            >
              ← Back to Main Platform
            </button>
            <span className="text-[11px] sm:text-xs font-mono text-white/50 truncate">In-OT View</span>
          </div>
          <MobileAnesthesiaBloodView
            patientId={currentPatient?.id}
            onOpenAttestation={() => setIsAttestationOpen(true)}
            onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
            onOpenQuestionnaire={() => router.push('/?view=intake')}
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
        <div className="veracity-canvas min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl text-white font-serif italic text-2xl shadow-lg">
            V
          </div>
          <p className="text-sm font-semibold text-white">Loading House Health Platform…</p>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
