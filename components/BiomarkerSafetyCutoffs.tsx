'use client';

import React, { useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import { evaluatePotassium, evaluateHemoglobin, evaluatePlateletCount, evaluateBloodGlucose, evaluateHbA1c } from '@/lib/rules-engine';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface BiomarkerSafetyCutoffsProps {
  patient: PatientCase;
}

const BiomarkerSafetyCutoffs: React.FC<BiomarkerSafetyCutoffsProps> = ({ patient }) => {
  const { t } = useI18n();
  const evaluations = useMemo(() => {
    const kLab = patient.labs.find(l => l.name.toLowerCase().includes('potassium'));
    const hgbLab = patient.labs.find(l => l.name.toLowerCase().includes('hemoglobin'));
    const pltLab = patient.labs.find(l => l.name.toLowerCase().includes('platelet'));
    const gluLab = patient.labs.find(l => l.name.toLowerCase().includes('glucose') || l.name.toLowerCase().includes('glu'));
    const hba1cLab = patient.labs.find(l => l.name.toLowerCase().includes('a1c') || l.name.toLowerCase().includes('hba1c'));

    const hasNeuraxial = patient.swimLane === 'LANE_3_IN_PERSON' && patient.medications.some(m => m.category === 'DOAC');

    return [
      {
        name: 'Potassium (K+)',
        value: kLab?.value,
        unit: 'mEq/L',
        thresholds: { red: '<3.0 or >5.5', amber: '3.1–3.4, 5.2–5.5' },
        evaluation: kLab ? evaluatePotassium(kLab.value) : null,
      },
      {
        name: 'Hemoglobin (Hb)',
        value: hgbLab?.value,
        unit: 'g/dL',
        thresholds: { red: '<7.0', amber: `<${patient.gender === 'F' ? '10.5' : '11.5'}` },
        evaluation: hgbLab ? evaluateHemoglobin(hgbLab.value, patient.gender) : null,
      },
      {
        name: 'Platelet Count',
        value: pltLab?.value,
        unit: '/µL',
        thresholds: { red: '<50,000', amber: '<70,000 (neuraxial)' },
        evaluation: pltLab ? evaluatePlateletCount(pltLab.value, hasNeuraxial) : null,
      },
      {
        name: 'Blood Glucose',
        value: gluLab?.value,
        unit: 'mg/dL',
        thresholds: { red: '<54 or >300', amber: '>140 (non-DM), >180 (DM)' },
        evaluation: gluLab ? evaluateBloodGlucose(gluLab.value, patient.medications.some(m => m.category === 'SGLT2I')) : null,
      },
      {
        name: 'HbA1c',
        value: hba1cLab?.value,
        unit: '%',
        thresholds: { red: '>9.0%', amber: '>5.7%' },
        evaluation: hba1cLab ? evaluateHbA1c(hba1cLab.value) : null,
      },
    ];
  }, [patient]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'RED': return <XCircle className="h-4 w-4 text-rose-200" />;
      case 'AMBER': return <AlertTriangle className="h-4 w-4 text-amber-200" />;
      default: return <CheckCircle2 className="h-4 w-4 text-emerald-200" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'RED': return 'border-rose-300/40 bg-rose-500/20';
      case 'AMBER': return 'border-amber-300/40 bg-amber-500/20';
      default: return 'glass-soft';
    }
  };

  return (
    <section aria-label="Biomarker safety cutoffs" className="glass-console rounded-2xl p-5 text-white/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-200" />
            <h2 className="font-serif italic text-lg tracking-wide text-white">{t('biomarkers.title')}</h2>
          </div>
          <p className="mt-0.5 text-xs text-white/70">{t('biomarkers.subtitle')}</p>
        </div>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {evaluations.map((item) => {
          if (!item.evaluation || item.value === undefined) return null;
          return (
            <div key={item.name} className={`flex flex-wrap items-start gap-3 rounded-xl border p-3.5 transition ${getSeverityStyles(item.evaluation.severity)}`}>
              <div className="flex items-center gap-2.5 shrink-0">
                {getSeverityIcon(item.evaluation.severity)}
                <div>
                  <span className="font-sans text-xs font-semibold text-white">{item.name}</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={`font-mono text-base font-semibold ${
                      item.evaluation.severity === 'RED' ? 'text-rose-200' :
                      item.evaluation.severity === 'AMBER' ? 'text-amber-200' :
                      'text-white'
                    }`}>
                      {typeof item.value === 'number' && item.value >= 1000 ? item.value.toLocaleString() : item.value}
                    </span>
                    <span className="text-[10.5px] text-white/70 font-mono">{item.unit}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] font-bold ${
                    item.evaluation.severity === 'RED' ? 'text-rose-200 border-rose-300/40 bg-rose-500/20' :
                    item.evaluation.severity === 'AMBER' ? 'text-amber-200 border-amber-300/40 bg-amber-500/20' :
                    'text-emerald-200 border-emerald-300/40 bg-emerald-500/20'
                  }`}>
                    {item.evaluation.severity === 'RED' ? 'HARD STOP' :
                     item.evaluation.severity === 'AMBER' ? 'REPLETION DIRECTIVE' :
                     'NORMAL'}
                  </span>
                  <span className="text-[9px] font-mono text-white/60">Red: {item.thresholds.red} · Amber: {item.thresholds.amber}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/75 font-sans leading-relaxed">{item.evaluation.directive}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(BiomarkerSafetyCutoffs);
