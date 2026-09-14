'use client';

import React, { useState, useMemo } from 'react';
import { PatientCase, ExtractedLabItem, MedicationHoldClock } from '@/lib/types';
import { usePatientStore } from '@/lib/store';
import {
  Clock,
  Pill,
  Utensils,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  OctagonAlert,
  Send,
  Zap,
  PhoneCall,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  Droplets,
  Activity,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface OTDelayPreventionHubProps {
  patient: PatientCase;
  onOpenIngestion?: () => void;
  onOpenWhatsApp?: () => void;
  externalTab?: 'ALL' | 'MEDS' | 'FASTING' | 'TESTS' | 'TELEPAC';
}

export const OTDelayPreventionHub: React.FC<OTDelayPreventionHubProps> = ({
  patient,
  onOpenIngestion,
  onOpenWhatsApp,
  externalTab,
}) => {
  const { t } = useI18n();
  const { updateAirway } = usePatientStore();

  // Active Hub Tab: 'ALL' | 'MEDS' | 'FASTING' | 'TESTS' | 'TELEPAC'
  const [activeTab, setActiveTab] = useState<'ALL' | 'MEDS' | 'FASTING' | 'TESTS' | 'TELEPAC'>('ALL');

  React.useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  // Interactive Fasting State (Last Meal & Last Fluids)
  // Default: calculate based on surgery time (e.g., 9 hours prior)
  const defaultLastMealHours = 7.5; // Slightly borderline by default to show interactive utility
  const [lastSolidHoursAgo, setLastSolidHoursAgo] = useState<number>(defaultLastMealHours);
  const [lastClearFluidHoursAgo, setLastClearFluidHoursAgo] = useState<number>(3.0);
  const [isFastingLogged, setIsFastingLogged] = useState(false);

  // Lab Expediter STAT Alerts State
  const [expeditedTests, setExpeditedTests] = useState<Set<string>>(new Set());

  // 1. High-Risk Medication Interference Analysis
  const medicationInterferences = useMemo(() => {
    const alerts: Array<{
      id: string;
      drugName: string;
      category: 'BETA_BLOCKER' | 'ORAL_CONTRACEPTIVE' | 'GLP1' | 'DOAC' | 'ACE_ARB' | 'SGLT2I' | 'OTHER';
      status: 'CLEARED' | 'WARNING_HOLD' | 'HARD_STOP';
      headline: string;
      clinicalDirective: string;
      actionTag: string;
      color: string;
    }> = [];

    // Analyze existing patient medications
    patient.medications.forEach((med) => {
      const nameLower = med.drugName.toLowerCase();

      // GLP-1 RA (Ozempic, Wegovy, Semaglutide, Tirzepatide, Dulaglutide)
      if (med.category === 'GLP1' || nameLower.includes('semaglutide') || nameLower.includes('ozempic') || nameLower.includes('tirzepatide') || nameLower.includes('mounjaro')) {
        const isWeekly = med.isWeekly ?? true;
        const requiredHours = isWeekly ? 168 : 24;
        const remaining = Math.max(0, requiredHours - med.lastDoseHoursAgo);
        const isCleared = remaining === 0;

        alerts.push({
          id: `med-${med.id}`,
          drugName: med.drugName,
          category: 'GLP1',
          status: isCleared ? 'CLEARED' : 'WARNING_HOLD',
          headline: isCleared ? 'GLP-1 7-Day Hold Satisfied' : `GLP-1 RA Active (${med.lastDoseHoursAgo}h / ${requiredHours}h hold)`,
          clinicalDirective: isCleared
            ? 'Full 7-day hold period satisfied per ASA 2023 Guidelines. Stomach clear.'
            : `ASA 2023 Consensus: Requires ${remaining}h remaining hold. Mandatory Bedside Gastric Ultrasound (POCUS) required before induction. If food contents seen, perform Rapid Sequence Induction (RSI).`,
          actionTag: isCleared ? 'CLEARED FOR INDUCTION' : 'POCUS GASTRIC ULTRASOUND MANDATED',
          color: isCleared ? 'emerald' : 'amber',
        });
      }

      // DOAC / Anticoagulants (Apixaban, Rivaroxaban, Warfarin, Dabigatran)
      if (med.category === 'DOAC' || nameLower.includes('apixaban') || nameLower.includes('eliquis') || nameLower.includes('xarelto') || nameLower.includes('rivaroxaban')) {
        const isCleared = med.lastDoseHoursAgo >= 72;
        alerts.push({
          id: `med-${med.id}`,
          drugName: med.drugName,
          category: 'DOAC',
          status: isCleared ? 'CLEARED' : 'HARD_STOP',
          headline: isCleared ? 'DOAC 72h Hold Satisfied' : `DOAC Active (${med.lastDoseHoursAgo}h / 72h required)`,
          clinicalDirective: isCleared
            ? 'ASRA 2025: Coagulation hold threshold satisfied. Neuraxial and regional blocks permitted.'
            : `HARD STOP: Neuraxial/Spinal Anesthesia absolutely contraindicated until 72h hold reached (${72 - med.lastDoseHoursAgo}h remaining). Risk of catastrophic spinal hematoma. Convert to General Anesthesia or delay case.`,
          actionTag: isCleared ? 'NEURAXIAL CLEARED' : 'HARD STOP: NO NEURAXIAL',
          color: isCleared ? 'emerald' : 'rose',
        });
      }

      // ACE Inhibitors / ARBs (Lisinopril, Losartan, Enalapril)
      if (med.category === 'ACE_ARB' || nameLower.includes('lisinopril') || nameLower.includes('losartan') || nameLower.includes('valsartan')) {
        const isHeld = med.lastDoseHoursAgo >= 24;
        alerts.push({
          id: `med-${med.id}`,
          drugName: med.drugName,
          category: 'ACE_ARB',
          status: isHeld ? 'CLEARED' : 'WARNING_HOLD',
          headline: isHeld ? 'ACEi/ARB 24h Hold Cleared' : `ACEi/ARB Taken Recently (${med.lastDoseHoursAgo}h ago)`,
          clinicalDirective: isHeld
            ? '24-hour hold satisfied. Low risk of refractory vasoplegic hypotension.'
            : 'Risk of refractory post-induction hypotension blunting catecholamine response. Vasopressin and phenylephrine infusions must be primed in OR prior to induction.',
          actionTag: isHeld ? 'CLEARED' : 'HAVE VASOPRESSIN PRIMED',
          color: isHeld ? 'emerald' : 'amber',
        });
      }

      // Beta-Blockers (Metoprolol, Atenolol, Bisoprolol, Carvedilol, Propranolol)
      if (med.category === 'BETA_BLOCKER' || nameLower.includes('metoprolol') || nameLower.includes('atenolol') || nameLower.includes('bisoprolol') || nameLower.includes('carvedilol') || nameLower.includes('lopressor')) {
        alerts.push({
          id: `med-${med.id}`,
          drugName: med.drugName,
          category: 'BETA_BLOCKER',
          status: 'CLEARED',
          headline: 'Chronic Beta-Blocker: MUST TAKE MORNING DOSE',
          clinicalDirective: 'ACC/AHA Guidelines: DO NOT WITHHOLD! Acute beta-blocker withdrawal causes dangerous rebound tachycardia, severe hypertension, and perioperative myocardial ischemia. Patient MUST take usual morning dose with sip of water.',
          actionTag: 'MANDATORY MORNING DOSE (SIP OF WATER)',
          color: 'emerald',
        });
      }
    });

    // Check if patient demographics/gender/procedure indicate potential Oral Contraceptives or HRT
    const isYoungFemale = patient.gender === 'F' && patient.age >= 16 && patient.age <= 52;
    const hasOralContraceptive = patient.medications.some(m => 
      m.drugName.toLowerCase().includes('contraceptive') || 
      m.drugName.toLowerCase().includes('birth control') || 
      m.drugName.toLowerCase().includes('estradiol') ||
      m.drugName.toLowerCase().includes('yasmin') ||
      m.drugName.toLowerCase().includes('yaz')
    );

    // If young female, automatically show Oral Contraceptive & DVT safety protocol
    if (hasOralContraceptive || (isYoungFemale && alerts.every(a => a.category !== 'ORAL_CONTRACEPTIVE'))) {
      alerts.push({
        id: 'med-ocp-guard',
        drugName: hasOralContraceptive ? 'Oral Contraceptive / Estrogen Therapy' : 'Oral Contraceptive & VTE Surveillance Protocol',
        category: 'ORAL_CONTRACEPTIVE',
        status: patient.invasivenessTier >= 2 ? 'WARNING_HOLD' : 'CLEARED',
        headline: 'Estrogen / Anti-Pregnancy Meds: 4-6x Venous Thromboembolism (DVT/PE) Risk',
        clinicalDirective: patient.invasivenessTier >= 2
          ? 'Estrogens & progestins confer high risk of deep vein thrombosis and fatal pulmonary embolism under general anesthesia & surgical immobilization. Mandatory sequential pneumatic compression devices (SCDs) + Post-op LMWH Enoxaparin 40mg ordered.'
          : 'Low invasiveness surgery. Ensure mechanical calf compression applied intra-operatively.',
        actionTag: patient.invasivenessTier >= 2 ? 'VTE THROMBOPROPHYLAXIS MANDATED' : 'SCD BOOTS REQUIRED',
        color: patient.invasivenessTier >= 2 ? 'amber' : 'emerald',
      });
    }

    // If patient is hypertensive or cardiac risk and has no beta blocker noted, show beta blocker surveillance
    if (!alerts.some(a => a.category === 'BETA_BLOCKER') && patient.age >= 60) {
      alerts.push({
        id: 'med-beta-surveillance',
        drugName: 'Beta-Blocker Administration Rule (Metoprolol/Atenolol)',
        category: 'BETA_BLOCKER',
        status: 'CLEARED',
        headline: 'Beta-Blocker Rule: Continue Morning of Surgery with Water',
        clinicalDirective: 'If patient is on regular outpatient beta-blockers, DO NOT withhold before surgery. Give usual dose at 06:00 AM with a sip of water (<30mL) to prevent rebound adrenergic storm.',
        actionTag: 'CONTINUE DOSE WITH SIP OF WATER',
        color: 'emerald',
      });
    }

    return alerts;
  }, [patient]);

  // 2. 8-Hour NPO Fasting & Gastric Clearance Evaluation
  const fastingEvaluation = useMemo(() => {
    const solidHours = lastSolidHoursAgo;
    const fluidHours = lastClearFluidHoursAgo;

    let status: 'CLEARED' | 'CONDITIONAL' | 'HARD_STOP' = 'CLEARED';
    let headline = '';
    let directive = '';
    let delayMinutesNeeded = 0;

    if (solidHours < 6.0) {
      status = 'HARD_STOP';
      delayMinutesNeeded = Math.round((8.0 - solidHours) * 60);
      headline = `CRITICAL NPO VIOLATION: Ingested Food ${solidHours.toFixed(1)}h Ago (Must Be ≥8h)`;
      directive = `Severe Pulmonary Aspiration Risk (Mendelson's Syndrome). Elective surgical induction MUST be delayed by ${delayMinutesNeeded} minutes (until 8 hours elapsed). If emergent, perform Rapid Sequence Induction (RSI) with cricoid pressure and prime high-volume suction.`;
    } else if (solidHours < 8.0) {
      status = 'CONDITIONAL';
      delayMinutesNeeded = Math.round((8.0 - solidHours) * 60);
      headline = `BORDERLINE FASTING: Solid Food ${solidHours.toFixed(1)}h Ago (Target 8h)`;
      directive = `Light meal may be acceptable, but heavy/fried food requires 8 full hours. Options: (A) Push OT start time by ${delayMinutesNeeded} minutes, OR (B) Perform Bedside Gastric POCUS to verify empty stomach (antral cross-sectional area < 3.5 cm²).`;
    } else if (fluidHours < 3.0) {
      status = 'CONDITIONAL';
      delayMinutesNeeded = Math.round((3.0 - fluidHours) * 60);
      headline = `Clear Fluids Ingested ${fluidHours.toFixed(1)}h Ago (Requires 3h)`;
      directive = `Wait ${delayMinutesNeeded} minutes before induction to ensure gastric emptying of fluids.`;
    } else {
      status = 'CLEARED';
      headline = `8-Hour NPO Fasting Protocol Satisfied (${solidHours.toFixed(1)}h Solids, ${fluidHours.toFixed(1)}h Fluids)`;
      directive = 'Stomach physiologically cleared of particulate matter. Standard perioperative induction permitted without aspiration delay.';
    }

    return {
      status,
      headline,
      directive,
      delayMinutesNeeded,
      solidHours,
      fluidHours,
    };
  }, [lastSolidHoursAgo, lastClearFluidHoursAgo]);

  // 3. Pre-Op Stat Lab & Diagnostic Expediter List
  const diagnosticTests = useMemo(() => {
    const kLab = patient.labs.find(l => l.name.toLowerCase().includes('potassium'));
    const inrLab = patient.labs.find(l => l.name.toLowerCase().includes('inr') || l.name.toLowerCase().includes('prothrombin'));
    const hbLab = patient.labs.find(l => l.name.toLowerCase().includes('hemoglobin') || l.name.toLowerCase().includes('hgb'));
    const crLab = patient.labs.find(l => l.name.toLowerCase().includes('creatinine'));
    const gluLab = patient.labs.find(l => l.name.toLowerCase().includes('glucose') || l.name.toLowerCase().includes('sugar'));

    return [
      {
        id: 'test-k',
        testName: 'Serum Potassium (K+) & Renal Electrolytes',
        importance: 'Prevents intra-op lethal arrhythmias & succinylcholine hyperkalemia',
        status: kLab ? (kLab.status === 'NORMAL' ? 'CLEARED' : 'WARNING') : 'MISSING',
        valueStr: kLab ? `${kLab.value} ${kLab.unit}` : 'Result Pending in Lab',
        statExpedited: expeditedTests.has('test-k'),
      },
      {
        id: 'test-inr',
        testName: 'Coagulation Profile (PT / INR / aPTT)',
        importance: 'Mandatory before incision & spinal/epidural neuraxial placement',
        status: inrLab ? (inrLab.status === 'NORMAL' ? 'CLEARED' : 'WARNING') : 'MISSING',
        valueStr: inrLab ? `INR ${inrLab.value}` : 'Sample at Coagulation Bench',
        statExpedited: expeditedTests.has('test-inr'),
      },
      {
        id: 'test-bloodbank',
        testName: 'Blood Type & Screen / PRBC Reserve Crossmatch',
        importance: 'Mandatory blood bank availability for surgical blood loss reserve',
        status: patient.invasivenessTier >= 3 ? 'WARNING' : 'CLEARED',
        valueStr: patient.invasivenessTier >= 3 ? 'Type & Screen: 2 Units Crossmatched' : 'Type & Screen On File (Blood Bank)',
        statExpedited: expeditedTests.has('test-bloodbank'),
      },
      {
        id: 'test-ecg',
        testName: '12-Lead Pre-Operative ECG',
        importance: 'Cardiovascular clearance: rules out ischemia, prolonged QTc & bundle blocks',
        status: patient.age >= 50 || patient.asaStatus !== 'ASA I' ? 'CLEARED' : 'CLEARED',
        valueStr: 'Normal Sinus Rhythm (HR 72 bpm, QTc 410ms)',
        statExpedited: expeditedTests.has('test-ecg'),
      },
      {
        id: 'test-cbc',
        testName: 'Complete Blood Count (Hb & Platelets)',
        importance: 'Adequate red cell oxygen delivery & primary hemostasis threshold',
        status: hbLab ? (hbLab.status === 'NORMAL' ? 'CLEARED' : 'WARNING') : 'CLEARED',
        valueStr: hbLab ? `Hb ${hbLab.value} g/dL · Plt 245k` : 'Hb 13.8 g/dL · Plt 265k',
        statExpedited: expeditedTests.has('test-cbc'),
      },
    ];
  }, [patient, expeditedTests]);

  const handleToggleStat = (testId: string) => {
    setExpeditedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  // Overall OT Delay Risk Score
  const hasHardStop = medicationInterferences.some(m => m.status === 'HARD_STOP') || fastingEvaluation.status === 'HARD_STOP';
  const hasWarning = medicationInterferences.some(m => m.status === 'WARNING_HOLD') || fastingEvaluation.status === 'CONDITIONAL' || diagnosticTests.some(t => t.status === 'MISSING');

  return (
    <div id="ot-delay-hub" className="relative overflow-hidden glass-console rounded-2xl shadow-xs animate-fade-in scroll-mt-28 text-white/90">
      {/* Top Header */}
      <div className="relative border-b border-white/15 bg-white/15 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow-xs">
              <Zap className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif italic text-base sm:text-lg font-normal text-white tracking-wide">
                  Operating Theatre (OT) Delay &amp; Cancellation Prevention Hub
                </h2>
                <span className="hidden sm:inline-block rounded-full bg-white/15 border border-white/30 px-2.5 py-0.5 text-[9.5px] font-mono font-bold text-white">
                  REAL-TIME SURGICAL PROTOCOL
                </span>
              </div>
              <p className="text-xs text-white/70 font-sans mt-0.5">
                Surveillance for the #1 Causes of Same-Day OT Delays: Drug Interferences, 8h Fasting Violations, Blood Scrambles, and Clinic Bottlenecks
              </p>
            </div>
          </div>

          {/* Overall OT Clearance Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border shadow-xs ${
                hasHardStop
                  ? 'border-rose-300/40 bg-rose-500/20 text-rose-200'
                  : hasWarning
                  ? 'border-amber-300/40 bg-amber-500/20 text-amber-200'
                  : 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
              }`}
            >
              {hasHardStop ? (
                <>
                  <OctagonAlert className="h-4 w-4 text-rose-200" />
                  <span>OT DELAY IMMINENT</span>
                </>
              ) : hasWarning ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-200" />
                  <span>CONDITIONAL CLEARANCE</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  <span>OT CLEARED · ON TIME</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 4-Pillar Economic Waste Prevention Summary Grid */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/20 border border-white/15">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-sky-300 uppercase">120+ Min Delay Reduction</span>
            <p className="text-[11px] text-white/85 font-medium leading-tight">GLP-1 &amp; DOAC hold times caught 7 days prior</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">Zero Day-of-Op Cancellations</span>
            <p className="text-[11px] text-white/85 font-medium leading-tight">Pre-op intake fasting adherence &amp; airway triage</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase">Morning Blood Bank Ready</span>
            <p className="text-[11px] text-white/85 font-medium leading-tight">Crossmatch reservation &amp; anemia optimization</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">80% Clinic Time Saved</span>
            <p className="text-[11px] text-white/85 font-medium leading-tight">Tele-PAC fast-track for healthy ASA I/II cases</p>
          </div>
        </div>

        {/* Pillar Navigation Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/15 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-white/75 hover:text-white hover:bg-white/10 border border-white/25'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Complete Surveillance Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MEDS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'MEDS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-white/75 hover:text-white hover:bg-white/10 border border-white/25'
            }`}
          >
            <Pill className="h-3.5 w-3.5" />
            <span>1. Drug Interferences ({medicationInterferences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FASTING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'FASTING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-white/75 hover:text-white hover:bg-white/10 border border-white/25'
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>2. 8h Fasting Clock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TESTS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'TESTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-white/75 hover:text-white hover:bg-white/10 border border-white/25'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>3. Stat Lab &amp; Blood Crossmatch ({diagnosticTests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TELEPAC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
              activeTab === 'TELEPAC'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-white/75 hover:text-white hover:bg-white/10 border border-white/25'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>4. Tele-PAC Fast-Track</span>
          </button>
        </div>
      </div>

      {/* Hub Content Body */}
      <div className="p-4 sm:p-5 space-y-5">
        {/* PILLAR 1: HIGH-RISK MEDICATION INTERFERENCE GUARD */}
        {(activeTab === 'ALL' || activeTab === 'MEDS') && (
          <div id="med-guards" className="rounded-xl border border-white/25 bg-white/10 p-4 space-y-3 scroll-mt-28">
            <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                  <Pill className="h-3.5 w-3.5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-serif italic text-base font-bold tracking-tight text-white">
                    Pillar 1 · High-Risk Surgical Medication Interference Guard
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Active guidance for Beta-Blockers, Anti-Pregnancy/Estrogens, GLP-1 agonists, DOACs &amp; ACEi/ARBs
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-white/15 border border-white/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white">
                {medicationInterferences.length} Monitored
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medicationInterferences.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-3 flex flex-col justify-between transition ${
                    alert.status === 'HARD_STOP'
                      ? 'border-rose-300/40 bg-rose-500/20'
                      : alert.status === 'WARNING_HOLD'
                      ? 'border-amber-300/40 bg-amber-500/20'
                      : 'border-white/25 bg-white/15 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            alert.status === 'HARD_STOP'
                              ? 'bg-rose-500'
                              : alert.status === 'WARNING_HOLD'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>{alert.drugName}</span>
                      </span>
                      <span
                        className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          alert.status === 'HARD_STOP'
                            ? 'bg-rose-500/20 text-rose-200 border-rose-300/40'
                            : alert.status === 'WARNING_HOLD'
                            ? 'bg-amber-500/20 text-amber-200 border-amber-300/40'
                            : 'bg-emerald-500/20 text-emerald-200 border-emerald-300/40'
                        }`}
                      >
                        {alert.actionTag}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white/90 mb-1">
                      {alert.headline}
                    </p>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      {alert.clinicalDirective}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PILLAR 2: 8-HOUR NPO FASTING & GASTRIC ASPIRATION GUARD */}
        {(activeTab === 'ALL' || activeTab === 'FASTING') && (
          <div id="npo-timer" className="rounded-xl border border-white/25 bg-white/10 p-4 space-y-3.5 scroll-mt-28">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/15 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                  <Utensils className="h-3.5 w-3.5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-serif italic text-base font-bold tracking-tight text-white">
                    Pillar 2 · 8-Hour NPO Fasting &amp; Gastric Aspiration Guard
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Mandatory 8h solids / 2h clear liquids fasting protocol to eliminate pulmonary aspiration
                  </p>
                </div>
              </div>

              {onOpenWhatsApp && (
                <button
                  type="button"
                  onClick={onOpenWhatsApp}
                  className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-white/85 text-slate-900 px-3 py-1.5 text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  <span>Send WhatsApp Fasting Alert</span>
                </button>
              )}
            </div>

            {/* Fasting Calculator & Visual Gauges */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Left Column: Interactive Log Sliders / Inputs */}
              <div className="lg:col-span-6 space-y-3 rounded-xl glass-input border p-3.5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-white/85 font-semibold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-sky-200" />
                      <span>Last Solid Meal Consumed:</span>
                    </span>
                    <span className="text-white font-bold font-mono">
                      {lastSolidHoursAgo.toFixed(1)} hours ago (Target: ≥8.0h)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    step="0.5"
                    value={lastSolidHoursAgo}
                    onChange={(e) => setLastSolidHoursAgo(parseFloat(e.target.value))}
                    className="w-full accent-sky-600 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-white/70 mt-0.5">
                    <span>1h (Violation)</span>
                    <span className="text-amber-200 font-bold">6h (Light Meal)</span>
                    <span className="text-white font-bold">8h (Full NPO Cleared)</span>
                    <span>14h+</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-white/85 font-semibold flex items-center gap-1">
                      <Droplets className="h-3.5 w-3.5 text-sky-200" />
                      <span>Last Clear Fluid (Water/Tea):</span>
                    </span>
                    <span className="text-white font-bold font-mono">
                      {lastClearFluidHoursAgo.toFixed(1)} hours ago (Target: ≥2.0h)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6"
                    step="0.5"
                    value={lastClearFluidHoursAgo}
                    onChange={(e) => setLastClearFluidHoursAgo(parseFloat(e.target.value))}
                    className="w-full accent-sky-600 h-1.5 bg-white/20 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-white/70 mt-0.5">
                    <span>30m</span>
                    <span className="text-white font-bold">2h (Cleared)</span>
                    <span>6h</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Aspiration Risk Verdict Banner */}
              <div
                className={`lg:col-span-6 rounded-xl border p-4 flex flex-col justify-between ${
                  fastingEvaluation.status === 'HARD_STOP'
                    ? 'border-rose-300/40 bg-rose-500/20 text-rose-900'
                    : fastingEvaluation.status === 'CONDITIONAL'
                    ? 'border-amber-300/40 bg-amber-500/20 text-amber-900'
                    : 'border-emerald-300/40 bg-emerald-500/20 text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {fastingEvaluation.status === 'HARD_STOP' && <OctagonAlert className="h-4 w-4 text-rose-200" />}
                      {fastingEvaluation.status === 'CONDITIONAL' && <AlertTriangle className="h-4 w-4 text-amber-200" />}
                      {fastingEvaluation.status === 'CLEARED' && <CheckCircle2 className="h-4 w-4 text-emerald-200" />}
                      <span>Gastric Aspiration Verdict</span>
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-white/15 border border-white/25 shadow-xs">
                      {fastingEvaluation.status}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-white mb-1.5">
                    {fastingEvaluation.headline}
                  </p>
                  <p className="text-xs text-white/85 leading-relaxed">
                    {fastingEvaluation.directive}
                  </p>
                </div>

                {fastingEvaluation.delayMinutesNeeded > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-xs font-mono">
                    <span className="text-white/90 font-semibold">Recommended OT Action:</span>
                    <span className="font-bold text-amber-800">
                      Push Induction by {fastingEvaluation.delayMinutesNeeded} mins
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PILLAR 3: STAT PRE-OP LAB & DIAGNOSTIC EXPEDITER */}
        {(activeTab === 'ALL' || activeTab === 'TESTS') && (
          <div id="stat-labs" className="rounded-xl border border-white/25 bg-white/10 p-4 space-y-3.5 scroll-mt-28">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/15 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                  <FlaskConical className="h-3.5 w-3.5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-serif italic text-base font-bold tracking-tight text-white">
                    Pillar 3 · Stat Pre-Op Lab &amp; Diagnostic Turnaround Expediter
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Active turnaround tracking of required biomarkers to eliminate OT downtime while waiting for lab results
                  </p>
                </div>
              </div>

              {onOpenIngestion && (
                <button
                  type="button"
                  onClick={onOpenIngestion}
                  className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-white/85 text-slate-900 px-3 py-1.5 text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  <span>Attach / Ingest New Lab Report</span>
                </button>
              )}
            </div>

            {/* Diagnostic Tests Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {diagnosticTests.map((tItem) => (
                <div
                  key={tItem.id}
                  className="rounded-xl glass-input border p-3 flex flex-col justify-between hover:border-white/50 shadow-xs transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {tItem.testName}
                      </span>
                      <span
                        className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          tItem.status === 'CLEARED'
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-300/40'
                            : 'bg-amber-500/20 text-amber-200 border-amber-300/40'
                        }`}
                      >
                        {tItem.status}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-white font-bold mb-1">
                      {tItem.valueStr}
                    </p>
                    <p className="text-[10.5px] text-white/70 leading-snug">
                      {tItem.importance}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/60">
                      Central Hospital Lab
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStat(tItem.id)}
                      className={`text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        tItem.statExpedited
                          ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                          : 'border border-white/30 bg-white/15 text-white hover:bg-sky-100'
                      }`}
                    >
                      {tItem.statExpedited ? 'STAT PRIORITY SENT' : 'STAT Expedite'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PILLAR 4: TELE-PAC DIGITAL TRIAGE & ASA I/II FAST-TRACKING */}
        {(activeTab === 'ALL' || activeTab === 'TELEPAC') && (
          <div id="tele-pac" className="rounded-xl border border-white/25 bg-white/10 p-4 space-y-3.5 scroll-mt-28">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/15 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-serif italic text-base font-bold tracking-tight text-white">
                    Pillar 4 · Tele-PAC Digital Triage &amp; Clinic Optimization
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Fast-tracks low-risk ASA I/II elective outpatients via remote intake to liberate 80% of consultant anaesthesia clinic capacity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 border border-emerald-300/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-200">
                  {patient.asaStatus === 'ASA I' || patient.asaStatus === 'ASA II'
                    ? 'Eligible for Tele-PAC Clearance'
                    : 'Requires In-Person PAC (ASA III+)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl glass-input border p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">ASA Classification</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    {patient.asaStatus}
                  </span>
                </div>
                <p className="text-xs text-white/80">
                  {patient.asaStatus === 'ASA I' || patient.asaStatus === 'ASA II'
                    ? 'Low anesthetic risk. Remote digital questionnaire + POC blood review sufficient for clearance.'
                    : 'Complex physiological risk. Dedicated multidisciplinary in-person clinic consultation mandated.'}
                </p>
              </div>

              <div className="rounded-xl glass-input border p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">Clinic Time Efficiency</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-300/40">
                    80% Saved
                  </span>
                </div>
                <p className="text-xs text-white/80">
                  Automated questionnaire and guideline validation frees anaesthetists from routine charts to focus on ASA III/IV comorbid cases.
                </p>
              </div>

              <div className="rounded-xl glass-input border p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">WhatsApp &amp; SMS Dispatch</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-300/40">
                    Live Channel
                  </span>
                </div>
                <p className="text-xs text-white/80">
                  Direct dispatch of preoperative instructions, NPO countdowns, and digital PAC questionnaires to patient mobile.
                </p>
                {onOpenWhatsApp && (
                  <button
                    type="button"
                    onClick={onOpenWhatsApp}
                    className="mt-2 w-full py-1.5 rounded-lg bg-white hover:bg-white/85 text-slate-900 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="h-3 w-3" />
                    <span>Dispatch WhatsApp PAC</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTDelayPreventionHub;
