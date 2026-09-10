'use client';

import React from 'react';
import { DrugInteraction } from '@/lib/types';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface DrugInteractionAlertProps {
  interactions: DrugInteraction[];
}

const SEVERITY_CONFIG = {
  MINOR: {
    label: 'MINOR',
    color: 'text-amber-200 bg-amber-500/20 border-amber-300/40',
    border: 'border-white/25',
    bg: 'bg-white/10',
  },
  MODERATE: {
    label: 'MODERATE',
    color: 'text-amber-800 bg-amber-500/20 border-amber-300/40',
    border: 'border-amber-300/40',
    bg: 'bg-amber-50/40',
  },
  MAJOR: {
    label: 'MAJOR',
    color: 'text-rose-200 bg-rose-500/20 border-rose-300/40 font-bold',
    border: 'border-rose-300/40',
    bg: 'bg-rose-50/40',
  },
  CONTRAINDICATED: {
    label: 'CONTRAINDICATED',
    color: 'text-white bg-rose-600 border-rose-600 font-bold',
    border: 'border-rose-300',
    bg: 'bg-rose-500/20',
  },
};

export const DrugInteractionAlert: React.FC<DrugInteractionAlertProps> = ({ interactions }) => {
  const { t } = useI18n();

  if (!interactions || interactions.length === 0) return null;

  const hasContraindicated = interactions.some((i) => i.severity === 'CONTRAINDICATED');
  const hasMajor = interactions.some((i) => i.severity === 'MAJOR');

  return (
    <div className="glass-console rounded-2xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className={`h-4 w-4 ${hasContraindicated ? 'text-rose-200' : 'text-amber-200'}`} />
            <h2 className="font-serif italic text-lg tracking-wide text-white font-bold">
              {t('drugInteractions.title')}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70 font-sans">
            {t('drugInteractions.detected', { count: interactions.length, type: interactions.length === 1 ? 'interaction' : 'interactions' })}
          </p>
        </div>

        {hasContraindicated && (
          <div className="flex items-center gap-1.5 rounded-lg border border-rose-300/40 bg-rose-500/20 px-2.5 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-200" />
            <span className="font-mono text-xs font-bold text-rose-200">{t('drugInteractions.contraindicatedPair')}</span>
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-2.5">
        {interactions.map((interaction, idx) => {
          const severity = SEVERITY_CONFIG[interaction.severity];
          return (
            <div
              key={idx}
              className={`rounded-xl border p-3.5 ${severity.border} ${severity.bg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans text-xs font-bold text-white">
                      {interaction.drug1}
                    </span>
                    <span className="text-xs text-white/60 font-bold">+</span>
                    <span className="font-sans text-xs font-bold text-white">
                      {interaction.drug2}
                    </span>
                    <span className={`rounded-md border px-2 py-0.5 font-mono text-[9.5px] font-bold ${severity.color}`}>
                      {severity.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/75 font-sans leading-relaxed">
                    {interaction.description}
                  </p>
                  <div className="mt-2 rounded-xl bg-white/15 border border-white/25 p-2.5 shadow-2xs">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white">
                      {t('drugInteractions.clinicalAction')}
                    </span>
                    <p className="mt-0.5 text-xs text-white/90 font-medium">{interaction.clinicalAction}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(DrugInteractionAlert);
