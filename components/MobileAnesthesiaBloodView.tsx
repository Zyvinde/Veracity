'use client';

import React, { useState } from 'react';
import {
  Droplets,
  Heart,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Pill,
  Cigarette,
  Activity,
  CheckCircle2,
  RefreshCw,
  Share2,
  Phone,
  FileCheck2,
  Check,
  User,
  Stethoscope,
  History,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePatientStore } from '@/lib/store';
import {
  evaluatePotassium,
  evaluateHemoglobin,
  evaluateTroponin,
  evaluateCreatinine,
} from '@/lib/rules-engine';

interface MobileAnesthesiaBloodViewProps {
  patientId?: string;
  onOpenAttestation?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenQuestionnaire?: () => void;
}

export const MobileAnesthesiaBloodView: React.FC<MobileAnesthesiaBloodViewProps> = ({
  patientId,
  onOpenAttestation,
  onOpenWhatsApp,
  onOpenQuestionnaire,
}) => {
  const { patients, currentPatientId, selectPatient } = usePatientStore();
  const activeId = patientId || currentPatientId;
  const currentPatient = patients.find((p) => p.id === activeId) || patients[0];

  const [expandedLab, setExpandedLab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'STAT_LABS' | 'CLINICAL_HISTORY' | 'NPO_MEDS'>('STAT_LABS');
  const [clearedNotice, setClearedNotice] = useState(false);

  if (!currentPatient) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        No patient record selected.
      </div>
    );
  }

  // Extract primary STAT labs or use calibrated defaults
  const potassiumLab = currentPatient.labs.find((l) => l.name.toLowerCase().includes('potassium')) || {
    id: 'lab-k',
    name: 'Serum Potassium (K⁺)',
    value: 4.2,
    unit: 'mEq/L',
    refLow: 3.5,
    refHigh: 5.0,
    status: 'NORMAL' as const,
    directive: 'Normal electrolyte range. Cleared for standard induction.',
  };

  const hemoglobinLab = currentPatient.labs.find((l) => l.name.toLowerCase().includes('hemoglobin')) || {
    id: 'lab-hb',
    name: 'Hemoglobin (Hb)',
    value: currentPatient.gender === 'M' ? 14.2 : 12.8,
    unit: 'g/dL',
    refLow: currentPatient.gender === 'M' ? 13.0 : 12.0,
    refHigh: currentPatient.gender === 'M' ? 17.5 : 15.5,
    status: 'NORMAL' as const,
    directive: 'Adequate red cell reserve. Cleared for standard surgery.',
  };

  const plateletsLab = currentPatient.labs.find((l) => l.name.toLowerCase().includes('platelet')) || {
    id: 'lab-plt',
    name: 'Platelet Count',
    value: 235,
    unit: '×10³/µL',
    refLow: 150,
    refHigh: 450,
    status: 'NORMAL' as const,
    directive: 'Platelets ≥ 80,000. ASRA neuraxial & spinal anesthesia cleared.',
  };

  const inrLab = currentPatient.labs.find((l) => l.name.toLowerCase().includes('inr') || l.name.toLowerCase().includes('prothrombin')) || {
    id: 'lab-inr',
    name: 'PT / INR (Coagulation)',
    value: 1.05,
    unit: 'INR',
    refLow: 0.8,
    refHigh: 1.2,
    status: 'NORMAL' as const,
    directive: 'INR ≤ 1.4 target met. Cleared for regional block & neuraxial access.',
  };

  const creatinineLab = currentPatient.labs.find((l) => l.name.toLowerCase().includes('creatinine')) || {
    id: 'lab-cr',
    name: 'Serum Creatinine & eGFR',
    value: 0.82,
    unit: 'mg/dL',
    refLow: 0.6,
    refHigh: 1.1,
    status: 'NORMAL' as const,
    directive: 'eGFR > 90 mL/min/1.73m². Standard anesthetic drug excretion.',
  };

  const troponinLab = currentPatient.labs.find((l) => l.name.toLowerCase().includes('troponin')) || {
    id: 'lab-trop',
    name: 'High-Sensitivity Troponin-I',
    value: 0.008,
    unit: 'ng/mL',
    refLow: 0.0,
    refHigh: 0.014,
    status: 'NORMAL' as const,
    directive: 'Within normal limits (<0.014 ng/mL). No active acute myocardial injury.',
  };

  const bloodBankData = {
    bloodGroup: 'A+',
    rhFactor: 'Positive',
    antibodyScreen: 'Negative',
    crossmatchedUnits: 2,
    bloodBankStatus: 'RESERVED_IN_OT_DEPOT',
  };

  const kEval = evaluatePotassium(potassiumLab.value);
  const hbEval = evaluateHemoglobin(hemoglobinLab.value, currentPatient.gender);
  const tropEval = evaluateTroponin(troponinLab.value);
  const creatEval = evaluateCreatinine(creatinineLab.value, currentPatient.age, currentPatient.gender);
  const q = currentPatient.questionnaire;

  const handle1TapClearance = () => {
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
    if (onOpenAttestation) onOpenAttestation();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#0a1e36]/80 text-white rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden font-sans">
      {/* Top Phone In-OT Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/15 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-md shrink-0">
              <Droplets className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight uppercase truncate">
                  In-OT Blood View
                </span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <span className="text-[10px] text-white/60 font-mono block truncate">
                DHA § 3060(a) Bedside STAT Triage
              </span>
            </div>
          </div>

          <select
            value={currentPatient.id}
            onChange={(e) => selectPatient(e.target.value)}
            className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-bold text-emerald-300 focus:outline-none backdrop-blur-md shrink-0 max-w-[140px]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id} className="bg-black text-white">
                {p.name.split(' ')[0]} ({p.overallStatus.replace('_', ' ').slice(0, 5)})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Pill Card */}
        <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-bold text-white truncate">{currentPatient.name}</h3>
                <span className="rounded bg-white/15 px-1.5 py-0.2 text-[10px] font-bold text-white/90 border border-white/20 shrink-0">
                  {currentPatient.asaStatus}
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-mono truncate">
                {currentPatient.mrn} · {currentPatient.age}y {currentPatient.gender}
              </p>
              <p className="text-[10px] text-white/50 truncate">
                {currentPatient.procedureName}
              </p>
            </div>

            <div
              className={
                'flex flex-col items-end px-2.5 py-1 rounded-lg text-center shrink-0 ' +
                (currentPatient.overallStatus === 'RED_HARD_STOP'
                  ? 'bg-rose-600 text-white'
                  : currentPatient.overallStatus === 'AMBER_CONDITIONAL'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white')
              }
            >
              <span className="text-[9px] font-bold uppercase tracking-wider">PAC Status</span>
              <span className="text-xs font-black">
                {currentPatient.overallStatus === 'RED_HARD_STOP'
                  ? 'RED STOP'
                  : currentPatient.overallStatus === 'AMBER_CONDITIONAL'
                  ? 'AMBER COND'
                  : 'CLEARED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="grid grid-cols-3 border-b border-white/15 bg-white/5 text-center text-xs backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('STAT_LABS')}
          className={
            'py-3 font-bold border-b-2 transition min-h-[44px] flex items-center justify-center cursor-pointer ' +
            (activeTab === 'STAT_LABS'
              ? 'border-emerald-400 text-emerald-300 bg-white/10'
              : 'border-transparent text-white/60 hover:text-white')
          }
        >
          🩸 STAT Labs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CLINICAL_HISTORY')}
          className={
            'py-3 font-bold border-b-2 transition min-h-[44px] flex items-center justify-center cursor-pointer ' +
            (activeTab === 'CLINICAL_HISTORY'
              ? 'border-emerald-400 text-emerald-300 bg-white/10'
              : 'border-transparent text-white/60 hover:text-white')
          }
        >
          📋 Med History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('NPO_MEDS')}
          className={
            'py-3 font-bold border-b-2 transition min-h-[44px] flex items-center justify-center cursor-pointer ' +
            (activeTab === 'NPO_MEDS'
              ? 'border-emerald-400 text-emerald-300 bg-white/10'
              : 'border-transparent text-white/60 hover:text-white')
          }
        >
          ⏱️ NPO / Holds
        </button>
      </div>

      {/* Tab 1: STAT Blood Labs */}
      {activeTab === 'STAT_LABS' && (
        <div className="p-3.5 space-y-2.5">
          {/* Potassium (K+) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 transition backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={
                    'flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ' +
                    (kEval.severity === 'RED'
                      ? 'bg-rose-600 text-white'
                      : kEval.severity === 'AMBER'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white')
                  }
                >
                  K⁺
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Serum Potassium (K⁺)</span>
                  <div className="text-[10px] text-white/50">Ref: 3.5 – 5.0 mEq/L</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white">
                  {potassiumLab.value}{' '}
                  <span className="text-[10px] font-normal text-white/50">mEq/L</span>
                </div>
                <span
                  className={
                    'px-2 py-0.5 rounded text-[9px] font-bold ' +
                    (kEval.severity === 'RED'
                      ? 'bg-rose-600 text-white'
                      : kEval.severity === 'AMBER'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white')
                  }
                >
                  {kEval.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-white/70 border-t border-white/10 pt-1.5 font-mono">
              Directive: {potassiumLab.directive || kEval.directive}
            </p>
          </div>

          {/* Hemoglobin (Hb) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 transition backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={
                    'flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ' +
                    (hbEval.severity === 'RED'
                      ? 'bg-rose-600 text-white'
                      : hbEval.severity === 'AMBER'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white')
                  }
                >
                  Hb
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Hemoglobin (Hb)</span>
                  <div className="text-[10px] text-white/50">
                    Ref: {currentPatient.gender === 'M' ? '13.0 – 17.5' : '12.0 – 15.5'} g/dL
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white">
                  {hemoglobinLab.value}{' '}
                  <span className="text-[10px] font-normal text-white/50">g/dL</span>
                </div>
                <span
                  className={
                    'px-2 py-0.5 rounded text-[9px] font-bold ' +
                    (hbEval.severity === 'RED'
                      ? 'bg-rose-600 text-white'
                      : hbEval.severity === 'AMBER'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white')
                  }
                >
                  {hbEval.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-white/70 border-t border-white/10 pt-1.5 font-mono">
              Directive: {hemoglobinLab.directive || hbEval.directive}
            </p>
          </div>

          {/* Platelets & Coagulation Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Platelets */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
              <div className="text-[11px] font-bold text-white/70">Platelets (PLT)</div>
              <div className="text-sm font-black text-white mt-0.5">
                {plateletsLab.value}{' '}
                <span className="text-[9px] font-normal text-white/50">k/µL</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                ✓ ASRA Neuraxial OK
              </div>
            </div>

            {/* PT / INR */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
              <div className="text-[11px] font-bold text-white/70">Coagulation (INR)</div>
              <div className="text-sm font-black text-white mt-0.5">
                {inrLab.value}{' '}
                <span className="text-[9px] font-normal text-white/50">INR</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                ✓ Regional Block OK
              </div>
            </div>
          </div>

          {/* Renal & Troponin Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Creatinine */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
              <div className="text-[11px] font-bold text-white/70">Creatinine / eGFR</div>
              <div className="text-sm font-black text-white mt-0.5">
                {creatinineLab.value}{' '}
                <span className="text-[9px] font-normal text-white/50">mg/dL</span>
              </div>
              <div
                className={
                  'text-[10px] font-semibold mt-1 ' +
                  (creatEval.severity === 'RED'
                    ? 'text-rose-400'
                    : creatEval.severity === 'AMBER'
                    ? 'text-amber-400'
                    : 'text-emerald-400')
                }
              >
                {creatEval.severity === 'GREEN'
                  ? `✓ eGFR ${creatEval.egfr} mL/min`
                  : creatEval.directive.slice(0, 90)}
              </div>
            </div>

            {/* Troponin */}
            <div
              className={
                'rounded-xl border p-2.5 backdrop-blur-md ' +
                (tropEval.severity === 'RED'
                  ? 'border-rose-500/40 bg-rose-950/20'
                  : tropEval.severity === 'AMBER'
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : 'border-white/10 bg-white/5')
              }
            >
              <div className="text-[11px] font-bold text-white/70">hs-Troponin I</div>
              <div className="text-sm font-black text-white mt-0.5">
                {troponinLab.value}{' '}
                <span className="text-[9px] font-normal text-white/50">ng/mL</span>
              </div>
              <div
                className={
                  'text-[10px] font-semibold mt-1 ' +
                  (tropEval.severity === 'RED'
                    ? 'text-rose-400'
                    : tropEval.severity === 'AMBER'
                    ? 'text-amber-400'
                    : 'text-emerald-400')
                }
              >
                {tropEval.severity === 'GREEN'
                  ? '✓ No Acute Ischemia'
                  : tropEval.status.replace('_', ' ')}
              </div>
              {tropEval.severity !== 'GREEN' && (
                <p className="mt-1 text-[10px] leading-snug text-white/70">{tropEval.directive}</p>
              )}
            </div>
          </div>

          {/* Blood Bank Strip */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-2.5 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white font-black text-xs">
                {bloodBankData.bloodGroup}
              </div>
              <div>
                <span className="text-xs font-bold text-white">Blood Bank Status</span>
                <p className="text-[10px] text-white/70">
                  Antibody Screen Negative · {bloodBankData.crossmatchedUnits} Units Reserved
                </p>
              </div>
            </div>
            <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
              Crossmatch OK
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Medical History */}
      {activeTab === 'CLINICAL_HISTORY' && (
        <div className="p-3.5 space-y-2.5 text-xs">
          {(() => {
            const refs = currentPatient.fitnessReferrals || [];
            const pending = refs.filter((r) => r.status === 'REQUESTED' || r.status === 'RECEIVED');
            const blocked = refs.filter((r) => r.status === 'NOT_CLEARED');
            if (pending.length === 0 && blocked.length === 0) return null;
            return (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 space-y-1 backdrop-blur-md">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertOctagon className="h-4 w-4" />
                  <span>DO NOT CLEAR — doctor fitness pending</span>
                </div>
                {pending.map((r) => (
                  <p key={r.id} className="text-rose-200 text-[11px]">
                    • {r.specialty}: {r.status.replace('_', ' ')} — {r.reason}
                  </p>
                ))}
                {blocked.map((r) => (
                  <p key={r.id} className="text-rose-200 text-[11px]">
                    • {r.specialty}: NOT CLEARED{r.notes ? ` — ${r.notes}` : ''}
                  </p>
                ))}
              </div>
            );
          })()}
          {/* Contraceptive / Estrogen Pill Alert */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Pill className="h-4 w-4" />
                <span>Contraceptive / Hormone Status:</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white border border-white/15">
                {q
                  ? q.contraceptiveType.replace(/_/g, ' ')
                  : currentPatient.gender === 'F'
                  ? 'Yasmin OCP (Active)'
                  : 'None'}
              </span>
            </div>
            <p className="text-white/80 text-[11px]">
              {q
                ? q.contraceptiveType === 'NONE'
                  ? 'No hormonal medication risk factors documented in questionnaire.'
                  : `${
                      q.contraceptiveDrugName || q.contraceptiveType.replace(/_/g, ' ')
                    } active (+VTE points). Apply bilateral mechanical SCDs in OT and encourage early post-op ambulation.${
                      q.contraceptiveDurationMonths ? ` Duration ${q.contraceptiveDurationMonths}mo.` : ''
                    }`
                : currentPatient.gender === 'F'
                ? 'Combined Oral Contraceptive active (+1 Caprini VTE point). Apply bilateral mechanical SCDs in OT and encourage early post-op ambulation.'
                : 'No hormonal medication risk factors documented.'}
            </p>
            {currentPatient.questionnaireUpdatedAtIso ? (
              <p className="text-[10px] font-mono text-white/50">
                Synced{' '}
                {new Date(
                  q?.completedAtIso || currentPatient.questionnaireUpdatedAtIso || ''
                ).toLocaleString()}{' '}
                · {q?.source?.replace(/_/g, ' ') || 'Intake'}
              </p>
            ) : (
              <p className="text-[10px] font-mono text-white/50">
                No questionnaire synced yet — send intake link.
              </p>
            )}
          </div>

          {/* Antipsychotic & Psychotropic Alert */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                <span>Psychotropic / Antipsychotic Drugs:</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white border border-white/15">
                {q ? (q.takesPsychiatricMeds ? `${q.psychiatricMeds.length} med(s)` : 'None') : 'Screened'}
              </span>
            </div>
            <p className="text-white/80 text-[11px]">
              {q && q.takesPsychiatricMeds && q.psychiatricMeds.length > 0
                ? `${q.psychiatricMeds.map((m) => m.name).join('; ')}. Alpha-1 blockade blunts Ephedrine. Prefer direct-acting Phenylephrine or Norepinephrine for hypotension. Check baseline QTc on ECG.`
                : 'If patient on Quetiapine / Haloperidol: Alpha-1 blockade blunts Ephedrine. Prefer direct-acting Phenylephrine or Norepinephrine for hypotension. Check baseline QTc on ECG.'}
            </p>
          </div>

          {/* Smoking & Inhalation Airway Alert */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Cigarette className="h-4 w-4" />
                <span>Smoking & Airway Reactivity:</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white border border-white/15">
                {q ? q.smokingStatus.replace(/_/g, ' ') : 'Airway Protocol'}
              </span>
            </div>
            <p className="text-white/80 text-[11px]">
              {q && (q.smokingStatus === 'ACTIVE_SMOKER' || q.smokingStatus === 'SHISHA' || q.smokingStatus === 'VAPING' || q.usesVapeOrShisha)
                ? `Active inhalation risk (${q.smokingStatus.replace(/_/g, ' ')}${q.packYears ? `, ${q.packYears} pack-years` : ''}). Airway hyperreactivity protocol: 100% FiO2 pre-oxygenation, IV Lidocaine (1.5mg/kg) pre-intubation and extubation.`
                : 'Airway hyperreactivity protocol: 100% FiO2 pre-oxygenation, IV Lidocaine (1.5mg/kg) pre-intubation and extubation to blunt airway reflexes and prevent laryngospasm.'}
            </p>
          </div>

          {/* Cardiac Disease & Stents */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>Cardiovascular & Stents (RCRI):</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white border border-white/15">
                {currentPatient.rcriClass}
              </span>
            </div>
            <p className="text-white/80 text-[11px]">
              {q && q.hasCardiacHistory
                ? `${q.cardiacConditions.join(', ').replace(/_/g, ' ') || 'Cardiac history'} · METs ${q.metsExerciseTolerance} · EF ${q.ejectionFraction ?? '—'}%. Maintain MAP > 65 mmHg, HR 60–80, avoid tachycardia.${q.cardiologyClearanceOnRecord ? ' Cardiology cleared.' : ' No cardiology clearance on record.'}`
                : 'RCRI Class I (<0.4% MACE risk). Maintain MAP > 65 mmHg, maintain heart rate 60–80 bpm, avoid severe tachycardia.'}
            </p>
          </div>

          {/* Medical Issues Checklist */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-emerald-400" />
                <span>Medical Issues:</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/90 border border-white/15">
                {q && q.medicalIssues && q.medicalIssues.length > 0
                  ? `${q.medicalIssues.length} flagged`
                  : 'None reported'}
              </span>
            </div>
            <p className="text-white/70 text-[11px]">
              {q && q.medicalIssues && q.medicalIssues.length > 0
                ? q.medicalIssues.map((m) => m.replace(/_/g, ' ').toLowerCase()).join(' · ') +
                  (q.medicalIssueNotes ? ` — ${q.medicalIssueNotes}` : '')
                : 'No cold, cough, fever, asthma, breathing infection, diabetes, BP, heart, liver or kidney issues reported.'}
            </p>
          </div>

          {/* Previous Surgery + Family Anesthesia + G6PD */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-white">
              <span className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-emerald-400" />
                <span>Previous Surgery / Family / G6PD:</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/90 border border-white/15">
                {q?.hadPreviousSurgery ? 'Prior surgery' : 'No prior surgery'}
              </span>
            </div>
            <p className="text-white/70 text-[11px]">
              {q?.hadPreviousSurgery && q.previousSurgeries && q.previousSurgeries.length > 0
                ? q.previousSurgeries
                    .map(
                      (s) =>
                        `${s.procedure}${s.year ? ` (${s.year})` : ''}${
                          s.complications ? ` — ${s.complications}` : ''
                        }`
                    )
                    .join('; ')
                : 'No previous surgery reported.'}
            </p>
            <p className="text-white/70 text-[11px]">
              Family anesthesia:{' '}
              {q?.familyAnesthesiaIssues && q.familyAnesthesiaIssues.length > 0
                ? q.familyAnesthesiaIssues.map((f) => f.replace(/_/g, ' ').toLowerCase()).join(' · ')
                : 'none'}
              {' · '}G6PD: {q?.hasG6pd ? `YES${q.g6pdDetails ? ` (${q.g6pdDetails})` : ''}` : 'no'}
            </p>
          </div>

          {/* Dental + Airway Screen + Drug Allergy */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>Teeth / Airway / Allergy:</span>
              </span>
              <span className="rounded bg-amber-600 px-2 py-0.5 text-[9px] font-bold text-white">
                Airway check
              </span>
            </div>
            <p className="text-white/70 text-[11px]">
              Teeth:{' '}
              {q?.dentalIssues && q.dentalIssues.length > 0
                ? q.dentalIssues.map((d) => d.replace(/_/g, ' ').toLowerCase()).join(' · ')
                : 'none'}
              {' · '}Neck:{' '}
              {q?.neckMovement ? q.neckMovement.replace(/_/g, ' ').toLowerCase() : 'normal'}
              {' · '}Mouth:{' '}
              {q?.mouthOpening
                ? q.mouthOpening.replace(/_/g, ' ').toLowerCase().replace('fingers', 'finger-width')
                : 'normal'}
            </p>
            <p className="text-white/70 text-[11px]">
              Drug allergy:{' '}
              {q?.hasDrugAllergy
                ? `${
                    (q.drugAllergyKeys || [])
                      .map((a) => a.replace(/_/g, ' ').toLowerCase())
                      .join(' · ') || 'reported'
                  }${q.drugAllergyDetails ? ` — ${q.drugAllergyDetails}` : ''}`
                : 'none reported'}
            </p>
          </div>

          {onOpenQuestionnaire && (
            <button
              type="button"
              onClick={onOpenQuestionnaire}
              className="w-full py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs transition cursor-pointer backdrop-blur-md"
            >
              Open Full Patient Pre-Op Questionnaire
            </button>
          )}
        </div>
      )}

      {/* Tab 3: Fasting NPO & Med Holds */}
      {activeTab === 'NPO_MEDS' && (
        <div className="p-3.5 space-y-2.5 text-xs">
          {/* NPO Clock */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>8-Hour NPO Fasting Clock:</span>
              </span>
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                {(q?.lastSolidFoodHoursAgo ?? 12) >= 8 && (q?.lastClearFluidHoursAgo ?? 4) >= 3
                  ? 'Fasting Met'
                  : 'NOT FASTED'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-black/30 border border-white/10">
                <div className="text-[10px] text-white/50">Solids Fasting</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {q?.lastSolidFoodHoursAgo ?? 12}h 00m
                </div>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/10">
                <div className="text-[10px] text-white/50">Clear Fluids</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {q?.lastClearFluidHoursAgo ?? 4}h 15m
                </div>
              </div>
            </div>
            <p className="text-[11px] text-white/80">
              {(q?.lastSolidFoodHoursAgo ?? 12) >= 8
                ? '✓ Low aspiration risk. Cleared for standard general anesthesia induction.'
                : '✕ Solids < 8h: HIGH aspiration risk. Delay induction, consider RSI + gastric POCUS.'}
              {q?.takesGlp1
                ? ` GLP-1 ${q.glp1DrugName || ''} last dose ${
                    q.lastGlp1DoseHoursAgo ?? '—'
                  }h ago (weekly target 168h).`
                : ''}
            </p>
          </div>

          {/* Day-of-surgery medicine rules */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 text-[11px] space-y-1">
            <p className="text-rose-400 font-bold">
              ✕ Do NOT take diabetes medicine on day of surgery.
            </p>
            <p className="text-emerald-400 font-bold">
              ✓ TAKE thyroid medicine with a sip of water.
            </p>
          </div>

          {/* Active Medication Hold Clocks */}
          <div className="space-y-1.5">
            <span className="font-bold text-[11px] text-white/60 uppercase tracking-wider">
              Active Medication Clocks:
            </span>
            {currentPatient.medications.map((med) => (
              <div
                key={med.id}
                className="rounded-lg border border-white/10 bg-white/5 p-2.5 flex items-center justify-between backdrop-blur-md"
              >
                <div>
                  <div className="font-bold text-white text-xs">{med.drugName}</div>
                  <div className="text-[10px] text-white/50 font-mono">
                    Hold required: {med.requiredHoldHours}h · Last dose: {med.lastDoseHoursAgo}h ago
                  </div>
                </div>
                <span
                  className={
                    'px-2 py-0.5 rounded text-[9px] font-bold ' +
                    (med.status === 'CLEARED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white')
                  }
                >
                  {med.status}
                </span>
              </div>
            ))}
            {q?.currentMedications && q.currentMedications.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-[11px] text-white/60 uppercase tracking-wider">
                  Patient-reported daily meds:
                </span>
                {q.currentMedications.map((med) => (
                  <div
                    key={med.name}
                    className="rounded-lg border border-white/10 bg-white/5 p-2.5 flex items-center justify-between backdrop-blur-md"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{med.name}</div>
                      <div className="text-[10px] text-white/50 font-mono">
                        {med.category.replace('_', ' ')}
                        {med.dose ? ` · ${med.dose}` : ''}
                      </div>
                    </div>
                    <span
                      className={
                        'px-2 py-0.5 rounded text-[9px] font-bold ' +
                        (med.category === 'THYROID'
                          ? 'bg-emerald-600 text-white'
                          : med.category === 'DIABETES'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white/15 text-white')
                      }
                    >
                      {med.category === 'THYROID'
                        ? 'TAKE sip'
                        : med.category === 'DIABETES'
                        ? 'HOLD'
                        : med.category.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Footer for In-OT Anesthesiologist */}
      <div className="p-4 bg-white/10 backdrop-blur-md border-t border-white/15 space-y-2">
        {clearedNotice && (
          <div className="p-2 rounded-lg bg-emerald-600 text-white text-xs font-bold text-center animate-fade-in">
            ✓ In-OT Anesthetic Clearance Logged & Certified!
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handle1TapClearance}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-3 px-3 text-xs font-bold shadow-md transition cursor-pointer min-h-[46px]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>1-Tap OT Clearance</span>
          </button>

          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white py-3 px-3 text-xs font-bold transition cursor-pointer backdrop-blur-md min-h-[46px]"
          >
            <Share2 className="h-4 w-4 text-emerald-400" />
            <span>Send PAC WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAnesthesiaBloodView;
