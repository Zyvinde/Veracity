'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluateASCExclusion } from '@/lib/rules-engine';
import { Building2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ASCEvaluatorProps {
  patient: PatientCase;
}

const ASCEvaluator: React.FC<ASCEvaluatorProps> = ({ patient }) => {
  const { t } = useI18n();
  const result = useMemo(() => evaluateASCExclusion(patient), [patient]);

  return (
    <section aria-label="ASC exclusion evaluation" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('asc.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('asc.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-[11px] font-bold ${
          result.excluded
            ? 'border-rose-300/40 bg-rose-500/20 text-rose-200'
            : 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
        }`}>
          {result.excluded ? <XCircle className="h-3 w-3 text-rose-200" /> : <CheckCircle2 className="h-3 w-3 text-emerald-200" />}
          {result.excluded ? t('asc.excluded') : t('asc.suitable')}
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Risk Score */}
        <div className="rounded-xl border glass-soft p-3.5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">Exclusion Risk Score</span>
          <div className="mt-2 relative">
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.riskScore >= 3 ? 'bg-rose-600' : result.riskScore >= 1 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (result.riskScore / 6) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-mono text-white/60">
              <span>Low Risk</span>
              <span className={`font-semibold ${result.riskScore >= 3 ? 'text-rose-200' : result.riskScore >= 1 ? 'text-amber-200' : 'text-emerald-200'}`}>
                Score: {result.riskScore}/6
              </span>
              <span>HIGH Risk</span>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="rounded-xl border glass-soft p-3.5">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/85">Exclusion Criteria Met</span>
          {result.reasons.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {result.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-rose-200 font-sans">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-rose-200" />
                  {reason}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-white/75 font-sans">No exclusion criteria identified. Patient is suitable for ambulatory surgery.</p>
          )}
        </div>
      </div>

      <div className={`mt-3 rounded-xl border p-3.5 ${
        result.excluded ? 'border-rose-300/40 bg-rose-500/20' : 'glass-soft'
      }`}>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">Recommendation</span>
        <p className="mt-1 text-xs text-white/85 font-sans leading-relaxed">{result.recommendation}</p>
      </div>
    </section>
  );
};

export default React.memo(ASCEvaluator);
