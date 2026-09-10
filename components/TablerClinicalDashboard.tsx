/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { usePatientStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { checkDrugInteractions } from '@/lib/rules-engine';
import { PatientCase } from '@/lib/types';
import TrafficLightBanner from '@/components/TrafficLightBanner';
import CountdownTimers from '@/components/CountdownTimers';
import LabAuditTable from '@/components/LabAuditTable';
import AirwaySpineModule from '@/components/AirwaySpineModule';
import { AllergyCard } from '@/components/AllergyCard';
import { SurgeryCountdown } from '@/components/SurgeryCountdown';
import { DrugInteractionAlert } from '@/components/DrugInteractionAlert';
import { ClinicalNotes } from '@/components/ClinicalNotes';
import { FHIRExport } from '@/components/FHIRExport';
import NeuraxialFeasibility from '@/components/NeuraxialFeasibility';
import SerologyBloodBank from '@/components/SerologyBloodBank';
import PreOpAnemiaOptimizer from '@/components/PreOpAnemiaOptimizer';
import PRBCTransfusionPredictor from '@/components/PRBCTransfusionPredictor';
import ASCEvaluator from '@/components/ASCEvaluator';
import PostOpRiskCalculator from '@/components/PostOpRiskCalculator';
import MorningMedDirectives from '@/components/MorningMedDirectives';
import PenicillinDelabeling from '@/components/PenicillinDelabeling';
import ERASTimeline from '@/components/ERASTimeline';
import ORReadinessKanban from '@/components/ORReadinessKanban';
import BiomarkerSafetyCutoffs from '@/components/BiomarkerSafetyCutoffs';
import FishboneViewer from '@/components/FishboneViewer';
import OTDelayPreventionHub from '@/components/OTDelayPreventionHub';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';

import {
  Activity,
  Droplets,
  ClipboardCheck,
  Stethoscope,
  Users,
  Search,
  Plus,
  Share2,
  Printer,
  FileCheck2,
  Clock,
  Pill,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Bell,
  FileText,
  ShieldCheck,
  History,
  Flame,
  Award,
  Maximize2,
  Minimize2,
  X,
  Sun,
  Moon,
  Lock,
  ExternalLink,
  Utensils,
} from 'lucide-react';

export type DashboardNavTab =
  | 'dashboard'
  | 'blood-labs'
  | 'questionnaire'
  | 'regional'
  | 'ot-defense'
  | 'notes'
  | 'patients';

export interface TablerClinicalDashboardProps {
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp: () => void;
  onOpenAuditDrawer: () => void;
}

export const TablerClinicalDashboard: React.FC<TablerClinicalDashboardProps> = ({
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  onOpenAuditDrawer,
}) => {
  const { t } = useI18n();
  const {
    patients,
    selectedLabId,
    getCurrentPatient,
    getSelectedLab,
    getCurrentAttestation,
    selectPatient,
    selectLab,
    updateAirway,
    toggleProvenanceDrawer,
    setFitnessStatus,
  } = usePatientStore();

  const [activeNav, setActiveNav] = useState<DashboardNavTab>('dashboard');
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'GREEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showAllMeds, setShowAllMeds] = useState(false);

  const currentPatient = getCurrentPatient();
  const selectedLab = getSelectedLab();
  const currentAttestation = getCurrentAttestation();

  // Theme support
  useEffect(() => {
    try {
      setIsDark(document.documentElement.classList.contains('dark'));
    } catch {
      /* non-DOM environment */
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('veracity-theme', next ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  };

  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const drugInteractions = useMemo(
    () => (currentPatient?.medications ? checkDrugInteractions(currentPatient.medications) : []),
    [currentPatient?.medications]
  );

  // Red-first roster: STOP cases surface before CONDITIONAL and CLEARED.
  const STATUS_RANK: Record<string, number> = { RED_HARD_STOP: 0, AMBER_CONDITIONAL: 1, GREEN_CLEARED: 2 };
  const sortByStatus = useCallback(
    (list: PatientCase[]) =>
      [...list].sort((a, b) => (STATUS_RANK[a.overallStatus] ?? 9) - (STATUS_RANK[b.overallStatus] ?? 9)),
    []
  );

  const rosterPatients = useMemo(() => sortByStatus(patients), [patients, sortByStatus]);

  const filteredPatients = useMemo(() => {
    return sortByStatus(
      patients.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.procedureName.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (patientFilter === 'RED') return p.overallStatus === 'RED_HARD_STOP';
        if (patientFilter === 'AMBER') return p.overallStatus === 'AMBER_CONDITIONAL';
        if (patientFilter === 'GREEN') return p.overallStatus === 'GREEN_CLEARED';
        return true;
      })
    );
  }, [patients, searchQuery, patientFilter, sortByStatus]);

  const redCount = patients.filter((p) => p.overallStatus === 'RED_HARD_STOP').length;
  const amberCount = patients.filter((p) => p.overallStatus === 'AMBER_CONDITIONAL').length;
  const greenCount = patients.filter((p) => p.overallStatus === 'GREEN_CLEARED').length;

  // Active notifications count and items
  const notifications = useMemo(() => {
    const list = [
      {
        id: 'notif-1',
        title: 'GLP-1 168h Hold Verified',
        patient: 'Fatima Al-Mansoor',
        detail: 'Semaglutide withheld 180h prior (Cutoff: 168h satisfied)',
        type: 'CLEARED',
        time: '10m ago',
      },
      {
        id: 'notif-2',
        title: 'Blood Bank Crossmatch Valid',
        patient: 'Aisha Al-Nuaimi',
        detail: '2 Units PRBC crossmatched and reserved at Al Garhoud Blood Bank',
        type: 'CLEARED',
        time: '25m ago',
      },
      {
        id: 'notif-3',
        title: 'ACEi Hold Advisory',
        patient: 'Fatima Al-Mansoor',
        detail: 'Lisinopril morning dose held to prevent vasoplegia & refractory hypotension',
        type: 'CONDITIONAL',
        time: '45m ago',
      },
    ];

    if (redCount > 0) {
      const redPatient = patients.find((p) => p.overallStatus === 'RED_HARD_STOP');
      if (redPatient) {
        list.unshift({
          id: 'notif-red',
          title: 'HARD STOP: Active Washout Inadequate',
          patient: redPatient.name,
          detail: redPatient.primaryActionDirective || 'DOAC hold requirement violated',
          type: 'HARD_STOP',
          time: 'Just now',
        });
      }
    }
    return list;
  }, [patients, redCount]);

  // Dynamic Lab extraction helper for current patient
  const patientLabs = currentPatient?.labs || [];

  const kLab = patientLabs.find(
    (l) => l.loinc === '2823-3' || l.name.toLowerCase().includes('potassium') || l.name.includes('K+')
  );
  const hbLab = patientLabs.find(
    (l) =>
      l.loinc === '718-7' ||
      l.name.toLowerCase().includes('hemoglobin') ||
      l.name.toLowerCase().includes('hgb') ||
      l.name.toLowerCase().includes('hb')
  );
  const pltLab = patientLabs.find(
    (l) =>
      l.loinc === '777-3' ||
      l.name.toLowerCase().includes('platelet') ||
      l.name.toLowerCase().includes('plt')
  );
  const inrLab = patientLabs.find(
    (l) =>
      l.loinc === '6301-6' ||
      l.name.toLowerCase().includes('inr') ||
      l.name.toLowerCase().includes('prothrombin')
  );
  const crLab = patientLabs.find(
    (l) =>
      l.loinc === '2160-0' ||
      l.name.toLowerCase().includes('creatinine') ||
      l.name.toLowerCase().includes('cr')
  );

  // Dynamic Vitals
  const latestVitals = currentPatient?.vitals?.[0] || {
    systolicBp: 124,
    diastolicBp: 78,
    heartRate: 68,
    spo2: 99,
    temperatureC: 36.8,
    respiratoryRate: 14,
  };
  const meanArterialPressure = Math.round(
    (2 * latestVitals.diastolicBp + latestVitals.systolicBp) / 3
  );

  // Active Hold Clocks Count
  const activeHoldCount = useMemo(() => {
    let count = 0;
    patients.forEach((p) => {
      p.medications.forEach((m) => {
        if (m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP') {
          count++;
        }
      });
    });
    return count;
  }, [patients]);

  if (!currentPatient) {
    return null;
  }

  return (
    <div className="console-canvas min-h-screen text-white/90 font-sans selection:bg-sky-500 selection:text-white p-3 sm:p-6 lg:p-8">
      {/* Outer Shell: premium lifted console card over gradient canvas */}
      <div className="console-shell max-w-[1560px] mx-auto rounded-3xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[960px]">
          {/* Tabler Slim Icon Rail (76px) */}
          <aside
            className="glass-strong hidden md:flex w-[76px] shrink-0 flex-col items-center justify-between border-r border-white/20 z-30 py-4"
            aria-label="Clinical sections"
          >
            <div className="flex flex-col items-center gap-5 w-full px-2">
              {/* Brand Mark — back to site */}
              <a
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white font-serif italic text-xl font-bold shadow-md shadow-sky-600/20"
                title="Back to Veracity home"
                aria-label="Back to Veracity home"
              >
                V
              </a>

              {/* Rail Navigation */}
              <nav className="flex flex-col items-center gap-1.5 w-full" aria-label="Dashboard sections">
                {(
                  [
                    { id: 'dashboard', label: 'Dashboard', icon: Activity },
                    { id: 'blood-labs', label: 'Blood Labs', icon: Droplets },
                    { id: 'questionnaire', label: 'Intake', icon: ClipboardCheck },
                    { id: 'regional', label: 'Regional', icon: Stethoscope },
                    { id: 'ot-defense', label: 'Defense', icon: Clock },
                    { id: 'patients', label: 'Roster', icon: Users },
                    { id: 'notes', label: 'Notes', icon: FileText },
                  ] as const
                ).map((item) => {
                  const isActive = activeNav === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`console-rail-btn group relative flex flex-col items-center justify-center w-full py-2.5 rounded-xl cursor-pointer ${
                        isActive
                          ? 'glass-badge-neutral shadow-xs font-bold'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-sky-200' : 'text-white/70 group-hover:text-white/90'}`} />
                      <span className="text-[10px] font-semibold tracking-tight mt-1 text-center leading-none">
                        {item.label}
                      </span>
                      {item.id === 'patients' && (
                        <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] font-bold text-white shadow-xs">
                          {patients.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Rail Bottom Actions */}
            <div className="flex flex-col items-center gap-2 w-full px-2 pt-3 border-t border-white/25">
              <button
                type="button"
                onClick={onOpenAttestation}
                title="1-Tap DHA PAC Attestation"
                aria-label="1-Tap DHA PAC Attestation"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white hover:bg-white/85 text-slate-900 transition cursor-pointer shadow-md shadow-black/40"
              >
                <Lock className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onOpenWhatsApp}
                title="Dispatch WhatsApp PAC Link"
                aria-label="Dispatch WhatsApp PAC Link"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 hover:bg-white/15 hover:border-white/30 text-white/85 hover:text-white transition cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onOpenPrintSlip}
                title="Print PAC Attestation Slip"
                aria-label="Print PAC Attestation Slip"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 hover:bg-white/15 hover:border-white/30 text-white/85 hover:text-white transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onOpenAuditDrawer}
                title="Audit Logs & System Settings"
                aria-label="Audit Logs & System Settings"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 hover:bg-white/15 hover:border-white/30 text-white/85 hover:text-white transition cursor-pointer"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
                aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 hover:bg-white/15 hover:border-white/30 text-white/85 hover:text-white transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <div
                className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white border border-white/30 font-bold text-[10px] relative cursor-pointer ring-2 ring-white/30"
                title="Dr. Tariq Mansoor · Consultant Anaesthetist · DHA § 3060"
              >
                <span>TM</span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
            </div>
          </aside>

          {/* Tabler Main Body & Top Navigation Bar */}
          <div className="flex-1 flex flex-col transparent min-w-0">
            {/* Top Command Bar */}
            <header className="glass-strong sticky top-0 z-20 border-b border-white/20 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
              {/* Left: Console Wordmark + Global Search */}
              <div className="flex items-center gap-4 flex-1 max-w-2xl min-w-0">
                <div className="hidden sm:flex flex-col leading-none shrink-0">
                  <span className="console-title font-serif italic text-[22px] font-bold tracking-tight text-white">
                    OT <span className="text-sky-200 not-italic">Console</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-sky-200/90 mt-1 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    DHA § 3060(a)
                  </span>
                </div>
                <div className="console-search relative flex-1 rounded-full border border-transparent transition">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search patient MRN, surgeon, or surgery..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 text-xs font-medium bg-white/10 border border-white/25 rounded-full text-white placeholder-white/60 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/20 focus:border-white/60 transition"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white/75"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-mono font-semibold text-white/60 bg-white/15 px-1.5 py-0.5 rounded border border-white/25">
                        ⌘K
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Panic-Alert Pill, Notification Bell, Profile Menu */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                {/* Panic Alert Pill */}
                <div className="hidden sm:flex items-center gap-1.5 bg-rose-500/20 border border-rose-300/40 px-3 py-1.5 rounded-full text-rose-200 shadow-xs">
                  <Flame className="h-3.5 w-3.5 text-rose-200 animate-pulse" />
                  <span className="text-[11px] font-bold font-mono">
                    {redCount > 0 ? `${redCount} HARD STOP` : 'PANIC ALERT: 0 STOPS'}
                  </span>
                </div>

                {/* Light / Dark Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="p-2 rounded-full bg-white/10 border border-white/25 text-white/75 hover:text-white hover:bg-white/15 transition cursor-pointer"
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-200" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsProfileMenuOpen(false);
                    }}
                    className="relative p-2 rounded-full bg-white/10 border border-white/25 text-white/75 hover:text-white hover:bg-white/15 transition cursor-pointer"
                    aria-label="Clinical Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                      {notifications.length}
                    </span>
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationsOpen && (
                    <div className="glass-strong menu-pop absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-white/15">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                            Clinical Alerts & Holds
                          </span>
                          <span className="rounded-full glass-badge-neutral px-2 py-0.5 text-[10px] font-bold">
                            {notifications.length} New
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-white/60 hover:text-white/75"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="divide-y divide-white/10 max-h-72 overflow-y-auto mt-2">
                        {notifications.map((n) => (
                          <div key={n.id} className="py-2.5 hover:bg-white/10 rounded-xl px-2 transition">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{n.title}</span>
                              <span className="text-[10px] font-mono text-white/60">{n.time}</span>
                            </div>
                            <div className="text-[11px] text-white font-semibold mt-0.5">
                              {n.patient}
                            </div>
                            <div className="text-[11px] text-white/70 mt-0.5 leading-snug">
                              {n.detail}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 mt-2 border-t border-white/15 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            onOpenAuditDrawer();
                          }}
                          className="text-xs font-bold text-white hover:text-white flex items-center gap-1"
                        >
                          <span>Open Audit Trail</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-xs text-white/60 hover:text-white/75 font-medium"
                        >
                          Dismiss All
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clinician Profile Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white/10 border border-white/25 hover:border-white/50 transition cursor-pointer"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=120"
                      alt="Dr. Tariq"
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-white/60"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120';
                      }}
                    />
                    <span className="text-xs font-bold text-white/90 hidden md:inline-block">
                      Dr. Tariq Mansoor
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-white/60" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="glass-strong menu-pop absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl p-3 z-50">
                      <div className="p-2 border-b border-white/15">
                        <div className="text-xs font-extrabold text-white">
                          Dr. Tariq Mansoor, MD
                        </div>
                        <div className="text-[10px] text-white/70 font-mono">
                          DESA, Consultant Anaesthetist
                        </div>
                        <div className="text-[9px] text-white font-mono font-bold mt-0.5">
                          Lic: DHA-3060-AE (Verified)
                        </div>
                      </div>

                      <div className="py-2 space-y-1 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenIngestion();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/85 hover:bg-white/15 hover:text-white text-left transition"
                        >
                          <Plus className="h-4 w-4 text-sky-200" />
                          <span>Ingest New Case</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenAttestation();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/85 hover:bg-white/15 hover:text-white text-left transition"
                        >
                          <Lock className="h-4 w-4 text-sky-200" />
                          <span>1-Tap DHA PAC Attestation</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenPrintSlip();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/85 hover:bg-white/15 hover:text-white text-left transition"
                        >
                          <Printer className="h-4 w-4 text-white/60" />
                          <span>Print PAC Attestation Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            onOpenAuditDrawer();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/85 hover:bg-white/15 hover:text-white text-left transition"
                        >
                          <History className="h-4 w-4 text-white/60" />
                          <span>DHA Regulatory Audit Trail</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="p-5 sm:p-8 space-y-7 overflow-y-auto">
              {/* Mobile Section Nav */}
              <nav
                className="md:hidden flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
                aria-label="Dashboard sections"
              >
                {(
                  [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'blood-labs', label: 'Blood Labs' },
                    { id: 'questionnaire', label: 'Intake' },
                    { id: 'regional', label: 'Regional' },
                    { id: 'ot-defense', label: 'Defense' },
                    { id: 'patients', label: 'Roster' },
                    { id: 'notes', label: 'Notes' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    aria-current={activeNav === item.id ? 'page' : undefined}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      activeNav === item.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-white/15 text-white/75 border border-white/25 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Hero Stat Strip (4 tiles) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Tile 1: Cases Today */}
                <div className="console-stat rounded-2xl border border-white/25 p-5 transition-[transform,background-color,border-color,box-shadow] duration-200 group overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 font-mono">
                      Cases Today
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-200 border border-sky-300/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-4xl font-extrabold text-white leading-none tracking-tight">
                    {patients.length} <span className="text-sm font-normal text-white/60 font-sans">Cases</span>
                  </div>
                  <div className="mt-2 text-xs text-white/70 font-medium flex items-center gap-1.5">
                    <span className="text-emerald-200 font-bold">{greenCount} Clr</span> ·{' '}
                    <span className="text-amber-200 font-bold">{amberCount} Cond</span> ·{' '}
                    <span className="text-rose-200 font-bold">{redCount} Stop</span>
                  </div>
                </div>

                {/* Tile 2: Active Holds */}
                <div className="console-stat rounded-2xl border border-white/25 p-5 transition-[transform,background-color,border-color,box-shadow] duration-200 group overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 font-mono">
                      Active Holds
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-300/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-4xl font-extrabold text-white leading-none tracking-tight">
                    {activeHoldCount} <span className="text-sm font-normal text-white/60 font-sans">Active</span>
                  </div>
                  <div className="mt-2 text-xs text-white/70 font-medium">
                    GLP-1 168h · ACEi · DOAC
                  </div>
                </div>

                {/* Tile 3: NPO Fasting */}
                <div className="console-stat rounded-2xl border border-white/25 p-5 transition-[transform,background-color,border-color,box-shadow] duration-200 group overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 font-mono">
                      NPO Fasting
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-300/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Utensils className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-4xl font-extrabold text-white leading-none tracking-tight">
                    12h <span className="text-sm font-normal text-white/60 font-sans">00m</span>
                  </div>
                  <div className="mt-2 text-xs text-white/70 font-medium">
                    Solids 12h · Liquids 3.5h
                  </div>
                </div>

                {/* Tile 4: PAC Attestation */}
                <div className="console-stat rounded-2xl border border-white/25 p-5 transition-[transform,background-color,border-color,box-shadow] duration-200 group overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 font-mono">
                      PAC Attestation
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-100 border border-indigo-300/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Award className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-4xl font-extrabold text-white leading-none tracking-tight">
                    100<span className="text-xl font-bold text-sky-200">%</span>
                  </div>
                  <div className="mt-2 text-xs text-white/70 font-medium">
                    DHA § 3060(a) Audited
                  </div>
                </div>
              </div>

              {/* Active Surgical Day Roster Strip */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="console-title font-serif italic text-[22px] font-bold tracking-tight text-white">
                      Active Surgical Day Roster
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-white/70 font-mono bg-white/15 border border-white/25 px-2.5 py-1 rounded-full shadow-xs">
                      Click patient card to load case
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenIngestion}
                    className="text-xs font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer bg-white hover:bg-white/85 border border-white/60 px-3 py-1.5 rounded-full shadow-md shadow-black/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ingest Case</span>
                  </button>
                </div>

                <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-none">
                  {rosterPatients.map((p, idx) => {
                    const isSelected = p.id === currentPatient.id;
                    const sampleAvatars = [
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
                    ];
                    const avatarSrc = sampleAvatars[idx % sampleAvatars.length];

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPatient(p.id)}
                        data-active={isSelected}
                        className={`console-roster-card shrink-0 rounded-2xl p-3 flex items-center gap-3 text-left min-w-[250px] border cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 text-white border-white/60'
                            : 'bg-white/10 backdrop-blur-sm border-white/25 text-white/85 hover:border-white/50 hover:bg-white/15 shadow-xs'
                        }`}
                      >
                        <img
                          src={avatarSrc}
                          alt={p.name}
                          className={`h-11 w-11 rounded-full object-cover ring-2 shrink-0 ${
                            isSelected ? 'ring-white/60' : 'ring-white/30'
                          }`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13px] font-bold truncate ${isSelected ? 'text-white' : 'text-white/90'}`}>
                            {p.name}
                          </div>
                          <div className="text-[10px] text-white/70 truncate font-mono mt-0.5">
                            {p.mrn} · {p.procedureName.split(' ')[0]} · {p.asaStatus}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              p.overallStatus === 'RED_HARD_STOP'
                                ? 'glass-badge-stop'
                                : p.overallStatus === 'AMBER_CONDITIONAL'
                                ? 'glass-badge-conditional'
                                : 'glass-badge-cleared'
                            }`}
                          >
                            {p.overallStatus === 'RED_HARD_STOP'
                              ? 'STOP'
                              : p.overallStatus === 'AMBER_CONDITIONAL'
                              ? 'COND'
                              : 'CLEARED'}
                          </span>
                          <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-white/40'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Views Routing */}
              {activeNav === 'blood-labs' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="console-title font-serif italic text-lg font-bold tracking-tight text-white flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-rose-200" />
                          <span>In-OT Anesthesiologist Mobile Viewport</span>
                        </h3>
                        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          Live Sync
                        </span>
                      </div>
                      <MobileAnesthesiaBloodView
                        patientId={currentPatient.id}
                        onOpenAttestation={onOpenAttestation}
                        onOpenWhatsApp={onOpenWhatsApp}
                        onOpenQuestionnaire={() => setActiveNav('questionnaire')}
                      />
                    </div>
                    <div className="lg:col-span-7 space-y-6">
                      <BiomarkerSafetyCutoffs patient={currentPatient} />
                      <FishboneViewer
                        labs={currentPatient.labs}
                        selectedLabId={selectedLab?.id || null}
                        onSelectLab={(id: string) => selectLab(id)}
                      />
                      <LabAuditTable
                        labs={currentPatient.labs}
                        selectedLabId={selectedLab?.id || null}
                        onSelectLab={(id: string) => selectLab(id)}
                        onOpenProvenanceDrawer={toggleProvenanceDrawer}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeNav === 'questionnaire' && (
                <div className="space-y-6">
                  <PatientPreOpQuestionnaire patientId={currentPatient.id} />
                </div>
              )}

              {activeNav === 'regional' && (
                <div className="space-y-6">
                  <NeuraxialFeasibility patient={currentPatient} />
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SerologyBloodBank patient={currentPatient} />
                    <PRBCTransfusionPredictor patient={currentPatient} />
                  </div>
                  <PreOpAnemiaOptimizer patient={currentPatient} />
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <MorningMedDirectives patient={currentPatient} />
                    <PenicillinDelabeling patient={currentPatient} />
                  </div>
                </div>
              )}

              {activeNav === 'ot-defense' && (
                <div className="space-y-6">
                  <OTDelayPreventionHub
                    patient={currentPatient}
                    externalTab="ALL"
                    onOpenIngestion={onOpenIngestion}
                    onOpenWhatsApp={onOpenWhatsApp}
                  />
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <PostOpRiskCalculator patient={currentPatient} />
                    <ASCEvaluator patient={currentPatient} />
                  </div>
                  <ERASTimeline patient={currentPatient} />
                  <ORReadinessKanban />
                </div>
              )}

              {activeNav === 'notes' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ClinicalNotes patientId={currentPatient.id} />
                    <FHIRExport patient={currentPatient} />
                  </div>
                </div>
              )}

              {activeNav === 'patients' && (
                <div className="space-y-6">
                  <div className="glass-console rounded-2xl p-6 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-serif italic text-lg font-bold tracking-tight text-white">
                          Operating Theatre Patient Directory
                        </h3>
                        <p className="text-xs text-white/70 mt-0.5">
                          Comprehensive Case Roster for Dubai Day Surgery Center
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(['ALL', 'GREEN', 'AMBER', 'RED'] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setPatientFilter(filter)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                              patientFilter === filter
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'bg-white/15 text-white/75 hover:bg-white/20'
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/25 text-white/70 font-bold uppercase tracking-wider bg-white/10">
                          <tr>
                            <th className="py-3 px-3">Patient</th>
                            <th className="py-3 px-3">MRN / ID</th>
                            <th className="py-3 px-3">Procedure</th>
                            <th className="py-3 px-3">ASA Class</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredPatients.map((p) => (
                            <tr
                              key={p.id}
                              onClick={() => {
                                selectPatient(p.id);
                                setActiveNav('dashboard');
                              }}
                              className={`hover:bg-white/10 transition cursor-pointer ${
                                p.id === currentPatient.id ? 'bg-white/15 font-medium' : ''
                              }`}
                            >
                              <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900 font-bold text-[10px]">
                                  {p.name.split(' ').map((n) => n[0]).join('')}
                                </div>
                                <span>{p.name}</span>
                              </td>
                              <td className="py-3.5 px-3 font-mono text-white/75">{p.mrn}</td>
                              <td className="py-3.5 px-3 text-white/75">{p.procedureName}</td>
                              <td className="py-3.5 px-3 font-bold text-white">{p.asaStatus}</td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.overallStatus === 'RED_HARD_STOP'
                                      ? 'glass-badge-stop'
                                      : p.overallStatus === 'AMBER_CONDITIONAL'
                                      ? 'glass-badge-conditional'
                                      : 'glass-badge-cleared'
                                  }`}
                                >
                                  {p.overallStatus.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectPatient(p.id);
                                    setActiveNav('dashboard');
                                  }}
                                  className="rounded-full bg-white hover:bg-white/85 text-slate-900 px-3 py-1 text-[11px] font-bold transition cursor-pointer shadow-xs"
                                >
                                  View Case
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Tabler Multi-Pane Dashboard Grid */}
              {activeNav === 'dashboard' && (
                <div className="space-y-6">
                  {/* Traffic Light Banner */}
                  <TrafficLightBanner patient={currentPatient} />

                  {/* Multi-Pane Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Pane 1: STAT Blood Investigation Console */}
                    <div className="lg:col-span-7 console-pane rounded-2xl border border-white/25 p-6 shadow-xs space-y-4 transition">
                      <div className="flex items-center justify-between pb-3 border-b border-white/15">
                        <div>
                          <h3 className="flex items-center gap-2 font-serif italic text-base font-bold text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-200 border border-rose-300/30 shrink-0"><Droplets className="h-4 w-4" /></span>
                            <span>STAT Blood Investigation Console</span>
                          </h3>
                          <p className="text-[10px] text-white/60 font-mono mt-0.5">
                            POC Biomarkers & Perioperative Safety Thresholds
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveNav('blood-labs')}
                          className="p-1 rounded text-white/60 hover:text-white hover:bg-white/15 transition cursor-pointer"
                          title="Open Full Lab Suite"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Biomarker Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* K+ */}
                        {(() => {
                          const val = kLab ? kLab.value : 4.2;
                          const isLow = val < 3.5;
                          const isHigh = val > 5.1;
                          const statusText = isLow ? 'LOW' : isHigh ? 'HIGH' : 'NORMAL';
                          const statusClass = isLow || isHigh
                            ? 'glass-badge-conditional'
                            : 'glass-badge-cleared';
                          const pct = Math.min(100, Math.max(15, ((val - 2.5) / 3.0) * 100));

                          return (
                            <div className="console-biomarker p-3.5 rounded-xl border border-white/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-white/75">
                                  Potassium (K⁺)
                                </span>
                                <span className={`rounded-full ${statusClass} px-1.5 py-0.5 text-[8px] font-bold`}>
                                  {statusText}
                                </span>
                              </div>
                              <div className="text-[22px] font-extrabold text-white font-mono">
                                {val.toFixed(1)}{' '}
                                <span className="text-xs font-normal text-white/60 font-sans">mEq/L</span>
                              </div>
                              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isLow || isHigh ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-white/60 font-mono">Range: 3.5 - 5.1 mEq/L</div>
                            </div>
                          );
                        })()}

                        {/* Hemoglobin */}
                        {(() => {
                          const val = hbLab ? hbLab.value : 13.8;
                          const isAnemic = val < 12.0;
                          const statusText = val < 10.0 ? 'ANEMIA' : isAnemic ? 'BORDERLINE' : 'OPTIMAL';
                          const statusClass = val < 10.0
                            ? 'glass-badge-stop'
                            : isAnemic
                            ? 'glass-badge-conditional'
                            : 'glass-badge-cleared';
                          const pct = Math.min(100, Math.max(20, (val / 17.5) * 100));

                          return (
                            <div className="console-biomarker p-3.5 rounded-xl border border-white/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-white/75">
                                  Hemoglobin (Hb)
                                </span>
                                <span className={`rounded-full ${statusClass} px-1.5 py-0.5 text-[8px] font-bold`}>
                                  {statusText}
                                </span>
                              </div>
                              <div className="text-[22px] font-extrabold text-white font-mono">
                                {val.toFixed(1)}{' '}
                                <span className="text-xs font-normal text-white/60 font-sans">g/dL</span>
                              </div>
                              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isAnemic ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-white/60 font-mono">Cutoff: ≥ 12.0 g/dL</div>
                            </div>
                          );
                        })()}

                        {/* Platelets */}
                        {(() => {
                          const rawVal = pltLab ? pltLab.value : 245000;
                          const kVal = rawVal > 1000 ? Math.round(rawVal / 1000) : Math.round(rawVal);
                          const isSafe = kVal >= 100;
                          const statusText = isSafe ? 'ASRA SAFE' : 'LOW PLT';
                          const statusClass = isSafe
                            ? 'glass-badge-cleared'
                            : 'glass-badge-stop';
                          const pct = Math.min(100, Math.max(20, (kVal / 450) * 100));

                          return (
                            <div className="console-biomarker p-3.5 rounded-xl border border-white/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-white/75">
                                  Platelet Count
                                </span>
                                <span className={`rounded-full ${statusClass} px-1.5 py-0.5 text-[8px] font-bold`}>
                                  {statusText}
                                </span>
                              </div>
                              <div className="text-[22px] font-extrabold text-white font-mono">
                                {kVal} <span className="text-xs font-normal text-white/60 font-sans">k/µL</span>
                              </div>
                              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isSafe ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-white/60 font-mono">Cutoff: &gt; 100k ASRA</div>
                            </div>
                          );
                        })()}

                        {/* PT/INR */}
                        {(() => {
                          const val = inrLab ? inrLab.value : 1.02;
                          const isNormal = val <= 1.2;
                          const statusText = isNormal ? 'COAG OK' : 'ELEVATED';
                          const statusClass = isNormal
                            ? 'glass-badge-cleared'
                            : 'glass-badge-stop';
                          const pct = Math.min(100, Math.max(20, (val / 2.0) * 100));

                          return (
                            <div className="console-biomarker p-3.5 rounded-xl border border-white/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-white/75">
                                  PT / INR
                                </span>
                                <span className={`rounded-full ${statusClass} px-1.5 py-0.5 text-[8px] font-bold`}>
                                  {statusText}
                                </span>
                              </div>
                              <div className="text-[22px] font-extrabold text-white font-mono">
                                {val.toFixed(2)}{' '}
                                <span className="text-xs font-normal text-white/60 font-sans">Ratio</span>
                              </div>
                              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isNormal ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-white/60 font-mono">Cutoff: &lt; 1.4</div>
                            </div>
                          );
                        })()}

                        {/* eGFR Renal */}
                        {(() => {
                          const crVal = crLab ? crLab.value : 0.82;
                          const isNormal = crVal <= 1.2;
                          const eGfrEst = crVal > 1.1 ? 68 : 88;
                          const statusText = isNormal ? 'NORMAL' : 'PRE-RENAL';
                          const statusClass = isNormal
                            ? 'glass-badge-cleared'
                            : 'glass-badge-conditional';

                          return (
                            <div className="console-biomarker p-3.5 rounded-xl border border-white/20 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-white/75">
                                  eGFR Renal
                                </span>
                                <span className={`rounded-full ${statusClass} px-1.5 py-0.5 text-[8px] font-bold`}>
                                  {statusText}
                                </span>
                              </div>
                              <div className="text-[22px] font-extrabold text-white font-mono">
                                {eGfrEst} <span className="text-xs font-normal text-white/60 font-sans">mL/min</span>
                              </div>
                              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${isNormal ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                  style={{ width: `${Math.min(100, eGfrEst)}%` }}
                                />
                              </div>
                              <div className="text-[9px] text-white/60 font-mono">Target: &gt; 60 mL/min</div>
                            </div>
                          );
                        })()}

                        {/* hs-Troponin I */}
                        <div className="console-biomarker p-3.5 rounded-xl border border-white/20 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-white/75">
                              hs-Troponin I
                            </span>
                            <span className="rounded-full glass-badge-cleared px-1.5 py-0.5 text-[8px] font-bold">
                              NEGATIVE
                            </span>
                          </div>
                          <div className="text-[22px] font-extrabold text-white font-mono">
                            &lt;0.01 <span className="text-xs font-normal text-white/60 font-sans">ng/mL</span>
                          </div>
                          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full w-[10%]" />
                          </div>
                          <div className="text-[9px] text-white/60 font-mono">Cutoff: &lt; 0.04 ng/mL</div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/15">
                        <span className="text-xs text-white/75 font-mono">
                          Serology:{' '}
                          <strong className="text-white font-bold">
                            {currentPatient.name.includes('Fatima')
                              ? 'B Pos · 2 Units Crossmatched'
                              : currentPatient.name.includes('Rajesh')
                              ? 'B Pos · 2U PRBC Reserved'
                              : 'A Pos · Type & Screen Valid'}
                          </strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveNav('blood-labs')}
                            className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/20 text-white/85 text-xs font-bold transition cursor-pointer"
                          >
                            Fishbone View
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveNav('blood-labs')}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-white/85 text-slate-900 text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            POC Console View
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pane 2: Vital Signs & Live Telemetry */}
                    <div className="lg:col-span-5 console-pane rounded-2xl border border-white/25 p-6 shadow-xs space-y-4 transition">
                      <div className="flex items-center justify-between pb-3 border-b border-white/15">
                        <div>
                          <h3 className="flex items-center gap-2 font-serif italic text-base font-bold text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-200 border border-sky-300/30 shrink-0"><Activity className="h-4 w-4" /></span>
                            <span>Vital Signs & Live Telemetry</span>
                          </h3>
                          <p className="text-[10px] text-white/60 font-mono mt-0.5">
                            Continuous POC Haemodynamic Monitor
                          </p>
                        </div>
                        <span className="rounded-full glass-badge-cleared px-2.5 py-0.5 text-[9px] font-bold">
                          Live Rhythm
                        </span>
                      </div>

                      {/* Live ECG Vector Strip with Grid */}
                      <div className="rounded-2xl bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] p-4 border border-slate-800 relative overflow-hidden shadow-inner">
                        <div className="flex items-center justify-between text-emerald-400 text-[10px] font-mono pb-1.5 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="font-bold">Lead II Telemetry</span>
                          </div>
                          <span className="text-white/50">25 mm/s · 10 mm/mV</span>
                        </div>

                        {/* Animated ECG Rhythm SVG */}
                        <div className="h-16 w-full flex items-center relative my-1">
                          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#10B981_1px,transparent_1px),linear-gradient(to_bottom,#10B981_1px,transparent_1px)] bg-[size:12px_12px]" />

                          <svg className="w-full h-full text-emerald-400 relative z-10" viewBox="0 0 400 60" fill="none">
                            <path
                              className="ecg-trace"
                              d="M 0 30 L 50 30 L 60 28 L 70 30 L 80 30 L 90 10 L 100 52 L 110 18 L 120 36 L 130 30 L 170 30 L 180 28 L 190 30 L 200 30 L 210 10 L 220 52 L 230 18 L 240 36 L 250 30 L 290 30 L 300 28 L 310 30 L 320 30 L 330 10 L 340 52 L 350 18 L 360 36 L 370 30 L 400 30"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Telemetry Metrics */}
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                          <div>
                            <div className="text-[9px] font-mono text-white/50">HR</div>
                            <div className="text-sm font-extrabold text-white font-mono">
                              {latestVitals.heartRate}{' '}
                              <span className="text-[8px] text-emerald-400 font-normal">bpm</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/50">NIBP</div>
                            <div className="text-sm font-extrabold text-white font-mono">
                              {latestVitals.systolicBp}/{latestVitals.diastolicBp}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/50">SpO2</div>
                            <div className="text-sm font-extrabold text-white font-mono">
                              {latestVitals.spo2}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/50">Temp</div>
                            <div className="text-sm font-extrabold text-white font-mono">
                              {latestVitals.temperatureC}°C
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Haemodynamic Status Bar */}
                      <div className="flex items-center justify-between text-xs font-semibold text-white/85 bg-white/10 p-3 rounded-xl border border-white/20">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                          <span>Sinus Rhythm · Hemodynamically Stable</span>
                        </span>
                        <span className="font-mono text-[11px] text-white/70 font-bold">
                          MAP {meanArterialPressure} mmHg
                        </span>
                      </div>
                    </div>

                    {/* Pane 3: Pre-Op Medication & Drug Hold Tracker */}
                    <div className="lg:col-span-6 console-pane rounded-2xl border border-white/25 p-6 shadow-xs space-y-4 transition">
                      <div className="flex items-center justify-between pb-3 border-b border-white/15">
                        <div>
                          <h3 className="flex items-center gap-2 font-serif italic text-base font-bold text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-200 border border-amber-300/30 shrink-0"><Pill className="h-4 w-4" /></span>
                            <span>Pre-Op Medication & Drug Hold Tracker</span>
                          </h3>
                          <p className="text-[10px] text-white/60 font-mono mt-0.5">
                            GLP-1 Chronometer & Refractory Hypotension Shield
                          </p>
                        </div>
                        <span className="rounded-full glass-badge-conditional px-2.5 py-0.5 text-[9px] font-bold">
                          Chronometers Active
                        </span>
                      </div>

                      <div className="space-y-3">
                        {currentPatient.medications && currentPatient.medications.length > 0 ? (
                          <>
                            {(showAllMeds ? currentPatient.medications : currentPatient.medications.slice(0, 2)).map((med) => {
                              const isHardStop = med.status === 'HARD_STOP';
                              const isHold = med.status === 'HOLD_REQUIRED';
                              const statusClass = isHardStop
                                ? 'glass-badge-stop'
                                : isHold
                                ? 'glass-badge-conditional'
                                : 'glass-badge-cleared';

                              return (
                                <div
                                  key={med.id}
                                  className="p-3.5 rounded-xl bg-white/10 border border-white/20 flex items-start justify-between gap-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-white truncate">
                                        {med.drugName}
                                      </span>
                                      <span className={`rounded-full ${statusClass} px-2 py-0.5 text-[8px] font-bold shrink-0`}>
                                        {isHardStop ? 'HARD STOP' : isHold ? 'HOLD REQUIRED' : 'CLEARED'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-white/75 mt-1 leading-snug">
                                      {med.clinicalAction || med.guidelineBasis}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 font-mono">
                                    <span className={`text-xs font-extrabold ${isHardStop ? 'text-rose-200' : isHold ? 'text-amber-200' : 'text-emerald-200'}`}>
                                      {med.lastDoseHoursAgo}h / {med.requiredHoldHours}h
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {currentPatient.medications.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setShowAllMeds((v) => !v)}
                                className="w-full py-2 rounded-xl border border-white/25 bg-white/10 text-xs font-bold text-white hover:bg-white/15 transition cursor-pointer"
                              >
                                {showAllMeds ? 'Show fewer holds' : `Show all ${currentPatient.medications.length} holds`}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  No Regular Pre-Op Medications
                                </span>
                                <span className="rounded-full glass-badge-cleared px-2 py-0.5 text-[8px] font-bold">
                                  CLEARED
                                </span>
                              </div>
                              <div className="text-[11px] text-white/70 mt-1">
                                No GLP-1, DOAC, SGLT2i, or ACEi hold requirements for this case.
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-extrabold text-emerald-200">
                                0 Holds
                              </span>
                            </div>
                          </div>
                        )}

                        {/* NPO Fasting Status Box */}
                        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-300/40 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Utensils className="h-3.5 w-3.5 text-emerald-200" />
                              <span>NPO Fasting Status: Cleared</span>
                            </div>
                            <div className="text-[11px] text-emerald-200 font-mono mt-0.5">
                              Solids: 12h 00m (Target ≥8h) · Clear Liquids: 3h 30m (Target ≥3h)
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[9px] font-bold text-white shadow-xs">
                            ZERO ASPIRATION
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pane 4: Airway & Perioperative Risk Scores */}
                    <div className="lg:col-span-6 console-pane rounded-2xl border border-white/25 p-6 shadow-xs space-y-4 transition">
                      <div className="flex items-center justify-between pb-3 border-b border-white/15">
                        <div>
                          <h3 className="flex items-center gap-2 font-serif italic text-base font-bold text-white">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-300/30 shrink-0"><ShieldCheck className="h-4 w-4" /></span>
                            <span>Airway & Perioperative Risk Scores</span>
                          </h3>
                          <p className="text-[10px] text-white/60 font-mono mt-0.5">
                            Pre-Anesthetic Multi-System Risk Stratification
                          </p>
                        </div>
                        <span className="rounded-full glass-badge-neutral px-2.5 py-0.5 text-[9px] font-bold">
                          {currentPatient.asaStatus} Cleared
                        </span>
                      </div>

                      {/* 4 Risk Metrics Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Mallampati */}
                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 space-y-1">
                          <div className="text-[10px] font-mono text-white/70 uppercase">Mallampati Class</div>
                          <div className="text-base font-extrabold text-white font-mono">
                            {currentPatient.airway.mallampati}
                          </div>
                          <div className="text-[10px] text-white/70 font-mono">
                            Mouth: {currentPatient.airway.mouthOpeningCm}cm · TMD: {currentPatient.airway.thyromentalDistanceCm}cm
                          </div>
                        </div>

                        {/* STOP-Bang OSA */}
                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 space-y-1">
                          <div className="text-[10px] font-mono text-white/70 uppercase">STOP-Bang OSA</div>
                          <div className="text-base font-extrabold text-white font-mono flex items-center gap-1.5">
                            <span>{currentPatient.stopBangScore} / 8</span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                                currentPatient.stopBangScore >= 5
                                  ? 'glass-badge-stop'
                                  : currentPatient.stopBangScore >= 3
                                  ? 'glass-badge-conditional'
                                  : 'glass-badge-cleared'
                              }`}
                            >
                              {currentPatient.stopBangScore >= 5
                                ? 'HIGH'
                                : currentPatient.stopBangScore >= 3
                                ? 'MODERATE'
                                : 'LOW'}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/70">
                            {currentPatient.stopBangScore >= 3 ? 'Consider CPAP' : 'No home CPAP required'}
                          </div>
                        </div>

                        {/* RCRI */}
                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 space-y-1">
                          <div className="text-[10px] font-mono text-white/70 uppercase">Cardiac RCRI</div>
                          <div className="text-base font-extrabold text-white font-mono">
                            {currentPatient.rcriClass}
                          </div>
                          <div className="text-[10px] text-white/70">
                            {currentPatient.rcriClass.includes('Class I') ? 'MACE Risk < 0.4%' : 'MACE Risk ~ 0.9%'}
                          </div>
                        </div>

                        {/* Allergies */}
                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 space-y-1">
                          <div className="text-[10px] font-mono text-white/70 uppercase">Allergies</div>
                          <div className="text-base font-bold text-white truncate">
                            {currentPatient.allergies && currentPatient.allergies.length > 0
                              ? currentPatient.allergies.map((a) => a.allergen).join(', ')
                              : 'No Known Allergies'}
                          </div>
                          <div className="text-[10px] text-emerald-200 font-bold">Latex: Negative · Cleared</div>
                        </div>
                      </div>

                      {/* 1-Tap DHA Attestation & WhatsApp PAC Dispatch Buttons */}
                      <div className="pt-3 border-t border-white/15 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={onOpenAttestation}
                          className="flex-1 py-2.5 rounded-xl bg-white hover:bg-white/85 text-slate-900 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-black/40"
                        >
                          <FileCheck2 className="h-4 w-4" />
                          <span>1-Tap DHA PAC Attest</span>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenWhatsApp}
                          className="flex-1 py-2.5 rounded-xl bg-white/15 hover:bg-white/30 text-white border border-white/35 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>WhatsApp PAC Link</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Clinical Modules */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    <SurgeryCountdown patient={currentPatient} />
                    <CountdownTimers medications={currentPatient.medications} />
                  </div>

                  {drugInteractions.length > 0 && (
                    <DrugInteractionAlert interactions={drugInteractions} />
                  )}

                  <AirwaySpineModule
                    airway={currentPatient.airway}
                    onUpdateAirway={(airway) => updateAirway(currentPatient.id, airway)}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablerClinicalDashboard;
