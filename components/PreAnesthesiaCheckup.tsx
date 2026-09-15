'use client';

import React, { useState, useMemo } from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import {
  ClipboardCheck,
  UserCheck,
  FileCheck2,
  ShieldCheck,
  Pill,
  AlertTriangle,
  Activity,
  Stethoscope,
  Syringe,
  Thermometer,
  HeartPulse,
  Brain,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CheckCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PreAnesthesiaCheckupProps {
  patient: PatientCase;
}

interface CheckItem {
  id: string;
  question: string;
  detail: string;
  category: string;
  critical: boolean;
}

const CHECKUP_SECTIONS = [
  {
    id: 'identity',
    title: 'Patient Identity & Consent',
    icon: <UserCheck className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => [
      {
        id: 'id-verify',
        question: 'Patient identity verified (name, DOB, MRN)?',
        detail: `MRN: ${p.mrn} — Confirm wristband matches chart and verbal confirmation obtained.`,
        category: 'identity',
        critical: true,
      },
      {
        id: 'consent',
        question: 'Written informed consent for anesthesia signed?',
        detail: 'Verify signed anesthesia consent form is in chart. Confirm patient understands risks: nausea, sore throat, nerve injury, awareness, allergic reaction.',
        category: 'identity',
        critical: true,
      },
      {
        id: 'consent-procedure',
        question: 'Surgical consent matches planned procedure?',
        detail: `Planned: ${p.procedureName} (${p.cptCode}). Verify surgeon consent matches. Confirm laterality if applicable.`,
        category: 'identity',
        critical: true,
      },
      {
        id: 'interpreter',
        question: 'Language / interpreter needs addressed?',
        detail: p.preferredLanguage === 'ar'
          ? 'Arabic-speaking patient. Interpreter may be needed for informed consent process.'
          : p.preferredLanguage === 'hi'
          ? 'Hindi-speaking patient. Confirm verbal comprehension of consent.'
          : 'English-speaking patient. Standard consent process.',
        category: 'identity',
        critical: false,
      },
    ],
  },
  {
    id: 'history',
    title: 'Medical History & Prior Anesthesia',
    icon: <FileCheck2 className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => [
      {
        id: 'prior-anesthesia',
        question: 'Prior anesthesia history reviewed?',
        detail: 'Ask: "Have you had anesthesia before? Any problems — nausea, vomiting, difficult intubation, awareness, prolonged recovery?" Document complications.',
        category: 'history',
        critical: true,
      },
      {
        id: 'family-anesthesia',
        question: 'Family history of anesthesia complications?',
        detail: 'Ask: "Does anyone in your family have problems with anesthesia? Muscle problems, high fevers, malignant hyperthermia?" MH history is critical for succinylcholine volatile agent decision.',
        category: 'history',
        critical: true,
      },
      {
        id: 'osa-screen',
        question: `STOP-Bang OSA screening assessed? (Score: ${p.stopBangScore}/8)`,
        detail: p.stopBangScore >= 3
          ? 'Moderate-to-high OSA risk. Consider post-op CPAP, avoid deep sedation, plan for difficult airway equipment.'
          : 'Low OSA risk. Standard monitoring and airway management.',
        category: 'history',
        critical: p.stopBangScore >= 3,
      },
      {
        id: 'cardiac',
        question: `Cardiac risk assessed? (RCRI: ${p.rcriClass})`,
        detail: p.rcriClass !== 'Class I (<0.4%)'
          ? 'Elevated cardiac risk. Ensure pre-op ECG on file. Consider cardiology clearance if recent change in functional status.'
          : 'Low cardiac risk. Standard perioperative cardiac monitoring.',
        category: 'history',
        critical: p.rcriClass === 'Class III (6.6%)' || p.rcriClass === 'Class IV (>11%)',
      },
      {
        id: 'smoking',
        question: 'Smoking / nicotine use status documented?',
        detail: 'Ask: "Do you smoke or use nicotine products? How much and how recently?" Cessation >12h reduces CO levels. Full cessation >8 weeks improves wound healing.',
        category: 'history',
        critical: false,
      },
      {
        id: 'pregnancy',
        question: 'Pregnancy status confirmed (if applicable)?',
        detail: p.isPregnant
          ? `Pregnant — ${p.pregnancyWeeks} weeks. obstetric anesthesia consult required. Aspiration prophylaxis mandatory.`
          : 'Female patient — confirm LMP / pregnancy test result. If childbearing age, urinalysis or β-hCG recommended.',
        category: 'history',
        critical: !!p.isPregnant,
      },
    ],
  },
  {
    id: 'airway',
    title: 'Airway & Spinal Assessment',
    icon: <Activity className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => [
      {
        id: 'mallampati',
        question: `Mallampati classification confirmed? (${p.airway.mallampati})`,
        detail: p.airway.mallampati === 'Class III' || p.airway.mallampati === 'Class IV'
          ? `${p.airway.mallampati} — Difficult airway likely. Ensure video laryngoscope, supraglottic airway, and front-of-neck access kit in room.`
          : `${p.airway.mallampati} — Standard airway expected. Direct laryngoscopy Mac 3 blade.`,
        category: 'airway',
        critical: p.airway.mallampati === 'Class III' || p.airway.mallampati === 'Class IV',
      },
      {
        id: 'mouth-opening',
        question: `Mouth opening assessed? (${p.airway.mouthOpeningCm} cm)`,
        detail: p.airway.mouthOpeningCm >= 4.0
          ? 'Adequate opening (≥3 fingerbreadths). Standard intubation approach.'
          : 'Restricted mouth opening. Consider fiberoptic intubation or video laryngoscope.',
        category: 'airway',
        critical: p.airway.mouthOpeningCm < 3.0,
      },
      {
        id: 'thyromental',
        question: `Thyromental distance measured? (${p.airway.thyromentalDistanceCm} cm)`,
        detail: p.airway.thyromentalDistanceCm >= 6.5
          ? 'Adequate thyromental distance. Adequate submandibular space for laryngoscopy.'
          : 'Short thyromental distance. Receded chin — anticipate difficult laryngoscopy.',
        category: 'airway',
        critical: p.airway.thyromentalDistanceCm < 6.0,
      },
      {
        id: 'neck-mobility',
        question: `Cervical spine mobility assessed? (${p.airway.neckMobility})`,
        detail: p.airway.neckMobility === 'Full'
          ? 'Full neck extension available. Standard positioning for intubation.'
          : 'Restricted cervical mobility. Assess for cervical spine disease. Consider video laryngoscope or fiberoptic. Do NOT force neck extension.',
        category: 'airway',
        critical: p.airway.neckMobility === 'Fusion',
      },
      {
        id: 'dentition',
        question: `Dentition assessed? (${p.airway.dentition})`,
        detail: p.airway.dentition === 'Loose Teeth' || p.airway.dentition === 'Caps/Crowns'
          ? `${p.airway.dentition} — Risk of dental damage during laryngoscopy. Warn patient. Avoid excessive force. Have dental kit available.`
          : `${p.airway.dentition} — No dental concerns for laryngoscopy.`,
        category: 'airway',
        critical: p.airway.dentition === 'Loose Teeth',
      },
      {
        id: 'npo',
        question: 'NPO status verified and documented?',
        detail: 'Confirm 8h solids / 2h minimum clears (3h preferred). If emergency, RSI with cricoid pressure consideration.',
        category: 'airway',
        critical: true,
      },
    ],
  },
  {
    id: 'medications',
    title: 'Medication Reconciliation',
    icon: <Pill className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => {
      const holdMeds = p.medications.filter(m => m.status === 'HOLD_REQUIRED');
      const hardStopMeds = p.medications.filter(m => m.status === 'HARD_STOP');
      const clearedMeds = p.medications.filter(m => m.status === 'CLEARED');

      const items: CheckItem[] = [
        {
          id: 'home-meds',
          question: 'Home medication list reviewed?',
          detail: `${p.medications.length} medications on file: ${p.medications.map(m => m.drugName.split('(')[0].trim()).join(', ')}.`,
          category: 'medications',
          critical: hardStopMeds.length > 0,
        },
        {
          id: 'holds',
          question: 'Pre-op medication holds confirmed?',
          detail: holdMeds.length > 0
            ? `Holds required: ${holdMeds.map(m => `${m.drugName.split('(')[0].trim()} (${m.requiredHoldHours}h hold)`).join(', ')}. Verify compliance.`
            : 'No mandatory medication holds pending.',
          category: 'medications',
          critical: holdMeds.length > 0,
        },
        {
          id: 'anticoagulants',
          question: 'Anticoagulant / antiplatelet hold compliance?',
          detail: hardStopMeds.length > 0
            ? `HARD STOP: ${hardStopMeds.map(m => `${m.drugName.split('(')[0].trim()} — ${m.clinicalAction}`).join('. ')}. Case cannot proceed until washout satisfied.`
            : 'No active anticoagulant washout concerns.',
          category: 'medications',
          critical: hardStopMeds.length > 0,
        },
        {
          id: 'herbal-supplements',
          question: 'Herbal supplements & OTC medications discussed?',
          detail: 'Ask: "Do you take any vitamins, herbal supplements, or over-the-counter medications? Fish oil, garlic, ginkgo, St. John\'s Wort, NSAIDs, aspirin?" Many affect coagulation and anesthesia.',
          category: 'medications',
          critical: false,
        },
        {
          id: 'glp1',
          question: 'GLP-1 RA hold window verified?',
          detail: p.medications.some(m => m.category === 'GLP1')
            ? 'GLP-1 receptor agonist detected. ASA 2023 consensus: hold weekly formulation ≥1 week, daily ≥1 day before surgery. Confirm last dose timing.'
            : 'No GLP-1 RA in current medication list.',
          category: 'medications',
          critical: false,
        },
      ];
      return items;
    },
  },
  {
    id: 'allergies',
    title: 'Allergy Verification',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => {
      const hasAnaphylaxis = p.allergies.some(a => a.severity === 'ANAPHYLAXIS');
      const hasSevere = p.allergies.some(a => a.severity === 'SEVERE');

      return [
        {
          id: 'allergy-list',
          question: `Allergy list reviewed and confirmed? (${p.allergies.length} on file)`,
          detail: p.allergies.length > 0
            ? `Documented allergies: ${p.allergies.map(a => `${a.allergen} (${a.severity} — ${a.reaction})`).join('; ')}.`
            : 'No known drug allergies (NKDA). Still confirm verbally with patient.',
          category: 'allergies',
          critical: hasAnaphylaxis || hasSevere,
        },
        {
          id: 'latex-allergy',
          question: 'Latex allergy status confirmed?',
          detail: 'Ask: "Are you allergic to latex or rubber gloves?" If yes, latex-free environment must be prepared — latex-free gloves, no rubber tourniquets, no latex catheter balloons.',
          category: 'allergies',
          critical: false,
        },
        {
          id: 'antibiotic-prophylaxis',
          question: 'Antibiotic prophylaxis plan matches allergy profile?',
          detail: p.allergies.some(a => a.allergen.includes('Penicillin') || a.allergen.includes('Sulfonamide'))
            ? 'Cross-reactivity check needed. If penicillin allergy, avoid cephalosporins (low cross-reactivity ~2%). If sulfonamide allergy, avoid sulfonamide antibiotics.'
            : 'No contraindications to standard surgical antibiotic prophylaxis.',
          category: 'allergies',
          critical: false,
        },
        {
          id: 'anaphylaxis-kit',
          question: 'Anaphylaxis kit & emergency protocol prepared?',
          detail: hasAnaphylaxis
            ? 'Anaphylaxis history present. Ensure: epinephrine 1:1000 drawn, diphenhydramine 50mg IV pre-drawn, methylprednisolone 125mg available, large-bore IV access x2.'
            : 'Standard emergency airway cart available in OR. No anaphylaxis-specific preparations required.',
          category: 'allergies',
          critical: hasAnaphylaxis,
        },
      ];
    },
  },
  {
    id: 'physical',
    title: 'Physical Examination & Vitals',
    icon: <Stethoscope className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => {
      const latestVitals = p.vitals[0];
      return [
        {
          id: 'vitals-bp',
          question: `Blood pressure assessed? (${latestVitals?.systolicBp || '—'}/${latestVitals?.diastolicBp || '—'} mmHg)`,
          detail: (latestVitals?.systolicBp ?? 0) > 140
            ? 'Elevated BP. Consider anxiolysis, reassess in holding area. If persistent >180/110, consider case delay for cardioprotection.'
            : 'Blood pressure within acceptable range for induction.',
          category: 'physical',
          critical: (latestVitals?.systolicBp ?? 0) > 180,
        },
        {
          id: 'vitals-hr',
          question: `Heart rate documented? (${latestVitals?.heartRate || '—'} bpm)`,
          detail: (latestVitals?.heartRate ?? 0) > 100
            ? 'Tachycardia detected. Assess for pain, anxiety, dehydration, or cardiac cause. Consider IV fluid bolus or beta-blocker.'
            : 'Heart rate within normal range.',
          category: 'physical',
          critical: (latestVitals?.heartRate ?? 0) > 120,
        },
        {
          id: 'vitals-spo2',
          question: `Oxygen saturation baseline? (${latestVitals?.spo2 || '—'}%)`,
          detail: (latestVitals?.spo2 ?? 100) < 95
            ? 'Suboptimal SpO2. Administer supplemental O2 via nasal cannula pre-induction. Consider pre-oxygenation optimization.'
            : 'Adequate baseline oxygen saturation.',
          category: 'physical',
          critical: (latestVitals?.spo2 ?? 100) < 92,
        },
        {
          id: 'bmi-assessment',
          question: `BMI assessment? (${p.bmi.toFixed(1)} kg/m²)`,
          detail: p.bmi >= 30
            ? `BMI ${p.bmi.toFixed(1)} — Obese. Consider: difficult mask ventilation, supraglottic airway sizing, extended monitoring, DVT prophylaxis, positioning aids.`
            : `BMI ${p.bmi.toFixed(1)} — Within normal range.`,
          category: 'physical',
          critical: p.bmi >= 40,
        },
        {
          id: 'infection',
          question: 'Active infection status?',
          detail: p.hasActiveInfection
            ? `Active infection: ${p.infectionType}. Assess severity. If systemic infection/sepsis, consider postponing elective surgery. If localized, proceed with antibiotic coverage.`
            : 'No active infection documented.',
          category: 'physical',
          critical: !!p.hasActiveInfection,
        },
        {
          id: 'temperature',
          question: `Temperature recorded? (${latestVitals?.temperatureC || '—'}°C)`,
          detail: (latestVitals?.temperatureC ?? 36.5) > 37.5
            ? 'Low-grade fever. Evaluate for infection. If >38°C, consider postponing elective surgery.'
            : 'Normal body temperature.',
          category: 'physical',
          critical: (latestVitals?.temperatureC ?? 36.5) > 38.0,
        },
      ];
    },
  },
  {
    id: 'iv-monitors',
    title: 'IV Access, Monitors & Equipment',
    icon: <Syringe className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => [
      {
        id: 'iv-access',
        question: 'IV access established and functional?',
        detail: 'Confirm IV site: size (≥18G for major surgery, ≥20G for minor), location, patency, no infiltration. Fluid running: Lactated Ringer\'s or Normal Saline.',
        category: 'iv-monitors',
        critical: true,
      },
      {
        id: 'monitors',
        question: 'ASA standard monitors applied?',
        detail: 'Verify: ECG (5-lead), NIBP, Pulse oximetry, Capnography (ETCO2), Temperature probe, Nerve stimulator (if neuromuscular block planned).',
        category: 'iv-monitors',
        critical: true,
      },
      {
        id: 'preoxygenation',
        question: 'Pre-oxygenation equipment checked?',
        detail: 'Confirm: functioning anesthesia machine, full O2 tank, ventilator self-test passed, breathing circuit checked for leaks, BVM at head of bed.',
        category: 'iv-monitors',
        critical: true,
      },
      {
        id: 'difficult-airway',
        question: 'Difficult airway equipment available?',
        detail: p.airway.riskTier === 'MODERATE' || p.airway.riskTier === 'HIGH'
          ? 'MODERATE/HIGH airway risk. Ensure: video laryngoscope (GlideScope/C-MAC), supraglottic airway (King LT / i-gel), fiberoptic scope backup, front-of-neck access kit (scalpel + tracheal hook).'
          : 'Standard airway equipment sufficient. Mac 3 blade, ETT sizes 7.0–7.5, BVM backup.',
        category: 'iv-monitors',
        critical: p.airway.riskTier === 'HIGH',
      },
      {
        id: 'blood-products',
        question: 'Blood products / cross-match available?',
        detail: p.labs.find(l => l.name.includes('Hemoglobin'))?.value !== undefined
          ? `Hgb: ${p.labs.find(l => l.name.includes('Hemoglobin'))?.value} g/dL. ${p.labs.find(l => l.name.includes('Hemoglobin'))?.value && p.labs.find(l => l.name.includes('Hemoglobin'))!.value < 10 ? 'Type & screen minimum. Consider cross-match for 2 units pRBC for high-bleed procedure.' : 'Type & screen on file. No immediate transfusion concern.'}`
          : 'Type and screen on file for reference.',
        category: 'iv-monitors',
        critical: false,
      },
    ],
  },
  {
    id: 'education',
    title: 'Patient Education & Communication',
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-white',
    items: (p: PatientCase): CheckItem[] => [
      {
        id: 'explain-plan',
        question: 'Anesthesia plan explained to patient?',
        detail: `Procedure: ${p.procedureName}. Explain type of anesthesia (GA vs regional vs MAC), expected duration, recovery time, common side effects (sore throat, nausea, dizziness).`,
        category: 'education',
        critical: true,
      },
      {
        id: 'ask-concerns',
        question: 'Patient concerns and anxiety addressed?',
        detail: 'Ask: "Do you have any concerns or questions about the anesthesia or surgery?" Address anxiety. Offer anxiolysis if needed (midazolam 1-2mg IV).',
        category: 'education',
        critical: false,
      },
      {
        id: 'postop-pain',
        question: 'Post-operative pain management plan discussed?',
        detail: 'Discuss multimodal analgesia: paracetamol, NSAID (if no contraindication), regional block, PCA if major surgery. Set realistic pain expectations.',
        category: 'education',
        critical: false,
      },
      {
        id: 'postop-nausea',
        question: 'PONV risk assessed and prophylaxis planned?',
        detail: 'Apfel score assessment (female, non-smoker, PONV/motion sickness history, post-op opioids). High risk → dexamethasone + ondansetron dual prophylaxis.',
        category: 'education',
        critical: false,
      },
      {
        id: 'discharge',
        question: 'Discharge criteria and escort plan confirmed?',
        detail: 'Patient must have responsible adult for escort home. No driving for 24h post-GA. No alcohol for 24h. Provide written post-op instructions.',
        category: 'education',
        critical: true,
      },
    ],
  },
];

const PreAnesthesiaCheckup: React.FC<PreAnesthesiaCheckupProps> = ({ patient }) => {
  const { t } = useI18n();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(CHECKUP_SECTIONS.map(s => s.id)));
  const [notes, setNotes] = useState<Record<string, string>>({});

  const sections = useMemo(() => {
    const sectionTitleMap: Record<string, string> = {
      identity: t('checkup.identityTitle'),
      history: t('checkup.historyTitle'),
      airway: t('checkup.airwayTitle'),
      cardiac: t('checkup.cardiacTitle'),
      pulmonary: t('checkup.pulmonaryTitle'),
      renal: t('checkup.renalTitle'),
      hematology: t('checkup.hematologyTitle'),
      medications: t('checkup.medicationsTitle'),
      allergies: t('checkup.allergiesTitle'),
      fasting: t('checkup.fastingTitle'),
      plan: t('checkup.planTitle'),
    };
    return CHECKUP_SECTIONS.map((s) => ({
      ...s,
      title: sectionTitleMap[s.id] || s.title,
      items: s.items(patient),
    }));
  }, [patient, t]);

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const completedItems = checkedItems.size;
  const criticalItems = sections.reduce((acc, s) => acc + s.items.filter(i => i.critical).length, 0);
  const criticalCompleted = sections.reduce(
    (acc, s) => acc + s.items.filter(i => i.critical && checkedItems.has(i.id)).length,
    0
  );
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const criticalPercent = criticalItems > 0 ? Math.round((criticalCompleted / criticalItems) * 100) : 0;

  const allCriticalDone = criticalCompleted === criticalItems;
  const allDone = completedItems === totalItems;

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markSectionComplete = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    setCheckedItems(prev => {
      const next = new Set(prev);
      section.items.forEach(item => next.add(item.id));
      return next;
    });
  };

  const markAllComplete = () => {
    const allItemIds = new Set<string>();
    sections.forEach(s => s.items.forEach(item => allItemIds.add(item.id)));
    setCheckedItems(allItemIds);
  };

  const resetAll = () => {
    setCheckedItems(new Set());
  };

  const expandAll = () => {
    setExpandedSections(new Set(CHECKUP_SECTIONS.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const getSectionProgress = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 0;
    const done = section.items.filter(i => checkedItems.has(i.id)).length;
    return Math.round((done / section.items.length) * 100);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesCategory = selectedCategory === 'all' || section.id === selectedCategory;
      const matchesSearch = !searchQuery || 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.items.some(i => i.question.toLowerCase().includes(searchQuery.toLowerCase()) || i.detail.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [sections, selectedCategory, searchQuery]);

  return (
    <section
      aria-label="Pre-anesthesia checkup"
      className="rounded-[6px] border border-white/[0.10] bg-[#0F1117] p-4 sm:p-5 shadow-none"
    >
      {/* Header & Doctor Fast Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-white" />
            <h2 className="font-serif text-lg sm:text-xl tracking-wide text-white font-bold">
              {t('checkup.title')}
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[#94A3B8]">
            {t('checkup.subtitle')} ({totalItems} {t('common.actions')} / 11 {t('tabs.domainsCount')})
          </p>
        </div>

        {/* Doctor Fast Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={markAllComplete}
            className="flex items-center gap-1.5 rounded-[4px] bg-white hover:bg-neutral-200 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-black transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
            title="1-Tap verification of all 11 core clinical checklist domains"
          >
            <Sparkles className="h-3.5 w-3.5 text-black" />
            <span>{t('checkup.markAllComplete')}</span>
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1 rounded-[4px] border border-white/[0.10] bg-[#000000] px-2.5 py-1.5 text-xs text-[#E2E8F0] hover:text-white hover:border-white/30 transition active:scale-95"
            title="Reset checklist"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t('checkup.resetAll')}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 border-l border-white/[0.08] pl-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-[3px] border border-white/[0.10] bg-[#000000] px-2 py-1 text-[10px] font-mono text-[#94A3B8] hover:text-white"
            >
              {t('checkup.expandAll')}
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-[3px] border border-white/[0.10] bg-[#000000] px-2 py-1 text-[10px] font-mono text-[#94A3B8] hover:text-white"
            >
              {t('checkup.collapseAll')}
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-white/[0.08] pl-2.5 sm:pl-3">
            <div className="text-right">
              <div className="font-mono text-[10.5px] text-[#94A3B8]">
                {t('checkup.critical')}: <span className={allCriticalDone ? 'text-white font-semibold' : 'text-[#EF4444] font-semibold'}>{criticalCompleted}/{criticalItems}</span>
              </div>
              <div className="font-mono text-[10.5px] text-[#94A3B8]">
                {t('common.status')}: <span className={allDone ? 'text-white font-semibold' : 'text-[#EF4444] font-semibold'}>{completedItems}/{totalItems}</span>
              </div>
            </div>
            <div className="relative h-9 w-9">
              <svg className="h-9 w-9 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/[0.08]" />
                <circle
                  cx="24" cy="24" r="20" fill="none" strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
                  className={`transition-all duration-500 ${allDone ? 'stroke-white' : allCriticalDone ? 'stroke-white' : 'stroke-white/40'}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10.5px] font-semibold text-white">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Quick-Jump / Category Chips (Horizontally Scrollable on Mobile) */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 rounded-[4px] px-2.5 py-1 text-[11px] font-mono transition-all ${
            selectedCategory === 'all'
              ? 'bg-white text-black font-semibold shadow-sm'
              : 'border border-white/[0.08] bg-[#000000] text-[#94A3B8] hover:text-white'
          }`}
        >
          All (11 Domains)
        </button>
        {sections.map(s => {
          const sProg = getSectionProgress(s.id);
          const isDone = sProg === 100;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedCategory(s.id)}
              className={`shrink-0 flex items-center gap-1 rounded-[4px] px-2.5 py-1 text-[11px] font-mono transition-all ${
                selectedCategory === s.id
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'border border-white/[0.08] bg-[#000000] text-[#94A3B8] hover:text-white'
              }`}
            >
              <span>{s.title.split(' ')[0]}</span>
              {isDone && <CheckCircle2 className={`h-3 w-3 ${selectedCategory === s.id ? 'text-black' : 'text-white'}`} />}
            </button>
          );
        })}
      </div>

      {/* Overall Status Banner */}
      {allDone && (
        <div className="mt-3.5 rounded-[4px] border border-white/40 bg-white/10 p-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
            <div>
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                {t('checkup.allCriticalClear')}
              </span>
              <p className="text-[11px] text-[#E2E8F0] font-sans">
                {t('checkup.doctorName')}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/40 bg-white/20 px-2.5 py-0.5 text-[10px] font-mono text-white font-bold">
            {t('common.cleared')}
          </span>
        </div>
      )}
      {!allDone && allCriticalDone && (
        <div className="mt-3.5 rounded-[4px] border border-red-500/40 bg-red-950/20 p-3 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-[#EF4444] shrink-0" />
          <div>
            <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-wider">
              {t('checkup.criticalVerified')}
            </span>
            <p className="text-[11px] text-[#E2E8F0] font-sans">
              {criticalItems}/{criticalItems} {t('checkup.criticalVerified')}. {totalItems - completedItems} optional checks remaining.
            </p>
          </div>
        </div>
      )}
      {!allCriticalDone && (
        <div className="mt-3.5 rounded-[4px] border border-red-500/40 bg-red-950/20 p-3 flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0" />
          <div>
            <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-wider">
              {criticalItems - criticalCompleted} {t('checkup.criticalPending')}
            </span>
            <p className="text-[11px] text-[#E2E8F0] font-sans">
              Complete critical checks before final surgical clearance sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="mt-4 space-y-2.5">
        {filteredSections.map(section => {
          const isExpanded = expandedSections.has(section.id);
          const sectionProgress = getSectionProgress(section.id);
          const sectionComplete = sectionProgress === 100;

          return (
            <div
              key={section.id}
              className={`rounded-[5px] border transition-colors ${
                sectionComplete
                  ? 'border-white/40 bg-[#000000]'
                  : 'border-white/[0.10] bg-[#000000]'
              }`}
            >
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.99] rounded-[4px]"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[#EF4444] transition-transform duration-200">{section.icon}</span>
                  <div>
                    <span className="font-sans text-xs font-medium text-white">{section.title}</span>
                    <span className="ml-2 font-mono text-[10px] text-[#94A3B8]">
                      {section.items.filter(i => checkedItems.has(i.id)).length}/{section.items.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {/* Mini progress bar */}
                  <div className="h-1 w-14 overflow-hidden rounded-full bg-white/[0.10]">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${sectionComplete ? 'bg-white' : 'bg-white/40'}`}
                      style={{ width: `${sectionProgress}%` }}
                    />
                  </div>
                  {sectionComplete && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white animate-scale-in" />
                  )}
                  {!sectionComplete && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); markSectionComplete(section.id); }}
                      className="rounded-[3px] border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white hover:border-white/50 hover:bg-white/10 active:scale-95 transition-all duration-150 cursor-pointer"
                      title={t('checkup.markDomainComplete')}
                    >
                      {t('checkup.markDomainComplete')}
                    </button>
                  )}
                  <span className="transition-transform duration-200">
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-[#94A3B8]" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                    )}
                  </span>
                </div>
              </button>

              {/* Section Items */}
              {isExpanded && (
                <div className="space-y-1.5 px-3 pb-3 pt-1 border-t border-white/[0.06] animate-slide-down">
                  {section.items.map(item => {
                    const isChecked = checkedItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2.5 rounded-[4px] p-2.5 transition-all duration-200 ${
                          isChecked
                            ? 'bg-white/[0.02] border border-white/[0.04] opacity-75'
                            : item.critical
                            ? 'bg-red-950/20 border border-red-500/30 hover:border-red-500/50'
                            : 'bg-[#0F1117] border border-white/[0.08] hover:border-white/[0.14]'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-all duration-150 active:scale-90 cursor-pointer ${
                            isChecked
                              ? 'border-white bg-white'
                              : item.critical
                              ? 'border-[#EF4444] bg-transparent hover:border-[#FCA5A5]'
                              : 'border-white/[0.25] bg-transparent hover:border-[#DC2626]'
                          }`}
                          aria-label={`${isChecked ? 'Uncheck' : 'Check'}: ${item.question}`}
                          aria-checked={isChecked}
                          role="checkbox"
                        >
                          {isChecked && <CheckCircle2 className="h-2.5 w-2.5 text-black animate-scale-in" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-sans text-xs transition-all duration-200 ${isChecked ? 'text-[#64748B] line-through' : 'text-white font-medium'}`}>
                              {item.question}
                            </span>
                            {item.critical && !isChecked && (
                              <span className="rounded-[2px] border border-red-500/40 bg-red-950/40 px-1 py-0.2 text-[9px] font-mono font-bold text-red-300 uppercase animate-pulse-slow">
                                {t('checkup.critical')}
                              </span>
                            )}
                            {item.critical && isChecked && (
                              <span className="rounded-[2px] border border-white/40 bg-white/10 px-1 py-0.2 text-[9px] font-mono font-medium text-white uppercase animate-scale-in">
                                {t('checkup.verified')}
                              </span>
                            )}
                          </div>
                          <p className={`mt-0.5 text-[10.5px] font-sans leading-relaxed transition-colors duration-200 ${isChecked ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                            {item.detail}
                          </p>
                          {/* Notes */}
                          <div className="mt-1.5">
                            <input
                              type="text"
                              placeholder={t('checkup.addNote')}
                              value={notes[item.id] || ''}
                              onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="w-full rounded-[3px] border border-white/[0.08] bg-[#000000] px-2.5 py-1 text-[10.5px] font-sans text-white placeholder-[#64748B] focus:border-[#DC2626] focus:outline-none transition-all duration-150"
                              aria-label={`Clinical note for ${item.question}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10.5px] font-mono text-[#94A3B8]">
        <span>{t('checkup.title')} · {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <span className={allDone ? 'text-white font-bold' : 'text-[#94A3B8]'}>
          {allDone ? `✓ ${t('checkup.domainComplete')}` : `${totalItems - completedItems} ${t('common.actions')} remaining`}
        </span>
      </div>
    </section>
  );
};

export default React.memo(PreAnesthesiaCheckup);
