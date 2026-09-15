'use client';

import React, { useMemo } from 'react';
import { usePatientStore } from '@/lib/store';

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export const QualityAnalytics: React.FC = () => {
  const { patients } = usePatientStore();

  const stats = useMemo(() => {
    const total = patients.length || 1;
    const green = patients.filter((p) => p.overallStatus === 'GREEN_CLEARED').length;
    const amber = patients.filter((p) => p.overallStatus === 'AMBER_CONDITIONAL').length;
    const red = patients.filter((p) => p.overallStatus === 'RED_HARD_STOP').length;

    const lane1 = patients.filter((p) => p.swimLane === 'LANE_1_VIRTUAL').length;
    const lane2 = patients.filter((p) => p.swimLane === 'LANE_2_TELEPHONIC').length;
    const lane3 = patients.filter((p) => p.swimLane === 'LANE_3_IN_PERSON').length;

    const asaMix: Record<string, number> = {};
    for (const p of patients) {
      asaMix[p.asaStatus] = (asaMix[p.asaStatus] || 0) + 1;
    }

    // NPO breach proxy: questionnaire-reported fasting <8h solids or <2h clears
    let npoBreach = 0;
    for (const p of patients) {
      const q = p.questionnaire;
      if (q && typeof q.lastSolidFoodHoursAgo === 'number' && typeof q.lastClearFluidHoursAgo === 'number') {
        if (q.lastSolidFoodHoursAgo < 8 || q.lastClearFluidHoursAgo < 2) npoBreach += 1;
      } else if (p.pacInterview?.lastFoodIso || p.pacInterview?.lastFluidIso) {
        // PAC interview stores exact datetimes; breach evaluated at interview time vs surgery.
        // Without recomputing gaps here, treat missing ack as at-risk.
        if (!p.pacInterview?.ackFasting) npoBreach += 1;
      }
    }

    // Cancellation-risk proxy: RED hard stop OR unresolved fitness referral
    let cancelRisk = 0;
    for (const p of patients) {
      const pendingFitness = (p.fitnessReferrals || []).some((r) => r.status !== 'CLEARED');
      if (p.overallStatus === 'RED_HARD_STOP' || pendingFitness) cancelRisk += 1;
    }

    return { total: patients.length, green, amber, red, lane1, lane2, lane3, asaMix, npoBreach, cancelRisk, denom: total };
  }, [patients]);

  const cards = [
    { label: 'Cleared (GREEN)', value: stats.green, pct: (stats.green / stats.denom) * 100, color: 'bg-emerald-400' },
    { label: 'Conditional (AMBER)', value: stats.amber, pct: (stats.amber / stats.denom) * 100, color: 'bg-amber-400' },
    { label: 'Hard stop (RED)', value: stats.red, pct: (stats.red / stats.denom) * 100, color: 'bg-rose-400' },
    { label: 'NPO breach (<8h solids / <2h clears)', value: stats.npoBreach, pct: (stats.npoBreach / stats.denom) * 100, color: 'bg-sky-400' },
    { label: 'Cancellation-risk cases', value: stats.cancelRisk, pct: (stats.cancelRisk / stats.denom) * 100, color: 'bg-orange-400' },
  ];

  const asaEntries = Object.entries(stats.asaMix).sort();

  return (
    <div className="space-y-3 text-white">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/20 bg-white/10 p-3">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">{c.label}</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-white">{c.value}</div>
            <div className="mt-2">
              <Bar pct={c.pct} color={c.color} />
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/60">{c.pct.toFixed(0)}% of {stats.total}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/20 bg-white/10 p-3">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">Swim-lane mix</div>
          {[
            { label: 'Lane 1 · Virtual', v: stats.lane1, color: 'bg-emerald-400' },
            { label: 'Lane 2 · Telephonic', v: stats.lane2, color: 'bg-amber-400' },
            { label: 'Lane 3 · In-person', v: stats.lane3, color: 'bg-sky-400' },
          ].map((r) => (
            <div key={r.label} className="mb-2">
              <div className="mb-1 flex items-center justify-between text-[11px] font-mono text-white/75">
                <span>{r.label}</span>
                <span className="font-bold text-white">{r.v}</span>
              </div>
              <Bar pct={(r.v / stats.denom) * 100} color={r.color} />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 p-3">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">ASA mix</div>
          {asaEntries.length === 0 && <div className="text-xs text-white/60">No ASA data.</div>}
          {asaEntries.map(([asa, count]) => (
            <div key={asa} className="mb-2">
              <div className="mb-1 flex items-center justify-between text-[11px] font-mono text-white/75">
                <span>{asa}</span>
                <span className="font-bold text-white">{count}</span>
              </div>
              <Bar pct={(count / stats.denom) * 100} color="bg-indigo-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualityAnalytics;
