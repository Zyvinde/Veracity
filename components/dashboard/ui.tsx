'use client';

import React from 'react';
import type { ClearanceStatus, MedStatus } from '@/lib/types';

export type SignalTone = 'stop' | 'hold' | 'clear' | 'neutral';

export function statusToTone(status: ClearanceStatus): SignalTone {
  if (status === 'GREEN_CLEARED') return 'clear';
  if (status === 'AMBER_CONDITIONAL') return 'hold';
  return 'stop';
}

export function medToTone(status: MedStatus): SignalTone {
  if (status === 'CLEARED') return 'clear';
  if (status === 'HOLD_REQUIRED') return 'hold';
  return 'stop';
}

function asDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Never throws: "8:21 AM" or "—" for missing/invalid timestamps. */
export function formatClockTime(iso: string | null | undefined): string {
  const d = asDate(iso);
  if (!d) return '—';
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

/** Never throws: "Wheels-in 8:21 AM" or "No slate". */
export function formatWheelsIn(iso: string | null | undefined): string {
  const t = formatClockTime(iso);
  return t === '—' ? 'No slate' : `Wheels-in ${t}`;
}

/** Priority rank for RED → AMBER → GREEN roster sorting. */
export function statusRank(status: ClearanceStatus): number {
  if (status === 'RED_HARD_STOP') return 0;
  if (status === 'AMBER_CONDITIONAL') return 1;
  return 2;
}

const toneClasses: Record<SignalTone, string> = {
  stop: 'text-[#DC2626] bg-[#FEF2F2] border-[#F87171]',
  hold: 'text-[#D97706] bg-[#FFFBEB] border-[#FCD34D]',
  clear: 'text-[#059669] bg-[#ECFDF5] border-[#6EE7B7]',
  neutral: 'text-[#5B6B78] bg-white border-[#D3DCE2]',
};

export function StatusPill({
  tone,
  children,
  className = '',
}: {
  tone: SignalTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 font-sans text-[11px] font-bold tracking-tight ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function MistCard({
  children,
  className = '',
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={`pearl-card rounded-xl border border-[#D3DCE2] bg-[#EFF3F6] shadow-[0_1px_2px_rgba(34,49,64,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  accent,
  right,
  id,
}: {
  title: string;
  accent?: string;
  right?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
      <h2 id={id} className="font-serif text-[17px] font-semibold text-[#223140]">
        {title} {accent ? <em className="font-serif italic">{accent}</em> : null}
      </h2>
      {right}
    </div>
  );
}

export function ProgressBar({
  percent,
  tone,
  label,
}: {
  percent: number;
  tone: SignalTone;
  label: string;
}) {
  const fill =
    tone === 'stop' ? 'bg-[#DC2626]' : tone === 'hold' ? 'bg-[#D97706]' : 'bg-[#059669]';
  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[#D3DCE2]"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className={`h-full rounded-full transition-all ${fill}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}
