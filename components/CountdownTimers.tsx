'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { MedicationHoldClock } from '@/lib/types';
import {
  Timer,
  Clock,
  Pill,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface CountdownTimersProps {
  medications: MedicationHoldClock[];
}

export const CountdownTimers: React.FC<CountdownTimersProps> = ({ medications }) => {
  const { t } = useI18n();
  const [selectedMedId, setSelectedMedId] = useState<string>(medications[0]?.id || '');

  const getCategoryTheme = (category: string, status: string) => {
    if (status === 'HARD_STOP')
      return {
        cardBorder: 'border-rose-300/40 bg-rose-500/20 hover:border-rose-300',
        badgeClass: 'glass-badge-stop font-bold',
        progressColor: 'bg-rose-600',
        icon: <XCircle className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />,
      };
    if (status === 'HOLD_REQUIRED')
      return {
        cardBorder: 'border-amber-300/40 bg-amber-500/20 hover:border-amber-300',
        badgeClass: 'glass-badge-conditional font-bold',
        progressColor: 'bg-amber-500',
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />,
      };
    return {
      cardBorder: 'glass-soft hover:border-white/50',
      badgeClass: 'glass-badge-cleared font-bold',
      progressColor: 'bg-emerald-500',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />,
    };
  };

  return (
    <section
      aria-label="Medication hold timers"
      className="glass-console rounded-2xl p-5 shadow-xs text-white/90 font-sans min-w-0 max-w-full overflow-hidden break-words"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-sky-200" aria-hidden="true" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">
              {t('countdown.title')}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('countdown.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-white border border-white/30 font-semibold">
            <Clock className="h-3 w-3 text-sky-200" aria-hidden="true" />
            <span>
              {t('countdown.activeMonitors')}: {medications.length}
            </span>
          </span>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3"
        role="list"
        aria-label={t('countdown.medicationList')}
      >
        {medications.map((med) => {
          const theme = getCategoryTheme(med.category, med.status);
          const hoursRemaining = Math.max(0, med.requiredHoldHours - med.lastDoseHoursAgo);
          const progressPercent =
            med.requiredHoldHours === 0
              ? 100
              : Math.min(100, Math.round((med.lastDoseHoursAgo / med.requiredHoldHours) * 100));

          return (
            <div
              key={med.id}
              role="listitem"
              onClick={() => setSelectedMedId(med.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedMedId(med.id);
              }}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                theme.cardBorder
              } ${selectedMedId === med.id ? 'ring-2 ring-white/60' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
                    <span className="font-bold text-[10px] uppercase tracking-wider text-white/85">
                      {med.category}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${theme.badgeClass}`}
                  >
                    {theme.icon}
                    <span>
                      {med.status === 'CLEARED'
                        ? t('common.cleared')
                        : med.status === 'HOLD_REQUIRED'
                        ? t('common.holdRequired')
                        : med.status === 'HARD_STOP'
                        ? t('common.hardStop')
                        : (med.status as string).replace('_', ' ')}
                    </span>
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="text-xs font-bold text-white group-hover:text-white transition">
                    {med.drugName}
                  </h3>
                  <p className="text-[10.5px] text-white/70 mt-0.5">
                    {t('countdown.schedule')}: {med.dosageSchedule}
                  </p>
                </div>
                <div className="mt-2.5 rounded-xl glass-input border p-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white/75">{t('countdown.holdElapsed')}</span>
                    <span className="font-bold text-white">{med.lastDoseHoursAgo} hrs</span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${med.drugName} hold progress`}
                  >
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${theme.progressColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9.5px] text-white/70 font-mono">
                    <span>
                      {t('countdown.target')}: {med.requiredHoldHours}h
                    </span>
                    <span className="font-semibold text-white/90">
                      {hoursRemaining > 0
                        ? t('countdown.remaining', { hours: hoursRemaining })
                        : t('countdown.holdMet')}
                    </span>
                  </div>
                </div>
                <div className="mt-2 rounded-xl bg-slate-100/80 p-2 border border-white/15 text-xs">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-amber-200" aria-hidden="true" /> {t('countdown.clinicalOrder')}
                  </span>
                  <p className="mt-0.5 text-white/85 text-[10.5px] leading-relaxed">
                    {med.clinicalAction}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[9.5px] text-white/60">
                <span className="flex items-center gap-1 truncate max-w-[200px]" title={med.guidelineBasis}>
                  <BookOpen className="h-3 w-3 text-sky-200 shrink-0" aria-hidden="true" />
                  <span className="truncate">{med.guidelineBasis}</span>
                </span>
                <ChevronRight className="h-3 w-3 text-white/60" aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(CountdownTimers);
