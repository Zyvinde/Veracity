'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluateNeuraxialFeasibility } from '@/lib/rules-engine';
import { Bone, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface NeuraxialFeasibilityProps {
  patient: PatientCase;
}

const NeuraxialFeasibility: React.FC<NeuraxialFeasibilityProps> = ({ patient }) => {
  const { t } = useI18n();
  const result = useMemo(() => evaluateNeuraxialFeasibility(patient), [patient]);

  const plt = patient.labs.find(l => l.name.toLowerCase().includes('platelet'));
  const inr = patient.labs.find(l => l.name.toLowerCase().includes('inr'));
  const doac = patient.medications.find(m => m.category === 'DOAC');

  return (
    <section aria-label="Neuraxial feasibility" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Bone className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('neuraxial.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('neuraxial.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold ${
          result.eligible
            ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
            : 'border-rose-300/40 bg-rose-500/20 text-rose-200'
        }`}>
          {result.eligible ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" /> : <ShieldAlert className="h-3.5 w-3.5 text-rose-200" />}
          {result.eligible ? t('neuraxial.cleared') : t('neuraxial.contraindicated')}
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Platelets */}
        <div className={`rounded-xl border p-3.5 ${(plt?.value ?? 200000) < 70000 ? 'border-rose-300/40 bg-rose-500/20' : 'glass-soft'}`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">{t('neuraxial.plateletCount')}</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`font-mono text-base font-bold ${(plt?.value ?? 200000) < 70000 ? 'text-rose-200' : 'text-white'}`}>
              {plt ? (plt.value >= 1000 ? `${Math.round(plt.value / 1000)}k` : plt.value) : '—'}
            </span>
            <span className="text-[10.5px] text-white/70 font-mono">/µL</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-mono">
            <span className="text-white/60">{t('neuraxial.threshold')}:</span>
            <span className="text-white/85 font-semibold">≥70,000</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {(plt?.value ?? 200000) >= 70000 ? (
              <><CheckCircle2 className="h-3 w-3 text-emerald-200" /><span className="text-[10.5px] text-emerald-200 font-semibold">{t('neuraxial.met')}</span></>
            ) : (
              <><XCircle className="h-3 w-3 text-rose-200" /><span className="text-[10.5px] text-rose-200 font-bold">{t('neuraxial.belowThreshold')}</span></>
            )}
          </div>
        </div>

        {/* INR */}
        <div className={`rounded-xl border p-3.5 ${(inr?.value ?? 1.0) > 1.4 ? 'border-rose-300/40 bg-rose-500/20' : 'glass-soft'}`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">INR (Prothrombin Time)</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`font-mono text-base font-bold ${(inr?.value ?? 1.0) > 1.4 ? 'text-rose-200' : 'text-white'}`}>
              {inr?.value.toFixed(2) ?? '—'}
            </span>
            <span className="text-[10.5px] text-white/70 font-mono">ratio</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-mono">
            <span className="text-white/60">Threshold:</span>
            <span className="text-white/85 font-semibold">≤1.40</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            {(inr?.value ?? 1.0) <= 1.4 ? (
              <><CheckCircle2 className="h-3 w-3 text-emerald-200" /><span className="text-[10.5px] text-emerald-200 font-semibold">Met</span></>
            ) : (
              <><XCircle className="h-3 w-3 text-rose-200" /><span className="text-[10.5px] text-rose-200 font-bold">Above threshold</span></>
            )}
          </div>
        </div>

        {/* DOAC Hold */}
        <div className={`rounded-xl border p-3.5 ${doac && doac.lastDoseHoursAgo < 72 ? 'border-rose-300/40 bg-rose-500/20' : 'glass-soft'}`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">DOAC Hold Time</span>
          {doac ? (
            <>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`font-mono text-base font-bold ${doac.lastDoseHoursAgo < 72 ? 'text-rose-200' : 'text-white'}`}>
                  {doac.lastDoseHoursAgo}h
                </span>
                <span className="text-[10.5px] text-white/70 font-mono">elapsed</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-mono">
                <span className="text-white/60">Required:</span>
                <span className="text-white/85 font-semibold">≥72h for neuraxial</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                {doac.lastDoseHoursAgo >= 72 ? (
                  <><CheckCircle2 className="h-3 w-3 text-emerald-200" /><span className="text-[10.5px] text-emerald-200 font-semibold">Washout complete</span></>
                ) : (
                  <><XCircle className="h-3 w-3 text-rose-200" /><span className="text-[10.5px] text-rose-200 font-bold">{72 - doac.lastDoseHoursAgo}h remaining</span></>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 font-mono text-base font-bold text-white">N/A</div>
              <span className="text-[10.5px] text-white/70">No active DOAC</span>
              <div className="mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-200" />
                <span className="text-[10.5px] text-emerald-200 font-semibold">No DOAC concern</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <div className={`mt-3.5 rounded-xl border p-3.5 ${
        result.eligible
          ? 'border-emerald-300/40 bg-emerald-500/20'
          : 'border-rose-300/40 bg-rose-500/20'
      }`}>
        <div className="flex items-center gap-2">
          {result.eligible ? (
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-rose-200" />
          )}
          <span className={`font-mono text-xs font-bold uppercase tracking-wider ${result.eligible ? 'text-emerald-100' : 'text-rose-800'}`}>
            ASRA Recommendation
          </span>
        </div>
        <p className="mt-1 text-xs text-white/85 font-sans leading-relaxed">{result.recommendation}</p>
        {result.hardStopReasons.length > 0 && (
          <ul className="mt-2 space-y-1">
            {result.hardStopReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-rose-200 font-sans">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-200" />
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default React.memo(NeuraxialFeasibility);
