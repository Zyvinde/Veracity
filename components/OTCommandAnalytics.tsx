'use client';

import React, { useMemo, useState } from 'react';
import { usePatientStore } from '@/lib/store';
import { DonutChart } from '@/components/ui/tremor/components/DonutChart/DonutChart';
import { BarChart } from '@/components/ui/tremor/components/BarChart/BarChart';
import { AreaChart } from '@/components/ui/tremor/components/AreaChart/AreaChart';
import { BarChart3, ChevronDown } from 'lucide-react';

const fmtInt = (v: number) => `${Math.round(v)}`;

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export const OTCommandAnalytics: React.FC = () => {
  const { patients } = usePatientStore();
  const [open, setOpen] = useState(true);

  const mix = useMemo(() => {
    const green = patients.filter((p) => p.overallStatus === 'GREEN_CLEARED').length;
    const amber = patients.filter((p) => p.overallStatus === 'AMBER_CONDITIONAL').length;
    const red = patients.filter((p) => p.overallStatus === 'RED_HARD_STOP').length;
    return [
      { name: 'Cleared', value: green },
      { name: 'Conditional', value: amber },
      { name: 'Hard stop', value: red },
    ];
  }, [patients]);

  const holds = useMemo(() => {
    const flagged = { Meds: 0, Fasting: 0, Fitness: 0, Labs: 0 };
    for (const p of patients) {
      if ((p.medications || []).some((m) => /HOLD|STOP|OMIT|AVOID|WITHHOLD/i.test(m.clinicalAction || ''))) {
        flagged.Meds += 1;
      }
      const q = p.questionnaire;
      if (q && typeof q.lastSolidFoodHoursAgo === 'number' && typeof q.lastClearFluidHoursAgo === 'number') {
        if (q.lastSolidFoodHoursAgo < 8 || q.lastClearFluidHoursAgo < 2) flagged.Fasting += 1;
      } else if (p.pacInterview && !p.pacInterview.ackFasting) {
        flagged.Fasting += 1;
      }
      if ((p.fitnessReferrals || []).some((r) => r.status !== 'CLEARED')) flagged.Fitness += 1;
      if ((p.labs || []).some((l) => l.status && l.status !== 'NORMAL')) flagged.Labs += 1;
    }
    return (Object.keys(flagged) as (keyof typeof flagged)[]).map((domain) => ({
      domain,
      Flagged: flagged[domain],
    }));
  }, [patients]);

  const throughput = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const dayCases = patients.filter((p) => {
        const t = new Date(p.scheduledTimeIso).getTime();
        return Number.isFinite(t) && t >= day.getTime() && t < next.getTime();
      });
      return {
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        Cases: dayCases.length,
        'Hard stops': dayCases.filter((p) => p.overallStatus === 'RED_HARD_STOP').length,
      };
    });
  }, [patients]);

  const total = patients.length;
  const redCount = mix[2]?.value ?? 0;

  return (
    <section aria-label="OT command analytics" className="rounded-2xl border border-white/20 bg-white/10 min-w-0 max-w-full overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-press w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-200 border border-sky-300/30 shrink-0">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs sm:text-sm font-serif italic font-bold text-white leading-tight">
              OT Command Analytics
            </span>
            <span className="block text-[10.5px] text-white/60 font-mono">
              {total} cases on roster{redCount > 0 ? ` · ${redCount} hard stop${redCount === 1 ? '' : 's'}` : ' · no hard stops'}
            </span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-white/60 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 px-3 sm:px-4 pb-3 sm:pb-4 animate-fade-in">
          <div className="glass-specular rounded-2xl border border-white/25 p-4 min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70 font-mono">Clearance mix</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-white leading-none tracking-tight tabular-nums">
              {total}
              <span className="ml-2 text-[11px] font-sans font-medium text-white/60">cases</span>
            </p>
            <DonutChart
              className="mt-3 h-44"
              data={mix}
              category="name"
              value="value"
              colors={['emerald', 'amber', 'pink']}
              variant="donut"
              valueFormatter={fmtInt}
            />
          </div>

          <div className="glass-specular rounded-2xl border border-white/25 p-4 min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70 font-mono">Cases flagged by domain</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-white leading-none tracking-tight tabular-nums">
              {holds.reduce((s, h) => s + h.Flagged, 0)}
              <span className="ml-2 text-[11px] font-sans font-medium text-white/60">open flags</span>
            </p>
            <BarChart
              className="mt-3 h-44"
              data={holds}
              index="domain"
              categories={['Flagged']}
              colors={['pink']}
              valueFormatter={fmtInt}
              yAxisWidth={28}
            />
          </div>

          <div className="glass-specular rounded-2xl border border-white/25 p-4 min-w-0 md:col-span-2 xl:col-span-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/70 font-mono">7-day case throughput</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-white leading-none tracking-tight tabular-nums">
              {throughput.reduce((s, d) => s + d.Cases, 0)}
              <span className="ml-2 text-[11px] font-sans font-medium text-white/60">scheduled</span>
            </p>
            <AreaChart
              className="mt-3 h-44"
              data={throughput}
              index="day"
              categories={['Cases', 'Hard stops']}
              colors={['cyan', 'pink']}
              valueFormatter={fmtInt}
              showGridLines={false}
              showYAxis={false}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default OTCommandAnalytics;
