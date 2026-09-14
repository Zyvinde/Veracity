'use client';

import React, { useState } from 'react';
import { PatientCase, AttestationRecord } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import {
  ShieldCheck,
  X,
  FileCheck2,
  Lock,
  Stamp,
  Fingerprint,
  AlertTriangle,
  Sparkles,
  Check,
  Globe2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientCase;
  onAuthorize: (record: AttestationRecord) => void;
}

export const AttestationModal: React.FC<AttestationModalProps> = ({
  isOpen,
  onClose,
  patient,
  onAuthorize,
}) => {
  const { t } = useI18n();
  const [clause1, setClause1] = useState(true);
  const [clause2, setClause2] = useState(true);
  const [clause3, setClause3] = useState(true);
  const [physicianName, setPhysicianName] = useState(patient.anesthesiologist || 'Dr. Consultant Anesthesiologist');
  const [licenseNumber, setLicenseNumber] = useState(patient.mrn.includes('DHA') ? 'DHA-MED-2026-99014' : 'NMC-IN-2026-44019');
  const [isSigning, setIsSigning] = useState(false);

  if (!isOpen) return null;

  const allAgreed = clause1 && clause2 && clause3;

  const handleSignAndAuthorize = async () => {
    if (!allAgreed) return;

    setIsSigning(true);

    // Simulate cryptographic SHA-256 hash generation
    const rawData = `${patient.id}-${patient.mrn}-${patient.overallStatus}-${physicianName}-${Date.now()}`;
    const msgBuffer = new TextEncoder().encode(rawData);
    let hashHex = '';
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      hashHex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    }

    const record: AttestationRecord = {
      patientId: patient.id,
      anesthesiologistName: physicianName,
      licenseNumber: licenseNumber,
      timestampIso: new Date().toISOString(),
      signatureHash: `0x${hashHex.substring(0, 32)}...${hashHex.substring(hashHex.length - 8)}`,
      jurisdiction: patient.mrn.includes('DHA') ? 'UAE_MOHAP_DHA' : 'NMC_INDIA',
      acceptedClauses: [
        'Reviewed all algorithmic CDS biomarker range variances and verified clinical accuracy.',
        'Acknowledged medication hold times per ASA 2023 & ASRA 2025 guidelines.',
        'Certified statutory responsibility under UAE Decree-Law No. 4 / Indian Medical Council Act.',
      ],
      rulesEngineVersion: 'v2.5.0-Sovereign-CDS',
    };

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }

    setTimeout(() => {
      setIsSigning(false);
      onAuthorize(record);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden glass-strong rounded-2xl shadow-2xl my-6 animate-scale-in text-white/90">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/15 bg-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/15">
              <ShieldCheck className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <h2 className="font-serif italic text-lg tracking-wide text-white font-bold">
                {t('attestation.title')}
              </h2>
              <p className="text-xs text-white/70 font-mono">
                {t('attestation.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/60 hover:bg-white/15 hover:text-white/85 transition-all duration-150 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-4 text-xs font-sans">
          {/* Case Summary Callout */}
          <div className="rounded-xl border border-white/25 bg-white/10 p-4">
            <div className="grid grid-cols-2 gap-3 text-white/85 font-mono text-[11px]">
              <div>
                <span className="text-white/60">{t('attestation.patient')}</span> <strong className="text-white">{patient.name}</strong> ({patient.mrn})
              </div>
              <div>
                <span className="text-white/60">{t('attestation.procedure')}</span> <span className="text-white font-medium">{patient.procedureName}</span>
              </div>
              <div>
                <span className="text-white/60">{t('attestation.clearanceStatus')}</span>{' '}
                <span className={`font-bold ${
                  patient.overallStatus === 'GREEN_CLEARED'
                    ? 'text-emerald-200'
                    : patient.overallStatus === 'AMBER_CONDITIONAL'
                    ? 'text-amber-200'
                    : 'text-rose-200'
                }`}>
                  {patient.overallStatus.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-white/60">{t('attestation.swimLane')}</span> <span className="text-white font-bold">{patient.swimLane}</span>
              </div>
            </div>
          </div>

          {/* Statutory Oath & Required Affirmations */}
          <div className="space-y-2.5">
            <h3 className="font-serif italic font-bold text-white text-sm">
              {t('attestation.affirmations')}
            </h3>

            <label className="flex items-start gap-3 rounded-xl border border-white/25 bg-white/10 p-3.5 cursor-pointer hover:border-white/50 hover:bg-white/15 transition">
              <input
                type="checkbox"
                checked={clause1}
                onChange={(e) => setClause1(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/15 text-sky-200 focus:ring-white/60 cursor-pointer"
              />
              <span className="text-white/85 leading-relaxed text-xs">
                <strong className="text-white">{t('attestation.clause1')}</strong> {t('attestation.clause1Text')}
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-white/25 bg-white/10 p-3.5 cursor-pointer hover:border-white/50 hover:bg-white/15 transition">
              <input
                type="checkbox"
                checked={clause2}
                onChange={(e) => setClause2(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/15 text-sky-200 focus:ring-white/60 cursor-pointer"
              />
              <span className="text-white/85 leading-relaxed text-xs">
                <strong className="text-white">{t('attestation.clause2')}</strong> {t('attestation.clause2Text')}
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-white/25 bg-white/10 p-3.5 cursor-pointer hover:border-white/50 hover:bg-white/15 transition">
              <input
                type="checkbox"
                checked={clause3}
                onChange={(e) => setClause3(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/15 text-sky-200 focus:ring-white/60 cursor-pointer"
              />
              <span className="text-white/85 leading-relaxed text-xs">
                <strong className="text-white">{t('attestation.clause3')}</strong> {t('attestation.clause3Text')}
              </span>
            </label>
          </div>

          {/* Practitioner Credentials Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10.5px] font-mono text-white/70 mb-1 font-semibold uppercase">
                {t('attestation.physicianName')}
              </label>
              <input
                type="text"
                value={physicianName}
                onChange={(e) => setPhysicianName(e.target.value)}
                className="w-full rounded-xl glass-input border px-3 py-2 text-xs text-white focus:border-white/60 focus:ring-1 focus:ring-white/60 focus:outline-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-mono text-white/70 mb-1 font-semibold uppercase">
                {t('attestation.licenseId')}
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded-xl glass-input border px-3 py-2 text-xs text-white focus:border-white/60 focus:ring-1 focus:ring-white/60 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 bg-white/10 px-6 py-4">
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-white/70">
            <Lock className="h-3.5 w-3.5 text-sky-200" />
            <span>{t('attestation.sha256')}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl glass-input border px-4 py-2 text-xs font-semibold text-white/85 hover:text-white hover:bg-white/15 transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>

            <button
              type="button"
              disabled={!allAgreed || isSigning}
              onClick={handleSignAndAuthorize}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition ${
                allAgreed && !isSigning
                  ? 'bg-white hover:bg-white/85 text-slate-900 shadow-md shadow-black/40 cursor-pointer active:scale-95'
                  : 'bg-white/15 text-white/60 border border-white/25 cursor-not-allowed'
              }`}
            >
              {isSigning ? (
                <>
                  <Fingerprint className="h-4 w-4 animate-spin text-slate-900" />
                  <span>{t('attestation.computing')}</span>
                </>
              ) : (
                <>
                  <Stamp className="h-4 w-4 text-slate-900" />
                  <span>{t('attestation.signAuthorize')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttestationModal;
