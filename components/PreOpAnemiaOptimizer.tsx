'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluateAnemiaOptimization } from '@/lib/rules-engine';
import { Beaker, CheckCircle2, AlertTriangle, Clock, TrendingUp, Info } from 'lucide-react';

interface PreOpAnemiaOptimizerProps {
  patient: PatientCase;
}

const PreOpAnemiaOptimizer: React.FC<PreOpAnemiaOptimizerProps> = ({ patient }) => {
  const { t } = useI18n();
  const result = useMemo(() => evaluateAnemiaOptimization(patient), [patient]);

  if (!result.isAnemic) return null;

  const severityConfig: Record<string, { color: string; label: string }> = {
    MILD: { color: 'text-amber-200 border-amber-300/40 bg-amber-500/20 font-semibold', label: t('anemia.mild') },
    MODERATE: { color: 'text-amber-800 border-amber-300 bg-amber-500/20 font-bold', label: t('anemia.moderate') },
    SEVERE: { color: 'text-rose-200 border-rose-300/40 bg-rose-500/20 font-bold', label: t('anemia.severe') },
  };

  const config = severityConfig[result.severity] || severityConfig.MILD;

  return (
    <section aria-label="Pre-operative anemia optimization" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Beaker className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('anemia.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('anemia.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-mono text-[11px] ${config.color}`}>
          <AlertTriangle className="h-3 w-3" />
          {config.label} — Hb {result.hemoglobin} g/dL
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Iron Protocol */}
        <div className="lg:col-span-2 rounded-xl border glass-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <Beaker className="h-3.5 w-3.5 text-sky-200" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white">{t('anemia.ironProtocol')}</span>
          </div>
          <p className="text-xs text-white/85 font-sans leading-relaxed">{result.ironProtocol}</p>
        </div>

        {/* Timeline & Expected Improvement */}
        <div className="space-y-2.5">
          <div className="rounded-xl border glass-soft p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-200" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-200">{t('anemia.timeline')}</span>
            </div>
            <p className="text-[11px] text-white/75 font-sans">{result.timeline}</p>
          </div>
          <div className="rounded-xl border glass-soft p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-sky-200" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-white">{t('anemia.expectedImprovement')}</span>
            </div>
            <p className="text-[11px] text-white/75 font-sans">{result.expectedImprovement}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/25 bg-sky-50/60 p-3.5 flex items-start gap-2.5">
        <CheckCircle2 className="h-4 w-4 text-sky-200 mt-0.5 shrink-0" />
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-800">Clinical Impact</span>
          <p className="mt-0.5 text-[11px] text-white/75 font-sans leading-relaxed">
            Pre-operative anemia correction reduces post-operative blood transfusions by up to 50% and improves surgical outcomes. Hb target: ≥12 g/dL (female) / ≥13 g/dL (male).
          </p>
        </div>
      </div>
    </section>
  );
};

export default React.memo(PreOpAnemiaOptimizer);
