'use client';

import React from 'react';
import { usePatientStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { Calendar, Clock, User, Scissors, CheckCircle2, AlertTriangle, OctagonAlert } from 'lucide-react';

const ORReadinessKanban: React.FC = () => {
  const { t } = useI18n();
  const { patients } = usePatientStore();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'GREEN_CLEARED': return { label: t('kanban.cleared'), color: 'border-emerald-300/40 bg-white/15 text-emerald-100', dot: 'bg-emerald-600', icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" /> };
      case 'AMBER_CONDITIONAL': return { label: t('kanban.conditional'), color: 'border-amber-300/40 bg-white/15 text-amber-800', dot: 'bg-amber-500', icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-200" /> };
      case 'RED_HARD_STOP': return { label: t('kanban.hardStop'), color: 'border-rose-300/40 bg-white/15 text-rose-800 font-bold', dot: 'bg-rose-600', icon: <OctagonAlert className="h-3.5 w-3.5 text-rose-200" /> };
      default: return { label: 'UNKNOWN', color: 'border-white/25 bg-white/15 text-white/75', dot: 'bg-slate-400', icon: null };
    }
  };

  const getInvasivenessLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Minor';
      case 2: return 'Intermediate';
      case 3: return 'Major';
      case 4: return 'Complex';
      default: return `Tier ${tier}`;
    }
  };

  const orRooms = ['OR-1 (Main)', 'OR-2 (Laparoscopic)', 'OR-3 (Ortho)'];

  return (
    <section aria-label="OR readiness kanban" className="glass-console rounded-2xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white font-bold">{t('kanban.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70 font-sans">{t('kanban.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2.5 py-0.5 text-emerald-200 font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('kanban.cleared')}</span>
          <span className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/20 px-2.5 py-0.5 text-amber-200 font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {t('kanban.conditional')}</span>
          <span className="flex items-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-500/20 px-2.5 py-0.5 text-rose-200 font-bold"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {t('kanban.hardStop')}</span>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {orRooms.map((room, roomIdx) => {
          const roomPatients = patients.filter((_, i) => i % orRooms.length === roomIdx);
          return (
            <div key={room} className="rounded-xl border border-white/25 bg-white/10 p-3.5">
              <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2.5">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">{room}</span>
                <span className="font-mono text-[10px] text-white/70 font-semibold px-2 py-0.5 rounded-full bg-white/15 border border-white/25">{roomPatients.length} case{roomPatients.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-2">
                {roomPatients.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/25 bg-white/60 p-4 text-center">
                    <span className="text-xs text-white/60 font-mono">No cases scheduled</span>
                  </div>
                ) : (
                  roomPatients.map(patient => {
                    const statusConfig = getStatusConfig(patient.overallStatus);
                    const scheduled = new Date(patient.scheduledTimeIso);
                    return (
                      <div key={patient.id} className={`rounded-xl border p-3 shadow-2xs hover:border-sky-400 transition-all ${statusConfig.color}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {statusConfig.icon}
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wide">{statusConfig.label}</span>
                            </div>
                            <div className="mt-1 font-sans text-xs font-bold text-white truncate">{patient.name}</div>
                            <div className="mt-0.5 text-[10px] font-mono text-white/70 truncate">{patient.procedureName}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono text-white/70 border-t border-white/15 pt-1.5">
                          <span className="flex items-center gap-0.5 font-medium text-white/85"><Clock className="h-2.5 w-2.5 text-white/60" /> {scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-white/80">•</span>
                          <span className="font-medium text-white/85">{patient.asaStatus}</span>
                          <span className="text-white/80">•</span>
                          <span className="flex items-center gap-0.5 text-white/85"><Scissors className="h-2.5 w-2.5 text-white/60" /> Tier {patient.invasivenessTier}</span>
                        </div>
                        <div className="mt-1 text-[9.5px] font-mono text-white/70 flex items-center gap-1">
                          <User className="h-2.5 w-2.5 text-white/60" />
                          <span className="truncate">{patient.surgeon}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(ORReadinessKanban);
