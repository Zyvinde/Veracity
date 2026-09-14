'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { ExtractedLabItem } from '@/lib/types';
import FishboneViewer from './FishboneViewer';
import {
  FlaskConical,
  Table as TableIcon,
  GitFork,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
} from 'lucide-react';

interface LabAuditTableProps {
  labs: ExtractedLabItem[];
  selectedLabId: string | null;
  onSelectLab: (labId: string) => void;
  onOpenProvenanceDrawer?: () => void;
}

export const LabAuditTable: React.FC<LabAuditTableProps> = ({
  labs,
  selectedLabId,
  onSelectLab,
  onOpenProvenanceDrawer,
}) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'TABLE' | 'FISHBONE'>('TABLE');

  const getStatusBadge = (status: ExtractedLabItem['status']) => {
    switch (status) {
      case 'NORMAL': return { label: t('common.normal'), className: 'bg-emerald-500/20 text-emerald-200 border-emerald-300/40 font-semibold', icon: <CheckCircle2 className="h-3 w-3 text-emerald-200" aria-hidden="true" /> };
      case 'BORDERLINE_LOW': return { label: 'BORDERLINE LOW', className: 'bg-amber-500/20 text-amber-200 border-amber-300/40 font-semibold', icon: <AlertTriangle className="h-3 w-3 text-amber-200" aria-hidden="true" /> };
      case 'BORDERLINE_HIGH': return { label: 'BORDERLINE HIGH', className: 'bg-amber-500/20 text-amber-200 border-amber-300/40 font-semibold', icon: <AlertTriangle className="h-3 w-3 text-amber-200" aria-hidden="true" /> };
      case 'CRITICAL_LOW': return { label: 'CRITICAL LOW', className: 'bg-rose-500/20 text-rose-200 border-rose-300/40 font-bold', icon: <XCircle className="h-3 w-3 text-rose-200" aria-hidden="true" /> };
      case 'CRITICAL_HIGH': return { label: 'CRITICAL HIGH', className: 'bg-rose-500/20 text-rose-200 border-rose-300/40 font-bold', icon: <XCircle className="h-3 w-3 text-rose-200" aria-hidden="true" /> };
    }
  };

  return (
    <section aria-label="Lab results" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-sky-200" aria-hidden="true" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('labs.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('labs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/25 bg-white/10 p-1" role="tablist" aria-label={t('labs.labViewMode')}>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'TABLE'}
            onClick={() => setViewMode('TABLE')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer ${
              viewMode === 'TABLE' ? 'bg-white/15 text-white font-bold shadow-xs border border-white/15' : 'text-white/70 hover:text-white/90'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('labs.auditTable')} ({labs.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'FISHBONE'}
            onClick={() => setViewMode('FISHBONE')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer ${
              viewMode === 'FISHBONE' ? 'bg-white/15 text-white font-bold shadow-xs border border-white/15' : 'text-white/70 hover:text-white/90'
            }`}
          >
            <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('labs.fishboneView')}</span>
          </button>
        </div>
      </div>

      <div role="tabpanel" aria-label={viewMode === 'TABLE' ? 'Lab audit table view' : 'Fishbone diagram view'}>
        {viewMode === 'FISHBONE' ? (
          <div className="mt-3.5">
            <FishboneViewer labs={labs} selectedLabId={selectedLabId} onSelectLab={(id: string) => { onSelectLab(id); onOpenProvenanceDrawer?.(); }} />
          </div>
        ) : (
          <div className="mt-3.5 overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="border-b glass-soft text-[10.5px] font-mono uppercase tracking-wider text-white/70">
                  <th scope="col" className="py-2.5 px-3">{t('labs.biomarkerLoinc')}</th>
                  <th scope="col" className="py-2.5 px-3">{t('labs.result')}</th>
                  <th scope="col" className="py-2.5 px-3">{t('labs.referenceRange')}</th>
                  <th scope="col" className="py-2.5 px-3">{t('labs.status')}</th>
                  <th scope="col" className="py-2.5 px-3">{t('labs.clinicalDirective')}</th>
                  <th scope="col" className="py-2.5 px-3 text-right">{t('labs.provenance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-sans text-xs">
                {labs.map((lab) => {
                  const isSelected = lab.id === selectedLabId;
                  const statusBadge = getStatusBadge(lab.status);
                  return (
                    <tr
                      key={lab.id}
                      onClick={() => { onSelectLab(lab.id); onOpenProvenanceDrawer?.(); }}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSelectLab(lab.id); onOpenProvenanceDrawer?.(); } }}
                      className={`group cursor-pointer transition-colors ${isSelected ? 'bg-white/15 border-l-2 border-sky-600' : 'hover:bg-white/10'}`}
                      aria-label={`${lab.name}: ${lab.value} ${lab.unit}, status ${lab.status.replace(/_/g, ' ')}`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white group-hover:text-white flex items-center gap-1.5">
                          <span>{lab.name}</span>
                        </div>
                        <div className="font-mono text-[10px] text-white/60 flex items-center gap-1">
                          <span>LOINC:</span>
                          <span className="text-white/75">{lab.loinc}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={`text-sm font-semibold ${lab.status.startsWith('CRITICAL') ? 'text-rose-200' : lab.status.startsWith('BORDERLINE') ? 'text-amber-200' : 'text-white'}`}>
                          {typeof lab.value === 'number' && lab.value >= 1000 ? lab.value.toLocaleString() : lab.value}
                        </span>{' '}
                        <span className="text-[10.5px] text-white/70">{lab.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10.5px] text-white/70">
                        <span>{lab.refLow >= 1000 ? lab.refLow.toLocaleString() : lab.refLow} – {lab.refHigh >= 1000 ? lab.refHigh.toLocaleString() : lab.refHigh} {lab.unit}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] font-medium ${statusBadge.className}`}>
                          {statusBadge.icon}
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs text-white/85">
                        <span className="line-clamp-2 text-[10.5px]">{lab.directive}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-white/60 group-hover:text-white">
                          <span>{lab.provenance.page ? `p.${lab.provenance.page}` : 'OCR'}</span>
                          <ChevronRight className="h-3 w-3" aria-hidden="true" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(LabAuditTable);
