const fs = require('fs');
const path = require('path');

const content = `'use client';

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
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePatientStore } from '@/lib/store';
import {
  evaluatePotassium,
  evaluateHemoglobin,
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
      <div className="p-4 text-center text-slate-400">
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

  const handle1TapClearance = () => {
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 3000);
    if (onOpenAttestation) onOpenAttestation();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#0B1120] text-slate-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden font-sans">
      {/* Top Phone In-OT Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight uppercase">In-OT Anesthesia Blood View</span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">DHA § 3060(a) Bedside STAT Triage</span>
            </div>
          </div>

          <select
            value={currentPatient.id}
            onChange={(e) => selectPatient(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-blue-300 focus:outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.split(' ')[0]} ({p.overallStatus.replace('_', ' ').slice(0, 5)})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Pill Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{currentPatient.name}</h3>
                <span className="rounded bg-blue-900 px-1.5 py-0.2 text-[10px] font-bold text-blue-300 border border-blue-700">
                  {currentPatient.asaStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                {currentPatient.mrn} · {currentPatient.age}y {currentPatient.gender} · {currentPatient.procedureName}
              </p>
            </div>

            <div
              className={'flex flex-col items-end px-2 py-1 rounded-lg text-center ' + (
                currentPatient.overallStatus === 'RED_HARD_STOP'
                  ? 'bg-rose-600 text-white'
                  : currentPatient.overallStatus === 'AMBER_CONDITIONAL'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              )}
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
      <div className="grid grid-cols-3 border-b border-slate-700 bg-slate-900/60 text-center text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('STAT_LABS')}
          className={'py-2.5 font-bold border-b-2 transition ' + (
            activeTab === 'STAT_LABS'
              ? 'border-blue-500 text-blue-400 bg-blue-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          🩸 STAT Labs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CLINICAL_HISTORY')}
          className={'py-2.5 font-bold border-b-2 transition ' + (
            activeTab === 'CLINICAL_HISTORY'
              ? 'border-blue-500 text-blue-400 bg-blue-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          📋 Med History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('NPO_MEDS')}
          className={'py-2.5 font-bold border-b-2 transition ' + (
            activeTab === 'NPO_MEDS'
              ? 'border-blue-500 text-blue-400 bg-blue-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          )}
        >
          ⏱️ NPO / Holds
        </button>
      </div>

      {/* Tab 1: STAT Blood Labs */}
      {activeTab === 'STAT_LABS' && (
        <div className="p-3.5 space-y-2.5">
          {/* Potassium (K+) */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={'flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ' + (
                  kEval.severity === 'RED'
                    ? 'bg-rose-600 text-white'
                    : kEval.severity === 'AMBER'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                )}>
                  K⁺
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Serum Potassium (K⁺)</span>
                  <div className="text-[10px] text-slate-400">Ref: 3.5 – 5.0 mEq/L</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white">{potassiumLab.value} <span className="text-[10px] font-normal text-slate-400">mEq/L</span></div>
                <span className={'px-1.5 py-0.2 rounded text-[9px] font-bold ' + (
                  kEval.severity === 'RED'
                    ? 'bg-rose-900 text-rose-200'
                    : kEval.severity === 'AMBER'
                    ? 'bg-amber-900 text-amber-200'
                    : 'bg-emerald-900 text-emerald-200'
                )}>
                  {kEval.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-300 border-t border-slate-700/60 pt-1.5 font-mono">
              Directive: {potassiumLab.directive || kEval.directive}
            </p>
          </div>

          {/* Hemoglobin (Hb) */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={'flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ' + (
                  hbEval.severity === 'RED'
                    ? 'bg-rose-600 text-white'
                    : hbEval.severity === 'AMBER'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                )}>
                  Hb
                </div>
                <div>
                  <span className="text-xs font-bold text-white">Hemoglobin (Hb)</span>
                  <div className="text-[10px] text-slate-400">Ref: {currentPatient.gender === 'M' ? '13.0 – 17.5' : '12.0 – 15.5'} g/dL</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-white">{hemoglobinLab.value} <span className="text-[10px] font-normal text-slate-400">g/dL</span></div>
                <span className={'px-1.5 py-0.2 rounded text-[9px] font-bold ' + (
                  hbEval.severity === 'RED'
                    ? 'bg-rose-900 text-rose-200'
                    : hbEval.severity === 'AMBER'
                    ? 'bg-amber-900 text-amber-200'
                    : 'bg-emerald-900 text-emerald-200'
                )}>
                  {hbEval.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-300 border-t border-slate-700/60 pt-1.5 font-mono">
              Directive: {hemoglobinLab.directive || hbEval.directive}
            </p>
          </div>

          {/* Platelets & Coagulation Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Platelets */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2.5">
              <div className="text-[11px] font-bold text-slate-300">Platelets (PLT)</div>
              <div className="text-sm font-black text-white mt-0.5">{plateletsLab.value} <span className="text-[9px] font-normal text-slate-400">k/µL</span></div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ ASRA Neuraxial OK</div>
            </div>

            {/* PT / INR */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2.5">
              <div className="text-[11px] font-bold text-slate-300">Coagulation (INR)</div>
              <div className="text-sm font-black text-white mt-0.5">{inrLab.value} <span className="text-[9px] font-normal text-slate-400">INR</span></div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Regional Block OK</div>
            </div>
          </div>

          {/* Renal & Troponin Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Creatinine */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2.5">
              <div className="text-[11px] font-bold text-slate-300">Creatinine / eGFR</div>
              <div className="text-sm font-black text-white mt-0.5">{creatinineLab.value} <span className="text-[9px] font-normal text-slate-400">mg/dL</span></div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ eGFR &gt; 90 mL/min</div>
            </div>

            {/* Troponin */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2.5">
              <div className="text-[11px] font-bold text-slate-300">hs-Troponin I</div>
              <div className="text-sm font-black text-white mt-0.5">{troponinLab.value} <span className="text-[9px] font-normal text-slate-400">ng/mL</span></div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ No Acute Ischemia</div>
            </div>
          </div>

          {/* Blood Bank Strip */}
          <div className="rounded-xl border border-blue-800/80 bg-blue-950/40 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white font-black text-xs">
                {bloodBankData.bloodGroup}
              </div>
              <div>
                <span className="text-xs font-bold text-white">Blood Bank Status</span>
                <p className="text-[10px] text-blue-300">Antibody Screen Negative · {bloodBankData.crossmatchedUnits} Units Reserved</p>
              </div>
            </div>
            <span className="rounded bg-emerald-900 px-2 py-0.5 text-[9px] font-bold text-emerald-200">
              Crossmatch OK
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Clinical Medical History */}
      {activeTab === 'CLINICAL_HISTORY' && (
        <div className="p-3.5 space-y-2.5 text-xs">
          {/* Contraceptive / Estrogen Pill Alert */}
          <div className="rounded-xl border border-pink-800/80 bg-pink-950/30 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-pink-300">
              <span className="flex items-center gap-1.5">
                <Pill className="h-4 w-4" />
                <span>Contraceptive / Hormone Status:</span>
              </span>
              <span className="rounded bg-pink-900 px-1.5 py-0.2 text-[9px] font-bold text-pink-100">
                {currentPatient.gender === 'F' ? 'Yasmin OCP (Active)' : 'None'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {currentPatient.gender === 'F'
                ? 'Combined Oral Contraceptive active (+1 Caprini VTE point). Apply bilateral mechanical SCDs in OT and encourage early post-op ambulation.'
                : 'No hormonal medication risk factors documented.'}
            </p>
          </div>

          {/* Antipsychotic & Psychotropic Alert */}
          <div className="rounded-xl border border-purple-800/80 bg-purple-950/30 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-purple-300">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                <span>Psychotropic / Antipsychotic Drugs:</span>
              </span>
              <span className="rounded bg-purple-900 px-1.5 py-0.2 text-[9px] font-bold text-purple-100">
                Screened
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              If patient on Quetiapine / Haloperidol: Alpha-1 blockade blunts Ephedrine. Prefer direct-acting <strong>Phenylephrine</strong> or <strong>Norepinephrine</strong> for hypotension. Check baseline QTc on ECG.
            </p>
          </div>

          {/* Smoking & Inhalation Airway Alert */}
          <div className="rounded-xl border border-amber-800/80 bg-amber-950/30 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Cigarette className="h-4 w-4" />
                <span>Smoking & Airway Reactivity:</span>
              </span>
              <span className="rounded bg-amber-900 px-1.5 py-0.2 text-[9px] font-bold text-amber-100">
                Airway Protocol
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Airway hyperreactivity protocol: 100% FiO2 pre-oxygenation, IV Lidocaine (1.5mg/kg) pre-intubation and extubation to blunt airway reflexes and prevent laryngospasm.
            </p>
          </div>

          {/* Cardiac Disease & Stents */}
          <div className="rounded-xl border border-rose-800/80 bg-rose-950/30 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-rose-300">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>Cardiovascular & Stents (RCRI):</span>
              </span>
              <span className="rounded bg-rose-900 px-1.5 py-0.2 text-[9px] font-bold text-rose-100">
                {currentPatient.rcriClass}
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              RCRI Class I (&lt;0.4% MACE risk). Maintain MAP &gt; 65 mmHg, maintain heart rate 60–80 bpm, avoid severe tachycardia.
            </p>
          </div>

          {onOpenQuestionnaire && (
            <button
              type="button"
              onClick={onOpenQuestionnaire}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
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
          <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-3 space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>8-Hour NPO Fasting Clock:</span>
              </span>
              <span className="rounded bg-emerald-800 px-2 py-0.5 text-[9px] font-bold text-white">
                Fasting Met
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded bg-slate-800 border border-slate-700">
                <div className="text-[10px] text-slate-400">Solids Fasting</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">12h 00m</div>
              </div>
              <div className="p-2 rounded bg-slate-800 border border-slate-700">
                <div className="text-[10px] text-slate-400">Clear Fluids</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">4h 15m</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-300">
              ✓ Low aspiration risk. Cleared for standard general anesthesia induction.
            </p>
          </div>

          {/* Active Medication Hold Clocks */}
          <div className="space-y-1.5">
            <span className="font-bold text-[11px] text-slate-300 uppercase tracking-wider">Active Medication Clocks:</span>
            {currentPatient.medications.map((med) => (
              <div key={med.id} className="rounded-lg border border-slate-700 bg-slate-800 p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">{med.drugName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Hold required: {med.requiredHoldHours}h · Last dose: {med.lastDoseHoursAgo}h ago</div>
                </div>
                <span className={'px-2 py-0.5 rounded text-[9px] font-bold ' + (
                  med.status === 'CLEARED'
                    ? 'bg-emerald-900 text-emerald-200'
                    : 'bg-amber-900 text-amber-200'
                )}>
                  {med.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Footer for In-OT Anesthesiologist */}
      <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-2">
        {clearedNotice && (
          <div className="p-2 rounded-lg bg-emerald-900 text-emerald-200 text-xs font-bold text-center animate-fade-in">
            ✓ In-OT Anesthetic Clearance Logged & Certified!
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handle1TapClearance}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 text-xs font-bold shadow transition cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>1-Tap OT Clearance</span>
          </button>

          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white py-2.5 px-3 text-xs font-bold transition cursor-pointer"
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
`;

fs.writeFileSync(path.join(__dirname, '../components/MobileAnesthesiaBloodView.tsx'), content, 'utf8');
console.log('Successfully generated MobileAnesthesiaBloodView.tsx');
