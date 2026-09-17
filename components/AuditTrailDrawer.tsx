'use client';

import React, { useState } from 'react';
import { AuditLogEntry } from '@/lib/types';
import { getAuditLog, getAuditLogForPatient } from '@/lib/audit-logger';
import { History, Filter, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface AuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
}

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({ isOpen, onClose, patientId }) => {
  const [showAll, setShowAll] = useState(false);
  const { t } = useI18n();

  if (!isOpen) return null;

  const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    PATIENT_VIEWED: { label: t('auditTrail.patientViewed'), color: 'text-white font-medium' },
    LAB_INSPECTED: { label: t('auditTrail.labInspected'), color: 'text-white font-bold' },
    ATTESTATION_SIGNED: { label: t('auditTrail.attestationSigned'), color: 'text-emerald-200 font-bold' },
    PAC_PRINTED: { label: t('auditTrail.pacPrinted'), color: 'text-sky-800 font-bold' },
    PAC_WHATSAPP_SENT: { label: t('auditTrail.whatsappSent'), color: 'text-emerald-200 font-bold' },
    PAC_INTERVIEW_COMPLETED: { label: 'PAC Interview Completed', color: 'text-emerald-200 font-bold' },
    PAC_INTERVIEW_VERIFIED: { label: 'PAC Interview Verified (Clinic)', color: 'text-emerald-200 font-bold' },
    INGESTION_STARTED: { label: t('auditTrail.ingestionStarted'), color: 'text-amber-200 font-bold' },
    INGESTION_COMPLETE: { label: t('auditTrail.ingestionComplete'), color: 'text-emerald-200 font-bold' },
    AIRWAY_MODIFIED: { label: t('auditTrail.airwayModified'), color: 'text-amber-200 font-bold' },
    CLINICIAN_SWITCHED: { label: 'Duty Clinician Switched', color: 'text-emerald-200 font-bold' },
    OVERRIDE_APPLIED: { label: t('auditTrail.overrideApplied'), color: 'text-rose-200 font-bold' },
  };

  const logs = patientId && !showAll
    ? getAuditLogForPatient(patientId)
    : getAuditLog();

  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative h-full w-full max-w-full sm:max-w-md border-l border-white/20 glass-panel rounded-none border-y-0 border-r-0 shadow-2xl overflow-y-auto overflow-x-clip veracity-drawer-in text-white/90 min-w-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/15 bg-black/40 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-sky-200" />
            <h3 className="font-serif italic text-lg tracking-wide text-white font-bold">{t('auditTrail.title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            {patientId && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                  showAll
                    ? 'border-sky-300 bg-white/15 text-white font-bold'
                    : 'border-white/25 bg-white/15 text-white/75 hover:text-white'
                }`}
              >
                <Filter className="h-3 w-3" />
                <span>{showAll ? t('auditTrail.allPatients') : t('auditTrail.currentPatient')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/60 hover:text-white/85 hover:bg-white/15 transition cursor-pointer"
              aria-label={t('auditTrail.closeTrail')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          {sortedLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/60 font-mono">
              {t('auditTrail.noEvents')}
            </div>
          ) : (
            sortedLogs.map((log) => {
              const action = ACTION_LABELS[log.action] || { label: log.action, color: 'text-white/90' };
              const time = new Date(log.timestamp);
              return (
                <div key={log.id} className="rounded-xl border border-white/25 bg-white/10 p-3.5 hover:border-white/50 hover:bg-white/15 transition-[border-color,background-color] duration-150">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-medium ${action.color}`}>
                      {action.label}
                    </span>
                    <span className="text-[10px] font-mono text-white/60">
                      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/85 font-sans leading-relaxed">{log.details}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-white/60 border-t border-white/15 pt-1.5">
                    <span>ID: {log.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AuditTrailDrawer);
