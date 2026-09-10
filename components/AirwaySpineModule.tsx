'use client';

import React, { useState } from 'react';
import { AirwayExam } from '@/lib/types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CupSoda,
  UtensilsCrossed,
  Shield,
  Activity,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface AirwaySpineModuleProps {
  airway: AirwayExam;
  onUpdateAirway?: (updated: AirwayExam) => void;
}

const AirwaySpineModule: React.FC<AirwaySpineModuleProps> = ({
  airway: initialAirway,
  onUpdateAirway,
}) => {
  const { t } = useI18n();
  const [airway, setAirway] = useState<AirwayExam>(initialAirway);

  React.useEffect(() => {
    setAirway(initialAirway);
  }, [initialAirway]);

  const handleMallampatiSelect = (mallampati: AirwayExam['mallampati']) => {
    const updated = { ...airway, mallampati };
    setAirway(updated);
    onUpdateAirway?.(updated);
  };

  const getMallampatiVisual = (cls: AirwayExam['mallampati']) => {
    switch (cls) {
      case 'Class I':
        return {
          desc: 'Soft palate, fauces, uvula, pillars visible',
          risk: t('airway.lowDifficulty'),
          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
        };
      case 'Class II':
        return {
          desc: 'Soft palate, fauces, uvula visible',
          risk: t('airway.standardLow'),
          color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10',
        };
      case 'Class III':
        return {
          desc: 'Soft palate, base of uvula visible',
          risk: t('airway.moderateDifficult'),
          color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
        };
      case 'Class IV':
        return {
          desc: 'Only hard palate visible',
          risk: t('airway.highDifficulty'),
          color: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
        };
    }
  };

  const isHighRisk =
    airway.mallampati === 'Class III' ||
    airway.mallampati === 'Class IV' ||
    airway.neckMobility !== 'Full';

  return (
    <section
      aria-label="Airway and spinal assessment"
      className="glass-console rounded-2xl p-5 shadow-xs text-white/90 font-sans"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-200" aria-hidden="true" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">
              {t('airway.title')}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('airway.subtitle')}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold ${
            isHighRisk
              ? 'border-amber-300/40 bg-amber-500/20 text-amber-200'
              : 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
          }`}
        >
          <Shield className="h-3 w-3" aria-hidden="true" />
          <span>
            {t('airway.riskTier')}:{' '}
            {isHighRisk ? t('airway.moderateDifficult') : t('airway.standardLow')}
          </span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/85">
              {t('airway.mallampati')}
            </span>
            <span className="text-[11px] text-white/70 font-mono">
              {t('airway.active')}: <strong className="text-white">{airway.mallampati}</strong>
            </span>
          </div>

          <div
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Mallampati classification"
          >
            {(['Class I', 'Class II', 'Class III', 'Class IV'] as const).map((cls) => {
              const info = getMallampatiVisual(cls);
              const isSelected = airway.mallampati === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleMallampatiSelect(cls)}
                  className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-white/60 bg-white/15 shadow-xs ring-1 ring-white/60 text-white'
                      : 'glass-soft hover:bg-white/15 text-white/85'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{cls}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
                    )}
                  </div>
                  <div className="my-2 flex h-9 items-center justify-center rounded-lg bg-white/15 border border-white/25 font-mono text-[9.5px] text-white/75">
                    {cls === 'Class I' && t('airway.uvulaPillars')}
                    {cls === 'Class II' && t('airway.uvulaOnly')}
                    {cls === 'Class III' && t('airway.baseUvula')}
                    {cls === 'Class IV' && t('airway.hardPalate')}
                  </div>
                  <p className="text-[9.5px] text-white/70 line-clamp-2 leading-tight">{info.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {[
              {
                label: t('airway.mouthOpening'),
                value: airway.mouthOpeningCm,
                unit: 'cm',
                sub: airway.mouthOpeningCm >= 4.0 ? '≥3 Fingers' : '<3 Fingers',
              },
              {
                label: t('airway.thyromentalDist'),
                value: airway.thyromentalDistanceCm,
                unit: 'cm',
                sub:
                  airway.thyromentalDistanceCm >= 6.5
                    ? t('airway.adequateSubmandibular')
                    : t('airway.recededChin'),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border glass-soft p-2.5">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/70">
                  {item.label}
                </span>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-white">{item.value}</span>
                  <span className="text-[10px] text-white/60 font-mono">{item.unit}</span>
                </div>
                <span className="text-[9.5px] text-white font-medium">{item.sub}</span>
              </div>
            ))}
            <div className="rounded-xl border glass-soft p-2.5">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/70">
                {t('airway.spineDentition')}
              </span>
              <div className="mt-0.5 text-xs font-bold text-white truncate">
                {airway.neckMobility} Neck
              </div>
              <span className="text-[9.5px] text-white/70 truncate block">{airway.dentition}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border glass-soft p-4">
          <div>
            <div className="flex items-center gap-2 border-b border-white/20 pb-2">
              <Clock className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {t('airway.standardFasting')}
              </h3>
            </div>
            <div className="mt-3 flex items-start gap-2.5 rounded-xl glass-input border p-2.5">
              <div className="rounded-lg bg-amber-500/20 p-1.5 text-amber-200">
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{t('airway.midnightNpo')}</span>
                  <span className="text-[9.5px] text-amber-200 uppercase font-semibold">
                    Mandatory
                  </span>
                </div>
                <p className="mt-0.5 text-[10.5px] text-white/70">{t('airway.midnightNpoDesc')}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-start gap-2.5 rounded-xl glass-input border p-2.5">
              <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-200">
                <CupSoda className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>{t('airway.clearLiquids')}</span>
                  <span className="text-[9.5px] text-emerald-200 font-semibold">
                    {t('airway.enhancedRecovery')}
                  </span>
                </div>
                <p className="mt-0.5 text-[10.5px] text-white/70">{t('airway.clearLiquidsDesc')}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/20 text-xs text-white/85 flex items-center justify-between">
            <span className="text-[10.5px] text-white/70 font-mono">
              {t('airway.recommendedDevice')}:
            </span>
            <span className="font-bold text-white text-[10.5px]">
              {isHighRisk ? t('airway.videoLaryngoscope') : t('airway.directMac')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(AirwaySpineModule);
