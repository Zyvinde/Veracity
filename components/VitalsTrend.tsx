'use client';

import React from 'react';
import { VitalsTrend as VitalsTrendType } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalsTrendProps {
  vitals: VitalsTrendType[];
}

const VitalsTrend: React.FC<VitalsTrendProps> = ({ vitals }) => {
  const { t } = useI18n();

  if (!vitals || vitals.length === 0) return null;

  const latest = vitals[vitals.length - 1];
  const previous = vitals.length > 1 ? vitals[vitals.length - 2] : null;

  const getTrend = (current: number, prev: number | undefined | null) => {
    if (prev == null) return 'stable';
    const diff = current - prev;
    if (Math.abs(diff) < 2) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 text-yellow-400" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 text-white" />;
    return <Minus className="h-3 w-3 text-[#64748B]" />;
  };

  const metrics = [
    { label: t('newFeatures.systolic'), value: latest.systolicBp, unit: 'mmHg', prev: previous?.systolicBp, normal: [90, 140] },
    { label: t('newFeatures.diastolic'), value: latest.diastolicBp, unit: 'mmHg', prev: previous?.diastolicBp, normal: [60, 90] },
    { label: t('newFeatures.heartRate'), value: latest.heartRate, unit: 'bpm', prev: previous?.heartRate, normal: [60, 100] },
    { label: t('newFeatures.spo2'), value: latest.spo2, unit: '%', prev: previous?.spo2, normal: [95, 100] },
    { label: t('newFeatures.temperature'), value: latest.temperatureC, unit: '°C', prev: previous?.temperatureC, normal: [36.1, 37.2] },
    { label: t('newFeatures.respiratoryRate'), value: latest.respiratoryRate, unit: '/min', prev: previous?.respiratoryRate, normal: [12, 20] },
  ];

  const getBarWidth = (value: number, min: number, max: number) => {
    const range = max - min;
    const pct = ((value - min) / range) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <div className="rounded-[6px] border border-white/[0.08] bg-[#111215] p-5 shadow-none">
      <div className="flex items-center gap-2 mb-3.5 border-b border-white/[0.06] pb-3">
        <Activity className="h-4 w-4 text-[#EF4444]" aria-hidden="true" />
        <h2 className="font-serif text-lg tracking-wide text-white">{t('newFeatures.vitalsTrend')}</h2>
        <span className="text-[10px] font-mono text-[#94A3B8]">
          ({vitals.length} {vitals.length === 1 ? 'reading' : 'readings'})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {metrics.map((m) => {
          const trend = getTrend(m.value, m.prev);
          const isNormal = m.value >= m.normal[0] && m.value <= m.normal[1];
          return (
            <div key={m.label} className="rounded-[4px] border border-white/[0.08] bg-[#000000] p-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>{m.label}</span>
                {getTrendIcon(trend)}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`font-mono text-base font-semibold ${isNormal ? 'text-white' : 'text-orange-400'}`}>
                  {m.value}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono">{m.unit}</span>
              </div>
              <div className="mt-1.5 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isNormal ? 'bg-white/15' : 'bg-orange-500'}`}
                  style={{ width: `${getBarWidth(m.value, m.normal[0] * 0.5, m.normal[1] * 1.5)}%` }}
                />
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[9px] font-mono text-[#6F6A64]">
                <span>{m.normal[0]}</span>
                <span>{m.normal[1]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(VitalsTrend);
