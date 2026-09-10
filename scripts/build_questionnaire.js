const fs = require('fs');
const path = require('path');

const content = `'use client';

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Heart,
  Pill,
  Cigarette,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
  Stethoscope,
  Wind,
} from 'lucide-react';
import {
  SmokingStatus,
  ContraceptiveType,
  PsychiatricMedication,
  CardiacCondition,
  PatientPreOpQuestionnaire as QuestionnaireType,
} from '@/lib/types';
import {
  evaluateQuestionnaireFull,
} from '@/lib/rules-engine';
import { usePatientStore } from '@/lib/store';

interface PatientPreOpQuestionnaireProps {
  patientId?: string;
  onClose?: () => void;
  onSaved?: (data: QuestionnaireType) => void;
  isStandalonePage?: boolean;
}

export const PatientPreOpQuestionnaire: React.FC<PatientPreOpQuestionnaireProps> = ({
  patientId,
  onClose,
  onSaved,
  isStandalonePage = false,
}) => {
  const { patients, currentPatientId, updatePatient } = usePatientStore();
  const activeId = patientId || currentPatientId;
  const currentPatient = patients.find((p) => p.id === activeId) || patients[0];

  const [activeStep, setActiveStep] = useState<number>(1);
  const totalSteps = 6;

  // Form State
  const [patientName, setPatientName] = useState(currentPatient?.name || 'Fatima Al-Mansoor');
  const [patientMrn, setPatientMrn] = useState(currentPatient?.mrn || 'DHA-892144-AE');
  const [age, setAge] = useState<number>(currentPatient?.age || 48);
  const [gender, setGender] = useState<'M' | 'F'>(currentPatient?.gender || 'F');
  const [procedureName, setProcedureName] = useState(currentPatient?.procedureName || 'Laparoscopic Cholecystectomy');

  // 1. Smoking & Inhalation
  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus>('NON_SMOKER');
  const [packYears, setPackYears] = useState<number>(0);
  const [cessationMonths, setCessationMonths] = useState<number>(0);
  const [usesVapeOrShisha, setUsesVapeOrShisha] = useState<boolean>(false);

  // 2. Contraceptive & Hormonal
  const [contraceptiveType, setContraceptiveType] = useState<ContraceptiveType>(
    gender === 'F' ? 'COMBINED_ORAL_PILL' : 'NONE'
  );
  const [contraceptiveDrugName, setContraceptiveDrugName] = useState<string>(
    gender === 'F' ? 'Yasmin (Ethinylestradiol + Drospirenone)' : ''
  );
  const [contraceptiveDurationMonths, setContraceptiveDurationMonths] = useState<number>(24);

  // 3. Psychiatric & Antipsychotic Drugs
  const [takesPsychiatricMeds, setTakesPsychiatricMeds] = useState<boolean>(false);
  const [selectedPsychMeds, setSelectedPsychMeds] = useState<PsychiatricMedication[]>([
    {
      name: 'Quetiapine (Seroquel 50mg HS)',
      category: 'ATYPICAL_ANTIPSYCHOTIC',
      dose: '50mg nightly',
      qtcProlongationRisk: true,
      sedationInteraction: true,
      hypotensionRisk: true,
      recommendation: 'Baseline ECG required. Alpha-1 antagonism blunts Ephedrine; prepare Phenylephrine.',
    },
  ]);

  // 4. Cardiac & Cardiovascular
  const [hasCardiacHistory, setHasCardiacHistory] = useState<boolean>(false);
  const [cardiacConditions, setCardiacConditions] = useState<CardiacCondition[]>([]);
  const [stentPlacementMonthsAgo, setStentPlacementMonthsAgo] = useState<number>(8);
  const [stentType, setStentType] = useState<'DES' | 'BMS'>('DES');
  const [ejectionFraction, setEjectionFraction] = useState<number>(55);
  const [metsTolerance, setMetsTolerance] = useState<number>(4);
  const [cardiologyCleared, setCardiologyCleared] = useState<boolean>(true);

  // 5. Diabetes & GLP-1 Agonists
  const [hasDiabetes, setHasDiabetes] = useState<boolean>(false);
  const [diabetesType, setDiabetesType] = useState<'TYPE_1' | 'TYPE_2' | 'GESTATIONAL'>('TYPE_2');
  const [takesGlp1, setTakesGlp1] = useState<boolean>(true);
  const [glp1DrugName, setGlp1DrugName] = useState<string>('Semaglutide (Ozempic 1.0mg weekly)');
  const [lastGlp1DoseHoursAgo, setLastGlp1DoseHoursAgo] = useState<number>(180);

  // 6. Fasting NPO Status
  const [lastSolidHours, setLastSolidHours] = useState<number>(12);
  const [lastFluidHours, setLastFluidHours] = useState<number>(4);

  // 7. Respiratory & Complications
  const [hasAsthma, setHasAsthma] = useState<boolean>(false);
  const [hasSleepApnea, setHasSleepApnea] = useState<boolean>(false);
  const [recentCold, setRecentCold] = useState<boolean>(false);
  const [personalMh, setPersonalMh] = useState<boolean>(false);
  const [familyMh, setFamilyMh] = useState<boolean>(false);
  const [difficultAirway, setDifficultAirway] = useState<boolean>(false);
  const [severePonv, setSeverePonv] = useState<boolean>(false);
  const [allergiesText, setAllergiesText] = useState<string>('Sulfonamide Antibiotics (Rash)');

  const [copiedLink, setCopiedLink] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Build live evaluation object
  const questionnaireData: Partial<QuestionnaireType> = useMemo(() => {
    return {
      patientId: currentPatient?.id || 'PAT-DXB-NEW',
      smokingStatus,
      packYears,
      cessationMonths,
      usesVapeOrShisha,
      contraceptiveType,
      contraceptiveDrugName,
      contraceptiveDurationMonths,
      hasVteRiskAlert: contraceptiveType === 'COMBINED_ORAL_PILL' || contraceptiveType === 'PATCH_RING' || contraceptiveType === 'HRT',
      takesPsychiatricMeds,
      psychiatricMeds: takesPsychiatricMeds ? selectedPsychMeds : [],
      hasCardiacHistory,
      cardiacConditions,
      stentPlacementMonthsAgo: hasCardiacHistory && cardiacConditions.includes('CORONARY_STENT_DES') ? stentPlacementMonthsAgo : undefined,
      stentType,
      ejectionFraction: hasCardiacHistory ? ejectionFraction : 60,
      metsExerciseTolerance: metsTolerance,
      cardiologyClearanceOnRecord: cardiologyCleared,
      hasDiabetes,
      diabetesType: hasDiabetes ? diabetesType : undefined,
      takesGlp1,
      glp1DrugName: takesGlp1 ? glp1DrugName : undefined,
      lastGlp1DoseHoursAgo: takesGlp1 ? lastGlp1DoseHoursAgo : undefined,
      hasAsthmaCopd: hasAsthma,
      usesInhaler: hasAsthma,
      hasSleepApnea,
      usesCpap: hasSleepApnea,
      recentUrtiWithin2Weeks: recentCold,
      lastSolidFoodHoursAgo: lastSolidHours,
      lastClearFluidHoursAgo: lastFluidHours,
      isNpoFastingAdequate: lastSolidHours >= 8 && lastFluidHours >= 2,
      personalMhHistory: personalMh,
      familyMhHistory: familyMh,
      difficultAirwayHistory: difficultAirway,
      severePonvHistory: severePonv,
      allergiesList: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
    };
  }, [
    currentPatient?.id,
    smokingStatus,
    packYears,
    cessationMonths,
    usesVapeOrShisha,
    contraceptiveType,
    contraceptiveDrugName,
    contraceptiveDurationMonths,
    takesPsychiatricMeds,
    selectedPsychMeds,
    hasCardiacHistory,
    cardiacConditions,
    stentPlacementMonthsAgo,
    stentType,
    ejectionFraction,
    metsTolerance,
    cardiologyCleared,
    hasDiabetes,
    diabetesType,
    takesGlp1,
    glp1DrugName,
    lastGlp1DoseHoursAgo,
    hasAsthma,
    hasSleepApnea,
    recentCold,
    lastSolidHours,
    lastFluidHours,
    personalMh,
    familyMh,
    difficultAirway,
    severePonv,
    allergiesText,
  ]);

  // Real-time clinical evaluation from rules-engine
  const report = useMemo(() => {
    return evaluateQuestionnaireFull(questionnaireData);
  }, [questionnaireData]);

  const toggleCardiacCondition = (cond: CardiacCondition) => {
    if (cardiacConditions.includes(cond)) {
      setCardiacConditions(cardiacConditions.filter((c) => c !== cond));
    } else {
      setCardiacConditions([...cardiacConditions, cond]);
    }
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== 'undefined' ? window.location.origin + '?view=intake&mrn=' + encodeURIComponent(patientMrn) : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleApplyToPatientStore = () => {
    if (currentPatient) {
      updatePatient(currentPatient.id, {
        overallStatus: report.overallClearance,
        primaryActionDirective: report.primaryActionDirective,
      });
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
      if (onSaved) {
        onSaved({
          ...questionnaireData,
          id: 'INTAKE-' + Date.now(),
          patientId: currentPatient.id,
          completedAtIso: new Date().toISOString(),
          source: 'PATIENT_MOBILE_LINK',
          riskFlags: [...report.hardStopFlags, ...report.conditionalFlags],
          clearanceStatus: report.overallClearance,
        } as QuestionnaireType);
      }
    }
  };

  return (
    <div className={'w-full ' + (isStandalonePage ? 'max-w-5xl mx-auto py-6 px-4' : 'bg-[#0F172A] text-slate-100 rounded-xl border border-slate-700 shadow-xl')}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 bg-slate-900 px-6 py-4 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Pre-Operative Medical Intake & Risk Questionnaire
              </h2>
              <span className="rounded bg-blue-900/80 px-2 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-700">
                Patient Self-Assessment / PAC Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Captures contraceptive VTE risks, antipsychotics, smoking status, cardiac conditions & 8-hour NPO status
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Patient Link'}</span>
          </button>

          <a
            href={'https://wa.me/?text=' + encodeURIComponent('Hello ' + patientName + ', please complete your Veracity Pre-Operative Clearance Questionnaire for ' + procedureName + ': ' + (typeof window !== 'undefined' ? window.location.origin : '') + '?view=intake')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Send WhatsApp</span>
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Clearance Status Banner */}
      <div
        className={'px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ' + (
          report.overallClearance === 'RED_HARD_STOP'
            ? 'bg-rose-950/80 border-rose-800 text-rose-200'
            : report.overallClearance === 'AMBER_CONDITIONAL'
            ? 'bg-amber-950/80 border-amber-800 text-amber-200'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
        )}
      >
        <div className="flex items-center gap-2.5">
          {report.overallClearance === 'RED_HARD_STOP' ? (
            <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
          ) : report.overallClearance === 'AMBER_CONDITIONAL' ? (
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <span>PAC Live Decision:</span>
              <span
                className={'px-2 py-0.5 rounded text-[10px] font-bold ' + (
                  report.overallClearance === 'RED_HARD_STOP'
                    ? 'bg-rose-600 text-white'
                    : report.overallClearance === 'AMBER_CONDITIONAL'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                )}
              >
                {report.overallClearance.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs mt-0.5">{report.primaryActionDirective}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyToPatientStore}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-sm cursor-pointer"
        >
          {isSavedSuccess ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Sparkles className="h-3.5 w-3.5" />}
          <span>{isSavedSuccess ? 'Synced to Active Case!' : 'Apply to Active Case'}</span>
        </button>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-700 bg-slate-900/60 px-6 py-2 gap-2 text-xs">
        {[
          { step: 1, label: '1. Patient & Demographics', icon: User },
          { step: 2, label: '2. Smoking & Vaping', icon: Cigarette },
          { step: 3, label: '3. Contraceptives & HRT', icon: Pill },
          { step: 4, label: '4. Antipsychotics & Psych', icon: Activity },
          { step: 5, label: '5. Cardiac & Stents', icon: Heart },
          { step: 6, label: '6. NPO & Summary', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStep === tab.step;
          return (
            <button
              key={tab.step}
              type="button"
              onClick={() => setActiveStep(tab.step)}
              className={'flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition shrink-0 cursor-pointer ' + (
                isActive
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="p-6 space-y-6">
        {/* STEP 1: DEMOGRAPHICS */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              <span>Patient Identification & Scheduled Procedure</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Emirates ID / MRN</label>
                <input
                  type="text"
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Age & Biological Gender</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Age"
                  />
                  <select
                    value={gender}
                    onChange={(e) => {
                      const newGender = e.target.value as 'M' | 'F';
                      setGender(newGender);
                      if (newGender === 'M') {
                        setContraceptiveType('NONE');
                        setContraceptiveDrugName('');
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scheduled Surgical Procedure</label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SMOKING & INHALATION */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cigarette className="h-4 w-4 text-amber-400" />
              <span>Smoking, Vaping & Airway Hyperreactivity History</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Smoking Status</label>
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value as SmokingStatus)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="NON_SMOKER">Never Smoked (Non-Smoker)</option>
                  <option value="ACTIVE_SMOKER">Active Smoker (Daily / Intermittent)</option>
                  <option value="EX_SMOKER">Former Smoker (Quit)</option>
                  <option value="VAPING">Vaping / E-Cigarettes Only</option>
                  <option value="SHISHA">Shisha / Hookah Smoker</option>
                </select>
              </div>

              {smokingStatus === 'ACTIVE_SMOKER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pack-Years (Packs/Day × Years)</label>
                  <input
                    type="number"
                    value={packYears}
                    onChange={(e) => setPackYears(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 15"
                  />
                </div>
              )}

              {smokingStatus === 'EX_SMOKER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Months Since Quitting</label>
                  <input
                    type="number"
                    value={cessationMonths}
                    onChange={(e) => setCessationMonths(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Months"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 md:col-span-2 pt-2">
                <input
                  type="checkbox"
                  id="usesVapeOrShisha"
                  checked={usesVapeOrShisha}
                  onChange={(e) => setUsesVapeOrShisha(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="usesVapeOrShisha" className="text-xs text-slate-200">
                  Also uses E-Cigarettes / Vapes, Heated Tobacco (IQOS), or Medwakh / Shisha
                </label>
              </div>
            </div>

            {/* Live Smoking Guideline Directives */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-xs space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5" />
                <span>Anesthesia Airway Defense Recommendation:</span>
              </div>
              <p className="text-slate-300">{report.smokingResult.inductionEmergencePlan}</p>
            </div>
          </div>
        )}

        {/* STEP 3: CONTRACEPTIVES & HRT */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Pill className="h-4 w-4 text-pink-400" />
              <span>Contraceptive Pills, Estrogen HRT & VTE Risk Shield</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hormonal Contraceptive / HRT Type</label>
                <select
                  value={contraceptiveType}
                  onChange={(e) => setContraceptiveType(e.target.value as ContraceptiveType)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="NONE">None / Not taking hormonal therapy</option>
                  <option value="COMBINED_ORAL_PILL">Combined Oral Contraceptive (Estrogen + Progestin)</option>
                  <option value="PROGESTIN_ONLY">Progestin-Only Pill (Mini-Pill)</option>
                  <option value="PATCH_RING">Contraceptive Patch / NuvaRing (Estrogen-containing)</option>
                  <option value="INJECTION">Depo-Provera Injection</option>
                  <option value="IUD">Intrauterine Device (Mirena / Kyleena / Copper)</option>
                  <option value="HRT">Hormone Replacement Therapy (Post-Menopausal Estrogen)</option>
                </select>
              </div>

              {contraceptiveType !== 'NONE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Medication Name / Brand</label>
                  <input
                    type="text"
                    value={contraceptiveDrugName}
                    onChange={(e) => setContraceptiveDrugName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Yasmin, Marvelon, Diane-35"
                  />
                </div>
              )}

              {contraceptiveType !== 'NONE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration of Use (Months)</label>
                  <input
                    type="number"
                    value={contraceptiveDurationMonths}
                    onChange={(e) => setContraceptiveDurationMonths(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Months"
                  />
                </div>
              )}
            </div>

            {/* Live Contraceptive & VTE Guidance Banner */}
            <div
              className={'rounded-lg border p-3 text-xs space-y-1.5 ' + (
                report.contraceptiveResult.vteRiskFlag
                  ? 'border-amber-700 bg-amber-950/60 text-amber-200'
                  : 'border-slate-700 bg-slate-800 text-slate-300'
              )}
            >
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>ACOG / ASRA 2024 Perioperative Contraceptive Guideline:</span>
                </span>
                <span className="rounded bg-amber-800/80 px-2 py-0.5 text-[10px] font-bold text-amber-100">
                  Caprini VTE Points: +{report.contraceptiveResult.capriniPoints}
                </span>
              </div>
              <p className="text-xs">{report.contraceptiveResult.recommendation}</p>
              <p className="text-xs font-mono text-slate-300">
                Directives: {report.contraceptiveResult.surgicalDirective}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: ANTIPSYCHOTICS & PSYCHIATRIC DRUGS */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span>Psychiatric, Antipsychotic & Psychotropic Medication Screening</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="takesPsychiatricMeds"
                checked={takesPsychiatricMeds}
                onChange={(e) => setTakesPsychiatricMeds(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <label htmlFor="takesPsychiatricMeds" className="text-xs font-bold text-slate-200">
                Patient takes prescription psychiatric or psychotropic medications
              </label>
            </div>

            {takesPsychiatricMeds && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      name: 'Quetiapine (Seroquel)',
                      category: 'ATYPICAL_ANTIPSYCHOTIC' as const,
                      risk: 'QTc prolongation & Alpha-1 vasoplegia',
                    },
                    {
                      name: 'Olanzapine (Zyprexa)',
                      category: 'ATYPICAL_ANTIPSYCHOTIC' as const,
                      risk: 'Sedation synergy & autonomic instability',
                    },
                    {
                      name: 'Haloperidol (Haldol)',
                      category: 'TYPICAL_ANTIPSYCHOTIC' as const,
                      risk: 'High QTc prolongation & EPS risk',
                    },
                    {
                      name: 'Risperidone (Risperdal)',
                      category: 'ATYPICAL_ANTIPSYCHOTIC' as const,
                      risk: 'Hypotension with volatile anesthetics',
                    },
                    {
                      name: 'Lithium (Priadel)',
                      category: 'LITHIUM' as const,
                      risk: 'Prolongs neuromuscular blockades (Rocuronium)',
                    },
                    {
                      name: 'Phenelzine / MAO Inhibitor',
                      category: 'MAOI' as const,
                      risk: 'FATAL CRISIS with Ephedrine or Meperidine',
                    },
                    {
                      name: 'SSRI / SNRI (Sertraline / Escitalopram)',
                      category: 'SSRI_SNRI' as const,
                      risk: 'Serotonin syndrome with synthetic opioids',
                    },
                  ].map((drug) => {
                    const isSelected = selectedPsychMeds.some((m) => m.name.includes(drug.name.split(' ')[0]));
                    return (
                      <button
                        key={drug.name}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPsychMeds(selectedPsychMeds.filter((m) => !m.name.includes(drug.name.split(' ')[0])));
                          } else {
                            setSelectedPsychMeds([
                              ...selectedPsychMeds,
                              {
                                name: drug.name,
                                category: drug.category,
                                qtcProlongationRisk: true,
                                sedationInteraction: true,
                                hypotensionRisk: true,
                                recommendation: drug.risk,
                              },
                            ]);
                          }
                        }}
                        className={'flex flex-col items-start p-3 rounded-lg border text-left transition cursor-pointer ' + (
                          isSelected
                            ? 'border-purple-500 bg-purple-950/60 text-white'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs">{drug.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                        </div>
                        <span className="text-[11px] text-slate-300 mt-1">{drug.risk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Antipsychotic Anesthesia Directives */}
            {takesPsychiatricMeds && (
              <div className="rounded-lg border border-purple-800 bg-purple-950/40 p-3.5 text-xs space-y-2">
                <div className="font-bold text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-purple-400" />
                    <span>Anesthesia Pressor & Drug Safety Warnings:</span>
                  </span>
                  <span className="rounded bg-rose-900/80 px-2 py-0.5 text-[10px] font-bold text-rose-200">
                    Avoid: {report.antipsychoticResult.avoidDrugs.join(', ') || 'Droperidol'}
                  </span>
                </div>
                {report.antipsychoticResult.clinicalDirectives.map((dir, idx) => (
                  <p key={idx} className="text-slate-300">
                    • {dir}
                  </p>
                ))}
                <div className="pt-1 text-emerald-300 font-mono text-[11px]">
                  ✓ Preferred Induction Vasopressors: {report.antipsychoticResult.recommendedPressors.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: CARDIAC & CARDIOVASCULAR */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span>Cardiovascular Disease, Stents & Functional Capacity</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasCardiacHistory"
                checked={hasCardiacHistory}
                onChange={(e) => setHasCardiacHistory(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <label htmlFor="hasCardiacHistory" className="text-xs font-bold text-slate-200">
                Patient has documented history of cardiac or heart conditions
              </label>
            </div>

            {hasCardiacHistory && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'MYOCARDIAL_INFARCTION' as CardiacCondition, label: 'Prior Heart Attack (MI)' },
                    { id: 'CORONARY_STENT_DES' as CardiacCondition, label: 'Drug-Eluting Stent (DES)' },
                    { id: 'CORONARY_STENT_BMS' as CardiacCondition, label: 'Bare-Metal Stent (BMS)' },
                    { id: 'HEART_FAILURE' as CardiacCondition, label: 'Heart Failure / Low EF' },
                    { id: 'ARRHYTHMIA_AFIB' as CardiacCondition, label: 'Atrial Fibrillation' },
                    { id: 'PACEMAKER_ICD' as CardiacCondition, label: 'Pacemaker / Defibrillator' },
                    { id: 'HYPERTENSION' as CardiacCondition, label: 'High Blood Pressure' },
                  ].map((item) => {
                    const isChecked = cardiacConditions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCardiacCondition(item.id)}
                        className={'p-2.5 rounded-lg border text-xs text-left font-medium transition cursor-pointer ' + (
                          isChecked
                            ? 'border-rose-500 bg-rose-950/60 text-white font-bold'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {cardiacConditions.includes('CORONARY_STENT_DES') && (
                  <div className="rounded-lg border border-rose-800 bg-rose-950/50 p-3 text-xs space-y-2">
                    <label className="block font-bold text-rose-200">
                      Months Since Drug-Eluting Stent (DES) Implantation:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={stentPlacementMonthsAgo}
                        onChange={(e) => setStentPlacementMonthsAgo(Number(e.target.value))}
                        className="w-24 rounded-lg border border-rose-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                        placeholder="Months"
                      />
                      <span className="text-slate-300">
                        {stentPlacementMonthsAgo < 6
                          ? '⚠️ HARD STOP: Stent < 6 months requires postponing elective surgery'
                          : stentPlacementMonthsAgo < 12
                          ? '⚡ 6-12 Months: High risk, continue Aspirin'
                          : '✓ >12 Months: Cleared for standard protocol'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Functional Capacity (METs)
                    </label>
                    <select
                      value={metsTolerance}
                      onChange={(e) => setMetsTolerance(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value={4}>≥ 4 METs (Can climb 2 flights of stairs without stopping)</option>
                      <option value={2}>&lt; 4 METs (Short of breath with light household walking)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Left Ventricular Ejection Fraction (LVEF %)
                    </label>
                    <input
                      type="number"
                      value={ejectionFraction}
                      onChange={(e) => setEjectionFraction(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      placeholder="e.g. 55"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: NPO FASTING & COMPLETE SUMMARY */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>8-Hour NPO Fasting, GLP-1 Holds & Clearance Attestation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hours Since Last Solid Food (Target ≥ 8h)
                </label>
                <input
                  type="number"
                  value={lastSolidHours}
                  onChange={(e) => setLastSolidHours(Number(e.target.value))}
                  className={'w-full rounded-lg border px-3 py-2 text-xs text-white focus:outline-none ' + (
                    lastSolidHours < 8
                      ? 'border-rose-600 bg-rose-950/40 text-rose-200'
                      : 'border-slate-700 bg-slate-800'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hours Since Last Clear Liquids (Target ≥ 2h)
                </label>
                <input
                  type="number"
                  value={lastFluidHours}
                  onChange={(e) => setLastFluidHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* GLP-1 Agonist Section */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="takesGlp1"
                  checked={takesGlp1}
                  onChange={(e) => setTakesGlp1(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="takesGlp1" className="text-xs font-bold text-slate-200">
                  Patient takes GLP-1 Agonist (Ozempic, Wegovy, Mounjaro, Tirzepatide, Trulicity)
                </label>
              </div>

              {takesGlp1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">GLP-1 Drug</label>
                    <input
                      type="text"
                      value={glp1DrugName}
                      onChange={(e) => setGlp1DrugName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Hours Since Last Dose (Weekly = 168h target)
                    </label>
                    <input
                      type="number"
                      value={lastGlp1DoseHoursAgo}
                      onChange={(e) => setLastGlp1DoseHoursAgo(Number(e.target.value))}
                      className={'w-full rounded-lg border px-3 py-1.5 text-xs text-white ' + (
                        lastGlp1DoseHoursAgo < 168
                          ? 'border-amber-600 bg-amber-950/40 text-amber-200'
                          : 'border-slate-700 bg-slate-900'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Allergies and Complications */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Documented Drug & Food Allergies
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Penicillin, Latex, Contrast Dye"
              />
            </div>

            {/* Full Clinical Summary Output */}
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-blue-400" />
                  <span>PAC Pre-Operative Risk Assessment Summary</span>
                </span>
                <span
                  className={'px-2 py-0.5 rounded text-[11px] font-bold ' + (
                    report.overallClearance === 'RED_HARD_STOP'
                      ? 'bg-rose-600 text-white'
                      : report.overallClearance === 'AMBER_CONDITIONAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  )}
                >
                  {report.overallClearance.replace('_', ' ')}
                </span>
              </div>

              {/* Hard Stops */}
              {report.hardStopFlags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-rose-400">Critical Surgical Contraindications:</span>
                  {report.hardStopFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-rose-200 bg-rose-950/50 p-2 rounded border border-rose-800">
                      <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conditionals */}
              {report.conditionalFlags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-400">Pre-Anesthesia Directives & Optimization:</span>
                  {report.conditionalFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/40 p-2 rounded border border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Green Cleared */}
              {report.greenClearancePoints.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400">Cleared Clinical Systems:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {report.greenClearancePoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/60">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between border-t border-slate-700 bg-slate-900 px-6 py-4 rounded-b-xl">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Step</span>
        </button>

        <div className="text-xs font-mono text-slate-400">
          Step {activeStep} of {totalSteps}
        </div>

        {activeStep < totalSteps ? (
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.min(totalSteps, prev + 1))}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>Next Step</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApplyToPatientStore}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Complete & Sync to Active OT Case</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientPreOpQuestionnaire;
`;

fs.writeFileSync(path.join(__dirname, '../components/PatientPreOpQuestionnaire.tsx'), content, 'utf8');
console.log('Successfully generated PatientPreOpQuestionnaire.tsx');
