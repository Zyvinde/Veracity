'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { predictPRBCUnits } from '@/lib/rules-engine';
import { FlaskConical, AlertTriangle } from 'lucide-react';

interface PRBCTransfusionPredictorProps {
  patient: PatientCase;
}

const PRBCTransfusionPredictor: React.FC<PRBCTransfusionPredictorProps> = ({ patient }) => {
  const { t } = useI18n();
  const result = useMemo(() => predictPRBCUnits(patient), [patient]);

  return (
    <section aria-label="PRBC transfusion prediction" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('transfusion.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('transfusion.subtitle')}</p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border glass-soft p-4 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">{t('transfusion.predictedUnits')}</span>
          <div className="mt-1 font-mono text-3xl font-bold text-white">{result.predictedUnits}</div>
          <span className="text-[10.5px] text-white/70 font-mono">{t('transfusion.unitsPrbc')}</span>
          <div className="mt-1 text-[9.5px] font-mono text-white/60">
            {t('transfusion.ci')}: [{result.confidenceInterval[0]} – {result.confidenceInterval[1]}]
          </div>
        </div>

        <div className="sm:col-span-2 rounded-xl border glass-soft p-4">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white">{t('transfusion.riskFactors')}</span>
          {result.riskFactors.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {result.riskFactors.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-white/85 font-sans">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] text-white/75 font-sans">{t('transfusion.noRisk')}</p>
          )}
        </div>
      </div>

      <div className={`mt-3 rounded-xl border p-3 ${
        result.predictedUnits > 0 ? 'border-amber-300/40 bg-amber-500/20' : 'glass-soft'
      }`}>
        <div className="flex items-center gap-2">
          {result.predictedUnits > 0 ? <AlertTriangle className="h-4 w-4 text-amber-200" /> : <FlaskConical className="h-4 w-4 text-sky-200" />}
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">{t('transfusion.recommendation')}</span>
        </div>
        <p className="mt-1 text-[11px] text-white/85 font-sans">{result.recommendation}</p>
      </div>
    </section>
  );
};

export default React.memo(PRBCTransfusionPredictor);
