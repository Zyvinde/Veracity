'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { generateMorningMedDirectives } from '@/lib/rules-engine';
import { Pill, CheckCircle2, XCircle, AlertTriangle, Droplets } from 'lucide-react';

interface MorningMedDirectivesProps {
  patient: PatientCase;
}

const MorningMedDirectives: React.FC<MorningMedDirectivesProps> = ({ patient }) => {
  const { t } = useI18n();
  const directives = useMemo(() => generateMorningMedDirectives(patient), [patient]);

  const actionConfig = {
    TAKE_WITH_SIP: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />, color: 'border-emerald-300/40 bg-emerald-500/20', label: t('morningMeds.take'), labelColor: 'text-emerald-200 bg-emerald-500/20 border-emerald-300/40 font-semibold' },
    HOLD: { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-200" />, color: 'border-amber-300/40 bg-amber-500/20', label: t('morningMeds.hold'), labelColor: 'text-amber-200 bg-amber-500/20 border-amber-300/40 font-semibold' },
    OMIT: { icon: <XCircle className="h-3.5 w-3.5 text-rose-200" />, color: 'border-rose-300/40 bg-rose-500/20', label: t('morningMeds.omit'), labelColor: 'text-rose-200 bg-rose-500/20 border-rose-300/40 font-bold' },
    MODIFIED_DOSE: { icon: <Droplets className="h-3.5 w-3.5 text-sky-200" />, color: 'border-white/30 bg-sky-50/60', label: 'MODIFY', labelColor: 'text-white bg-white/15 border-white/30 font-semibold' },
  };

  return (
    <section aria-label="Morning medication directives" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('morningMeds.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('morningMeds.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9.5px]">
          <span className="flex items-center gap-1 text-emerald-200"><CheckCircle2 className="h-2.5 w-2.5" /> {t('morningMeds.take')}</span>
          <span className="flex items-center gap-1 text-amber-200"><AlertTriangle className="h-2.5 w-2.5" /> {t('morningMeds.hold')}</span>
          <span className="flex items-center gap-1 text-rose-200"><XCircle className="h-2.5 w-2.5" /> {t('morningMeds.omit')}</span>
        </div>
      </div>

      <div className="mt-3.5 space-y-2">
        {directives.map((dir, i) => {
          const config = actionConfig[dir.action];
          return (
            <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${config.color}`}>
              {config.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sans text-xs font-semibold text-white">{dir.drugName}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9.5px] ${config.labelColor}`}>
                    {config.label}
                  </span>
                  {dir.critical && (
                    <span className="rounded-full border border-rose-300/40 bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-rose-200 uppercase">
                      Critical
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-white/75 font-sans leading-relaxed">{dir.reason}</p>
                <p className="mt-0.5 text-[10.5px] text-white/70 font-mono">{dir.timing}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(MorningMedDirectives);
