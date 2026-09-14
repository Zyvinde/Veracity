'use client';

import React, { useState } from 'react';
import type { PatientCase } from '@/lib/types';
import { computeFastingCompliance } from '@/lib/rules-engine';
import { AlertTriangle, Check, ChevronDown } from 'lucide-react';
import { formatClockTime } from './ui';

interface CaseFlightDeckProps {
  patient: PatientCase;
  attested: boolean;
  now: Date | null;
  onOpenAttestation: () => void;
  onOpenWhatsApp: () => void;
  onOpenIngestion: () => void;
  onOpenPrintSlip: () => void;
  onInspectPdf: () => void;
}

export function CaseFlightDeck({
  patient,
  attested,
  now,
  onOpenAttestation,
  onOpenWhatsApp,
  onInspectPdf,
}: CaseFlightDeckProps) {
  const [showAllMeds, setShowAllMeds] = useState(false);
  const meds = patient.medications || [];
  const visibleMeds = showAllMeds ? meds : meds.slice(0, 2);
  const hiddenCount = meds.length - visibleMeds.length;

  const fasting = now ? computeFastingCompliance(patient.scheduledTimeIso, now) : null;
  const elapsedSince = (deadlineIso: string): string => {
    if (!now) return '—';
    const d = new Date(deadlineIso);
    if (Number.isNaN(d.getTime())) return '—';
    return `${Math.max(0, (now.getTime() - d.getTime()) / 3600000).toFixed(1)}h elapsed`;
  };

  const genderLabel = patient.gender === 'F' ? 'Female' : 'Male';
  const hardStop = patient.overallStatus === 'RED_HARD_STOP';
  const conditional = patient.overallStatus === 'AMBER_CONDITIONAL';
  const blocker = meds.find((m) => m.status === 'HARD_STOP') || meds.find((m) => m.status === 'HOLD_REQUIRED');
  const tone = hardStop ? 'stop' : conditional ? 'hold' : 'clear';
  const toneBox =
    tone === 'stop'
      ? 'bg-[#FEF2F2] border-[#F87171]'
      : tone === 'hold'
      ? 'bg-[#FFFBEB] border-[#FCD34D]'
      : 'bg-[#ECFDF5] border-[#6EE7B7]';
  const toneText = tone === 'stop' ? 'text-[#DC2626]' : tone === 'hold' ? 'text-[#92400E]' : 'text-[#059669]';
  const toneLabel = tone === 'stop' ? 'HARD STOP' : tone === 'hold' ? 'CONDITIONAL' : 'CLEARED';

  return (
    <section
      aria-label="Active clearance flight deck"
      className="lg:col-span-7 bg-white border border-[#D3DCE2] rounded-xl p-6 shadow-xs flex flex-col justify-between gap-5 min-w-0 h-full"
    >
      <div className="min-w-0">
        {/* ── Selected patient header ── */}
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B6B78]">
          Active Clearance Dossier
        </p>
        <h2 className="mt-1 font-serif text-xl font-bold text-[#223140]">
          {patient.name}, {patient.age}{patient.gender === 'F' ? 'F' : 'M'}
        </h2>
        <p className="mt-1 font-mono text-[11px] text-[#5B6B78] tabular-nums">
          {patient.mrn} • {patient.asaStatus} • {patient.procedureName} • Scheduled {formatClockTime(patient.scheduledTimeIso)}
        </p>
        <p className="mt-0.5 font-sans text-xs text-[#5B6B78]">
          {patient.age}Y · {genderLabel}
        </p>

        {/* ── Directive box ── */}
        <div className={`rounded-lg p-3 mt-3 flex items-start gap-3 border ${toneBox}`}>
          <AlertTriangle
            className={`h-4 w-4 mt-0.5 shrink-0 ${tone === 'clear' ? 'text-[#059669]' : tone === 'hold' ? 'text-[#D97706]' : 'text-[#DC2626]'}`}
            aria-hidden="true"
          />
          <p className={`font-sans text-[13px] leading-relaxed ${toneText}`}>
            <strong className="font-bold">{toneLabel}: </strong>
            {blocker
              ? `${blocker.drugName} hold violation — elapsed ${blocker.lastDoseHoursAgo}h of ${blocker.requiredHoldHours}h required. ${patient.primaryActionDirective}`
              : patient.primaryActionDirective}
          </p>
        </div>

        {/* ── Medication washout tracker ── */}
        <h3 className="mt-5 font-serif text-lg font-bold text-[#223140]">Medication Washout Tracker</h3>
        {meds.length === 0 ? (
          <p className="mt-2 rounded-lg border border-[#6EE7B7] bg-[#ECFDF5] p-3 font-sans text-xs font-semibold text-[#059669]">
            No home medications on file — nothing to hold.
          </p>
        ) : (
          <div className="mt-2 space-y-2.5">
            {visibleMeds.map((m) => {
              const pct =
                m.requiredHoldHours === 0
                  ? 100
                  : Math.min(100, Math.round((m.lastDoseHoursAgo / m.requiredHoldHours) * 100));
              const nonCompliant = m.status !== 'CLEARED';
              return (
                <div key={m.id} className="rounded-lg border border-[#D3DCE2] bg-[#EFF3F6] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-[13px] font-bold text-[#223140]">
                      {m.drugName}{' '}
                      <span className="font-mono text-[10px] font-medium text-[#5B6B78]">ASRA 2025</span>
                    </p>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border whitespace-nowrap ${
                        nonCompliant
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#F87171]'
                          : 'bg-[#ECFDF5] text-[#059669] border-[#6EE7B7]'
                      }`}
                    >
                      {nonCompliant ? 'Non-Compliant' : 'Compliant'}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#5B6B78] tabular-nums">
                    Elapsed {m.lastDoseHoursAgo} hrs / {m.requiredHoldHours} hrs target
                  </p>
                  <div className="w-full bg-[#D3DCE2] h-2 rounded-full mt-2" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.drugName} hold progress`}>
                    <div
                      className={`h-2 rounded-full ${nonCompliant ? 'bg-[#DC2626]' : 'bg-[#059669]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllMeds((v) => !v)}
                aria-expanded={showAllMeds}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-[#D3DCE2] bg-white py-2 font-sans text-xs font-semibold text-[#223140] transition hover:bg-[#EFF3F6]"
              >
                {showAllMeds ? 'Show fewer' : `+ Show ${hiddenCount} More Drug Hold${hiddenCount > 1 ? 's' : ''}`}
                <ChevronDown className={`h-3.5 w-3.5 transition ${showAllMeds ? 'rotate-180' : ''}`} aria-hidden="true" />
                {!showAllMeds && <span aria-hidden="true">▼</span>}
              </button>
            )}
          </div>
        )}

        {/* ── ASA fasting & NPO box ── */}
        <h3 className="mt-5 font-serif text-lg font-bold text-[#223140]">ASA Fasting &amp; NPO</h3>
        {!fasting ? (
          <p className="mt-2 font-mono text-xs text-[#5B6B78]" aria-busy="true">
            Computing fasting windows…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-lg border border-[#D3DCE2] bg-[#EFF3F6] p-3">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-[#5B6B78]">Solids</p>
              <p className="mt-1 flex items-center gap-1.5 font-sans text-[13px] font-bold text-[#223140]">
                {fasting.npoSolidsCompliant ? (
                  <>
                    <Check className="h-4 w-4 text-[#059669]" aria-hidden="true" /> Passed
                  </>
                ) : (
                  <>Pending</>
                )}
                <span className="font-mono text-[10px] font-medium text-[#5B6B78] tabular-nums">
                  ({elapsedSince(fasting.solidsDeadline)})
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-[#D3DCE2] bg-[#EFF3F6] p-3">
              <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-[#5B6B78]">Non-clear liquids</p>
              <p className="mt-1 flex items-center gap-1.5 font-sans text-[13px] font-bold text-[#223140]">
                {fasting.npoLiquidsCompliant ? (
                  <>
                    <Check className="h-4 w-4 text-[#059669]" aria-hidden="true" /> Compliant
                  </>
                ) : (
                  <>Compliant <span className="font-mono text-[10px] font-medium text-[#5B6B78]">(Plain water only)</span></>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Action CTAs bar ── */}
      <div className="mt-6 pt-4 border-t border-[#D3DCE2] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onInspectPdf}
          className="bg-white border border-[#D3DCE2] text-[#223140] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#EFF3F6] transition font-sans whitespace-nowrap"
        >
          Inspect Raw Lab PDF ↗
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="bg-white border border-[#D3DCE2] text-[#223140] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#EFF3F6] transition font-sans whitespace-nowrap"
          >
            Dispatch WhatsApp PAC Nudge
          </button>
          <button
            type="button"
            onClick={onOpenAttestation}
            disabled={attested}
            className="bg-[#B3871C] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#8F6E14] shadow-sm transition font-sans whitespace-nowrap disabled:opacity-60"
          >
            {attested ? 'Attestation Signed' : '1-Tap Physician Attestation'}
          </button>
        </div>
      </div>
    </section>
  );
}
