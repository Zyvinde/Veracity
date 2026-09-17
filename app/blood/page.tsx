'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { usePatientStore } from '@/lib/store';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';
import AttestationModal from '@/components/AttestationModal';
import { WhatsAppPACModal } from '@/components/WhatsAppPACModal';
import { logAuditEvent } from '@/lib/audit-logger';
import { AttestationRecord } from '@/lib/types';

function BloodPageContent() {
  const router = useRouter();
  const {
    patients,
    getCurrentPatient,
    getCurrentAttestation,
    addAttestation,
    fetchPatientsFromApi,
    fetchAttestationsFromApi,
  } = usePatientStore();

  const [isAttestationOpen, setIsAttestationOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  useEffect(() => {
    fetchPatientsFromApi();
    fetchAttestationsFromApi();
  }, [fetchPatientsFromApi, fetchAttestationsFromApi]);

  const currentPatient = getCurrentPatient();
  const currentAttestation = getCurrentAttestation();

  const handleAuthorizeAttestation = (record: AttestationRecord) => {
    addAttestation(record);
    setIsAttestationOpen(false);
  };

  if (!currentPatient || patients.length === 0) {
    return (
      <div className="veracity-canvas min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl text-white font-serif italic text-2xl shadow-xl">
          V
        </div>
        <p className="text-sm font-semibold text-white">Loading In-OT Blood View…</p>
        <p className="text-xs text-white/50 font-mono">Connecting to sovereign blood bank</p>
      </div>
    );
  }

  return (
    <div className="veracity-canvas min-h-screen px-3 py-4 sm:p-6 flex flex-col items-center justify-start sm:justify-center text-white w-full overflow-x-hidden selection:bg-sky-500/30">
      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-300 hover:text-sky-200 transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/console"
              className="text-xs font-mono text-sky-400 hover:text-sky-300 transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] flex items-center shrink-0"
            >
              OT Console →
            </Link>
          </div>
        </div>

        <MobileAnesthesiaBloodView
          patientId={currentPatient.id}
          onOpenAttestation={() => setIsAttestationOpen(true)}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
          onOpenQuestionnaire={() => router.push('/intake')}
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
            logAuditEvent(action as any, currentPatient.id, details);
          }}
        />
      )}
    </div>
  );
}

export default function BloodPage() {
  return (
    <Suspense
      fallback={
        <div className="veracity-canvas min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
          <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl text-white font-serif italic text-2xl shadow-lg">
            V
          </div>
          <p className="text-sm font-semibold text-white">Loading In-OT Blood View…</p>
        </div>
      }
    >
      <BloodPageContent />
    </Suspense>
  );
}
