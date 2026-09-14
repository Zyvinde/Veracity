'use client';

import React, { useMemo } from 'react';
import type { PatientCase } from '@/lib/types';
import { formatClockTime, statusRank } from './ui';

function offendingDrug(p: PatientCase): string | null {
  const bad = p.medications?.find((m) => m.status === 'HARD_STOP' || m.status === 'HOLD_REQUIRED');
  return bad ? bad.drugName.split(' (')[0] : null;
}

function pillFor(p: PatientCase): { label: string; cls: string } {
  const drug = offendingDrug(p);
  if (p.overallStatus === 'GREEN_CLEARED') {
    return { label: 'CLEARED', cls: 'bg-[#ECFDF5] text-[#059669] border-[#6EE7B7]' };
  }
  if (p.overallStatus === 'AMBER_CONDITIONAL') {
    return { label: drug ? `HOLD: ${drug}` : 'HOLD', cls: 'bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]' };
  }
  return { label: drug ? `HARD STOP: ${drug}` : 'HARD STOP', cls: 'bg-[#FEF2F2] text-[#DC2626] border-[#F87171]' };
}

interface RosterPanelProps {
  patients: PatientCase[];
  currentPatientId: string;
  searchQuery: string;
  onSelectPatient: (id: string) => void;
}

export function RosterPanel({ patients, currentPatientId, searchQuery, onSelectPatient }: RosterPanelProps) {
  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? patients.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q) ||
            p.procedureName.toLowerCase().includes(q)
        )
      : [...patients];
    // Priority sort: RED → AMBER → GREEN.
    filtered.sort((a, b) => statusRank(a.overallStatus) - statusRank(b.overallStatus));
    return filtered;
  }, [patients, searchQuery]);

  return (
    <section aria-label="Priority surgical roster" className="lg:col-span-5 bg-white border border-[#D3DCE2] rounded-xl p-5 shadow-xs flex flex-col min-w-0 h-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-bold text-[#223140]">Elective Surgical Slate</h2>
        <span className="font-mono text-[10px] text-[#5B6B78] whitespace-nowrap">
          Priority: RED ➔ AMBER ➔ GREEN
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 overflow-y-auto max-h-[600px] min-w-0" role="listbox" aria-label="Surgical roster by priority">
        {rows.length === 0 && (
          <p className="rounded-lg border border-[#D3DCE2] bg-[#EFF3F6] px-3 py-4 text-center font-sans text-xs text-[#5B6B78]">
            No cases match this search.
          </p>
        )}
        {rows.map((p) => {
          const isActive = p.id === currentPatientId;
          const pill = pillFor(p);
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelectPatient(p.id)}
              className={`p-3.5 rounded-lg border border-[#D3DCE2] transition-all cursor-pointer flex items-center justify-between gap-3 text-left min-w-0 ${
                isActive
                  ? 'bg-white border-[#B3871C] shadow-[0_2px_10px_rgba(179,135,28,0.15)]'
                  : 'bg-[#EFF3F6] hover:bg-white'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-sm text-[#223140] font-sans">{p.name}</span>
                <span className="block truncate font-mono text-[11px] text-[#5B6B78]">{p.mrn}</span>
                <span className="mt-0.5 block truncate font-sans text-xs text-[#5B6B78]">
                  {p.procedureName} • <span className="font-mono tabular-nums">{formatClockTime(p.scheduledTimeIso)}</span>
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-[10px] px-2.5 py-1 rounded-full font-bold border whitespace-nowrap ${pill.cls}`}
              >
                {pill.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
