'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluatePostOpRisk } from '@/lib/rules-engine';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PostOpRiskCalculatorProps {
  patient: PatientCase;
}

const PostOpRiskCalculator: React.FC<PostOpRiskCalculatorProps> = ({ patient }) => {
  const { t } = useI18n();
  const result = useMemo(() => evaluatePostOpRisk(patient), [patient]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'VERY_HIGH': return { text: 'text-rose-200', bg: 'bg-rose-600', border: 'border-rose-300/40 bg-rose-500/20 font-bold' };
      case 'HIGH': return { text: 'text-rose-200', bg: 'bg-rose-600', border: 'border-rose-300/40 bg-rose-500/20 font-bold' };
      case 'MODERATE': return { text: 'text-amber-200', bg: 'bg-amber-500', border: 'border-amber-300/40 bg-amber-500/20 font-semibold' };
      default: return { text: 'text-emerald-200', bg: 'bg-emerald-500', border: 'border-emerald-300/40 bg-emerald-500/20 font-semibold' };
    }
  };

  const akiColor = getRiskColor(result.akiRisk);
  const vteColor = getRiskColor(result.vteRisk);

  return (
    <section aria-label="Post-operative risk assessment" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('postOpRisk.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('postOpRisk.subtitle')}</p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* AKI Risk */}
        <div className="rounded-xl border glass-soft p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white/85">AKI Risk (KDIGO)</span>
            <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${akiColor.text} ${akiColor.border}`}>
              {result.akiRisk}
            </span>
          </div>
          <div className="mt-3 relative">
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div className={`h-full rounded-full transition-all ${akiColor.bg}`} style={{ width: `${Math.min(100, (result.akiScore / 8) * 100)}%` }} />
            </div>
            <span className="mt-1 block text-right font-mono text-[9.5px] text-white/60">Score: {result.akiScore}/8</span>
          </div>
        </div>

        {/* VTE Risk */}
        <div className="rounded-xl border glass-soft p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white/85">VTE Risk (Caprini)</span>
            <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] ${vteColor.text} ${vteColor.border}`}>
              {result.vteRisk}
            </span>
          </div>
          <div className="mt-3 relative">
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div className={`h-full rounded-full transition-all ${vteColor.bg}`} style={{ width: `${Math.min(100, (result.vteScore / 8) * 100)}%` }} />
            </div>
            <span className="mt-1 block text-right font-mono text-[9.5px] text-white/60">Caprini: {result.capriniScore}</span>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {result.riskFactors.length > 0 && (
        <div className="mt-3 rounded-xl border glass-soft p-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-200">Identified Risk Factors</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.riskFactors.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md border border-amber-300/40 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-mono text-amber-800">
                <AlertTriangle className="h-2.5 w-2.5 text-amber-200" />
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-white/15 bg-white/10 p-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-200 mt-0.5 shrink-0" />
              <span className="text-[10.5px] text-white/85 font-sans">{rec}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default React.memo(PostOpRiskCalculator);
