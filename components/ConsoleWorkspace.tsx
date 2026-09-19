'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePatientStore } from '@/lib/store';
import VeracityFlightDeck from '@/components/VeracityFlightDeck';
import AttestationModal from '@/components/AttestationModal';
import PrintablePACSlip from '@/components/PrintablePACSlip';
const IngestionModal = dynamic(() => import('@/components/IngestionModal'), { ssr: false });
import { WhatsAppPACModal } from '@/components/WhatsAppPACModal';
import { AuditTrailDrawer } from '@/components/AuditTrailDrawer';
import { logAuditEvent } from '@/lib/audit-logger';
import { AttestationRecord } from '@/lib/types';
import ConsoleFiberBackground from '@/components/ConsoleFiberBackground';

function ConsoleWorkspaceContent() {
  const {
    patients,
    getCurrentPatient,
    getCurrentAttestation,
    addAttestation,
    addPatient,
    fetchPatientsFromApi,
    fetchAttestationsFromApi,
    selectPatientByMrn,
  } = usePatientStore();

  useEffect(() => {
    fetchPatientsFromApi();
    fetchAttestationsFromApi();
  }, [fetchPatientsFromApi, fetchAttestationsFromApi]);

  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isAttestationOpen, setIsAttestationOpen] = useState(false);
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Support deep-linking a case: /console?mrn=XXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mrn = params.get('mrn');
      if (mrn) {
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
  }, [selectPatientByMrn]);

  const currentPatient = getCurrentPatient();
  const currentAttestation = getCurrentAttestation();

  // Close any open modal/drawer with Escape + lock body scroll while a modal is open
  const anyModalOpen = isIngestionOpen || isAttestationOpen || isPrintSlipOpen || isWhatsAppOpen;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsIngestionOpen(false);
        setIsAttestationOpen(false);
        setIsPrintSlipOpen(false);
        setIsWhatsAppOpen(false);
        setIsAuditDrawerOpen(false);
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

  const handleAuthorizeAttestation = useCallback(
    (record: AttestationRecord) => {
      addAttestation(record);
      setIsAttestationOpen(false);
      setIsPrintSlipOpen(true);
    },
    [addAttestation]
  );

  const handleIngestComplete = useCallback(
    (newPatient: Parameters<typeof addPatient>[0]) => {
      addPatient(newPatient);
      setIsIngestionOpen(false);
    },
    [addPatient]
  );

  // Guard: store hydrates async — show branded loader instead of crashing on undefined patient
  if (!currentPatient || patients.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-[#1a1a1a]">
        <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1a1a] text-white font-serif italic text-2xl shadow-sm">
          V
        </div>
        <p className="text-sm font-semibold text-[#1a1a1a]">Loading House Health surgical roster…</p>
        <p className="text-xs text-[#6b706b] font-mono">Loading MVP demo with mock cases</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-full min-w-0 overflow-x-clip min-h-screen">
      <div role="note" aria-label="MVP prototype notice" className="mx-auto w-full max-w-[1200px] px-4 pt-4 sm:px-6">
        <div className="rounded-full border border-[#9a6700]/30 bg-[#9a6700]/[0.08] px-3 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-[#7a5200]">
          MVP Prototype — mock cases, demo auth, local storage · Not for clinical use
        </div>
      </div>
      <VeracityFlightDeck
        onOpenIngestion={() => setIsIngestionOpen(true)}
        onOpenAttestation={() => setIsAttestationOpen(true)}
        onOpenPrintSlip={() => setIsPrintSlipOpen(true)}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
      />

      {/* Modals & Drawers */}
      {isAttestationOpen && currentPatient && (
        <AttestationModal
          isOpen={isAttestationOpen}
          onClose={() => setIsAttestationOpen(false)}
          patient={currentPatient}
          onAuthorize={handleAuthorizeAttestation}
        />
      )}

      {isPrintSlipOpen && currentPatient && (
        <PrintablePACSlip
          isOpen={isPrintSlipOpen}
          onClose={() => setIsPrintSlipOpen(false)}
          patient={currentPatient}
          attestationRecord={currentAttestation}
        />
      )}

      {isIngestionOpen && (
        <IngestionModal
          isOpen={isIngestionOpen}
          onClose={() => setIsIngestionOpen(false)}
          onIngestComplete={handleIngestComplete}
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

      <AuditTrailDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        patientId={currentPatient?.id || ''}
      />
    </div>
  );
}

export default function ConsoleWorkspace() {
  return (
      <Suspense
      fallback={
      <div className="min-h-screen w-full max-w-full min-w-0 overflow-x-clip flex flex-col items-center justify-center gap-4 px-4 py-8 sm:p-8 text-center text-[#1a1a1a]">
          <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1a1a] text-white font-serif italic text-2xl shadow-sm">
            V
          </div>
          <p className="text-sm font-semibold text-[#1a1a1a]">Loading House Health console…</p>
        </div>
      }
    >
      <ConsoleWorkspaceContent />
    </Suspense>
  );
}

export function ConsoleBackdrop() {
  return <ConsoleFiberBackground fixed blurred />;
}
