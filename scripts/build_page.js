const fs = require('fs');
const path = require('path');

const content = `'use client';

import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { usePatientStore } from '@/lib/store';
import VeracityHeroLanding from '@/components/VeracityHeroLanding';
import TablerClinicalDashboard from '@/components/TablerClinicalDashboard';
import AttestationModal from '@/components/AttestationModal';
import PrintablePACSlip from '@/components/PrintablePACSlip';
import IngestionModal from '@/components/IngestionModal';
import { WhatsAppPACModal } from '@/components/WhatsAppPACModal';
import { AuditTrailDrawer } from '@/components/AuditTrailDrawer';
import { ScrollToTop } from '@/components/ui-utils';
import { logAuditEvent } from '@/lib/audit-logger';
import { AttestationRecord } from '@/lib/types';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';

function PageContent() {
  const {
    patients,
    getCurrentPatient,
    getCurrentAttestation,
    addAttestation,
    addPatient,
    fetchPatientsFromApi,
    fetchAttestationsFromApi,
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
  const [directView, setDirectView] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view) setDirectView(view);
    }
  }, []);

  const currentPatient = getCurrentPatient();
  const currentAttestation = getCurrentAttestation();
  const consoleRef = useRef<HTMLDivElement>(null);

  const scrollToConsole = useCallback(() => {
    consoleRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  // If user requested direct standalone view via ?view=
  if (directView === 'intake' || directView === 'questionnaire') {
    return (
      <div className="min-h-screen bg-[#0F172A] p-4 sm:p-8 text-white">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setDirectView(null);
                window.history.pushState({}, '', '/');
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              ← Back to Main Platform
            </button>
            <span className="text-xs font-mono text-slate-400">Patient Self-Assessment Portal</span>
          </div>
          <PatientPreOpQuestionnaire
            patientId={currentPatient?.id}
            isStandalonePage
          />
        </div>
      </div>
    );
  }

  if (directView === 'blood' || directView === 'mobile') {
    return (
      <div className="min-h-screen bg-[#0B1120] p-4 flex flex-col items-center justify-center text-white">
        <div className="w-full max-w-md space-y-3">
          <button
            type="button"
            onClick={() => {
              setDirectView(null);
              window.history.pushState({}, '', '/');
            }}
            className="text-xs font-bold text-blue-400 hover:text-blue-300"
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
      </div>
    );
  }

  if (directView === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#0F172A]">
        <TablerClinicalDashboard
          onOpenIngestion={() => setIsIngestionOpen(true)}
          onOpenAttestation={() => setIsAttestationOpen(true)}
          onOpenPrintSlip={() => setIsPrintSlipOpen(true)}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
          onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E293B]" dir="ltr">
      {/* 1. Pearl Health 1:1 Editorial Landing Page */}
      <VeracityHeroLanding
        onLaunchConsole={scrollToConsole}
        onOpenIngestion={() => setIsIngestionOpen(true)}
        onOpenAttestation={() => setIsAttestationOpen(true)}
      />

      {/* 2. Tabler UI Clean Solid-Color Clinical Dashboard Workspace */}
      <div ref={consoleRef} id="ot-console" className="scroll-mt-0 border-t border-[#E5E2DC]">
        <TablerClinicalDashboard
          onOpenIngestion={() => setIsIngestionOpen(true)}
          onOpenAttestation={() => setIsAttestationOpen(true)}
          onOpenPrintSlip={() => setIsPrintSlipOpen(true)}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
          onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
        />
      </div>

      {/* Modals & Drawers */}
      {isAttestationOpen && (
        <AttestationModal
          isOpen={isAttestationOpen}
          onClose={() => setIsAttestationOpen(false)}
          patient={currentPatient}
          onAuthorize={handleAuthorizeAttestation}
        />
      )}

      {isPrintSlipOpen && (
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

      {isWhatsAppOpen && (
        <WhatsAppPACModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          patient={currentPatient}
          attestationRecord={currentAttestation}
          onLogAudit={(action, details) => {
            logAuditEvent(action as any, currentPatient.id, details);
          }}
        />
      )}

      <AuditTrailDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        patientId={currentPatient?.id || ''}
      />

      <ScrollToTop />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Veracity Platform...</div>}>
      <PageContent />
    </Suspense>
  );
}
`;

fs.writeFileSync(path.join(__dirname, '../app/page.tsx'), content, 'utf8');
console.log('Successfully generated app/page.tsx with view parameter support');
