'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluateSerology } from '@/lib/rules-engine';
import { Droplets, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SerologyBloodBankProps {
  patient: PatientCase;
}

const SerologyBloodBank: React.FC<SerologyBloodBankProps> = ({ patient }) => {
  const { t } = useI18n();
  const panel = useMemo(() => evaluateSerology(patient), [patient]);

  const markers = [
    { name: 'HIV 1/2 Antibody', value: panel.hiv1_2, loinc: '75622-1' },
    { name: 'HBsAg (Hepatitis B)', value: panel.hbsAg, loinc: '5196-1' },
    { name: 'Anti-HCV (Hepatitis C)', value: panel.antiHCV, loinc: '696-3' },
  ];

  const allNegative = markers.every(m => m.value === 'NEGATIVE');
  const anyPositive = markers.some(m => m.value === 'POSITIVE');
  const anyNotTested = markers.some(m => m.value === 'NOT_TESTED');

  return (
    <section aria-label="Serology and blood bank" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('serology.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('serology.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold ${
          allNegative && panel.crossmatchStatus !== 'INCOMPATIBLE'
            ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
            : anyPositive
            ? 'border-rose-300/40 bg-rose-500/20 text-rose-200'
            : 'border-amber-300/40 bg-amber-500/20 text-amber-200'
        }`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {allNegative ? t('serology.cleared') : anyPositive ? t('serology.alert') : t('serology.pending')}
        </span>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {markers.map((marker) => (
          <div key={marker.name} className={`rounded-xl border p-3.5 ${
            marker.value === 'POSITIVE' ? 'border-rose-300/40 bg-rose-500/20' :
            marker.value === 'NOT_TESTED' ? 'border-amber-300/40 bg-amber-500/20' :
            'glass-soft'
          }`}>
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">{marker.name}</span>
            <div className="mt-1.5 flex items-center gap-2">
              {marker.value === 'NEGATIVE' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />}
              {marker.value === 'POSITIVE' && <AlertTriangle className="h-3.5 w-3.5 text-rose-200" />}
              {marker.value === 'NOT_TESTED' && <AlertTriangle className="h-3.5 w-3.5 text-amber-200" />}
              <span className={`font-mono text-xs font-semibold ${
                marker.value === 'NEGATIVE' ? 'text-emerald-200' :
                marker.value === 'POSITIVE' ? 'text-rose-200' :
                'text-amber-200'
              }`}>
                {marker.value}
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-white/60 block mt-1">LOINC: {marker.loinc}</span>
          </div>
        ))}
      </div>

      {/* Blood Group & Crossmatch */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl border glass-soft p-3.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">Blood Group & Rh</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-white">{panel.bloodGroup}</span>
            <span className={`font-mono text-xs font-semibold ${panel.rhFactor === 'POSITIVE' ? 'text-emerald-200' : 'text-amber-200'}`}>
              Rh{panel.rhFactor === 'POSITIVE' ? '+' : '−'}
            </span>
          </div>
          <span className="text-[9.5px] text-white/60 font-mono block mt-1">Last screened: {panel.screenedDate}</span>
        </div>

        <div className={`rounded-xl border p-3.5 ${
          panel.crossmatchStatus === 'COMPATIBLE' ? 'border-emerald-300/40 bg-emerald-50/50' :
          panel.crossmatchStatus === 'INCOMPATIBLE' ? 'border-rose-300/40 bg-rose-50/50' :
          'glass-soft'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">Crossmatch Status</span>
          <div className="mt-1.5 flex items-center gap-2">
            {panel.crossmatchStatus === 'COMPATIBLE' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />}
            {panel.crossmatchStatus === 'INCOMPATIBLE' && <AlertTriangle className="h-3.5 w-3.5 text-rose-200" />}
            <span className={`font-mono text-xs font-bold ${
              panel.crossmatchStatus === 'COMPATIBLE' ? 'text-emerald-200' :
              panel.crossmatchStatus === 'INCOMPATIBLE' ? 'text-rose-200' :
              'text-white/85'
            }`}>
              {panel.crossmatchStatus}
            </span>
          </div>
          <span className="text-[9.5px] text-white/60 font-mono block mt-1">
            {panel.crossmatchStatus === 'COMPATIBLE' ? '2 units PRBC crossmatched & held' : 'Additional crossmatch required'}
          </span>
        </div>
      </div>

      {anyPositive && (
        <div className="mt-3.5 rounded-xl border border-rose-300/40 bg-rose-500/20 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Positive Serology Alert</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-900 font-sans">Post-donation screening positive results require infection control precautions and surgeon notification before proceeding.</p>
        </div>
      )}
    </section>
  );
};

export default React.memo(SerologyBloodBank);
