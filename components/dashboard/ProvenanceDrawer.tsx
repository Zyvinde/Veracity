'use client';

import React from 'react';
import type { PatientCase } from '@/lib/types';
import { X } from 'lucide-react';
import { formatClockTime } from './ui';

interface ProvenanceDrawerProps {
  open: boolean;
  patient: PatientCase;
  onClose: () => void;
}

export function ProvenanceDrawer({ open, patient, onClose }: ProvenanceDrawerProps) {
  if (!open) return null;

  const docName = patient.labs[0]?.provenance.documentName || 'Lab_Report.pdf';
  const topLab = [...patient.labs].sort((a, b) => {
    const rank = (s: string) => (s.includes('CRITICAL') ? 0 : s !== 'NORMAL' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  })[0];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Provenance inspector">
      <button
        type="button"
        aria-label="Close provenance inspector"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#223140]/40"
      />
      <aside className="drawer-slide-in absolute inset-y-0 right-0 w-[550px] max-w-full bg-white border-l border-[#D3DCE2] shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold text-[#223140]">Provenance Inspector</h2>
            <p className="mt-0.5 truncate font-mono text-[11px] text-[#5B6B78]">{docName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D3DCE2] bg-white px-3 py-1.5 font-sans text-xs font-bold text-[#223140] transition hover:bg-[#EFF3F6]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Close
          </button>
        </div>

        {/* Left: rendered source with bounding-box highlight */}
        <div className="mt-4 rounded-xl border border-[#D3DCE2] bg-[#EFF3F6] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B6B78]">
            Rendered source · bounding-box highlight
          </p>
          <div className="mt-2 space-y-1">
            {patient.labs.map((lab) => {
              const isTop = topLab && lab.id === topLab.id;
              const abnormal = lab.status !== 'NORMAL';
              return (
                <div
                  key={lab.id}
                  className={`grid grid-cols-12 items-center gap-1 rounded-md bg-white px-2 py-1.5 font-mono text-[11px] ${
                    isTop ? 'border-2 border-[#DC2626]' : 'border border-[#D3DCE2]'
                  }`}
                >
                  <span className="col-span-5 truncate font-semibold text-[#223140]">{lab.name}</span>
                  <span className={`col-span-2 text-right font-bold tabular-nums ${abnormal ? 'text-[#DC2626]' : 'text-[#223140]'}`}>
                    {lab.value}
                  </span>
                  <span className="col-span-2 text-center text-[#5B6B78]">{lab.unit}</span>
                  <span className="col-span-3 text-right text-[#5B6B78] tabular-nums">
                    {lab.refLow} – {lab.refHigh}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: extracted value, confidence, citation */}
        {topLab && (
          <div className="mt-4 rounded-xl border border-[#D3DCE2] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B6B78]">
                Extracted LOINC value
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                  topLab.status === 'NORMAL'
                    ? 'bg-[#ECFDF5] text-[#059669] border-[#6EE7B7]'
                    : topLab.status.includes('CRITICAL')
                    ? 'bg-[#FEF2F2] text-[#DC2626] border-[#F87171]'
                    : 'bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]'
                }`}
              >
                {topLab.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-2 font-sans text-sm font-bold text-[#223140]">{topLab.name}</p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-[#223140] tabular-nums">
              {topLab.value} <span className="text-sm font-medium text-[#5B6B78]">{topLab.unit}</span>
            </p>
            <dl className="mt-3 space-y-1.5 border-t border-[#D3DCE2] pt-3 font-mono text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[#5B6B78]">LOINC</dt>
                <dd className="font-bold text-[#223140]">{topLab.loinc}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#5B6B78]">OCR confidence</dt>
                <dd className="font-bold text-[#223140] tabular-nums">
                  {Math.round((topLab.provenance.confidence || 0) * 100)}%
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#5B6B78]">Reference</dt>
                <dd className="text-right font-bold text-[#223140] tabular-nums">
                  {topLab.refLow} – {topLab.refHigh} {topLab.unit}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#5B6B78]">Guideline</dt>
                <dd className="text-right font-bold text-[#B3871C]">ASRA 2025 · ASA 2023</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-lg bg-[#EFF3F6] p-2.5 font-sans text-xs leading-relaxed text-[#223140]">
              {topLab.directive}
            </p>
            <p className="mt-2 font-mono text-[10px] text-[#5B6B78]">
              Source: {docName} · page {topLab.provenance.page} · {formatClockTime(patient.scheduledTimeIso)} slate
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
