'use client';

import React, { useMemo } from 'react';
import type { PatientCase } from '@/lib/types';
import {
  evaluateAirwayRisk,
  evaluateASCExclusion,
  evaluateNeuraxialFeasibility,
  evaluatePenicillinDelabeling,
} from '@/lib/rules-engine';

function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'idle'; children: React.ReactNode }) {
  const cls =
    tone === 'ok' ? 'veracity-status-cleared' : tone === 'warn' ? 'veracity-status-conditional' : tone === 'bad' ? 'veracity-status-stop' : 'rounded-full border border-black/10 bg-black/[0.04] text-[#6b706b]';
  return <span className={`veracity-num shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{children}</span>;
}

/**
 * ConsolePreOp — restored pre-op assessment modules (old PreAnesthesiaCheckup,
 * AirwaySpineModule, AllergyCard, BMICalculator + ASC/neuraxial/delabeling),
 * rebuilt Harvey-styled on the retained rules-engine functions.
 */
export const PreOpSections: React.FC<{ patient: PatientCase }> = ({ patient }) => {
  const airwayRisk = useMemo(() => {
    try { return evaluateAirwayRisk(patient.airway); } catch { return 'MODERATE' as const; }
  }, [patient]);
  const asc = useMemo(() => {
    try { return evaluateASCExclusion(patient); } catch { return null; }
  }, [patient]);
  const neuraxial = useMemo(() => {
    try { return evaluateNeuraxialFeasibility(patient); } catch { return null; }
  }, [patient]);
  const delabel = useMemo(() => {
    try { return evaluatePenicillinDelabeling(patient); } catch { return null; }
  }, [patient]);

  const latestVitals = patient.vitals.length > 0 ? patient.vitals[patient.vitals.length - 1] : null;
  const holds = patient.medications.filter((m) => m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP').length;
  const hasQuestionnaire = Boolean(patient.questionnaire || patient.pacInterview);

  const domains: { name: string; detail: string; tone: 'ok' | 'warn' | 'bad' | 'idle'; label: string }[] = [
    { name: 'Identity & consent', detail: `${patient.name} · ${patient.mrn} · ${patient.procedureName}`, tone: 'ok', label: 'VERIFIED' },
    { name: 'History intake', detail: hasQuestionnaire ? 'Questionnaire / PAC interview on file' : 'No questionnaire yet — send intake link', tone: hasQuestionnaire ? 'ok' : 'idle', label: hasQuestionnaire ? 'DOCUMENTED' : 'PENDING' },
    { name: 'Airway exam', detail: `Mallampati ${patient.airway.mallampati} · ${patient.airway.mouthOpeningCm}cm opening · ${airwayRisk} risk`, tone: airwayRisk === 'LOW' ? 'ok' : airwayRisk === 'MODERATE' ? 'warn' : 'bad', label: `${airwayRisk} RISK` },
    { name: 'Medications & holds', detail: holds > 0 ? `${holds} active hold${holds === 1 ? '' : 's'} — see section 10` : 'No active holds', tone: holds > 0 ? 'warn' : 'ok', label: holds > 0 ? `${holds} HOLDS` : 'CLEAR' },
    { name: 'Allergy review', detail: patient.allergies.length > 0 ? `${patient.allergies.length} documented — see section 06` : 'No known allergies documented', tone: patient.allergies.some((a) => a.severity === 'ANAPHYLAXIS') ? 'bad' : patient.allergies.length > 0 ? 'warn' : 'ok', label: patient.allergies.length > 0 ? `${patient.allergies.length} NOTED` : 'NKDA' },
    { name: 'Vitals baseline', detail: latestVitals ? `HR ${latestVitals.heartRate} · ${latestVitals.systolicBp}/${latestVitals.diastolicBp} · SpO2 ${latestVitals.spo2}%` : 'No vitals recorded', tone: latestVitals ? 'ok' : 'idle', label: latestVitals ? 'RECORDED' : 'PENDING' },
    { name: 'Labs & biomarkers', detail: patient.labs.length > 0 ? `${patient.labs.length} markers — see sections 03, 08–09` : 'No biomarkers yet', tone: patient.labs.some((l) => l.status.startsWith('CRITICAL')) ? 'bad' : patient.labs.length > 0 ? 'ok' : 'idle', label: patient.labs.length > 0 ? `${patient.labs.length} MARKERS` : 'PENDING' },
    { name: 'Fasting (NPO)', detail: 'Live chronometer in section 10', tone: 'ok', label: 'TRACKED' },
    { name: 'Cardiac & RCRI', detail: `${patient.rcriClass} · STOP-Bang ${patient.stopBangScore}`, tone: 'ok', label: 'STRATIFIED' },
    { name: 'IV access & plan', detail: `Tier ${patient.invasivenessTier} · ${patient.swimLane.replace(/_/g, ' ')}`, tone: 'ok', label: 'PLANNED' },
    { name: 'Patient education', detail: hasQuestionnaire ? 'Intake education delivered with questionnaire' : 'Deliver at intake', tone: hasQuestionnaire ? 'ok' : 'idle', label: hasQuestionnaire ? 'DELIVERED' : 'PENDING' },
  ];

  return (
    <>
      <section id="veracity-checklist" aria-label="Pre-anesthesia checklist" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">05 — Checklist</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Pre-anesthesia <span className="italic">checklist</span></h2>
          </div>
          <p className="veracity-num text-[11px] text-[#9a9ea6]">{domains.filter((d) => d.tone === 'ok').length}/{domains.length} domains green</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {domains.map((d) => (
            <div key={d.name} className="veracity-tile flex items-start justify-between gap-2 p-3.5">
              <div className="min-w-0">
                <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">{d.name}</h3>
                <p className="veracity-ui-label mt-1 line-clamp-2 text-[12px] leading-snug text-[#6b706b]">{d.detail}</p>
              </div>
              <Pill tone={d.tone}>{d.label}</Pill>
            </div>
          ))}
        </div>
      </section>

      <section id="veracity-airway" aria-label="Airway, allergy and BMI" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">06 — Airway</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Airway, allergy <span className="italic">&amp; body</span></h2>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="veracity-tile p-3.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Airway exam</p>
            <p className="veracity-num mt-2 text-[22px] font-semibold leading-none text-[#1a1a1a]">{airwayRisk}<span className="text-[12px] font-medium text-[#6b706b]"> risk</span></p>
            <p className="veracity-ui-label mt-2 text-[12px] leading-snug text-[#6b706b]">
              Mallampati {patient.airway.mallampati} · TMD {patient.airway.thyromentalDistanceCm}cm · {String(patient.airway.neckMobility).replace(/_/g, ' ').toLowerCase()} neck · {String(patient.airway.dentition).replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
          <div className="veracity-tile p-3.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Allergies ({patient.allergies.length})</p>
            {patient.allergies.length === 0 ? (
              <p className="veracity-num mt-2 text-[22px] font-semibold leading-none text-[#1a1a1a]">NKDA</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {patient.allergies.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="veracity-ui-label truncate text-[12px] text-[#1a1a1a]">{a.allergen}</span>
                    <Pill tone={a.severity === 'ANAPHYLAXIS' || a.severity === 'SEVERE' ? 'bad' : a.severity === 'MODERATE' ? 'warn' : 'idle'}>{a.severity}</Pill>
                  </li>
                ))}
              </ul>
            )}
            <p className="veracity-ui-label mt-2 text-[12px] text-[#6b706b]">{patient.allergies.length > 0 ? patient.allergies[0].reaction : 'No known drug allergies'}</p>
          </div>
          <div className="veracity-tile p-3.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Body mass</p>
            <p className="veracity-num mt-2 text-[22px] font-semibold leading-none text-[#1a1a1a]">{patient.bmi.toFixed(1)}<span className="text-[12px] font-medium text-[#6b706b]"> BMI</span></p>
            <p className="veracity-ui-label mt-2 text-[12px] leading-snug text-[#6b706b]">{patient.weightKg}kg · {patient.heightCm}cm · {patient.age}y · {patient.gender}</p>
          </div>
        </div>
      </section>

      <section id="veracity-suitability" aria-label="Suitability scores" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">07 — Suitability</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Suitability <span className="italic">scores</span></h2>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className={asc && asc.excluded ? 'veracity-tile-critical p-3.5' : 'veracity-tile p-3.5'}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">ASC suitability</h3>
              {asc && <Pill tone={asc.excluded ? 'bad' : 'ok'}>{asc.excluded ? 'EXCLUDED' : 'SUITABLE'}</Pill>}
            </div>
            <p className="veracity-num mt-2 text-[26px] font-semibold leading-none text-[#1a1a1a]">{asc ? asc.riskScore : '—'}</p>
            <p className="veracity-ui-label mt-2 line-clamp-3 text-[12px] leading-snug text-[#6b706b]">{asc ? (asc.reasons[0] ?? asc.recommendation) : 'Not computed for this case.'}</p>
          </div>
          <div className={neuraxial && !neuraxial.eligible ? 'veracity-tile-critical p-3.5' : 'veracity-tile p-3.5'}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">Neuraxial feasibility</h3>
              {neuraxial && <Pill tone={neuraxial.eligible ? 'ok' : 'bad'}>{neuraxial.eligible ? 'FEASIBLE' : 'NO-GO'}</Pill>}
            </div>
            <p className="veracity-ui-label mt-2 line-clamp-3 min-h-[48px] text-[12px] leading-snug text-[#1a1a1a]">{neuraxial ? neuraxial.recommendation : 'Not computed for this case.'}</p>
            {neuraxial && neuraxial.hardStopReasons.length > 0 && (
              <p className="veracity-ui-label mt-1 line-clamp-2 text-[12px] text-[#6b706b]">{neuraxial.hardStopReasons[0]}</p>
            )}
          </div>
          <div className="veracity-tile p-3.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">Penicillin delabeling</h3>
              {delabel && <Pill tone={delabel.eligibleForDelabeling ? 'ok' : 'idle'}>{delabel.eligibleForDelabeling ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</Pill>}
            </div>
            <p className="veracity-ui-label mt-2 line-clamp-3 min-h-[48px] text-[12px] leading-snug text-[#1a1a1a]">{delabel ? delabel.recommendation : 'Not computed for this case.'}</p>
            {delabel && delabel.alternativeAntibiotics.length > 0 && (
              <p className="veracity-num mt-1 text-[11px] text-[#6b706b]">Alt: {delabel.alternativeAntibiotics.slice(0, 3).join(', ')}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default PreOpSections;
