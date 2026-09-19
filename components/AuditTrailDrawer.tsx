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
    PATIENT_VIEWED: { label: t('auditTrail.patientViewed'), color: 'text-[#1a1a1a] font-medium' },
    LAB_INSPECTED: { label: t('auditTrail.labInspected'), color: 'text-[#1a1a1a] font-bold' },
    ATTESTATION_SIGNED: { label: t('auditTrail.attestationSigned'), color: 'text-[#1c7a3d] font-bold' },
    PAC_PRINTED: { label: t('auditTrail.pacPrinted'), color: 'text-[#1a1a1a] font-bold' },
    PAC_WHATSAPP_SENT: { label: t('auditTrail.whatsappSent'), color: 'text-[#1c7a3d] font-bold' },
    PAC_INTERVIEW_COMPLETED: { label: 'PAC Interview Completed', color: 'text-[#1c7a3d] font-bold' },
    PAC_INTERVIEW_VERIFIED: { label: 'PAC Interview Verified (Clinic)', color: 'text-[#1c7a3d] font-bold' },
    INGESTION_STARTED: { label: t('auditTrail.ingestionStarted'), color: 'text-[#7a5200] font-bold' },
    INGESTION_COMPLETE: { label: t('auditTrail.ingestionComplete'), color: 'text-[#1c7a3d] font-bold' },
    AIRWAY_MODIFIED: { label: t('auditTrail.airwayModified'), color: 'text-[#7a5200] font-bold' },
    CLINICIAN_SWITCHED: { label: 'Duty Clinician Switched', color: 'text-[#1c7a3d] font-bold' },
    OVERRIDE_APPLIED: { label: t('auditTrail.overrideApplied'), color: 'text-[#b3261e] font-bold' },
  };

  const logs = patientId && !showAll
    ? getAuditLogForPatient(patientId)
    : getAuditLog();

  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative h-full w-full max-w-full sm:max-w-md border-l border-black/10 glass-panel rounded-none border-y-0 border-r-0 shadow-2xl overflow-y-auto overflow-x-clip veracity-drawer-in text-[#1a1a1a] min-w-0">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/70 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-[#1a1a1a]" />
            <h3 className="font-serif italic text-lg tracking-wide text-[#1a1a1a] font-bold">{t('auditTrail.title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            {patientId && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                  showAll
                    ? 'border-[#1a1a1a] bg-[#1a1a1a]/[0.06] text-[#1a1a1a] font-bold'
                    : 'border-black/15 bg-white text-[#6b706b] hover:text-black'
                }`}
              >
                <Filter className="h-3 w-3" />
                <span>{showAll ? t('auditTrail.allPatients') : t('auditTrail.currentPatient')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#6b706b] hover:text-black hover:bg-black/[0.05] transition cursor-pointer"
              aria-label={t('auditTrail.closeTrail')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          {sortedLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6b706b] font-mono">
              {t('auditTrail.noEvents')}
            </div>
          ) : (
            sortedLogs.map((log) => {
              const action = ACTION_LABELS[log.action] || { label: log.action, color: 'text-[#1a1a1a]' };
              const time = new Date(log.timestamp);
              return (
                <div key={log.id} className="rounded-xl border border-black/10 bg-white p-3.5 shadow-sm hover:border-black/25 transition-[border-color,background-color] duration-150">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-medium ${action.color}`}>
                      {action.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#9a9ea6]">
                      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#3f4440] font-sans leading-relaxed">{log.details}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-[#9a9ea6] border-t border-black/10 pt-1.5">
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
