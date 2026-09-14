'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { usePatientStore } from '@/lib/store';
import TablerClinicalDashboard from '@/components/TablerClinicalDashboard';
import AttestationModal from '@/components/AttestationModal';
import PrintablePACSlip from '@/components/PrintablePACSlip';
import IngestionModal from '@/components/IngestionModal';
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white font-serif italic text-2xl shadow-xl animate-pulse backdrop-blur-md">
          V
        </div>
        <p className="text-sm font-semibold text-white">Loading Veracity surgical roster…</p>
        <p className="text-xs text-white/50 font-mono">Fetching sovereign clinical cases</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full min-h-screen">
      <TablerClinicalDashboard
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
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white font-serif italic text-2xl shadow-xl animate-pulse backdrop-blur-md">
            V
          </div>
          <p className="text-sm font-semibold text-white">Loading Veracity console…</p>
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
