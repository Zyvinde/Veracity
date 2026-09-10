'use client';

import React from 'react';
import { Allergy } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface AllergyCardProps {
  allergies: Allergy[];
}

const SEVERITY_CONFIG = {
  MILD: { label: 'MILD', color: 'text-white/85 bg-white/15 border-white/25 font-medium', icon: <Info className="h-3 w-3 text-white/70" /> },
  MODERATE: { label: 'MODERATE', color: 'text-amber-200 bg-amber-500/20 border-amber-300/40 font-semibold', icon: <AlertTriangle className="h-3 w-3 text-amber-200" /> },
  SEVERE: { label: 'SEVERE', color: 'text-rose-200 bg-rose-500/20 border-rose-300/40 font-bold', icon: <ShieldAlert className="h-3 w-3 text-rose-200" /> },
  ANAPHYLAXIS: { label: 'ANAPHYLAXIS', color: 'text-rose-200 bg-rose-500/20 border-rose-300/40 font-bold', icon: <ShieldAlert className="h-3 w-3 text-rose-200" /> },
};

const CATEGORY_COLORS: Record<string, string> = {
  MEDICATION: 'text-amber-200 border-amber-300/40 bg-amber-500/20',
  FOOD: 'text-orange-700 border-orange-200 bg-orange-50',
  ENVIRONMENTAL: 'text-white/85 border-white/25 bg-white/10',
  CONTRAST_DYE: 'text-white border-white/30 bg-white/15',
  LATEX: 'text-rose-200 border-rose-300/40 bg-rose-500/20',
};

export const AllergyCard: React.FC<AllergyCardProps> = ({ allergies }) => {
  const { t } = useI18n();

  if (!allergies || allergies.length === 0) {
    return (
      <div className="glass-console rounded-2xl p-5 shadow-xs text-white/90">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-200" />
          <h2 className="font-serif italic text-lg tracking-wide text-white">{t('allergies.title')}</h2>
        </div>
        <div className="rounded-xl border glass-soft p-4 text-center">
          <p className="text-xs text-white/90 font-sans font-semibold">{t('allergies.nkda')}</p>
          <p className="text-[10.5px] text-white/70 mt-1 font-mono">{t('allergies.documented')}</p>
        </div>
      </div>
    );
  }

  const hasAnaphylaxis = allergies.some((a) => a.severity === 'ANAPHYLAXIS');
  const hasSevere = allergies.some((a) => a.severity === 'SEVERE');

  return (
    <div className="glass-console rounded-2xl p-5 shadow-xs text-white/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('allergies.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">
            {t('allergies.documentedCount', { count: allergies.length, allergy: allergies.length === 1 ? 'allergy' : 'allergies' })}
            {hasAnaphylaxis && (
              <span className="ml-2 text-rose-200 font-semibold">· {t('allergies.anaphylaxisRisk')}</span>
            )}
          </p>
        </div>

        {(hasAnaphylaxis || hasSevere) && (
          <div className="flex items-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-500/20 px-2.5 py-1">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-200" />
            <span className="font-mono text-xs font-bold text-rose-200">
              {hasAnaphylaxis ? t('allergies.kitRequired') : t('allergies.severeAlert')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-2">
        {allergies.map((allergy) => {
          const severity = SEVERITY_CONFIG[allergy.severity];
          const catColor = CATEGORY_COLORS[allergy.category] || 'text-white/75 border-white/25 bg-white/10';

          return (
            <div
              key={allergy.id}
              className={`flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors ${
                allergy.severity === 'ANAPHYLAXIS' || allergy.severity === 'SEVERE'
                  ? 'border-rose-300/40 bg-rose-500/20'
                  : allergy.severity === 'MODERATE'
                  ? 'border-amber-300/40 bg-amber-500/20'
                  : 'glass-soft'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-semibold text-white">{allergy.allergen}</span>
                  <span className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-mono font-medium ${catColor}`}>
                    {allergy.category}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/70 font-sans">
                  {t('allergies.reaction')} <span className="text-white/90 font-medium">{allergy.reaction}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${severity.color}`}>
                  {severity.icon}
                  <span>{severity.label}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Anaphylaxis Protocol Note */}
      {hasAnaphylaxis && (
        <div className="mt-3.5 rounded-xl border border-rose-300/40 bg-rose-500/20 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-rose-200">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{t('allergies.anaphylaxisProtocol')}</span>
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[10.5px] text-rose-900 font-sans">
            <li>· {t('allergies.epipen')}</li>
            <li>· {t('allergies.ivAccess')}</li>
            <li>· {t('allergies.pretreatment')}</li>
            <li>· {t('allergies.teamBriefed')}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(AllergyCard);