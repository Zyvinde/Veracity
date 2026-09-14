'use client';

import React, { useMemo } from 'react';
import type { PatientCase } from '@/lib/types';
import { Card } from '@/components/ui/tremor/components/Card/Card';
import { Callout } from '@/components/ui/tremor/components/Callout/Callout';
import { AreaChart } from '@/components/ui/tremor/components/AreaChart/AreaChart';
import { Activity } from 'lucide-react';

interface VitalsPaneProps {
  patient: PatientCase;
}

export function VitalsPane({ patient }: VitalsPaneProps) {
  const series = useMemo(
    () =>
      (patient.vitals || []).map((v, i) => ({
        t: `T-${(patient.vitals.length - 1 - i) * 15}m`,
        Systolic: v.systolicBp,
        Diastolic: v.diastolicBp,
        HR: v.heartRate,
        SpO2: v.spo2,
      })),
    [patient.vitals]
  );

  const latest = patient.vitals?.[patient.vitals.length - 1];

  if (!series.length) {
    return (
      <Callout title="No telemetry yet" variant="neutral" icon={Activity}>
        No vitals trend recorded for {patient.name}. Telemetry appears here once monitors sync.
      </Callout>
    );
  }

  return (
    <div className="space-y-4">
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Systolic BP', value: `${latest.systolicBp} mmHg` },
            { label: 'Diastolic BP', value: `${latest.diastolicBp} mmHg` },
            { label: 'Heart Rate', value: `${latest.heartRate} bpm` },
            { label: 'SpO₂', value: `${latest.spo2} %` },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-sky-200/70">
                {s.label}
              </p>
              <p className="mt-1 font-mono text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-5">
        <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Blood Pressure Trend</h3>
        <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">systolic vs diastolic · 15-min cadence</p>
        <AreaChart
          className="mt-3 h-64"
          data={series}
          index="t"
          categories={['Systolic', 'Diastolic']}
          colors={['blue', 'cyan']}
          showLegend
          showGridLines
          autoMinValue
          valueFormatter={(v) => `${v} mmHg`}
        />
      </Card>
      <Card className="p-5">
        <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Cardio-Respiratory Trend</h3>
        <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">heart rate vs SpO₂</p>
        <AreaChart
          className="mt-3 h-64"
          data={series}
          index="t"
          categories={['HR', 'SpO2']}
          colors={['violet', 'emerald']}
          showLegend
          showGridLines
          autoMinValue
        />
      </Card>
    </div>
  );
}
