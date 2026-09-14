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
  const { locale, setLocale } = useI18n();
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
      isNpoFastingAdequate: lastSolidHours >= 8 && lastFluidHours >= 3,
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
      className="w-full max-w-5xl mx-auto bg-[#0a1e36]/80 text-white rounded-2xl border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden"
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
                Pre-Operative Medical Intake & Risk Assessment
              </h2>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-300 border border-white/20 shrink-0">
                Self-Assessment
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/60 truncate">
              Captures contraceptive VTE risks, medications, smoking, cardiac & NPO status
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
                { code: 'ar', label: 'العربية' },
                { code: 'hi', label: 'हिन्दी' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLocale(lang.code as Locale)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition min-h-[38px] flex items-center justify-center cursor-pointer ${
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
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <a
            href={
              'https://wa.me/?text=' +
              encodeURIComponent(
                'Hello ' +
                  patientName +
                  ', please complete your Veracity Pre-Operative Clearance Questionnaire for ' +
                  procedureName +
                  ': ' +
                  (typeof window !== 'undefined' ? window.location.origin : '') +
                  '?view=intake'
              )
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold transition cursor-pointer shadow-md min-h-[44px]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Send WhatsApp</span>
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
              <span className="text-white">PAC Live Decision:</span>
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
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition shadow cursor-pointer min-h-[38px]"
        >
          {isSavedSuccess ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isSavedSuccess ? 'Synced to Active Case!' : 'Apply to Active Case'}</span>
        </button>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-white/15 bg-white/5 px-3 sm:px-6 py-2.5 gap-2 text-xs backdrop-blur-md scrollbar-none">
        {[
          { step: 1, label: 'Demographics', icon: User },
          { step: 2, label: 'Medical Issues', icon: ClipboardList },
          { step: 3, label: 'Surgery & Anesthesia', icon: History },
          { step: 4, label: 'Smoking & Vaping', icon: Cigarette },
          { step: 5, label: 'Contraceptives & HRT', icon: Pill },
          { step: 6, label: 'Psych & Neuro', icon: Activity },
          { step: 7, label: 'Cardiac & Stents', icon: Heart },
          { step: 8, label: 'NPO & Summary', icon: Clock },
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
              <span>Patient Identification & Scheduled Procedure</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Full Legal Name
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
                  Emirates ID / MRN
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
                  Age & Biological Gender
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-24 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
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
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                  >
                    <option value="F" className="bg-black text-white">
                      Female
                    </option>
                    <option value="M" className="bg-black text-white">
                      Male
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Scheduled Surgical Procedure
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
              <span>Any medical issues?</span>
            </h3>
            <p className="text-xs text-white/60">
              Tick all conditions the patient has now or had recently — cold, cough, fever, asthma,
              breathing infection, diabetes, blood pressure, heart, liver, kidney.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(MEDICAL_ISSUES_META) as MedicalIssueKey[]).map((key) => {
                const meta = MEDICAL_ISSUES_META[key];
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
                      <span className="font-bold text-xs text-white">{meta.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{meta.hint}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Notes on medical issues (optional)
              </label>
              <input
                type="text"
                value={medicalIssueNotes}
                onChange={(e) => setMedicalIssueNotes(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder="e.g. Fever 2 days ago, BP tablets daily"
              />
            </div>

            {report.medicalResult.directives.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-xs space-y-1.5 backdrop-blur-md">
                <div className="font-bold text-amber-300">What this means for surgery:</div>
                {report.medicalResult.directives.map((dir, idx) => (
                  <p key={idx} className="text-white/80">
                    • {dir}
                  </p>
                ))}
              </div>
            )}

            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pt-2 font-serif">
              <Pill className="h-4 w-4 text-emerald-400" />
              <span>Current daily medications</span>
            </h3>
            <p className="text-xs text-white/60">
              BP, diabetes, thyroid, anxiety, contraceptive pills, weight-reduction (Mounjaro,
              Wegovy) — tick all the patient takes every day.
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
                    <span className="text-[11px] text-white/60 mt-1">{preset.hint}</span>
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
                placeholder="Other medicine name (e.g. Thyroxine 50mcg)"
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
                    BP
                  </option>
                  <option value="DIABETES" className="bg-black text-white">
                    Diabetes
                  </option>
                  <option value="THYROID" className="bg-black text-white">
                    Thyroid
                  </option>
                  <option value="ANXIETY" className="bg-black text-white">
                    Anxiety
                  </option>
                  <option value="CONTRACEPTIVE" className="bg-black text-white">
                    Contraceptive
                  </option>
                  <option value="WEIGHT_LOSS" className="bg-black text-white">
                    Weight-loss
                  </option>
                  <option value="OTHER">Other</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    addCurrentMed(newMedName, newMedCategory);
                    setNewMedName('');
                  }}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {currentMedications.length > 0 && (
              <div className="space-y-1.5">
                {currentMedications.map((med) => (
                  <div
                    key={med.name}
                    className="rounded-xl border border-white/15 bg-white/5 p-2.5 flex items-center justify-between backdrop-blur-md"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{med.name}</div>
                      <div className="text-[10px] text-white/50">{med.category.replace('_', ' ')}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentMedications(currentMedications.filter((m) => m.name !== med.name))
                      }
                      className="p-1.5 text-white/50 hover:text-rose-400 transition cursor-pointer"
                      aria-label={`Remove ${med.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">
                Medication notes (optional)
              </label>
              <input
                type="text"
                value={currentMedNotes}
                onChange={(e) => setCurrentMedNotes(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder="e.g. Takes insulin morning + night"
              />
            </div>

            {report.currentMedsResult.directives.length > 0 && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-1.5 backdrop-blur-md">
                <div className="font-bold text-emerald-300">
                  Day-of-surgery plan for these medicines:
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
              <span>Previous surgery, anesthesia, teeth & airway history</span>
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
                Patient had surgery before
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
                          Complications: {s.complications}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviousSurgeries(previousSurgeries.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-white/50 hover:text-rose-400 transition cursor-pointer"
                      aria-label="Remove surgery"
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
                    placeholder="Surgery (e.g. Appendix removal)"
                  />
                  <input
                    type="number"
                    value={newSurgeryYear}
                    onChange={(e) => setNewSurgeryYear(e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder="Year"
                  />
                  <input
                    type="text"
                    value={newSurgeryComplications}
                    onChange={(e) => setNewSurgeryComplications(e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder="Any problem? (optional)"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPreviousSurgery}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add surgery</span>
                </button>
              </div>
            )}

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">Anesthesia problems in family</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(FAMILY_ANESTHESIA_META) as FamilyAnesthesiaIssueKey[]).map((key) => {
                const meta = FAMILY_ANESTHESIA_META[key];
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
                      <span className="font-bold text-xs text-white">{meta.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{meta.hint}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={familyAnesthesiaNotes}
              onChange={(e) => setFamilyAnesthesiaNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
              placeholder="Family anesthesia notes (optional)"
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
                  Patient has G6PD deficiency (favism)
                </label>
              </div>
              {hasG6pd && (
                <input
                  type="text"
                  value={g6pdDetails}
                  onChange={(e) => setG6pdDetails(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                  placeholder="Details (e.g. diagnosed age 6, prior hemolysis)"
                />
              )}
            </div>

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">Teeth — dentures, veneers, braces, loose tooth</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(DENTAL_META) as DentalIssueKey[]).map((key) => {
                const meta = DENTAL_META[key];
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
                      <span className="font-bold text-xs text-white">{meta.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <span className="text-[11px] text-white/60 mt-1">{meta.hint}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={dentalNotes}
              onChange={(e) => setDentalNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
              placeholder="Teeth notes — which tooth is loose? (optional)"
            />

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">Neck movement & mouth opening</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Neck movement</label>
                <select
                  value={neckMovement}
                  onChange={(e) => setNeckMovement(e.target.value as typeof neckMovement)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NORMAL" className="bg-[#0a0a0a] text-white">Normal — full movement</option>
                  <option value="STIFF" className="bg-[#0a0a0a] text-white">Stiff — hard to bend/turn</option>
                  <option value="VERY_LIMITED" className="bg-[#0a0a0a] text-white">Very limited movement</option>
                  <option value="FUSION" className="bg-[#0a0a0a] text-white">Fused / fixed neck (rod or disease)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Mouth opening</label>
                <select
                  value={mouthOpening}
                  onChange={(e) => setMouthOpening(e.target.value as typeof mouthOpening)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NORMAL_3FINGERS" className="bg-[#0a0a0a] text-white">Wide — 3 fingers fit</option>
                  <option value="LIMITED_2FINGERS" className="bg-[#0a0a0a] text-white">Limited — only 2 fingers fit</option>
                  <option value="VERY_LIMITED_1FINGER" className="bg-[#0a0a0a] text-white">Very small — only 1 finger fits</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              value={airwayScreenNotes}
              onChange={(e) => setAirwayScreenNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
              placeholder="Neck/mouth notes (optional)"
            />

            <h4 className="text-xs font-bold text-white/90 uppercase tracking-wider">Allergy to any medication</h4>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasDrugAllergy"
                checked={hasDrugAllergy}
                onChange={(e) => setHasDrugAllergy(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-rose-200 focus:ring-0"
              />
              <label htmlFor="hasDrugAllergy" className="text-xs font-bold text-white/90">
                Patient is allergic to a medicine
              </label>
            </div>
            {hasDrugAllergy && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(DRUG_ALLERGY_META) as DrugAllergyKey[]).map((key) => {
                    const meta = DRUG_ALLERGY_META[key];
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
                          <span className="font-bold text-xs text-white">{meta.label}</span>
                          {selected && <Check className="h-3.5 w-3.5 text-rose-400" />}
                        </div>
                        <span className="text-[11px] text-white/60 mt-1">{meta.hint}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={drugAllergyDetails}
                  onChange={(e) => setDrugAllergyDetails(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                  placeholder="What happens? e.g. rash, swelling, breathing trouble, anaphylaxis"
                />
              </div>
            )}

            {(report.familyG6pdResult.directives.length > 0 || report.dentalResult.directives.length > 0 || report.airwayScreenResult.directives.length > 0 || report.drugAllergyResult.directives.length > 0) && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs space-y-1.5 backdrop-blur-md">
                <div className="font-bold text-purple-300">History alerts for the anesthesiologist:</div>
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
              <span>Smoking, Vaping & Airway Hyperreactivity History</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Primary Smoking Status</label>
                <select
                  value={smokingStatus}
                  onChange={(e) => setSmokingStatus(e.target.value as SmokingStatus)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NON_SMOKER" className="bg-[#0a0a0a] text-white">Never Smoked (Non-Smoker)</option>
                  <option value="ACTIVE_SMOKER" className="bg-[#0a0a0a] text-white">Active Smoker (Daily / Intermittent)</option>
                  <option value="EX_SMOKER" className="bg-[#0a0a0a] text-white">Former Smoker (Quit)</option>
                  <option value="VAPING" className="bg-[#0a0a0a] text-white">Vaping / E-Cigarettes Only</option>
                  <option value="SHISHA" className="bg-[#0a0a0a] text-white">Shisha / Hookah Smoker</option>
                </select>
              </div>

              {smokingStatus === 'ACTIVE_SMOKER' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Pack-Years (Packs/Day × Years)</label>
                  <input
                    type="number"
                    value={packYears}
                    onChange={(e) => setPackYears(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder="e.g. 15"
                  />
                </div>
              )}

              {smokingStatus === 'EX_SMOKER' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Months Since Quitting</label>
                  <input
                    type="number"
                    value={cessationMonths}
                    onChange={(e) => setCessationMonths(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
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
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-200 focus:ring-0"
                />
                <label htmlFor="usesVapeOrShisha" className="text-xs text-white/80">
                  Also uses E-Cigarettes / Vapes, Heated Tobacco (IQOS), or Medwakh / Shisha
                </label>
              </div>
            </div>

            {/* Live Smoking Guideline Directives */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1 backdrop-blur-md">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5" />
                <span>Anesthesia Airway Defense Recommendation:</span>
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
              <span>Contraceptive Pills, Estrogen HRT & VTE Risk Shield</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Hormonal Contraceptive / HRT Type</label>
                <select
                  value={contraceptiveType}
                  onChange={(e) => setContraceptiveType(e.target.value as ContraceptiveType)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                >
                  <option value="NONE" className="bg-[#0a0a0a] text-white">None / Not taking hormonal therapy</option>
                  <option value="COMBINED_ORAL_PILL" className="bg-[#0a0a0a] text-white">Combined Oral Contraceptive (Estrogen + Progestin)</option>
                  <option value="PROGESTIN_ONLY" className="bg-[#0a0a0a] text-white">Progestin-Only Pill (Mini-Pill)</option>
                  <option value="PATCH_RING" className="bg-[#0a0a0a] text-white">Contraceptive Patch / NuvaRing (Estrogen-containing)</option>
                  <option value="INJECTION" className="bg-[#0a0a0a] text-white">Depo-Provera Injection</option>
                  <option value="IUD" className="bg-[#0a0a0a] text-white">Intrauterine Device (Mirena / Kyleena / Copper)</option>
                  <option value="HRT" className="bg-[#0a0a0a] text-white">Hormone Replacement Therapy (Post-Menopausal Estrogen)</option>
                </select>
              </div>

              {contraceptiveType !== 'NONE' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Medication Name / Brand</label>
                  <input
                    type="text"
                    value={contraceptiveDrugName}
                    onChange={(e) => setContraceptiveDrugName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder="e.g. Yasmin, Marvelon, Diane-35"
                  />
                </div>
              )}

              {contraceptiveType !== 'NONE' && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Duration of Use (Months)</label>
                  <input
                    type="number"
                    value={contraceptiveDurationMonths}
                    onChange={(e) => setContraceptiveDurationMonths(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    placeholder="Months"
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
                  <span>ACOG / ASRA Perioperative Contraceptive Guideline:</span>
                </span>
                <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Caprini VTE Points: +{report.contraceptiveResult.capriniPoints}
                </span>
              </div>
              <p className="text-xs text-white/90">{report.contraceptiveResult.recommendation}</p>
              <p className="text-xs font-mono text-white/60">
                Directives: {report.contraceptiveResult.surgicalDirective}
              </p>
            </div>
          </div>
        )}

        {/* STEP 6: ANTIPSYCHOTICS & PSYCHIATRIC DRUGS */}
        {activeStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Activity className="h-4 w-4 text-purple-400" />
              <span>Psychiatric, Antipsychotic & Psychotropic Medication Screening</span>
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
                        <span className="text-[11px] text-white/60 mt-1">{drug.risk}</span>
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
                    <span>Anesthesia Pressor & Drug Safety Warnings:</span>
                  </span>
                  <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    Avoid: {report.antipsychoticResult.avoidDrugs.join(', ') || 'Droperidol'}
                  </span>
                </div>
                {report.antipsychoticResult.clinicalDirectives.map((dir, idx) => (
                  <p key={idx} className="text-white/80">
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

        {/* STEP 7: CARDIAC & CARDIOVASCULAR */}
        {activeStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-serif italic">
              <Heart className="h-4 w-4 text-rose-200" />
              <span>Cardiovascular Disease, Stents & Functional Capacity</span>
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
                        className={'p-2.5 rounded-xl border text-xs text-left font-medium transition cursor-pointer backdrop-blur-md ' + (
                          isChecked
                            ? 'border-rose-500/60 bg-rose-500/20 text-white font-bold'
                            : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {cardiacConditions.includes('CORONARY_STENT_DES') && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs space-y-2 backdrop-blur-md">
                    <label className="block font-bold text-rose-300">
                      Months Since Drug-Eluting Stent (DES) Implantation:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={stentPlacementMonthsAgo}
                        onChange={(e) => setStentPlacementMonthsAgo(Number(e.target.value))}
                        className="w-24 rounded-xl border border-rose-500/30 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="Months"
                      />
                      <span className="text-white/80">
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
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Functional Capacity (METs)
                    </label>
                    <select
                      value={metsTolerance}
                      onChange={(e) => setMetsTolerance(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                    >
                      <option value={4} className="bg-[#0a0a0a] text-white">≥ 4 METs (Can climb 2 flights of stairs without stopping)</option>
                      <option value={2} className="bg-[#0a0a0a] text-white">&lt; 4 METs (Short of breath with light household walking)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/70 mb-1">
                      Left Ventricular Ejection Fraction (LVEF %)
                    </label>
                    <input
                      type="number"
                      value={ejectionFraction}
                      onChange={(e) => setEjectionFraction(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                      placeholder="e.g. 55"
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
              <span>8-Hour NPO Fasting, GLP-1 Holds & Clearance Attestation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Hours Since Last Solid Food (Target ≥ 8h)
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
                  Hours Since Last Clear Liquids (Target ≥ 3h)
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
              <div className="font-bold text-white/90">Day-of-surgery medicine rules:</div>
              <p className="text-rose-400">✕ Do NOT take any diabetes medicine on the morning of surgery (tablets + insulin).</p>
              <p className="text-emerald-400">✓ TAKE thyroid medicine on the morning of surgery with a sip of water.</p>
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
                  Patient takes GLP-1 Agonist (Ozempic, Wegovy, Mounjaro, Tirzepatide, Trulicity)
                </label>
              </div>

              {takesGlp1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">GLP-1 Drug</label>
                    <input
                      type="text"
                      value={glp1DrugName}
                      onChange={(e) => setGlp1DrugName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none backdrop-blur-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">
                      Hours Since Last Dose (Weekly = 168h target)
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
                Documented Drug & Food Allergies
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none backdrop-blur-md"
                placeholder="e.g. Penicillin, Latex, Contrast Dye"
              />
            </div>

            {/* Specialist fitness consultations for major illness */}
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-amber-400" />
                  <span>Doctor fitness for major illness</span>
                </span>
                {report.fitnessResult.isBlocked ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-sm">HOLD — fitness pending</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-sm">No pending fitness</span>
                )}
              </div>
              <p className="text-[11px] text-white/60">
                For major illness the patient must bring fitness from their own concerned doctor. Surgery stays on hold until each referral is marked Cleared.
              </p>
              {report.fitnessResult.suggested.length === 0 && (
                <p className="text-xs text-emerald-400">No major illness detected — no outside fitness needed.</p>
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
                          className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 shadow-md"
                        >
                          Request fitness
                        </button>
                      ) : (
                        <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow-sm ' + (
                          existing.status === 'CLEARED'
                            ? 'bg-emerald-600 text-white'
                            : existing.status === 'NOT_CLEARED'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                        )}>
                          {existing.status.replace('_', ' ')}
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
                            {st.replace('_', ' ')}
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
                  <span>PAC Pre-Operative Risk Assessment Summary</span>
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
                  <span className="text-[11px] font-bold text-rose-400">Critical Surgical Contraindications:</span>
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
                  <span className="text-[11px] font-bold text-amber-400">Pre-Anesthesia Directives & Optimization:</span>
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
                  <span className="text-[11px] font-bold text-emerald-400">Cleared Clinical Systems:</span>
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
      <div className="flex items-center justify-between border-t border-white/15 bg-white/5 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 rounded-b-2xl gap-2">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer backdrop-blur-md min-h-[44px]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
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
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApplyToPatientStore}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 sm:px-6 py-2.5 text-xs font-bold transition shadow-lg cursor-pointer min-h-[44px]"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Complete & Sync</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientPreOpQuestionnaire;
