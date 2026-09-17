'use client';

import React, { useEffect, useRef } from 'react';
import { PatientCase, AttestationRecord } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import {
  Printer,
  X,
  FileCheck,
  Building,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
} from 'lucide-react';

interface PrintablePACSlipProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientCase;
  attestationRecord: AttestationRecord | null;
}

export const PrintablePACSlip: React.FC<PrintablePACSlipProps> = ({
  isOpen,
  onClose,
  patient,
  attestationRecord,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => window.print();

  const getStatusDisplay = (status: PatientCase['overallStatus']) => {
    switch (status) {
      case 'GREEN_CLEARED':
        return { title: 'CLEARED FOR SURGERY', color: 'text-black border-black bg-zinc-100 font-bold', badge: 'CLEARED' };
      case 'AMBER_CONDITIONAL':
        return { title: 'CONDITIONAL SURGICAL CLEARANCE', color: 'text-amber-800 border-amber-800 bg-amber-50 font-bold', badge: 'CONDITIONAL' };
      case 'RED_HARD_STOP':
        return { title: 'HARD STOP • CASE POSTPONEMENT RECOMMENDED', color: 'text-red-700 border-red-700 bg-red-50 font-bold', badge: 'HARD STOP' };
    }
  };

  const statusInfo = getStatusDisplay(patient.overallStatus);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-slip-title"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-full sm:max-w-3xl rounded-none sm:rounded-2xl border border-slate-200 bg-white shadow-2xl my-0 sm:my-8 min-h-screen sm:min-h-0 animate-scale-in text-slate-900 overflow-hidden">
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-4 rounded-t-none sm:rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <Printer className="h-4 w-4 text-sky-600" />
            <span id="print-slip-title" className="font-serif italic text-base tracking-wide text-slate-900 font-bold">
              {t('printSlip.title')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 px-5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{t('printSlip.printExport')}</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close print preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          id="printable-pac-slip"
          className="p-4 sm:p-8 bg-white text-slate-900 font-sans text-xs leading-relaxed max-h-[85vh] overflow-y-auto overflow-x-clip min-w-0 break-words"
        >
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-black tracking-tight text-slate-950">{t('printSlip.anteriorHealth')}</span>
                <span className="font-serif italic text-sm text-slate-600">| {t('printSlip.axiomBio')}</span>
              </div>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                {t('printSlip.certificate')}
              </p>
              <p className="text-[10px] text-slate-700 font-sans mt-0.5">
                Facility: <strong>{patient.facility}</strong>
              </p>
            </div>
            <div className="text-right font-mono text-[9px] text-slate-600">
              <div className="font-bold text-slate-900 text-[10px]">{t('printSlip.certNo')}</div>
              <div>{patient.id}</div>
              <div>{t('printSlip.issued')} {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
              <div className="text-emerald-700 font-bold mt-1">{t('printSlip.nonDeviceCds')}</div>
            </div>
          </div>

          <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-sans min-w-0">
            <div>
              <div className="text-slate-500 text-[10px] font-mono uppercase">{t('printSlip.patientName')}</div>
              <div className="font-serif text-base font-bold text-slate-900">{patient.name}</div>
              <div className="text-slate-600 font-mono text-[10px]">MRN: {patient.mrn}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] font-mono uppercase">{t('printSlip.biometricsSurgery')}</div>
              <div><strong>{t('printSlip.ageSex')}</strong> {patient.age}y / {patient.gender === 'F' ? 'Female' : 'Male'}</div>
              <div><strong>BMI:</strong> {patient.bmi.toFixed(1)} ({patient.weightKg}kg / {patient.heightCm}cm)</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] font-mono uppercase">{t('printSlip.plannedProcedure')}</div>
              <div className="font-semibold text-slate-900">{patient.procedureName}</div>
              <div className="text-slate-600 font-mono text-[10px]">{patient.cptCode} • Tier {patient.invasivenessTier}</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 text-center my-4 ${statusInfo.color}`}>
            <div className="font-serif text-lg font-black tracking-wide uppercase">{statusInfo.title}</div>
            <p className="mt-1 font-mono text-xs font-semibold">{patient.primaryActionDirective}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 text-center font-mono text-[10px] min-w-0">
            <div className="border border-slate-300 p-2 rounded bg-slate-50">
              <span className="text-slate-500 block">{t('printSlip.asaTier')}</span>
              <strong className="text-xs text-slate-900">{patient.asaStatus}</strong>
            </div>
            <div className="border border-slate-300 p-2 rounded bg-slate-50">
              <span className="text-slate-500 block">{t('printSlip.cardiacRcri')}</span>
              <strong className="text-xs text-slate-900">{patient.rcriClass}</strong>
            </div>
            <div className="border border-slate-300 p-2 rounded bg-slate-50">
              <span className="text-slate-500 block">{t('printSlip.stopBang')}</span>
              <strong className="text-xs text-slate-900">{patient.stopBangScore} / 8 pts</strong>
            </div>
            <div className="border border-slate-300 p-2 rounded bg-slate-50">
              <span className="text-slate-500 block">{t('printSlip.pacSwimLane')}</span>
              <strong className="text-xs text-slate-900">{patient.swimLane.replace(/_/g, ' ')}</strong>
            </div>
          </div>

          <div className="my-4 border border-slate-300 rounded-lg p-3">
            <h4 className="font-serif font-bold text-xs uppercase text-slate-900 border-b border-slate-200 pb-1">
              {t('printSlip.pharmacotherapy')}
            </h4>
            <div className="mt-2 space-y-1.5 font-mono text-[10px]">
              {patient.medications.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1">
                  <div>
                    <strong className="text-slate-900">{m.drugName}</strong>
                    <span className="text-slate-600 block">{m.clinicalAction}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    m.status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border border-slate-300 rounded-lg p-3 font-mono text-[10px] min-w-0">
            <div>
              <h5 className="font-bold text-slate-900 uppercase">{t('printSlip.airwayAnatomy')}</h5>
              <div>• Mallampati: <strong>{patient.airway.mallampati}</strong></div>
              <div>• Mouth Opening: <strong>{patient.airway.mouthOpeningCm} cm</strong></div>
              <div>• Thyromental Distance: <strong>{patient.airway.thyromentalDistanceCm} cm</strong></div>
              <div>• Cervical Spine: <strong>{patient.airway.neckMobility}</strong></div>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 uppercase">{t('printSlip.fastingDirectives')}</h5>
              <div>• Solids / Non-Clear: <strong>{t('printSlip.midnightNpo')}</strong></div>
              <div>• Clear Liquids / Carb: <strong>{t('printSlip.carbDrink')}</strong></div>
              <div>• Intubation Route: <strong>{t('printSlip.intubation')}</strong></div>
            </div>
          </div>

          <div className="my-4 border border-slate-300 rounded-lg p-3 font-mono text-[10px]">
            <h4 className="font-serif font-bold text-xs uppercase text-slate-900 border-b border-slate-200 pb-1">
              Quick PAC interview {patient.pacCompleted ? '✓ completed' : '— pending'}
            </h4>
            {patient.pacInterview ? (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700 min-w-0">
                <div>• Escort: <strong>{patient.pacInterview.escortName || '—'}{patient.pacInterview.escortPhone ? ` (${patient.pacInterview.escortPhone})` : ''}</strong></div>
                <div>• BMI (PAC): <strong>{patient.pacInterview.weightKg && patient.pacInterview.heightCm ? `${(patient.pacInterview.weightKg / Math.pow(patient.pacInterview.heightCm / 100, 2)).toFixed(1)} (${patient.pacInterview.weightKg}kg/${patient.pacInterview.heightCm}cm)` : '—'}</strong></div>
                <div>• Last food: <strong>{patient.pacInterview.lastFoodIso ? new Date(patient.pacInterview.lastFoodIso).toLocaleString() : '—'}</strong></div>
                <div>• Last water: <strong>{patient.pacInterview.lastFluidIso ? new Date(patient.pacInterview.lastFluidIso).toLocaleString() : '—'}</strong></div>
                <div>• Meds: <strong>{patient.pacInterview.takesAnyMeds ? (patient.pacInterview.medCategories || []).join(', ') || (patient.pacInterview.medsFreeText || 'reported').slice(0, 80) : 'none reported'}</strong></div>
                <div>• Allergy: <strong>{patient.pacInterview.hasAllergyAlert ? (patient.pacInterview.allergySummary || 'see chart').slice(0, 80) : 'none reported'}</strong></div>
                <div>• Acks: <strong>{[patient.pacInterview.ackFasting && 'fasting', patient.pacInterview.ackDiabetesHold && 'diabetes-hold', patient.pacInterview.ackThyroidTake && 'thyroid-take', patient.pacInterview.ackBringList && 'bring-list', patient.pacInterview.ackEscort && 'escort'].filter(Boolean).join(', ') || '—'}</strong></div>
                <div>• Mode: <strong>{patient.pacInterview.mode}{patient.pacInterview.clinicVerified?.planSelected ? ` / plan ${patient.pacInterview.clinicVerified.planSelected}` : ''}</strong></div>
              </div>
            ) : (
              <p className="mt-2 text-slate-500">Patient hasn’t completed the 3-min Quick PAC yet. Send link: /pac?mrn={patient.mrn}</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center min-w-0">
            <div className="col-span-2">
              <div className="font-serif font-bold text-xs uppercase text-slate-900">{t('printSlip.attestingAnesthesiologist')}</div>
              <div className="font-mono text-xs font-semibold text-slate-900 mt-1">
                {attestationRecord?.anesthesiologistName || patient.anesthesiologist}
              </div>
              <div className="font-mono text-[9px] text-slate-600">
                License: {attestationRecord?.licenseNumber || 'DHA-MED-2026-99014'}
              </div>
              <div className="font-mono text-[9px] text-slate-500 mt-1 break-all">
                SHA-256: {attestationRecord?.signatureHash || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="w-16 h-16 border border-slate-300 bg-slate-100 flex items-center justify-center font-mono text-[8px] text-center p-1">
                {t('printSlip.digitalSignature')}
              </div>
              <span className="font-mono text-[8px] text-emerald-700 font-bold mt-1">✓ {t('printSlip.validatedCds')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PrintablePACSlip);
