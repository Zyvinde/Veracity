'use client';

import React, { useState, useEffect } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { computeFastingCompliance } from '@/lib/rules-engine';
import { Clock, AlertTriangle, CheckCircle2, UtensilsCrossed, CupSoda } from 'lucide-react';

interface SurgeryCountdownProps {
  patient: PatientCase;
}

export const SurgeryCountdown: React.FC<SurgeryCountdownProps> = ({ patient }) => {
  const { t } = useI18n();
  // Live clock is client-only. Mock schedule times are generated at module
  // evaluation (different instants on server vs browser), so every time-derived
  // string below renders only after mount — otherwise SSR hydration mismatches
  // and React discards the whole page boundary.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div
        className="glass-console rounded-2xl p-5 sm:p-6 shadow-xs text-white/90 font-sans"
        aria-busy="true"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-200" />
              <h2 className="font-serif italic text-lg tracking-wide text-white">
                {t('surgeryCountdown.title')}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-white/70">{t('surgeryCountdown.subtitle')}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-0.5 text-[11px] font-bold text-white/60">
            …
          </span>
        </div>
        <div className="mt-4 grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-44 rounded-xl bg-white/15" />
          <div className="h-44 rounded-xl bg-white/15" />
        </div>
      </div>
    );
  }

  const surgeryTime = new Date(patient.scheduledTimeIso);
  const diffMs = surgeryTime.getTime() - now.getTime();
  const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const totalMinutes = Math.max(0, Math.floor((diffMs / (1000 * 60)) % 60));
  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  const fasting = computeFastingCompliance(patient.scheduledTimeIso, now);

  const formattedDate = surgeryTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = surgeryTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const urgencyLevel =
    totalHours < 12 ? 'Urgent (<12h)' : totalHours < 48 ? 'Approaching (<48h)' : 'Scheduled';
  const urgencyColor =
    totalHours < 12
      ? 'border-rose-300/40 bg-rose-500/20 text-rose-200 font-bold'
      : totalHours < 48
      ? 'border-amber-300/40 bg-amber-500/20 text-amber-200 font-bold'
      : 'border-white/30 bg-white/15 text-white font-bold';

  return (
    <div className="glass-console rounded-2xl p-5 sm:p-6 shadow-xs text-white/90 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">
              {t('surgeryCountdown.title')}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('surgeryCountdown.subtitle')}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] ${urgencyColor}`}
        >
          {urgencyLevel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Surgery Countdown */}
        <div className="rounded-xl border glass-soft p-4">
          <div className="text-center mb-3">
            <div className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Scheduled Procedure
            </div>
            <div className="mt-1 text-sm font-bold text-white">{patient.procedureName}</div>
            <div className="text-xs text-white/70 mt-0.5 font-mono">
              {formattedDate} at {formattedTime}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl glass-input border p-2.5 shadow-xs">
              <div className="text-[10px] text-white/70 uppercase font-semibold">Days</div>
              <div className="font-mono text-xl font-extrabold text-white mt-0.5">{totalDays}</div>
            </div>
            <div className="rounded-xl glass-input border p-2.5 shadow-xs">
              <div className="text-[10px] text-white/70 uppercase font-semibold">Hours</div>
              <div className="font-mono text-xl font-extrabold text-white mt-0.5">
                {remainingHours}
              </div>
            </div>
            <div className="rounded-xl glass-input border p-2.5 shadow-xs">
              <div className="text-[10px] text-white/70 uppercase font-semibold">Minutes</div>
              <div className="font-mono text-xl font-extrabold text-white mt-0.5">
                {totalMinutes}
              </div>
            </div>
          </div>
        </div>

        {/* NPO Fasting Compliance */}
        <div className="rounded-xl border glass-soft p-4">
          <div className="text-center mb-3">
            <div className="text-xs font-bold text-white/70 uppercase tracking-wider">
              {t('surgeryCountdown.npoStatus')}
            </div>
          </div>

          <div className="space-y-2">
            {/* Solids NPO */}
            <div
              className={`flex items-start gap-3 rounded-xl border p-2.5 ${
                fasting.npoSolidsCompliant
                  ? 'border-emerald-300/40 bg-emerald-500/20'
                  : 'border-amber-300/40 bg-amber-500/20'
              }`}
            >
              <div
                className={`rounded-lg p-1.5 ${
                  fasting.npoSolidsCompliant
                    ? 'bg-emerald-100 text-emerald-200'
                    : 'bg-amber-100 text-amber-200'
                }`}
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">{t('surgeryCountdown.solids')}</span>
                  {fasting.npoSolidsCompliant ? (
                    <span className="text-emerald-200 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> {t('surgeryCountdown.compliant')}
                    </span>
                  ) : (
                    <span className="text-amber-200 font-bold text-[11px]">
                      {t('surgeryCountdown.notYet')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10.5px] text-white/70">
                  {fasting.npoSolidsCompliant
                    ? t('surgeryCountdown.solidsCompliant')
                    : `${t('surgeryCountdown.cutoff')} ${new Date(
                        fasting.solidsDeadline
                      ).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>

            {/* Clear Liquids */}
            <div
              className={`flex items-start gap-3 rounded-xl border p-2.5 ${
                fasting.npoLiquidsCompliant
                  ? 'border-emerald-300/40 bg-emerald-500/20'
                  : 'border-white/25 bg-white/15'
              }`}
            >
              <div
                className={`rounded-lg p-1.5 ${
                  fasting.npoLiquidsCompliant
                    ? 'bg-emerald-100 text-emerald-200'
                    : 'bg-white/15 text-white/85'
                }`}
              >
                <CupSoda className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">{t('surgeryCountdown.clearDrink')}</span>
                  {fasting.npoLiquidsCompliant ? (
                    <span className="text-emerald-200 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> {t('surgeryCountdown.cutoffPassed')}
                    </span>
                  ) : (
                    <span className="text-amber-200 font-bold text-[11px]">
                      {t('surgeryCountdown.allowed')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10.5px] text-white/70">
                  {fasting.npoLiquidsCompliant
                    ? t('surgeryCountdown.liquidsPassed')
                    : t('surgeryCountdown.liquidsAllowed', {
                        time: new Date(fasting.liquidsDeadline).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      })}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl glass-input border p-2.5 text-xs text-white/85">
            <span className="font-bold text-white uppercase tracking-wider text-[10px]">
              Protocol:
            </span>{' '}
            {fasting.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
};