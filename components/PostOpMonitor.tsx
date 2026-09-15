'use client';

import React, { useEffect, useState } from 'react';
import { evaluatePRO, PostOpPRO, PROSeverity } from '@/lib/pro-monitoring';

interface PostOpMonitorProps {
  patientId: string;
  patientName?: string;
}

interface StoredEntry extends PostOpPRO {
  recordedAtIso: string;
}

const SEVERITY_STYLE: Record<PROSeverity, string> = {
  GREEN: 'border-emerald-300/40 bg-emerald-500/20 text-white',
  AMBER: 'border-amber-300/40 bg-amber-500/20 text-white',
  RED: 'border-rose-300/40 bg-rose-500/20 text-white',
};

const DOT_STYLE: Record<PROSeverity, string> = {
  GREEN: 'bg-emerald-400',
  AMBER: 'bg-amber-400',
  RED: 'bg-rose-500',
};

function loadEntries(patientId: string): StoredEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`veracity-pro-day07:${patientId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredEntry[]) : [];
  } catch {
    return [];
  }
}

export const PostOpMonitor: React.FC<PostOpMonitorProps> = ({ patientId, patientName }) => {
  const [postOpDay, setPostOpDay] = useState<number>(1);
  const [pain, setPain] = useState<number>(3);
  const [nausea, setNausea] = useState<boolean>(false);
  const [feverC, setFeverC] = useState<number>(37.0);
  const [woundRedness, setWoundRedness] = useState<boolean>(false);
  const [woundDischarge, setWoundDischarge] = useState<boolean>(false);
  const [opioidUse, setOpioidUse] = useState<number>(0);
  const [ambulated, setAmbulated] = useState<boolean>(true);
  const [entries, setEntries] = useState<StoredEntry[]>([]);

  useEffect(() => {
    setEntries(loadEntries(patientId));
  }, [patientId]);

  const current: PostOpPRO = {
    postOpDay,
    pain0_10: pain,
    nausea,
    feverC,
    woundRedness,
    woundDischarge,
    opioidUse,
    ambulated,
  };
  const result = evaluatePRO(current);

  const handleSave = () => {
    const entry: StoredEntry = { ...current, recordedAtIso: new Date().toISOString() };
    const next = [...entries, entry].slice(-14);
    setEntries(next);
    try {
      window.localStorage.setItem(`veracity-pro-day07:${patientId}`, JSON.stringify(next));
    } catch {
      // localStorage unavailable — keep in-memory only
    }
  };

  const toggleBtn = (active: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
        active
          ? 'border-sky-400/60 bg-sky-500/25 text-white'
          : 'border-white/15 bg-white/5 text-white/70 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3 text-white">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-serif italic text-sm font-bold text-white">Post-Op PRO · Day 0–7</h4>
          <p className="text-[11px] text-white/60 font-mono">
            {patientName ? `${patientName} · ` : ''}stored on this device per patient
          </p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold ${SEVERITY_STYLE[result.severity]}`}>
          <span className={`h-2 w-2 rounded-full ${DOT_STYLE[result.severity]}`} />
          {result.severity}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-white/70">Post-op day (0–7)</label>
          <input
            type="number"
            min={0}
            max={7}
            value={postOpDay}
            onChange={(e) => setPostOpDay(Math.min(7, Math.max(0, Number(e.target.value) || 0)))}
            className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-white/70">Pain (0–10)</label>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={pain}
            onChange={(e) => setPain(Number(e.target.value))}
            className="w-full accent-sky-500 min-h-[44px]"
          />
          <div className="text-xs font-mono font-bold text-white">{pain}/10</div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-white/70">Temperature (°C)</label>
          <input
            type="number"
            min={35}
            max={42}
            step={0.1}
            value={feverC}
            onChange={(e) => setFeverC(Number(e.target.value) || 37.0)}
            className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-white/70">Opioid tabs / 24h</label>
          <input
            type="number"
            min={0}
            max={20}
            step={1}
            value={opioidUse}
            onChange={(e) => setOpioidUse(Math.max(0, Number(e.target.value) || 0))}
            className="w-full min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          {toggleBtn(nausea, () => setNausea((v) => !v), nausea ? 'Nausea: YES' : 'Nausea: NO')}
          {toggleBtn(ambulated, () => setAmbulated((v) => !v), ambulated ? 'Ambulated: YES' : 'Ambulated: NO')}
        </div>
        <div className="flex gap-2">
          {toggleBtn(woundRedness, () => setWoundRedness((v) => !v), woundRedness ? 'Wound red: YES' : 'Wound red: NO')}
          {toggleBtn(woundDischarge, () => setWoundDischarge((v) => !v), woundDischarge ? 'Discharge: YES' : 'Discharge: NO')}
        </div>
      </div>

      <div className={`rounded-xl border p-3 text-xs leading-relaxed ${SEVERITY_STYLE[result.severity]}`}>
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-80">Escalation directive</div>
        <div className="mt-1">{result.directive}</div>
        {result.flags.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] opacity-90">
            {result.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full min-h-[44px] rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-white/85 active:scale-[0.99] cursor-pointer"
      >
        Save Day {postOpDay} PRO to this device
      </button>

      {entries.length > 0 && (
        <div className="rounded-xl border border-white/15 bg-white/5 p-3">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/60">
            Recent entries ({entries.length})
          </div>
          <div className="space-y-1.5">
            {entries.slice(-5).reverse().map((e, i) => {
              const r = evaluatePRO(e);
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-[11px] font-mono text-white/75">
                  <span>Day {e.postOpDay} · pain {e.pain0_10}/10 · {e.feverC.toFixed(1)}°C</span>
                  <span className={`flex items-center gap-1 font-bold ${r.severity === 'RED' ? 'text-rose-300' : r.severity === 'AMBER' ? 'text-amber-300' : 'text-emerald-300'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLE[r.severity]}`} />
                    {r.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostOpMonitor;
