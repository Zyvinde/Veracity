'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluatePenicillinDelabeling } from '@/lib/rules-engine';
import { ShieldAlert, CheckCircle2, AlertTriangle, Pill } from 'lucide-react';

interface PenicillinDelabelingProps {
  patient: PatientCase;
}

const PenicillinDelabeling: React.FC<PenicillinDelabelingProps> = ({ patient }) => {
  const { t } = useI18n();
  const result = useMemo(() => evaluatePenicillinDelabeling(patient), [patient]);

  const pcnAllergy = patient.allergies.find(
    a => a.allergen.toLowerCase().includes('penicillin') || a.allergen.toLowerCase().includes('amoxicillin')
  );

  if (!pcnAllergy) return null;

  return (
    <section aria-label="Penicillin allergy delabeling" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('penicillin.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('penicillin.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-[11px] font-bold ${
          result.eligibleForDelabeling
            ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
            : 'border-rose-300/40 bg-rose-500/20 text-rose-200'
        }`}>
          {result.eligibleForDelabeling ? <CheckCircle2 className="h-3 w-3 text-emerald-200" /> : <AlertTriangle className="h-3 w-3 text-rose-200" />}
          {result.eligibleForDelabeling ? t('penicillin.delabelingEligible') : t('penicillin.trueAllergyRisk')}
        </span>
      </div>

      {/* Documented Allergy */}
      <div className="mt-3.5 rounded-xl border glass-soft p-3.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">Documented Allergy</span>
        <div className="mt-1 flex items-center gap-2.5">
          <span className="font-sans text-xs font-semibold text-white">{pcnAllergy.allergen}</span>
          <span className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-medium ${
            pcnAllergy.severity === 'ANAPHYLAXIS' || pcnAllergy.severity === 'SEVERE' ? 'text-rose-200 border-rose-300/40 bg-rose-500/20' :
            pcnAllergy.severity === 'MODERATE' ? 'text-amber-200 border-amber-300/40 bg-amber-500/20' :
            'text-white/85 border-white/25 bg-white/15'
          }`}>
            {pcnAllergy.severity}
          </span>
        </div>
        <p className="mt-1 text-[10.5px] text-white/70 font-sans">Reaction: <span className="text-white/90 font-medium">{pcnAllergy.reaction}</span></p>
      </div>

      {/* Assessment */}
      <div className="mt-2.5 rounded-xl border glass-soft p-3.5">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/85">True Allergy Risk Assessment</span>
        <p className="mt-1 text-xs text-white/85 font-sans leading-relaxed">{result.trueAllergyRisk}</p>
      </div>

      {/* Recommendation */}
      <div className={`mt-2.5 rounded-xl border p-3.5 ${
        result.eligibleForDelabeling ? 'border-emerald-300/40 bg-emerald-500/20' : 'border-rose-300/40 bg-rose-500/20'
      }`}>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">Recommendation</span>
        <p className="mt-1 text-xs text-white/85 font-sans leading-relaxed">{result.recommendation}</p>
      </div>

      {/* Alternative Antibiotics */}
      <div className="mt-2.5 rounded-xl border glass-soft p-3.5">
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-white/85">
          <Pill className="h-3 w-3 text-sky-200" />
          Alternative Surgical Prophylaxis
        </span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {result.alternativeAntibiotics.map((abx, i) => (
            <span key={i} className="inline-flex items-center rounded-md glass-input border px-2 py-0.5 text-[9.5px] font-mono text-white/85 shadow-xs">
              {abx}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(PenicillinDelabeling);
