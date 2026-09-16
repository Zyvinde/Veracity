'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  History,
  ClipboardList,
  Plus,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import {
  SmokingStatus,
  ContraceptiveType,
  PsychiatricMedication,
  CardiacCondition,
  MedicalIssueKey,
  PreviousSurgeryRecord,
  FamilyAnesthesiaIssueKey,
  DentalIssueKey,
  DrugAllergyKey,
  CurrentMedication,
  PatientPreOpQuestionnaire as QuestionnaireType,
} from '@/lib/types';
import {
  evaluateQuestionnaireFull,
  MEDICAL_ISSUES_META,
  FAMILY_ANESTHESIA_META,
  DENTAL_META,
  DRUG_ALLERGY_META,
  CURRENT_MED_PRESETS,
} from '@/lib/rules-engine';
import { usePatientStore } from '@/lib/store';
import { useI18n, Locale } from '@/lib/i18n/context';

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
  const { t, locale, setLocale } = useI18n();
  const { patients, currentPatientId, saveQuestionnaire, generateIntakeLink, requestFitness, setFitnessStatus } = usePatientStore();
  const activeId = patientId || currentPatientId;
  const currentPatient = patients.find((p) => p.id === activeId) || patients[0];

  const [activeStep, setActiveStep] = useState<number>(1);
  const totalSteps = 8;

  // Form State
  const [patientName, setPatientName] = useState(currentPatient?.name || 'Fatima Al-Mansoor');
  const [patientMrn, setPatientMrn] = useState(currentPatient?.mrn || 'DHA-892144-AE');
  const [age, setAge] = useState<number>(currentPatient?.age || 48);
  const [gender, setGender] = useState<'M' | 'F'>(currentPatient?.gender || 'F');
  const [procedureName, setProcedureName] = useState(currentPatient?.procedureName || 'Laparoscopic Cholecystectomy');

  // 0. Medical issues checklist
  const [medicalIssues, setMedicalIssues] = useState<MedicalIssueKey[]>([]);
  const [medicalIssueNotes, setMedicalIssueNotes] = useState<string>('');

  // 0b. Previous surgery history
  const [hadPreviousSurgery, setHadPreviousSurgery] = useState<boolean>(false);
  const [previousSurgeries, setPreviousSurgeries] = useState<PreviousSurgeryRecord[]>([]);
  const [newSurgeryProcedure, setNewSurgeryProcedure] = useState<string>('');
  const [newSurgeryYear, setNewSurgeryYear] = useState<string>('');
  const [newSurgeryComplications, setNewSurgeryComplications] = useState<string>('');

  // 0c. Family anesthesia + G6PD + dental + airway + drug allergy
  const [familyAnesthesiaIssues, setFamilyAnesthesiaIssues] = useState<FamilyAnesthesiaIssueKey[]>([]);
  const [familyAnesthesiaNotes, setFamilyAnesthesiaNotes] = useState<string>('');
  const [hasG6pd, setHasG6pd] = useState<boolean>(false);
  const [g6pdDetails, setG6pdDetails] = useState<string>('');
  const [dentalIssues, setDentalIssues] = useState<DentalIssueKey[]>([]);
  const [dentalNotes, setDentalNotes] = useState<string>('');
  const [neckMovement, setNeckMovement] = useState<'NORMAL' | 'STIFF' | 'VERY_LIMITED' | 'FUSION'>('NORMAL');
  const [mouthOpening, setMouthOpening] = useState<'NORMAL_3FINGERS' | 'LIMITED_2FINGERS' | 'VERY_LIMITED_1FINGER'>('NORMAL_3FINGERS');
  const [airwayScreenNotes, setAirwayScreenNotes] = useState<string>('');
  const [hasDrugAllergy, setHasDrugAllergy] = useState<boolean>(false);
  const [drugAllergyKeys, setDrugAllergyKeys] = useState<DrugAllergyKey[]>([]);
  const [drugAllergyDetails, setDrugAllergyDetails] = useState<string>('');

  // 0d. Current daily medications
  const [currentMedications, setCurrentMedications] = useState<CurrentMedication[]>([]);
  const [currentMedNotes, setCurrentMedNotes] = useState<string>('');
  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedCategory, setNewMedCategory] = useState<CurrentMedication['category']>('OTHER');

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
  const [hydratedFromRecord, setHydratedFromRecord] = useState(false);

  // Hydrate form once from previously saved questionnaire on the active case
  useEffect(() => {
    const saved = currentPatient?.questionnaire;
    if (!saved || hydratedFromRecord) return;
    setMedicalIssues(saved.medicalIssues || []);
    setMedicalIssueNotes(saved.medicalIssueNotes || '');
    setHadPreviousSurgery(!!saved.hadPreviousSurgery);
    setPreviousSurgeries(saved.previousSurgeries || []);
    setFamilyAnesthesiaIssues(saved.familyAnesthesiaIssues || []);
    setFamilyAnesthesiaNotes(saved.familyAnesthesiaNotes || '');
    setHasG6pd(!!saved.hasG6pd);
    setG6pdDetails(saved.g6pdDetails || '');
    setDentalIssues(saved.dentalIssues || []);
    setDentalNotes(saved.dentalNotes || '');
    setNeckMovement(saved.neckMovement || 'NORMAL');
    setMouthOpening(saved.mouthOpening || 'NORMAL_3FINGERS');
    setAirwayScreenNotes(saved.airwayScreenNotes || '');
    setHasDrugAllergy(!!saved.hasDrugAllergy);
    setDrugAllergyKeys(saved.drugAllergyKeys || []);
    setDrugAllergyDetails(saved.drugAllergyDetails || '');
    setCurrentMedications(saved.currentMedications || []);
    setCurrentMedNotes(saved.currentMedNotes || '');
    setSmokingStatus(saved.smokingStatus);
    setPackYears(saved.packYears || 0);
    setCessationMonths(saved.cessationMonths || 0);
    setUsesVapeOrShisha(!!saved.usesVapeOrShisha);
    setContraceptiveType(saved.contraceptiveType);
    setContraceptiveDrugName(saved.contraceptiveDrugName || '');
    setContraceptiveDurationMonths(saved.contraceptiveDurationMonths || 0);
    setTakesPsychiatricMeds(!!saved.takesPsychiatricMeds);
    setSelectedPsychMeds(saved.psychiatricMeds || []);
    setHasCardiacHistory(!!saved.hasCardiacHistory);
    setCardiacConditions(saved.cardiacConditions || []);
    setStentPlacementMonthsAgo(saved.stentPlacementMonthsAgo || 8);
    if (saved.stentType) setStentType(saved.stentType);
    setEjectionFraction(saved.ejectionFraction || 55);
    setMetsTolerance(saved.metsExerciseTolerance || 4);
    setCardiologyCleared(!!saved.cardiologyClearanceOnRecord);
    setHasDiabetes(!!saved.hasDiabetes);
    if (saved.diabetesType) setDiabetesType(saved.diabetesType);
    setTakesGlp1(!!saved.takesGlp1);
    setGlp1DrugName(saved.glp1DrugName || '');
    setLastGlp1DoseHoursAgo(saved.lastGlp1DoseHoursAgo ?? 180);
    setLastSolidHours(saved.lastSolidFoodHoursAgo ?? 12);
    setLastFluidHours(saved.lastClearFluidHoursAgo ?? 4);
    setHasAsthma(!!saved.hasAsthmaCopd);
    setHasSleepApnea(!!saved.hasSleepApnea);
    setRecentCold(!!saved.recentUrtiWithin2Weeks);
    setPersonalMh(!!saved.personalMhHistory);
    setFamilyMh(!!saved.familyMhHistory);
    setDifficultAirway(!!saved.difficultAirwayHistory);
    setSeverePonv(!!saved.severePonvHistory);
    if (saved.allergiesList?.length) setAllergiesText(saved.allergiesList.join(', '));
    setHydratedFromRecord(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPatient?.id, hydratedFromRecord]);

  // Build live evaluation object
  const questionnaireData: Partial<QuestionnaireType> = useMemo(() => {
    return {
      patientId: currentPatient?.id || 'PAT-DXB-NEW',
      medicalIssues,
      medicalIssueNotes,
      hadPreviousSurgery,
      previousSurgeries,
      previousSurgeryNotes: previousSurgeries.map((s) => `${s.procedure}${s.year ? ` (${s.year})` : ''}${s.complications ? ` — ${s.complications}` : ''}`).join('; '),
      familyAnesthesiaIssues,
      familyAnesthesiaNotes,
      hasG6pd,
      g6pdDetails,
      dentalIssues,
      dentalNotes,
      neckMovement,
      mouthOpening,
      airwayScreenNotes,
      hasDrugAllergy,
      drugAllergyKeys,
      drugAllergyDetails,
      currentMedications,
      currentMedNotes,
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
    medicalIssues,
    medicalIssueNotes,
    hadPreviousSurgery,
    previousSurgeries,
    familyAnesthesiaIssues,
    familyAnesthesiaNotes,
    hasG6pd,
    g6pdDetails,
    dentalIssues,
    dentalNotes,
    neckMovement,
    mouthOpening,
    airwayScreenNotes,
    hasDrugAllergy,
    drugAllergyKeys,
    drugAllergyDetails,
    currentMedications,
    currentMedNotes,
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
    return evaluateQuestionnaireFull(questionnaireData, currentPatient?.fitnessReferrals || []);
  }, [questionnaireData, currentPatient?.fitnessReferrals]);

  const toggleCardiacCondition = (cond: CardiacCondition) => {
    if (cardiacConditions.includes(cond)) {
      setCardiacConditions(cardiacConditions.filter((c) => c !== cond));
    } else {
      setCardiacConditions([...cardiacConditions, cond]);
    }
  };

  const toggleListKey = <T,>(list: T[], key: T, set: (v: T[]) => void) => {
    if (list.includes(key)) set(list.filter((k) => k !== key));
    else set([...list, key]);
  };

  const addPreviousSurgery = () => {
    if (!newSurgeryProcedure.trim()) return;
    const year = parseInt(newSurgeryYear, 10);
    setPreviousSurgeries([
      ...previousSurgeries,
      {
        procedure: newSurgeryProcedure.trim(),
        year: Number.isFinite(year) ? year : undefined,
        anesthesiaType: 'UNKNOWN',
        complications: newSurgeryComplications.trim() || undefined,
      },
    ]);
    setNewSurgeryProcedure('');
    setNewSurgeryYear('');
    setNewSurgeryComplications('');
  };

  const addCurrentMed = (name: string, category: CurrentMedication['category']) => {
    if (!name.trim() || currentMedications.some((m) => m.name.toLowerCase() === name.trim().toLowerCase())) return;
    setCurrentMedications([...currentMedications, { name: name.trim(), category }]);
  };

  const handleCopyShareLink = () => {
    const url =
      typeof window !== 'undefined' && currentPatient
        ? generateIntakeLink(currentPatient.id)
        : typeof window !== 'undefined'
        ? window.location.origin + '?view=intake&mrn=' + encodeURIComponent(patientMrn)
        : '';
    if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleApplyToPatientStore = () => {
    if (currentPatient) {
      const record = {
        ...questionnaireData,
        id: 'INTAKE-' + Date.now(),
        patientId: currentPatient.id,
        completedAtIso: new Date().toISOString(),
        source: 'PATIENT_MOBILE_LINK',
        riskFlags: [...report.hardStopFlags, ...report.conditionalFlags],
        clearanceStatus: report.overallClearance,
      } as QuestionnaireType;
      saveQuestionnaire(currentPatient.id, record);
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
      if (onSaved) {
        onSaved(record);
      }
    }
  };

  return (
    <div
      className="w-full max-w-full sm:max-w-5xl mx-auto bg-[#0a1e36]/80 text-white rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden overflow-x-clip min-w-0 break-words"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/15 bg-white/10 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shrink-0">
            <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="font-serif text-sm sm:text-base font-bold text-white tracking-tight break-words">
                {t('intake.headerTitle')}
              </h2>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-300 border border-white/20 shrink-0">
                {t('intake.selfBadge')}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/60 truncate">
              {t('intake.headerSub')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center rounded-xl bg-white/10 border border-white/20 p-0.5 backdrop-blur-md">
            {(
              [
                { code: 'en', label: 'EN' },
                { code: 'ar', label: 'عربي' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'ur', label: 'اردو' },
                { code: 'ml', label: 'മല' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLocale(lang.code as Locale)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition min-h-[44px] flex items-center justify-center cursor-pointer ${
                  locale === lang.code
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-semibold text-white transition cursor-pointer backdrop-blur-md min-h-[44px]"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedLink ? t('intake.linkCopied') : t('intake.copyLink')}</span>
          </button>

          <a
            href={
              'https://wa.me/?text=' +
              encodeURIComponent(
                t('intake.waShare', {
                  name: patientName,
                  procedure: procedureName,
                  origin: typeof window !== 'undefined' ? window.location.origin : '',
                })
              )
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold transition cursor-pointer shadow-md min-h-[44px]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{t('intake.sendWhatsapp')}</span>
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 p-2.5 text-white/70 hover:text-white hover:bg-white/20 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Clearance Status Banner */}
      <div
        className={
          'px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 backdrop-blur-md ' +
          (report.overallClearance === 'RED_HARD_STOP'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            : report.overallClearance === 'AMBER_CONDITIONAL'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200')
        }
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
              <span className="text-white">{t('intake.pacLive')}</span>
              <span
                className={
                  'px-2 py-0.5 rounded text-[10px] font-bold text-white ' +
                  (report.overallClearance === 'RED_HARD_STOP'
                    ? 'bg-rose-600'
                    : report.overallClearance === 'AMBER_CONDITIONAL'
                    ? 'bg-amber-600'
                    : 'bg-emerald-600')
                }
              >
                {report.overallClearance.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs mt-0.5 text-white/90">{report.primaryActionDirective}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApplyToPatientStore}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition shadow cursor-pointer min-h-[44px]"
        >
          {isSavedSuccess ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isSavedSuccess ? t('intake.synced') : t('intake.applyCase')}</span>
        </button>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-white/15 bg-white/5 px-3 sm:px-6 py-2.5 gap-2 text-xs backdrop-blur-md scrollbar-none">
        {[
          { step: 1, label: t('intake.step1'), icon: User },
          { step: 2, label: t('intake.step2'), icon: ClipboardList },
          { step: 3, label: t('intake.step3'), icon: History },
          { step: 4, label: t('intake.step4'), icon: Cigarette },
          { step: 5, label: t('intake.step5'), icon: Pill },
          { step: 6, label: t('intake.step6'), icon: Activity },
          { step: 7, label: t('intake.step7'), icon: Heart },
          { step: 8, label: t('intake.step8'), icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStep === tab.step;
          const isDone = tab.step < activeStep;
          return (
            <button
              key={tab.step}
              type="button"
              onClick={() => setActiveStep(tab.step)}
              className={
                'flex items-center gap-1.5 sm:gap-2 pl-2 pr-3.5 py-2 rounded-full border font-semibold transition shrink-0 cursor-pointer whitespace-nowrap backdrop-blur-md min-h-[44px] ' +
                (isActive
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : isDone
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white')
              }
            >
              <span
                className={
                  'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-[11px] font-bold ' +
                  (isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white/70')
                }
              >
                {isDone ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : tab.step}
              </span>
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* STEP 1: DEMOGRAPHICS */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif">
              <User className="h-4 w-4 text-emerald-400" />
              <span>{t('intake.s1Title')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {t('intake.fullName')}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {t('intake.emiratesId')}
                </label>
                <input
                  type="text"
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {t('intake.ageGender')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-24 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.agePh')}
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
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                  >
                    <option value="F" className="bg-black text-white">
                      {t('intake.female')}
                    </option>
                    <option value="M" className="bg-black text-white">
                      {t('intake.male')}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {t('intake.procedure')}
                </label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEDICAL ISSUES + CURRENT MEDICATIONS */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif">
              <ClipboardList className="h-4 w-4 text-emerald-400" />
              <span>{t('intake.s2Title')}</span>
            </h3>
            <p className="text-xs text-white/60">
              {t('intake.s2Sub')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(MEDICAL_ISSUES_META) as MedicalIssueKey[]).map((key) => {
                const selected = medicalIssues.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleListKey(medicalIssues, key, setMedicalIssues)}
                    className={
                      'flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ' +
                      (selected
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white')
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-white">{t(`intake.medical.${key}`)}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{t(`intake.medicalHint.${key}`)}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {t('intake.medNotes')}
              </label>
              <input
                type="text"
                value={medicalIssueNotes}
                onChange={(e) => setMedicalIssueNotes(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder={t('intake.medNotesPh')}
              />
            </div>

            {report.medicalResult.directives.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs space-y-1.5 backdrop-blur-md">
                <div className="font-bold text-amber-300">{t('intake.meansTitle')}</div>
                {report.medicalResult.directives.map((dir, idx) => (
                  <p key={idx} className="text-white/80">
                    • {dir}
                  </p>
                ))}
              </div>
            )}

            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pt-2 font-serif">
              <Pill className="h-4 w-4 text-emerald-400" />
              <span>{t('intake.medsTitle')}</span>
            </h3>
            <p className="text-xs text-white/60">
              {t('intake.medsSub')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CURRENT_MED_PRESETS.map((preset) => {
                const selected = currentMedications.some(
                  (m) => m.name.toLowerCase() === preset.name.toLowerCase()
                );
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setCurrentMedications(
                          currentMedications.filter(
                            (m) => m.name.toLowerCase() !== preset.name.toLowerCase()
                          )
                        );
                      } else {
                        addCurrentMed(preset.name, preset.category);
                      }
                    }}
                    className={
                      'flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ' +
                      (selected
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white')
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-white">{preset.name}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{t(`intake.medPresetHint.${preset.name}`)}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="md:col-span-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder={t('intake.otherMedPh')}
              />
              <div className="flex gap-2">
                <select
                  value={newMedCategory}
                  onChange={(e) =>
                    setNewMedCategory(e.target.value as CurrentMedication['category'])
                  }
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="BP" className="bg-black text-white">
                    {t('intake.catBP')}
                  </option>
                  <option value="DIABETES" className="bg-black text-white">
                    {t('intake.catDiabetes')}
                  </option>
                  <option value="THYROID" className="bg-black text-white">
                    {t('intake.catThyroid')}
                  </option>
                  <option value="ANXIETY" className="bg-black text-white">
                    {t('intake.catAnxiety')}
                  </option>
                  <option value="CONTRACEPTIVE" className="bg-black text-white">
                    {t('intake.catContraceptive')}
                  </option>
                  <option value="WEIGHT_LOSS" className="bg-black text-white">
                    {t('intake.catWeightLoss')}
                  </option>
                  <option value="OTHER">{t('intake.catOther')}</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    addCurrentMed(newMedName, newMedCategory);
                    setNewMedName('');
                  }}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition cursor-pointer shadow-md min-h-[44px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t('intake.add')}</span>
                </button>
              </div>
            </div>

            {currentMedications.length > 0 && (
              <div className="space-y-1.5">
                {currentMedications.map((med) => (
                  <div
                    key={med.name}
                    className="rounded-xl border border-white/15 bg-white/5 p-2.5 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md min-w-0 break-words"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-xs break-words">{med.name}</div>
                      <div className="text-[10px] text-white/50">{med.category.replace('_', ' ')}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentMedications(currentMedications.filter((m) => m.name !== med.name))
                      }
                      className="p-1.5 text-white/50 hover:text-rose-400 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                      aria-label={t('intake.removeMed', { name: med.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {t('intake.medNotes2')}
              </label>
              <input
                type="text"
                value={currentMedNotes}
                onChange={(e) => setCurrentMedNotes(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder={t('intake.medNotes2Ph')}
              />
            </div>

            {report.currentMedsResult.directives.length > 0 && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-1.5 backdrop-blur-md">
                <div className="font-bold text-emerald-300">
                  {t('intake.dayPlan')}
                </div>
                {report.currentMedsResult.directives.map((dir, idx) => (
                  <p key={idx} className="text-white/80">
                    • {dir}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SURGERY & ANESTHESIA HISTORY */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif">
              <History className="h-4 w-4 text-emerald-400" />
              <span>{t('intake.s3Title')}</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hadPreviousSurgery"
                checked={hadPreviousSurgery}
                onChange={(e) => setHadPreviousSurgery(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-0"
              />
              <label htmlFor="hadPreviousSurgery" className="text-xs font-bold text-white">
                {t('intake.hadSurgery')}
              </label>
            </div>

            {hadPreviousSurgery && (
              <div className="space-y-2">
                {previousSurgeries.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/15 bg-white/5 p-2.5 flex items-center justify-between gap-2 backdrop-blur-md"
                  >
                    <div className="text-xs">
                      <div className="font-bold text-white">
                        {s.procedure}
                        {s.year ? ` (${s.year})` : ''}
                      </div>
                      {s.complications && (
                        <div className="text-[11px] text-amber-300">
                          {t('intake.complications', { c: s.complications })}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviousSurgeries(previousSurgeries.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-white/50 hover:text-rose-400 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                      aria-label={t('intake.removeSurgery')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newSurgeryProcedure}
                    onChange={(e) => setNewSurgeryProcedure(e.target.value)}
                    className="md:col-span-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.surgeryPh')}
                  />
                  <input
                    type="number"
                    value={newSurgeryYear}
                    onChange={(e) => setNewSurgeryYear(e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.yearPh')}
                  />
                  <input
                    type="text"
                    value={newSurgeryComplications}
                    onChange={(e) => setNewSurgeryComplications(e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.problemPh')}
                  />
                </div>
                <button
                  type="button"
                  onClick={addPreviousSurgery}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md min-h-[44px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t('intake.addSurgery')}</span>
                </button>
              </div>
            )}

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">{t('intake.familyTitle')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(FAMILY_ANESTHESIA_META) as FamilyAnesthesiaIssueKey[]).map((key) => {
                const selected = familyAnesthesiaIssues.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleListKey(familyAnesthesiaIssues, key, setFamilyAnesthesiaIssues)}
                    className={'flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ' + (
                      selected
                        ? 'border-purple-500/50 bg-purple-500/20 text-white'
                        : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-white">{t(`intake.family.${key}`)}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{t(`intake.familyHint.${key}`)}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={familyAnesthesiaNotes}
              onChange={(e) => setFamilyAnesthesiaNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
              placeholder={t('intake.familyNotesPh')}
            />

            <div className="rounded-xl border border-white/15 bg-white/5 p-3.5 space-y-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasG6pd"
                  checked={hasG6pd}
                  onChange={(e) => setHasG6pd(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="hasG6pd" className="text-xs font-bold text-white/90">
                  {t('intake.g6pd')}
                </label>
              </div>
              {hasG6pd && (
                <input
                  type="text"
                  value={g6pdDetails}
                  onChange={(e) => setG6pdDetails(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                  placeholder={t('intake.g6pdPh')}
                />
              )}
            </div>

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">{t('intake.teethTitle')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(DENTAL_META) as DentalIssueKey[]).map((key) => {
                const selected = dentalIssues.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleListKey(dentalIssues, key, setDentalIssues)}
                    className={'flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ' + (
                      selected
                        ? 'border-amber-500/50 bg-amber-500/20 text-white'
                        : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-white">{t(`intake.dental.${key}`)}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{t(`intake.dentalHint.${key}`)}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={dentalNotes}
              onChange={(e) => setDentalNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
              placeholder={t('intake.dentalNotesPh')}
            />

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">{t('intake.neckTitle')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.neckLabel')}</label>
                <select
                  value={neckMovement}
                  onChange={(e) => setNeckMovement(e.target.value as typeof neckMovement)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NORMAL" className="bg-[#0a0a0a] text-white">{t('intake.neckNormal')}</option>
                  <option value="STIFF" className="bg-[#0a0a0a] text-white">{t('intake.neckStiff')}</option>
                  <option value="VERY_LIMITED" className="bg-[#0a0a0a] text-white">{t('intake.neckVeryLimited')}</option>
                  <option value="FUSION" className="bg-[#0a0a0a] text-white">{t('intake.neckFusion')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.mouthLabel')}</label>
                <select
                  value={mouthOpening}
                  onChange={(e) => setMouthOpening(e.target.value as typeof mouthOpening)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NORMAL_3FINGERS" className="bg-[#0a0a0a] text-white">{t('intake.mouthWide')}</option>
                  <option value="LIMITED_2FINGERS" className="bg-[#0a0a0a] text-white">{t('intake.mouthLimited2')}</option>
                  <option value="VERY_LIMITED_1FINGER" className="bg-[#0a0a0a] text-white">{t('intake.mouthVerySmall')}</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              value={airwayScreenNotes}
              onChange={(e) => setAirwayScreenNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
              placeholder={t('intake.airwayNotesPh')}
            />

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">{t('intake.allergyTitle')}</h4>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasDrugAllergy"
                checked={hasDrugAllergy}
                onChange={(e) => setHasDrugAllergy(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-rose-200 focus:ring-0"
              />
              <label htmlFor="hasDrugAllergy" className="text-xs font-bold text-white/90">
                {t('intake.hasAllergyQ')}
              </label>
            </div>
            {hasDrugAllergy && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(DRUG_ALLERGY_META) as DrugAllergyKey[]).map((key) => {
                  const selected = drugAllergyKeys.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleListKey(drugAllergyKeys, key, setDrugAllergyKeys)}
                        className={'flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ' + (
                          selected
                            ? 'border-rose-500/50 bg-rose-500/20 text-white'
                            : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs text-white">{t(`intake.drugAllergy.${key}`)}</span>
                          {selected && <Check className="h-3.5 w-3.5 text-rose-400" />}
                        </div>
                        <span className="text-[11px] text-white/60 mt-1">{t(`intake.drugAllergyHint.${key}`)}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={drugAllergyDetails}
                  onChange={(e) => setDrugAllergyDetails(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                  placeholder={t('intake.allergyDetailsPh')}
                />
              </div>
            )}

            {(report.familyG6pdResult.directives.length > 0 || report.dentalResult.directives.length > 0 || report.airwayScreenResult.directives.length > 0 || report.drugAllergyResult.directives.length > 0) && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs space-y-1.5 backdrop-blur-md">
                <div className="font-bold text-purple-300">{t('intake.historyAlerts')}</div>
                {report.familyG6pdResult.directives.map((dir, idx) => (
                  <p key={'fg' + idx} className="text-white/80">• {dir}</p>
                ))}
                {report.dentalResult.directives.map((dir, idx) => (
                  <p key={'de' + idx} className="text-white/80">• {dir}</p>
                ))}
                {report.airwayScreenResult.directives.map((dir, idx) => (
                  <p key={'aw' + idx} className="text-white/80">• {dir}</p>
                ))}
                {report.drugAllergyResult.directives.map((dir, idx) => (
                  <p key={'al' + idx} className="text-white/80">• {dir}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SMOKING & INHALATION */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Cigarette className="h-4 w-4 text-amber-400" />
              <span>{t('intake.s4Title')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.smokeStatus')}</label>
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value as SmokingStatus)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NON_SMOKER" className="bg-[#0a0a0a] text-white">{t('intake.smokeNever')}</option>
                  <option value="ACTIVE_SMOKER" className="bg-[#0a0a0a] text-white">{t('intake.smokeActive')}</option>
                  <option value="EX_SMOKER" className="bg-[#0a0a0a] text-white">{t('intake.smokeEx')}</option>
                  <option value="VAPING" className="bg-[#0a0a0a] text-white">{t('intake.smokeVape')}</option>
                  <option value="SHISHA" className="bg-[#0a0a0a] text-white">{t('intake.smokeShisha')}</option>
                </select>
              </div>

              {smokingStatus === 'ACTIVE_SMOKER' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.packYears')}</label>
                  <input
                    type="number"
                    value={packYears}
                    onChange={(e) => setPackYears(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.packYearsPh')}
                  />
                </div>
              )}

              {smokingStatus === 'EX_SMOKER' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.quitMonths')}</label>
                  <input
                    type="number"
                    value={cessationMonths}
                    onChange={(e) => setCessationMonths(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.quitMonthsPh')}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 md:col-span-2 pt-2">
                <input
                  type="checkbox"
                  id="usesVapeOrShisha"
                  checked={usesVapeOrShisha}
                  onChange={(e) => setUsesVapeOrShisha(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-200 focus:ring-0"
                />
                <label htmlFor="usesVapeOrShisha" className="text-xs text-white/80">
                  {t('intake.alsoVape')}
                </label>
              </div>
            </div>

            {/* Live Smoking Guideline Directives */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1 backdrop-blur-md">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5" />
                <span>{t('intake.defenseTitle')}</span>
              </div>
              <p className="text-white/80">{report.smokingResult.inductionEmergencePlan}</p>
            </div>
          </div>
        )}

        {/* STEP 5: CONTRACEPTIVES & HRT */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Pill className="h-4 w-4 text-pink-400" />
              <span>{t('intake.s5Title')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.contraType')}</label>
                <select
                  value={contraceptiveType}
                  onChange={(e) => setContraceptiveType(e.target.value as ContraceptiveType)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NONE" className="bg-[#0a0a0a] text-white">{t('intake.contraNone')}</option>
                  <option value="COMBINED_ORAL_PILL" className="bg-[#0a0a0a] text-white">{t('intake.contraCombined')}</option>
                  <option value="PROGESTIN_ONLY" className="bg-[#0a0a0a] text-white">{t('intake.contraProgestin')}</option>
                  <option value="PATCH_RING" className="bg-[#0a0a0a] text-white">{t('intake.contraPatch')}</option>
                  <option value="INJECTION" className="bg-[#0a0a0a] text-white">{t('intake.contraInjection')}</option>
                  <option value="IUD" className="bg-[#0a0a0a] text-white">{t('intake.contraIud')}</option>
                  <option value="HRT" className="bg-[#0a0a0a] text-white">{t('intake.contraHrt')}</option>
                </select>
              </div>

              {contraceptiveType !== 'NONE' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.drugName')}</label>
                  <input
                    type="text"
                    value={contraceptiveDrugName}
                    onChange={(e) => setContraceptiveDrugName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.drugNamePh')}
                  />
                </div>
              )}

              {contraceptiveType !== 'NONE' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">{t('intake.durationMo')}</label>
                  <input
                    type="number"
                    value={contraceptiveDurationMonths}
                    onChange={(e) => setContraceptiveDurationMonths(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder={t('intake.durationMoPh')}
                  />
                </div>
              )}
            </div>

            {/* Live Contraceptive & VTE Guidance Banner */}
            <div
              className={'rounded-xl border p-3.5 text-xs space-y-1.5 backdrop-blur-md ' + (
                report.contraceptiveResult.vteRiskFlag
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-white/15 bg-white/5 text-white/80'
              )}
            >
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-white">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>{t('intake.acogTitle')}</span>
                </span>
                <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {t('intake.capriniPts', { n: report.contraceptiveResult.capriniPoints })}
                </span>
              </div>
              <p className="text-xs text-white/90">{report.contraceptiveResult.recommendation}</p>
              <p className="text-xs font-mono text-white/60">
                {t('intake.directivesLabel', { d: report.contraceptiveResult.surgicalDirective })}
              </p>
            </div>
          </div>
        )}

        {/* STEP 6: ANTIPSYCHOTICS & PSYCHIATRIC DRUGS */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Activity className="h-4 w-4 text-purple-400" />
              <span>{t('intake.s6Title')}</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="takesPsychiatricMeds"
                checked={takesPsychiatricMeds}
                onChange={(e) => setTakesPsychiatricMeds(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-0"
              />
              <label htmlFor="takesPsychiatricMeds" className="text-xs font-bold text-white/90">
                {t('intake.takesPsych')}
              </label>
            </div>

            {takesPsychiatricMeds && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      name: 'Quetiapine (Seroquel)',
                      category: 'ATYPICAL_ANTIPSYCHOTIC' as const,
                      riskKey: 'psychRisk0',
                    },
                    {
                      name: 'Olanzapine (Zyprexa)',
                      category: 'ATYPICAL_ANTIPSYCHOTIC' as const,
                      riskKey: 'psychRisk1',
                    },
                    {
                      name: 'Haloperidol (Haldol)',
                      category: 'TYPICAL_ANTIPSYCHOTIC' as const,
                      riskKey: 'psychRisk2',
                    },
                    {
                      name: 'Risperidone (Risperdal)',
                      category: 'ATYPICAL_ANTIPSYCHOTIC' as const,
                      riskKey: 'psychRisk3',
                    },
                    {
                      name: 'Lithium (Priadel)',
                      category: 'LITHIUM' as const,
                      riskKey: 'psychRisk4',
                    },
                    {
                      name: 'Phenelzine / MAO Inhibitor',
                      category: 'MAOI' as const,
                      riskKey: 'psychRisk5',
                    },
                    {
                      name: 'SSRI / SNRI (Sertraline / Escitalopram)',
                      category: 'SSRI_SNRI' as const,
                      riskKey: 'psychRisk6',
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
                                recommendation: t(`intake.${drug.riskKey}`),
                              },
                            ]);
                          }
                        }}
                        className={'flex flex-col items-start p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ' + (
                          isSelected
                            ? 'border-purple-500/50 bg-purple-500/20 text-white'
                            : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs text-white">{drug.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                        </div>
                        <span className="text-[11px] text-white/60 mt-1">{t(`intake.${drug.riskKey}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Antipsychotic Anesthesia Directives */}
            {takesPsychiatricMeds && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs space-y-2 backdrop-blur-md">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-purple-400" />
                    <span>{t('intake.pressorTitle')}</span>
                  </span>
                  <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    {t('intake.avoidLabel', { drugs: report.antipsychoticResult.avoidDrugs.join(', ') || 'Droperidol' })}
                  </span>
                </div>
                {report.antipsychoticResult.clinicalDirectives.map((dir, idx) => (
                  <p key={idx} className="text-white/80">
                    • {dir}
                  </p>
                ))}
                <div className="pt-1 text-emerald-300 font-mono text-[11px]">
                  ✓ {t('intake.preferredPressors', { list: report.antipsychoticResult.recommendedPressors.join(', ') })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: CARDIAC & CARDIOVASCULAR */}
        {activeStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Heart className="h-4 w-4 text-rose-200" />
              <span>{t('intake.s7Title')}</span>
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasCardiacHistory"
                checked={hasCardiacHistory}
                onChange={(e) => setHasCardiacHistory(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-rose-200 focus:ring-0"
              />
              <label htmlFor="hasCardiacHistory" className="text-xs font-bold text-white/90">
                {t('intake.hasCardiac')}
              </label>
            </div>

            {hasCardiacHistory && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                  {[
                    { id: 'MYOCARDIAL_INFARCTION' as CardiacCondition },
                    { id: 'CORONARY_STENT_DES' as CardiacCondition },
                    { id: 'CORONARY_STENT_BMS' as CardiacCondition },
                    { id: 'HEART_FAILURE' as CardiacCondition },
                    { id: 'ARRHYTHMIA_AFIB' as CardiacCondition },
                    { id: 'PACEMAKER_ICD' as CardiacCondition },
                    { id: 'HYPERTENSION' as CardiacCondition },
                  ].map((item) => {
                    const isChecked = cardiacConditions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleCardiacCondition(item.id)}
                        className={'p-2.5 rounded-xl border text-xs text-left font-medium transition cursor-pointer backdrop-blur-md ' + (
                          isChecked
                            ? 'border-rose-500/60 bg-rose-500/20 text-white font-bold'
                            : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                        )}
                      >
                        {t(`intake.cardiac.${item.id}`)}
                      </button>
                    );
                  })}
                </div>

                {cardiacConditions.includes('CORONARY_STENT_DES') && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs space-y-2 backdrop-blur-md">
                    <label className="block font-bold text-rose-300">
                      {t('intake.stentTitle')}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={stentPlacementMonthsAgo}
                        onChange={(e) => setStentPlacementMonthsAgo(Number(e.target.value))}
                        className="w-24 rounded-xl border border-rose-500/30 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
                        placeholder={t('intake.monthsPh')}
                      />
                      <span className="text-white/80">
                        {stentPlacementMonthsAgo < 6
                          ? t('intake.stentHard')
                          : stentPlacementMonthsAgo < 12
                          ? t('intake.stentRisk')
                          : t('intake.stentClear')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      {t('intake.mets')}
                    </label>
                    <select
                      value={metsTolerance}
                      onChange={(e) => setMetsTolerance(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    >
                      <option value={4} className="bg-[#0a0a0a] text-white">{t('intake.metsGood')}</option>
                      <option value={2} className="bg-[#0a0a0a] text-white">{t('intake.metsBad')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      {t('intake.lvef')}
                    </label>
                    <input
                      type="number"
                      value={ejectionFraction}
                      onChange={(e) => setEjectionFraction(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                      placeholder={t('intake.lvefPh')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: NPO FASTING & COMPLETE SUMMARY */}
        {activeStep === 8 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>{t('intake.s8Title')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {t('intake.solidHours')}
                </label>
                <input
                  type="number"
                  value={lastSolidHours}
                  onChange={(e) => setLastSolidHours(Number(e.target.value))}
                  className={'w-full rounded-xl border px-3 py-2 text-xs text-white focus:outline-none backdrop-blur-md ' + (
                    lastSolidHours < 8
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      : 'border-white/15 bg-white/5'
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  {t('intake.fluidHours')}
                </label>
                <input
                  type="number"
                  value={lastFluidHours}
                  onChange={(e) => setLastFluidHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                />
              </div>
            </div>

            {/* Day-of-surgery medicine rules */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-3.5 space-y-1.5 text-xs backdrop-blur-md">
              <div className="font-bold text-white/90">{t('intake.medRules')}</div>
              <p className="text-rose-400">✕ {t('intake.noDiabetes')}</p>
              <p className="text-emerald-400">✓ {t('intake.takeThyroid')}</p>
            </div>

            {/* GLP-1 Agonist Section */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-3.5 space-y-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="takesGlp1"
                  checked={takesGlp1}
                  onChange={(e) => setTakesGlp1(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-200 focus:ring-0"
                />
                <label htmlFor="takesGlp1" className="text-xs font-bold text-white/90">
                  {t('intake.glp1Q')}
                </label>
              </div>

              {takesGlp1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">{t('intake.glp1Drug')}</label>
                    <input
                      type="text"
                      value={glp1DrugName}
                      onChange={(e) => setGlp1DrugName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none backdrop-blur-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">
                      {t('intake.glp1Hours')}
                    </label>
                    <input
                      type="number"
                      value={lastGlp1DoseHoursAgo}
                      onChange={(e) => setLastGlp1DoseHoursAgo(Number(e.target.value))}
                      className={'w-full rounded-xl border px-3 py-1.5 text-xs text-white backdrop-blur-md ' + (
                        lastGlp1DoseHoursAgo < 168
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                          : 'border-white/15 bg-white/5'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Allergies and Complications */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                {t('intake.allergiesLabel')}
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder={t('intake.allergiesPh')}
              />
            </div>

            {/* Specialist fitness consultations for major illness */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-amber-400" />
                  <span>{t('intake.fitnessTitle')}</span>
                </span>
                {report.fitnessResult.isBlocked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm">{t('intake.fitnessHold')}</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-sm">{t('intake.fitnessClear')}</span>
                )}
              </div>
              <p className="text-[11px] text-white/60">
                {t('intake.fitnessSub')}
              </p>
              {report.fitnessResult.suggested.length === 0 && (
                <p className="text-xs text-emerald-400">{t('intake.fitnessNone')}</p>
              )}
              {report.fitnessResult.suggested.map((s) => {
                const existing = (currentPatient?.fitnessReferrals || []).find((r) => r.specialty === s.specialty);
                return (
                  <div key={s.specialty} className="rounded-xl border border-white/15 bg-white/5 p-3 space-y-2 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-xs">{s.specialty}</div>
                        <div className="text-[10px] text-white/60">{s.reason}</div>
                      </div>
                      {!existing ? (
                        <button
                          type="button"
                          onClick={() => currentPatient && requestFitness(currentPatient.id, s.specialty, s.reason)}
                          className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 shadow-md min-h-[44px] sm:min-h-0"
                        >
                          {t('intake.requestFitness')}
                        </button>
                      ) : (
                        <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow-sm ' + (
                          existing.status === 'CLEARED'
                            ? 'bg-emerald-600 text-white'
                            : existing.status === 'NOT_CLEARED'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        )}>
                          {existing.status === 'CLEARED' ? t('intake.fitCleared') : existing.status === 'NOT_CLEARED' ? t('intake.fitNotCleared') : existing.status === 'RECEIVED' ? t('intake.fitReceived') : t('intake.fitRequested')}
                        </span>
                      )}
                    </div>
                    {existing && (
                      <div className="flex flex-wrap items-center gap-2">
                        {(['REQUESTED', 'RECEIVED', 'CLEARED', 'NOT_CLEARED'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => currentPatient && setFitnessStatus(currentPatient.id, existing.id, st)}
                            className={'px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ' + (
                              existing.status === st
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                            )}
                          >
                            {st === 'CLEARED' ? t('intake.fitCleared') : st === 'NOT_CLEARED' ? t('intake.fitNotCleared') : st === 'RECEIVED' ? t('intake.fitReceived') : t('intake.fitRequested')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Full Clinical Summary Output */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                  <span>{t('intake.summaryTitle')}</span>
                </span>
                <span
                  className={'px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-md ' + (
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
                  <span className="text-[11px] font-bold text-rose-400">{t('intake.hardTitle')}</span>
                  {report.hardStopFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-rose-200 bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/30 backdrop-blur-md">
                      <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Conditionals */}
              {report.conditionalFlags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-400">{t('intake.condTitle')}</span>
                  {report.conditionalFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-200 bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30 backdrop-blur-md">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Green Cleared */}
              {report.greenClearancePoints.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400">{t('intake.greenTitle')}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {report.greenClearancePoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 backdrop-blur-md">
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
      <div className="flex flex-wrap items-center justify-between border-t border-white/15 bg-white/5 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 rounded-b-2xl gap-2 min-w-0">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer backdrop-blur-md min-h-[44px]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{t('intake.previous')}</span>
        </button>

        <div className="text-[11px] sm:text-xs font-mono text-white/60 text-center px-1">
          {activeStep} / {totalSteps}
        </div>

        {activeStep < totalSteps ? (
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.min(totalSteps, prev + 1))}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-5 py-2.5 text-xs font-bold transition shadow-md cursor-pointer min-h-[44px]"
          >
            <span>{t('intake.next')}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApplyToPatientStore}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-6 py-2.5 text-xs font-bold transition shadow-lg cursor-pointer min-h-[44px]"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t('intake.completeSync')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientPreOpQuestionnaire;
