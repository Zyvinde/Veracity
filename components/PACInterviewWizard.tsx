'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Pill,
  Heart,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Share2,
  Copy,
  User,
  Stethoscope,
} from 'lucide-react';
import { PACInterview, PACMedCategory } from '@/lib/types';
import { evaluatePACInterview } from '@/lib/rules-engine';
import { usePatientStore } from '@/lib/store';

interface PACInterviewWizardProps {
  patientId?: string;
  initialMode?: 'SELF' | 'CLINIC';
}

const MED_CHIPS: { id: PACMedCategory; label: string; hint: string }[] = [
  { id: 'BLOOD_THINNER', label: 'Blood thinner', hint: 'Aspirin, clopidogrel, warfarin, apixaban' },
  { id: 'BP', label: 'BP tablets', hint: 'Pressure pills' },
  { id: 'DIABETES', label: 'Diabetes / insulin', hint: 'Sugar tablets or insulin' },
  { id: 'THYROID', label: 'Thyroid', hint: 'Thyroxine / carbimazole' },
  { id: 'PAINKILLER_NSAID', label: 'Painkillers', hint: 'Ibuprofen, diclofenac, aspirin' },
  { id: 'PSYCH_NEURO', label: 'Brain / sleep / fits', hint: 'Seizure, anxiety, depression, sleep' },
  { id: 'STEROID', label: 'Steroids', hint: 'Prednisolone, inhalers with steroid' },
  { id: 'CONTRACEPTIVE_HRT', label: 'Hormone pill / HRT', hint: 'OCP, patch, injection, HRT' },
  { id: 'GLP1_WEIGHTLOSS', label: 'Weight injection', hint: 'Ozempic, Wegovy, Mounjaro' },
  { id: 'OTHER', label: 'Other daily pill', hint: 'Anything else daily' },
];

const CHRONIC_CHIPS = ['HEART', 'BP', 'DIABETES', 'ASTHMA', 'KIDNEY', 'LIVER', 'THYROID', 'SEIZURE'];
const DENTAL_CHIPS = ['DENTURES', 'LOOSE_TOOTH', 'BRACES', 'CAPS_CROWNS'];

function toLocalInputValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const PACInterviewWizard: React.FC<PACInterviewWizardProps> = ({ patientId, initialMode }) => {
  const { patients, currentPatientId, selectPatientByMrn } = usePatientStore();
  const store = usePatientStore();
  const savePACInterview = store.savePACInterview;

  // Resolve mode + patient from URL (?mrn=&mode=clinic) without Next navigation hooks
  const [mode, setMode] = useState<'SELF' | 'CLINIC'>(initialMode || 'SELF');
  const [urlMrn, setUrlMrn] = useState<string>('');
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mrn');
      const md = params.get('mode');
      if (m) {
        setUrlMrn(m);
        selectPatientByMrn(decodeURIComponent(m));
      }
      if (md === 'clinic' || md === 'CLINIC') setMode('CLINIC');
      else if (md === 'self' || md === 'SELF') setMode('SELF');
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeId = patientId || currentPatientId;
  const currentPatient = patients.find((p) => p.id === activeId) || patients[0];
  const saved = currentPatient?.pacInterview;

  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [savedOk, setSavedOk] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 1
  const [escortName, setEscortName] = useState('');
  const [escortPhone, setEscortPhone] = useState('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  // Step 2
  const [takesAnyMeds, setTakesAnyMeds] = useState(false);
  const [medCategories, setMedCategories] = useState<PACMedCategory[]>([]);
  const [medsFreeText, setMedsFreeText] = useState('');
  const [takesHerbalsOTC, setTakesHerbalsOTC] = useState(false);
  const [herbalsFreeText, setHerbalsFreeText] = useState('');
  const [medsLast24h, setMedsLast24h] = useState('');
  // Step 3
  const [recentFeverColdCough, setRecentFeverColdCough] = useState(false);
  const [chestPainOrBreathless, setChestPainOrBreathless] = useState(false);
  const [loudSnoring, setLoudSnoring] = useState(false);
  const [chronicFlags, setChronicFlags] = useState<string[]>([]);
  const [bleedingOrTransfusionHx, setBleedingOrTransfusionHx] = useState(false);
  const [pregnancyStatus, setPregnancyStatus] = useState<PACInterview['pregnancyStatus']>('NOT_APPLICABLE');
  const [lmpOrWeeks, setLmpOrWeeks] = useState('');
  const [allergySummary, setAllergySummary] = useState('');
  const [hasAllergyAlert, setHasAllergyAlert] = useState(false);
  // Step 4
  const [dentalFlags, setDentalFlags] = useState<string[]>([]);
  const [mouthOpensWide, setMouthOpensWide] = useState(true);
  const [neckMovesFully, setNeckMovesFully] = useState(true);
  const [lastFoodIso, setLastFoodIso] = useState('');
  const [lastFluidIso, setLastFluidIso] = useState('');
  const [glp1LastDoseText, setGlp1LastDoseText] = useState('');
  // Step 5
  const [ackFasting, setAckFasting] = useState(false);
  const [ackDiabetesHold, setAckDiabetesHold] = useState(false);
  const [ackThyroidTake, setAckThyroidTake] = useState(false);
  const [ackBringList, setAckBringList] = useState(false);
  const [ackEscort, setAckEscort] = useState(false);
  const [teachBackName, setTeachBackName] = useState('');
  // Clinic verify
  const [vNpo, setVNpo] = useState(false);
  const [vAirway, setVAirway] = useState(false);
  const [vMeds, setVMeds] = useState(false);
  const [vAllergy, setVAllergy] = useState(false);
  const [vConsent, setVConsent] = useState(false);
  const [vPlan, setVPlan] = useState<'GA' | 'SPINAL' | 'REGIONAL' | 'MAC' | 'COMBINED' | 'UNDECIDED'>('UNDECIDED');
  const [vName, setVName] = useState('');
  const [vNotes, setVNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once from saved interview
  useEffect(() => {
    if (!saved || hydrated) return;
    setEscortName(saved.escortName || '');
    setEscortPhone(saved.escortPhone || '');
    setWeightKg(saved.weightKg ?? '');
    setHeightCm(saved.heightCm ?? '');
    setTakesAnyMeds(saved.takesAnyMeds);
    setMedCategories(saved.medCategories || []);
    setMedsFreeText(saved.medsFreeText || '');
    setTakesHerbalsOTC(saved.takesHerbalsOTC);
    setHerbalsFreeText(saved.herbalsFreeText || '');
    setMedsLast24h(saved.medsLast24h || '');
    setRecentFeverColdCough(!!saved.recentFeverColdCough);
    setChestPainOrBreathless(!!saved.chestPainOrBreathless);
    setLoudSnoring(!!saved.loudSnoring);
    setChronicFlags(saved.chronicFlags || []);
    setBleedingOrTransfusionHx(!!saved.bleedingOrTransfusionHx);
    if (saved.pregnancyStatus) setPregnancyStatus(saved.pregnancyStatus);
    setLmpOrWeeks(saved.lmpOrWeeks || '');
    setAllergySummary(saved.allergySummary || '');
    setHasAllergyAlert(!!saved.hasAllergyAlert);
    setDentalFlags(saved.dentalFlags || []);
    setMouthOpensWide(saved.mouthOpensWide !== false);
    setNeckMovesFully(saved.neckMovesFully !== false);
    setLastFoodIso(saved.lastFoodIso ? toLocalInputValue(saved.lastFoodIso) : '');
    setLastFluidIso(saved.lastFluidIso ? toLocalInputValue(saved.lastFluidIso) : '');
    setGlp1LastDoseText(saved.glp1LastDoseText || '');
    setAckFasting(!!saved.ackFasting);
    setAckDiabetesHold(!!saved.ackDiabetesHold);
    setAckThyroidTake(!!saved.ackThyroidTake);
    setAckBringList(!!saved.ackBringList);
    setAckEscort(!!saved.ackEscort);
    setTeachBackName(saved.teachBackName || '');
    if (saved.clinicVerified) {
      setVNpo(!!saved.clinicVerified.npoVerified);
      setVAirway(!!saved.clinicVerified.airwaySeen);
      setVMeds(!!saved.clinicVerified.medsReconciled);
      setVAllergy(!!saved.clinicVerified.allergyBanded);
      setVConsent(!!saved.clinicVerified.consentExplained);
      if (saved.clinicVerified.planSelected) setVPlan(saved.clinicVerified.planSelected);
      setVName(saved.clinicVerified.verifierName || '');
      setVNotes(saved.clinicVerified.notes || '');
    }
    if (saved.mode) setMode(saved.mode);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatient?.id]);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) => {
    set(list.includes(v) ? list.filter((i) => i !== v) : [...list, v]);
  };

  const draft: Partial<PACInterview> = useMemo(() => ({
    takesAnyMeds,
    medCategories,
    medsFreeText,
    takesHerbalsOTC,
    herbalsFreeText,
    medsLast24h,
    recentFeverColdCough,
    chestPainOrBreathless,
    loudSnoring,
    chronicFlags,
    bleedingOrTransfusionHx,
    pregnancyStatus,
    lmpOrWeeks,
    allergySummary,
    hasAllergyAlert,
    dentalFlags,
    mouthOpensWide,
    neckMovesFully,
    lastFoodIso: lastFoodIso ? new Date(lastFoodIso).toISOString() : undefined,
    lastFluidIso: lastFluidIso ? new Date(lastFluidIso).toISOString() : undefined,
    glp1LastDoseText,
    ackFasting,
    ackDiabetesHold,
    ackThyroidTake,
    ackBringList,
    ackEscort,
    teachBackName,
    weightKg: typeof weightKg === 'number' ? weightKg : undefined,
    heightCm: typeof heightCm === 'number' ? heightCm : undefined,
    escortName,
    escortPhone,
  }), [takesAnyMeds, medCategories, medsFreeText, takesHerbalsOTC, herbalsFreeText, medsLast24h, recentFeverColdCough, chestPainOrBreathless, loudSnoring, chronicFlags, bleedingOrTransfusionHx, pregnancyStatus, lmpOrWeeks, allergySummary, hasAllergyAlert, dentalFlags, mouthOpensWide, neckMovesFully, lastFoodIso, lastFluidIso, glp1LastDoseText, ackFasting, ackDiabetesHold, ackThyroidTake, ackBringList, ackEscort, teachBackName, weightKg, heightCm, escortName, escortPhone]);

  const report = useMemo(
    () => evaluatePACInterview(draft, currentPatient?.scheduledTimeIso),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(draft), currentPatient?.scheduledTimeIso]
  );

  const handleSave = () => {
    if (!currentPatient) return;
    const record: PACInterview = {
      ...(draft as PACInterview),
      id: saved?.id || 'PAC-' + Date.now(),
      patientId: currentPatient.id,
      completedAtIso: new Date().toISOString(),
      mode,
      source: mode === 'CLINIC' ? 'CLINIC_VERIFY' : 'PAC_QUICK_LINK',
      clinicVerified: mode === 'CLINIC' ? {
        npoVerified: vNpo,
        airwaySeen: vAirway,
        medsReconciled: vMeds,
        allergyBanded: vAllergy,
        consentExplained: vConsent,
        planSelected: vPlan,
        verifierName: vName,
        notes: vNotes,
      } : saved?.clinicVerified,
    };
    savePACInterview(currentPatient.id, record);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 3000);
  };

  const shareUrl = () => {
    if (typeof window === 'undefined' || !currentPatient) return '';
    return `${window.location.origin}/pac?mrn=${encodeURIComponent(currentPatient.mrn)}&mode=self`;
  };

  const handleCopy = () => {
    const url = shareUrl();
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const yesNo = (val: boolean, set: (b: boolean) => void, id: string) => (
    <div className="flex gap-2" role="group" aria-label={id}>
      {([true, false] as const).map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => set(opt)}
          aria-pressed={val === opt}
          className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer min-h-[44px] ${
            val === opt
              ? opt
                ? 'border-amber-500 bg-amber-600 text-white shadow-md'
                : 'border-emerald-500 bg-emerald-600 text-white shadow-md'
              : 'border-white/15 bg-white/5 text-white/70 hover:text-white hover:border-white/30'
          }`}
        >
          {opt ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );

  const chip = (selected: boolean, label: string, onClick: () => void, hint?: string) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition cursor-pointer min-h-[44px] ${
        selected
          ? 'border-emerald-500 bg-emerald-950/40 text-white ring-1 ring-emerald-500/50'
          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white'
      }`}
    >
      <span>
        <span className="block text-xs font-bold text-white">{label}</span>
        {hint && <span className="block text-[11px] text-white/55 mt-0.5">{hint}</span>}
      </span>
      {selected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
    </button>
  );

  const steps = [
    { n: 1, label: mode === 'CLINIC' ? 'Patient + escort' : 'You + surgery', icon: User },
    { n: 2, label: 'Meds', icon: Pill },
    { n: 3, label: 'Body check', icon: Heart },
    { n: 4, label: 'Mouth + fasting', icon: Clock },
    { n: 5, label: mode === 'CLINIC' ? 'Verify + plan' : 'Do’s + done', icon: ClipboardCheck },
  ];

  return (
    <div className="w-full max-w-full sm:max-w-3xl mx-auto bg-[#0a1e36]/80 text-white rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden overflow-x-clip min-w-0 break-words">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 bg-white/10 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-sm sm:text-base font-bold tracking-tight">
              Quick PAC — {mode === 'CLINIC' ? 'Clinic verify' : 'Ask-the-questions'}
              {currentPatient?.pacCompleted && <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold">DONE</span>}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/60 truncate">
              {currentPatient ? `${currentPatient.name} • ${currentPatient.mrn} • ${currentPatient.procedureName}` : 'No case loaded'}
              {urlMrn ? ` • link MRN ${urlMrn}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-white/10 border border-white/20 p-0.5" role="group" aria-label="Mode">
            {(['SELF', 'CLINIC'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition min-h-[44px] cursor-pointer ${mode === m ? 'bg-emerald-600 text-white shadow' : 'text-white/70 hover:text-white'}`}
              >
                {m === 'SELF' ? 'Patient' : 'Clinic'}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold transition cursor-pointer min-h-[44px]">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
          <a
            href={currentPatient ? `https://wa.me/?text=${encodeURIComponent(`Please complete your Quick PAC (2-3 min) before surgery: ${shareUrl()}`)}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold transition min-h-[44px]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Live banner */}
      <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
        report.overallClearance === 'RED_HARD_STOP' ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        : report.overallClearance === 'AMBER_CONDITIONAL' ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'}`}>
        <div className="flex items-center gap-2.5">
          {report.overallClearance === 'RED_HARD_STOP' ? <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
          : report.overallClearance === 'AMBER_CONDITIONAL' ? <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          : <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider">Live: {report.overallClearance.replace(/_/g, ' ')}</div>
            <p className="text-xs mt-0.5 text-white/90 max-w-xl">{report.primaryActionDirective}</p>
          </div>
        </div>
        <button type="button" onClick={handleSave} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold transition shadow cursor-pointer min-h-[44px]">
          {savedOk ? 'Saved!' : mode === 'CLINIC' ? 'Verify + save' : 'Save + done'}
        </button>
      </div>

      {/* Steps */}
      <div className="flex overflow-x-auto border-b border-white/15 bg-white/5 px-3 sm:px-6 py-2.5 gap-2 scrollbar-none">
        {steps.map((s) => {
          const Icon = s.icon;
          const active = step === s.n;
          const done = s.n < step;
          return (
            <button key={s.n} type="button" onClick={() => setStep(s.n)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition cursor-pointer min-h-[44px] ${active ? 'bg-emerald-600 border-emerald-500 text-white' : done ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-white/70'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : done ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>{done ? <Check className="h-3 w-3" /> : s.n}</span>
              <Icon className="h-3.5 w-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Who are you, who brings you home?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Escort name (adult taking you home)</label>
                <input value={escortName} onChange={(e) => setEscortName(e.target.value)} placeholder="e.g. Ahmed, husband"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Escort phone</label>
                <input value={escortPhone} onChange={(e) => setEscortPhone(e.target.value)} placeholder="+971 ..." inputMode="tel"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Weight (kg)</label>
                <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 72" inputMode="decimal"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Height (cm)</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 165" inputMode="decimal"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
            </div>
            {report.bmi != null && <p className="text-xs text-white/70">BMI auto: <strong className="text-white">{report.bmi}</strong> — used for drug doses + airway plan.</p>}
            <p className="text-xs text-white/60">No driving for 24h after anesthesia. You MUST have an adult escort.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Are you on any meds?</h3>
            <p className="text-xs text-white/60">Daily, weekly, even sometimes — include injections like Ozempic/Mounjaro.</p>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">Do you take ANY medicine regularly?</div>
              {yesNo(takesAnyMeds, setTakesAnyMeds, 'takes-any-meds')}
            </div>
            {takesAnyMeds && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MED_CHIPS.map((c) => chip(medCategories.includes(c.id), c.label, () => toggle(medCategories, c.id, setMedCategories), c.hint))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Names + doses (as on strip)</label>
                  <input value={medsFreeText} onChange={(e) => setMedsFreeText(e.target.value)} placeholder="e.g. Metformin 500mg morning, Thyroxine 50mcg"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
                </div>
                {(medCategories.includes('GLP1_WEIGHTLOSS')) && (
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">When was your last weight-loss injection?</label>
                    <input value={glp1LastDoseText} onChange={(e) => setGlp1LastDoseText(e.target.value)} placeholder="e.g. 3 days ago, Monday"
                      className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none min-h-[44px]" />
                  </div>
                )}
              </>
            )}
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">Vitamins, herbals, ayurvedic, fish oil, iron, OTC painkillers?</div>
              {yesNo(takesHerbalsOTC, setTakesHerbalsOTC, 'herbals')}
            </div>
            {takesHerbalsOTC && (
              <input value={herbalsFreeText} onChange={(e) => setHerbalsFreeText(e.target.value)} placeholder="e.g. fish oil, ginkgo, ashwagandha"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
            )}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">What did you take in the last 24 hours?</label>
              <input value={medsLast24h} onChange={(e) => setMedsLast24h(e.target.value)} placeholder="e.g. BP pill morning, nothing else"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
            </div>
            {report.morningMeds.length > 0 && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-1">
                <div className="font-bold text-emerald-300">Morning-of-surgery rules for you:</div>
                {report.morningMeds.map((m, i) => <p key={i} className="text-white/85">• {m}</p>)}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Quick body check</h3>
            <div className="space-y-3">
              <div><div className="text-xs font-semibold text-white/80 mb-2">Fever, cold, cough, breathing infection in last 2 weeks?</div>{yesNo(recentFeverColdCough, setRecentFeverColdCough, 'fever')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">Chest pain? Breathless climbing 2 floors?</div>{yesNo(chestPainOrBreathless, setChestPainOrBreathless, 'chest')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">Loud snoring? Sleepy in daytime?</div>{yesNo(loudSnoring, setLoudSnoring, 'snore')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">Bleeding problem? Transfusion before? Heavy bruises / nose / gum bleeds?</div>{yesNo(bleedingOrTransfusionHx, setBleedingOrTransfusionHx, 'bleed')}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">Any long-term illness? (tap all)</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {CHRONIC_CHIPS.map((c) => chip(chronicFlags.includes(c), c, () => toggle(chronicFlags, c, setChronicFlags)))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Pregnancy (skip if not applicable)</label>
                <select value={pregnancyStatus} onChange={(e) => setPregnancyStatus(e.target.value as PACInterview['pregnancyStatus'])}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none min-h-[44px]">
                  <option value="NOT_APPLICABLE" className="bg-black">Not applicable</option>
                  <option value="NOT_PREGNANT" className="bg-black">Not pregnant</option>
                  <option value="POSSIBLY_PREGNANT" className="bg-black">Could be pregnant</option>
                  <option value="PREGNANT" className="bg-black">Pregnant</option>
                  <option value="BREASTFEEDING" className="bg-black">Breastfeeding</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Last period / weeks (if relevant)</label>
                <input value={lmpOrWeeks} onChange={(e) => setLmpOrWeeks(e.target.value)} placeholder="e.g. 10 days ago / 12 weeks"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">Any allergy — medicine, food, latex, dye? (rash, swelling, breathing trouble?)</div>
              {yesNo(hasAllergyAlert, setHasAllergyAlert, 'allergy')}
              {hasAllergyAlert && (
                <input value={allergySummary} onChange={(e) => setAllergySummary(e.target.value)} placeholder="e.g. penicillin — rash; peanuts — breathing trouble"
                  className="mt-2 w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none min-h-[44px]" />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Mouth, teeth + fasting</h3>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">Teeth? (tap all that apply)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DENTAL_CHIPS.map((d) => chip(dentalFlags.includes(d), d.replace(/_/g, ' ').toLowerCase(), () => toggle(dentalFlags, d, setDentalFlags)))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><div className="text-xs font-semibold text-white/80 mb-2">Mouth opens wide (3 fingers fit)?</div>{yesNo(mouthOpensWide, setMouthOpensWide, 'mouth')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">Neck moves fully (look up/down/side)?</div>{yesNo(neckMovesFully, setNeckMovesFully, 'neck')}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Last food / milk / heavy meal (exact time)</label>
                <input type="datetime-local" value={lastFoodIso} onChange={(e) => setLastFoodIso(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Last water / clear juice (exact time)</label>
                <input type="datetime-local" value={lastFluidIso} onChange={(e) => setLastFluidIso(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs space-y-1">
              <div className="font-bold text-white/90">Rule: 8h solids / 2h minimum clears (3h preferred).</div>
              {report.fastingHoursSinceFood != null && <p className="text-white/70">Since food: {report.fastingHoursSinceFood}h • Since water: {report.fastingHoursSinceFluid ?? '—'}h</p>}
              {currentPatient?.scheduledTimeIso && <p className="text-white/60">Surgery: {new Date(currentPatient.scheduledTimeIso).toLocaleString()}</p>}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">{mode === 'CLINIC' ? 'Clinic verify + plan' : 'Do’s for surgery day'}</h3>
            {mode === 'SELF' ? (
              <div className="space-y-2">
                {[
                  { v: ackFasting, s: setAckFasting, t: 'I will fast: 8h solids / 2h minimum clears (3h preferred).' },
                  { v: ackDiabetesHold, s: setAckDiabetesHold, t: 'I will NOT take diabetes tablets/insulin on surgery morning.' },
                  { v: ackThyroidTake, s: setAckThyroidTake, t: 'I WILL take thyroid tablet on surgery morning with a sip of water.' },
                  { v: ackBringList, s: setAckBringList, t: 'I will bring: reports, ECG, inhaler/CPAP, pills strip. No makeup, nail polish, jewellery.' },
                  { v: ackEscort, s: setAckEscort, t: 'An adult will stay + take me home. No driving 24h.' },
                ].map((a, i) => (
                  <button key={i} type="button" onClick={() => a.s(!a.v)} aria-pressed={a.v}
                    className={`w-full flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${a.v ? 'border-emerald-500 bg-emerald-950/40' : 'border-white/15 bg-white/5'}`}>
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${a.v ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>
                      {a.v && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <span className="text-xs text-white/90">{a.t}</span>
                  </button>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Type your name = “I understood”</label>
                  <input value={teachBackName} onChange={(e) => setTeachBackName(e.target.value)} placeholder="Full name"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { v: vNpo, s: setVNpo, t: 'NPO verified (8h solids / 2h minimum clears (3h preferred), GLP-1 hold checked)' },
                  { v: vAirway, s: setVAirway, t: 'Airway seen (mouth, neck, teeth, Mallampati if done)' },
                  { v: vMeds, s: setVMeds, t: 'Meds reconciled (blood thinner + diabetes + thyroid plan told)' },
                  { v: vAllergy, s: setVAllergy, t: 'Allergy banded + kit/latex plan ready' },
                  { v: vConsent, s: setVConsent, t: 'Plan + risks explained, questions answered' },
                ].map((a, i) => (
                  <button key={i} type="button" onClick={() => a.s(!a.v)} aria-pressed={a.v}
                    className={`w-full flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer ${a.v ? 'border-emerald-500 bg-emerald-950/40' : 'border-amber-500/40 bg-amber-950/30'}`}>
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${a.v ? 'bg-emerald-500 border-emerald-500' : 'border-amber-400'}`}>
                      {a.v && <Check className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <span className="text-xs text-white/90">{a.t}</span>
                  </button>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Anesthesia plan</label>
                    <select value={vPlan} onChange={(e) => setVPlan(e.target.value as typeof vPlan)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none min-h-[44px]">
                      {(['UNDECIDED', 'GA', 'SPINAL', 'REGIONAL', 'MAC', 'COMBINED'] as const).map((p) => (
                        <option key={p} value={p} className="bg-black">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">Verifier name</label>
                    <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Dr. / Nurse name"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
                  </div>
                </div>
                <input value={vNotes} onChange={(e) => setVNotes(e.target.value)} placeholder="Verify notes (optional)"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-emerald-400 focus:outline-none min-h-[44px]" />
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider">Summary for anesthesiologist</div>
              {report.hardStopFlags.length > 0 && (
                <div className="space-y-1">
                  {report.hardStopFlags.map((f, i) => (
                    <div key={i} className="flex gap-2 text-xs text-rose-200 bg-rose-500/15 border border-rose-500/30 rounded-lg p-2"><AlertOctagon className="h-4 w-4 shrink-0 text-rose-400" /><span>{f}</span></div>
                  ))}
                </div>
              )}
              {report.conditionalFlags.slice(0, 6).map((f, i) => (
                <div key={'c' + i} className="flex gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-lg p-2"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" /><span>{f}</span></div>
              ))}
              {report.greenPoints.slice(0, 4).map((g, i) => (
                <div key={'g' + i} className="flex gap-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4 shrink-0" /><span>{g}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between border-t border-white/15 bg-white/5 px-4 sm:px-6 py-3.5 gap-2 min-w-0">
        <button type="button" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold disabled:opacity-40 transition cursor-pointer min-h-[44px]">
          <ChevronLeft className="h-4 w-4" /><span>Back</span>
        </button>
        <div className="text-xs font-mono text-white/60">{step} / {totalSteps}</div>
        {step < totalSteps ? (
          <button type="button" onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold transition shadow cursor-pointer min-h-[44px]">
            <span>Next</span><ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold transition shadow cursor-pointer min-h-[44px]">
            <ShieldCheck className="h-4 w-4" /><span>{savedOk ? 'Saved!' : mode === 'CLINIC' ? 'Verify + save' : 'Finish + save'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PACInterviewWizard;
