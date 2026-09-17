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
import { useI18n } from '@/lib/i18n/context';

interface PACInterviewWizardProps {
  patientId?: string;
  initialMode?: 'SELF' | 'CLINIC';
}

const MED_CHIP_IDS: PACMedCategory[] = [
  'BLOOD_THINNER',
  'BP',
  'DIABETES',
  'THYROID',
  'PAINKILLER_NSAID',
  'PSYCH_NEURO',
  'STEROID',
  'CONTRACEPTIVE_HRT',
  'GLP1_WEIGHTLOSS',
  'OTHER',
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
  const { t, locale, setLocale } = useI18n();
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
          {opt ? t('common.yes') : t('common.no')}
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
    { n: 1, label: mode === 'CLINIC' ? t('pacWizard.step1PatientEscort') : t('pacWizard.step1YouSurgery'), icon: User },
    { n: 2, label: t('pacWizard.step2Meds'), icon: Pill },
    { n: 3, label: t('pacWizard.step3Body'), icon: Heart },
    { n: 4, label: t('pacWizard.step4MouthFasting'), icon: Clock },
    { n: 5, label: mode === 'CLINIC' ? t('pacWizard.step5VerifyPlan') : t('pacWizard.step5Dos'), icon: ClipboardCheck },
  ];

  return (
    <div className="w-full max-w-full sm:max-w-3xl mx-auto glass-panel text-white rounded-2xl border-white/[0.08] shadow-2xl overflow-hidden overflow-x-clip min-w-0 break-words">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 bg-black/30 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-sky-200 shadow-md shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-sm sm:text-base font-bold tracking-tight">
              {t('pacWizard.title')} — {mode === 'CLINIC' ? t('pacWizard.clinicVerify') : t('pacWizard.askQuestions')}
              {currentPatient?.pacCompleted && <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-950">{t('pacWizard.doneBadge')}</span>}
            </h2>
            <p className="text-[11px] sm:text-xs text-white/60 truncate">
              {currentPatient ? `${currentPatient.name} • ${currentPatient.mrn} • ${currentPatient.procedureName}` : t('pacWizard.noCase')}
              {urlMrn ? ` • ${t('pacWizard.linkMrn', { mrn: urlMrn })}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-white/10 border border-white/20 p-0.5" role="group" aria-label="Language">
            {(['en', 'ar', 'hi', 'ur', 'ml'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-2 py-1.5 text-[10px] font-mono font-bold rounded-lg transition min-h-[44px] cursor-pointer ${locale === l ? 'bg-slate-100 text-slate-950 shadow' : 'text-white/70 hover:text-white'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl bg-white/10 border border-white/20 p-0.5" role="group" aria-label="Mode">
            {(['SELF', 'CLINIC'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition min-h-[44px] cursor-pointer ${mode === m ? 'bg-slate-100 text-slate-950 shadow' : 'text-white/70 hover:text-white'}`}
              >
                {m === 'SELF' ? t('pacWizard.modePatient') : t('pacWizard.modeClinic')}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold transition cursor-pointer min-h-[44px]">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? t('pacWizard.copied') : t('pacWizard.copyLink')}</span>
          </button>
          <a
            href={currentPatient ? `https://wa.me/?text=${encodeURIComponent(t('pacWizard.waShare', { url: shareUrl() }))}` : '#'}
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
        report.overallClearance === 'RED_HARD_STOP' ? 'veracity-status-stop border-b'
        : report.overallClearance === 'AMBER_CONDITIONAL' ? 'veracity-status-conditional border-b'
        : 'veracity-status-cleared border-b'}`}>
        <div className="flex items-center gap-2.5">
          {report.overallClearance === 'RED_HARD_STOP' ? <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
          : report.overallClearance === 'AMBER_CONDITIONAL' ? <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          : <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider">{t('pacWizard.live')}: {report.overallClearance.replace(/_/g, ' ')}</div>
            <p className="text-xs mt-0.5 text-white/90 max-w-xl">{report.primaryActionDirective}</p>
          </div>
        </div>
        <button type="button" onClick={handleSave} className="veracity-press rounded-xl bg-slate-100 hover:bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow cursor-pointer min-h-[44px]">
          {savedOk ? t('pacWizard.savedBtn') : mode === 'CLINIC' ? t('pacWizard.verifySave') : t('pacWizard.saveDone')}
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition cursor-pointer min-h-[44px] ${active ? 'bg-slate-100 border-slate-100 text-slate-950' : done ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-white/70'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : done ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>{done ? <Check className="h-3 w-3" /> : s.n}</span>
              <Icon className="h-3.5 w-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <div key={step} className="veracity-fade-up p-4 sm:p-6 space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">{t('pacWizard.s1Title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.escortName')}</label>
                <input value={escortName} onChange={(e) => setEscortName(e.target.value)} placeholder={t('pacWizard.escortNamePh')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.escortPhone')}</label>
                <input value={escortPhone} onChange={(e) => setEscortPhone(e.target.value)} placeholder={t('pacWizard.escortPhonePh')} inputMode="tel"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.weight')}</label>
                <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t('pacWizard.weightPh')} inputMode="decimal"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.height')}</label>
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t('pacWizard.heightPh')} inputMode="decimal"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
            </div>
            {report.bmi != null && <p className="text-xs text-white/70">{t('pacWizard.bmiAuto', { bmi: report.bmi })}</p>}
            <p className="text-xs text-white/60">{t('pacWizard.noDriving')}</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">{t('pacWizard.s2Title')}</h3>
            <p className="text-xs text-white/60">{t('pacWizard.s2Sub')}</p>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.anyMedsQ')}</div>
              {yesNo(takesAnyMeds, setTakesAnyMeds, 'takes-any-meds')}
            </div>
            {takesAnyMeds && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MED_CHIP_IDS.map((id) => chip(medCategories.includes(id), t(`pacWizard.meds.${id}`), () => toggle(medCategories, id, setMedCategories), t(`pacWizard.medsHint.${id}`)))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.medNames')}</label>
                  <input value={medsFreeText} onChange={(e) => setMedsFreeText(e.target.value)} placeholder={t('pacWizard.medNamesPh')}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
                </div>
                {(medCategories.includes('GLP1_WEIGHTLOSS')) && (
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.glp1Q')}</label>
                    <input value={glp1LastDoseText} onChange={(e) => setGlp1LastDoseText(e.target.value)} placeholder={t('pacWizard.glp1Ph')}
                      className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none min-h-[44px]" />
                  </div>
                )}
              </>
            )}
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.herbalsQ')}</div>
              {yesNo(takesHerbalsOTC, setTakesHerbalsOTC, 'herbals')}
            </div>
            {takesHerbalsOTC && (
              <input value={herbalsFreeText} onChange={(e) => setHerbalsFreeText(e.target.value)} placeholder={t('pacWizard.herbalsPh')}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
            )}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.last24h')}</label>
              <input value={medsLast24h} onChange={(e) => setMedsLast24h(e.target.value)} placeholder={t('pacWizard.last24hPh')}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
            </div>
            {report.morningMeds.length > 0 && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-1">
                <div className="font-bold text-emerald-300">{t('pacWizard.morningRules')}</div>
                {report.morningMeds.map((m, i) => <p key={i} className="text-white/85">• {m}</p>)}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">{t('pacWizard.s3Title')}</h3>
            <div className="space-y-3">
              <div><div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.feverQ')}</div>{yesNo(recentFeverColdCough, setRecentFeverColdCough, 'fever')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.chestQ')}</div>{yesNo(chestPainOrBreathless, setChestPainOrBreathless, 'chest')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.snoreQ')}</div>{yesNo(loudSnoring, setLoudSnoring, 'snore')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.bleedQ')}</div>{yesNo(bleedingOrTransfusionHx, setBleedingOrTransfusionHx, 'bleed')}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.chronicQ')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {CHRONIC_CHIPS.map((c) => chip(chronicFlags.includes(c), t(`pacWizard.chronic.${c}`), () => toggle(chronicFlags, c, setChronicFlags)))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.pregnancy')}</label>
                <select value={pregnancyStatus} onChange={(e) => setPregnancyStatus(e.target.value as PACInterview['pregnancyStatus'])}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-sky-300 focus:outline-none min-h-[44px]">
                  <option value="NOT_APPLICABLE" className="bg-black">{t('pacWizard.pregNA')}</option>
                  <option value="NOT_PREGNANT" className="bg-black">{t('pacWizard.pregNot')}</option>
                  <option value="POSSIBLY_PREGNANT" className="bg-black">{t('pacWizard.pregMaybe')}</option>
                  <option value="PREGNANT" className="bg-black">{t('pacWizard.pregYes')}</option>
                  <option value="BREASTFEEDING" className="bg-black">{t('pacWizard.pregFeed')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.lmp')}</label>
                <input value={lmpOrWeeks} onChange={(e) => setLmpOrWeeks(e.target.value)} placeholder={t('pacWizard.lmpPh')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.allergyQ')}</div>
              {yesNo(hasAllergyAlert, setHasAllergyAlert, 'allergy')}
              {hasAllergyAlert && (
                <input value={allergySummary} onChange={(e) => setAllergySummary(e.target.value)} placeholder={t('pacWizard.allergyPh')}
                  className="mt-2 w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:outline-none min-h-[44px]" />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">{t('pacWizard.s4Title')}</h3>
            <div>
              <div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.teethQ')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DENTAL_CHIPS.map((d) => chip(dentalFlags.includes(d), t(`pacWizard.dental.${d}`), () => toggle(dentalFlags, d, setDentalFlags)))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.mouthQ')}</div>{yesNo(mouthOpensWide, setMouthOpensWide, 'mouth')}</div>
              <div><div className="text-xs font-semibold text-white/80 mb-2">{t('pacWizard.neckQ')}</div>{yesNo(neckMovesFully, setNeckMovesFully, 'neck')}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.lastFood')}</label>
                <input type="datetime-local" value={lastFoodIso} onChange={(e) => setLastFoodIso(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.lastFluid')}</label>
                <input type="datetime-local" value={lastFluidIso} onChange={(e) => setLastFluidIso(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs space-y-1">
              <div className="font-bold text-white/90">{t('pacWizard.ruleLine')}</div>
              {report.fastingHoursSinceFood != null && <p className="text-white/70">{t('pacWizard.sinceLine', { food: report.fastingHoursSinceFood, fluid: report.fastingHoursSinceFluid ?? '—' })}</p>}
              {currentPatient?.scheduledTimeIso && <p className="text-white/60">{t('pacWizard.surgeryAt', { when: new Date(currentPatient.scheduledTimeIso).toLocaleString() })}</p>}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-serif">{mode === 'CLINIC' ? t('pacWizard.step5VerifyPlan') : t('pacWizard.step5Dos')}</h3>
            {mode === 'SELF' ? (
              <div className="space-y-2">
                {[
                  { v: ackFasting, s: setAckFasting, t: t('pacWizard.ackFasting') },
                  { v: ackDiabetesHold, s: setAckDiabetesHold, t: t('pacWizard.ackDiabetes') },
                  { v: ackThyroidTake, s: setAckThyroidTake, t: t('pacWizard.ackThyroid') },
                  { v: ackBringList, s: setAckBringList, t: t('pacWizard.ackBring') },
                  { v: ackEscort, s: setAckEscort, t: t('pacWizard.ackEscort') },
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
                  <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.teachBack')}</label>
                  <input value={teachBackName} onChange={(e) => setTeachBackName(e.target.value)} placeholder={t('pacWizard.teachBackPh')}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { v: vNpo, s: setVNpo, t: t('pacWizard.vNpo') },
                  { v: vAirway, s: setVAirway, t: t('pacWizard.vAirway') },
                  { v: vMeds, s: setVMeds, t: t('pacWizard.vMeds') },
                  { v: vAllergy, s: setVAllergy, t: t('pacWizard.vAllergy') },
                  { v: vConsent, s: setVConsent, t: t('pacWizard.vConsent') },
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
                    <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.planLabel')}</label>
                    <select value={vPlan} onChange={(e) => setVPlan(e.target.value as typeof vPlan)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-sky-300 focus:outline-none min-h-[44px]">
                      {(['UNDECIDED', 'GA', 'SPINAL', 'REGIONAL', 'MAC', 'COMBINED'] as const).map((p) => (
                        <option key={p} value={p} className="bg-black">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">{t('pacWizard.verifierName')}</label>
                    <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder={t('pacWizard.verifierPh')}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
                  </div>
                </div>
                <input value={vNotes} onChange={(e) => setVNotes(e.target.value)} placeholder={t('pacWizard.verifyNotesPh')}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-sky-300 focus:outline-none min-h-[44px]" />
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider">{t('pacWizard.summaryTitle')}</div>
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
          <ChevronLeft className="h-4 w-4" /><span>{t('pacWizard.back')}</span>
        </button>
        <div className="text-xs font-mono text-white/60">{step} / {totalSteps}</div>
        {step < totalSteps ? (
          <button type="button" onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            className="veracity-press flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-white px-5 py-2.5 text-xs font-bold text-slate-950 shadow cursor-pointer min-h-[44px]">
            <span>{t('pacWizard.next')}</span><ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={handleSave}
            className="veracity-press flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-white px-5 py-2.5 text-xs font-bold text-slate-950 shadow cursor-pointer min-h-[44px]">
            <ShieldCheck className="h-4 w-4" /><span>{savedOk ? t('pacWizard.savedBtn') : mode === 'CLINIC' ? t('pacWizard.verifySave') : t('pacWizard.finishSave')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PACInterviewWizard;
