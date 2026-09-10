'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { generateERASTimeline } from '@/lib/rules-engine';
import { Route, CheckCircle2, Clock, AlertCircle, SkipForward } from 'lucide-react';

interface ERASTimelineProps {
  patient: PatientCase;
}

const ERASTimeline: React.FC<ERASTimelineProps> = ({ patient }) => {
  const { t } = useI18n();
  const events = useMemo(() => generateERASTimeline(patient), [patient]);

  const categoryConfig = {
    FASTING: { color: 'text-amber-200', bg: 'bg-amber-500/20', border: 'border-amber-300/40' },
    MEDICATION: { color: 'text-white', bg: 'bg-white/15', border: 'border-white/30' },
    HYGIENE: { color: 'text-emerald-200', bg: 'bg-emerald-500/20', border: 'border-emerald-300/40' },
    EDUCATION: { color: 'text-white/85', bg: 'bg-white/15', border: 'border-white/25' },
    PROMS: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />;
      case 'CURRENT': return <Clock className="h-3.5 w-3.5 text-sky-200" />;
      case 'SKIPPED': return <SkipForward className="h-3.5 w-3.5 text-white/60" />;
      default: return <AlertCircle className="h-3.5 w-3.5 text-white/60" />;
    }
  };

  return (
    <section aria-label="ERAS timeline" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('eras.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('eras.subtitle')}</p>
        </div>
      </div>

      <div className="mt-4 relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/20" />

        <div className="space-y-3">
          {events.map((event, i) => {
            const config = categoryConfig[event.category];
            const isCompleted = event.status === 'COMPLETED';
            const isCurrent = event.status === 'CURRENT';

            return (
              <div key={i} className={`relative flex gap-3 ${isCompleted ? 'opacity-70' : ''}`}>
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${
                    isCurrent ? 'border-white/60 bg-white/15 shadow-xs' :
                    isCompleted ? 'border-emerald-300/40 bg-emerald-500/20' :
                    'border-white/25 bg-white/15 shadow-xs'
                  }`}>
                    {statusIcon(event.status)}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 rounded-xl border p-3 transition ${
                  isCurrent ? 'border-sky-300 bg-sky-50/60 shadow-xs' :
                  isCompleted ? 'border-white/15 bg-white/10' :
                  'border-white/25 bg-white/15 shadow-xs'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold ${config.border} ${config.color} ${config.bg}`}>
                        {event.timeLabel}
                      </span>
                      <span className="font-sans text-xs font-semibold text-white">{event.title}</span>
                    </div>
                    <span className={`font-mono text-[9.5px] font-bold ${
                      isCompleted ? 'text-emerald-200' : isCurrent ? 'text-white' : 'text-white/60'
                    }`}>
                      {isCompleted ? 'DONE' : isCurrent ? 'NOW' : 'UPCOMING'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10.5px] text-white/75 font-sans leading-relaxed">{event.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ERASTimeline);
