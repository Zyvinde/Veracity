const fs = require('fs');
const path = require('path');

const content = `'use client';

import React, { useState, useMemo } from 'react';
import { usePatientStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { checkDrugInteractions } from '@/lib/rules-engine';
import { AttestationRecord, PatientCase } from '@/lib/types';
import HeaderComplianceBar from '@/components/HeaderComplianceBar';
import TrafficLightBanner from '@/components/TrafficLightBanner';
import CountdownTimers from '@/components/CountdownTimers';
import LabAuditTable from '@/components/LabAuditTable';
import ProvenanceInspector from '@/components/ProvenanceInspector';
import AirwaySpineModule from '@/components/AirwaySpineModule';
import { AllergyCard } from '@/components/AllergyCard';
import { SurgeryCountdown } from '@/components/SurgeryCountdown';
import { DrugInteractionAlert } from '@/components/DrugInteractionAlert';
import { AuditTrailDrawer } from '@/components/AuditTrailDrawer';
import { PatientSearch } from '@/components/PatientSearch';
import { ClinicalNotes } from '@/components/ClinicalNotes';
import { BMICalculator } from '@/components/BMICalculator';
import VitalsTrend from '@/components/VitalsTrend';
import { FHIRExport } from '@/components/FHIRExport';
import PreAnesthesiaCheckup from '@/components/PreAnesthesiaCheckup';
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
import { DigitalPACCard } from '@/components/DigitalPACCard';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';

import {
  Activity,
  Droplets,
  ClipboardCheck,
  Stethoscope,
  ShieldAlert,
  Users,
  Search,
  Plus,
  Share2,
  Printer,
  FileCheck2,
  Clock,
  Pill,
  Heart,
  ChevronRight,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Phone,
  BarChart3,
  Calendar,
  Layers,
  HelpCircle,
  Settings,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  History,
} from 'lucide-react';

export type TablerViewTab =
  | 'overview'
  | 'blood-labs'
  | 'questionnaire'
  | 'regional'
  | 'ot-defense'
  | 'patients';

interface TablerClinicalDashboardProps {
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
    isProvenanceDrawerOpen,
    getCurrentPatient,
    getSelectedLab,
    getCurrentAttestation,
    selectPatient,
    selectLab,
    updateAirway,
    addPatient,
    toggleProvenanceDrawer,
  } = usePatientStore();

  const [activeTab, setActiveTab] = useState<TablerViewTab>('overview');
  const [patientFilter, setPatientFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'GREEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const currentPatient = getCurrentPatient();
  const selectedLab = getSelectedLab();
  const currentAttestation = getCurrentAttestation();

  const drugInteractions = useMemo(
    () => (currentPatient?.medications ? checkDrugInteractions(currentPatient.medications) : []),
    [currentPatient?.medications]
  );

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.procedureName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (patientFilter === 'RED') return p.overallStatus === 'RED_HARD_STOP';
      if (patientFilter === 'AMBER') return p.overallStatus === 'AMBER_CONDITIONAL';
      if (patientFilter === 'GREEN') return p.overallStatus === 'GREEN_CLEARED';
      return true;
    });
  }, [patients, searchQuery, patientFilter]);

  const redCount = patients.filter((p) => p.overallStatus === 'RED_HARD_STOP').length;
  const amberCount = patients.filter((p) => p.overallStatus === 'AMBER_CONDITIONAL').length;
  const greenCount = patients.filter((p) => p.overallStatus === 'GREEN_CLEARED').length;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Tabler Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#206BC4] text-white font-bold text-base shadow-sm">
                V
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">Veracity</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-400 border border-slate-700">
                  Tabler OT Console
                </span>
              </div>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden lg:flex items-center gap-1" role="tablist">
              {[
                { id: 'overview' as const, label: 'Overview & Vitals', icon: Activity },
                { id: 'blood-labs' as const, label: 'STAT Blood Labs', icon: Droplets },
                { id: 'questionnaire' as const, label: 'Pre-Op Questionnaire', icon: ClipboardCheck },
                { id: 'regional' as const, label: 'Regional & ASRA', icon: Stethoscope },
                { id: 'ot-defense' as const, label: 'OT Delay Hub', icon: ShieldAlert },
                { id: 'patients' as const, label: 'Patient Roster', icon: Users },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ' + (
                      isActive
                        ? 'bg-[#206BC4] text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Header Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenIngestion}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-blue-400" />
                <span>Ingest Case</span>
              </button>

              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp PAC</span>
              </button>

              <button
                type="button"
                onClick={onOpenAttestation}
                className="flex items-center gap-1.5 rounded-lg bg-[#206BC4] hover:bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>1-Tap Attest</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto border-t border-slate-700/80 bg-slate-900/90 px-4 py-2 gap-1 text-xs">
          {[
            { id: 'overview' as const, label: 'Overview', icon: Activity },
            { id: 'blood-labs' as const, label: 'Blood Labs', icon: Droplets },
            { id: 'questionnaire' as const, label: 'Questionnaire', icon: ClipboardCheck },
            { id: 'regional' as const, label: 'Regional', icon: Stethoscope },
            { id: 'ot-defense' as const, label: 'OT Delay Hub', icon: ShieldAlert },
            { id: 'patients' as const, label: 'Patients', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={'flex items-center gap-1 px-2.5 py-1 rounded font-medium shrink-0 ' + (
                  isActive
                    ? 'bg-[#206BC4] text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. Tabler Stat Cards Grid (Pure Solid Colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total OT Cases */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cases Today</span>
              <div className="text-2xl font-extrabold text-white mt-1">{patients.length} <span className="text-xs font-normal text-slate-400">Scheduled</span></div>
              <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                {greenCount} Cleared · {amberCount} Cond · {redCount} Stop
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: STAT Blood Lab Queue */}
          <div
            onClick={() => setActiveTab('blood-labs')}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-600 transition"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">STAT Blood Labs</span>
              <div className="text-2xl font-extrabold text-white mt-1">100% <span className="text-xs font-normal text-slate-400">In-OT POC</span></div>
              <div className="text-[11px] text-blue-400 font-semibold mt-1">
                K⁺, Hb, Platelets, INR Ready
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
              <Droplets className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: Medication & NPO Holds */}
          <div
            onClick={() => setActiveTab('ot-defense')}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-600 transition"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Hold Clocks</span>
              <div className="text-2xl font-extrabold text-white mt-1">3 <span className="text-xs font-normal text-slate-400">Monitored</span></div>
              <div className="text-[11px] text-amber-400 font-semibold mt-1">
                GLP-1 180h Cleared · ACE Held
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 text-white font-bold">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4: Patient Pre-Op Questionnaires */}
          <div
            onClick={() => setActiveTab('questionnaire')}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-600 transition"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Questionnaires</span>
              <div className="text-2xl font-extrabold text-white mt-1">5 / 5 <span className="text-xs font-normal text-slate-400">Synced</span></div>
              <div className="text-[11px] text-purple-400 font-semibold mt-1">
                Contraceptives & Psych Screened
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white font-bold">
              <ClipboardCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* 3. Patient Selector Bar */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Patient Case:</span>
            <div className="flex flex-wrap gap-1.5">
              {patients.map((p) => {
                const isSelected = p.id === currentPatient.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPatient(p.id)}
                    className={'px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ' + (
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    )}
                  >
                    <span className={'h-2 w-2 rounded-full ' + (
                      p.overallStatus === 'RED_HARD_STOP'
                        ? 'bg-rose-400'
                        : p.overallStatus === 'AMBER_CONDITIONAL'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    )} />
                    <span>{p.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-75">({p.asaStatus})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPrintSlip}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print PAC</span>
            </button>
            <button
              type="button"
              onClick={onOpenAuditDrawer}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white"
            >
              <History className="h-3.5 w-3.5" />
              <span>Audit Log</span>
            </button>
          </div>
        </div>

        {/* 4. Active Patient Demographics Ribbon */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white tracking-tight">{currentPatient.name}</h2>
                <span className="rounded bg-blue-900 px-2 py-0.5 text-xs font-bold text-blue-300 border border-blue-700">
                  {currentPatient.asaStatus}
                </span>
                <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-mono text-slate-300 border border-slate-700">
                  {currentPatient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                {currentPatient.age} yrs · {currentPatient.gender} · {currentPatient.weightKg} kg · BMI {currentPatient.bmi} · Mallampati {currentPatient.airway.mallampati} · {currentPatient.procedureName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Surgeon / Facility</div>
                <div className="text-xs font-bold text-slate-200">{currentPatient.surgeon.split(',')[0]}</div>
                <div className="text-[10px] text-slate-400 font-mono">{currentPatient.facility.split(',')[0]}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Dynamic 3-State Traffic Light PAC Clearance Banner */}
        <TrafficLightBanner patient={currentPatient} />

        {/* 6. Live Digital PAC Clearance Card */}
        <DigitalPACCard
          patient={currentPatient}
          attestationRecord={currentAttestation}
          onOpenPrintSlip={onOpenPrintSlip}
          onOpenAttestation={onOpenAttestation}
          onOpenWhatsApp={onOpenWhatsApp}
        />

        {/* 7. TAB CONTENT SECTIONS */}
        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SurgeryCountdown patient={currentPatient} />
              {currentPatient.vitals && currentPatient.vitals.length > 0 && (
                <VitalsTrend vitals={currentPatient.vitals} />
              )}
            </div>

            {drugInteractions.length > 0 && (
              <DrugInteractionAlert interactions={drugInteractions} />
            )}

            <AllergyCard allergies={currentPatient.allergies || []} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              <div className="lg:col-span-12 space-y-6">
                <CountdownTimers medications={currentPatient.medications} />

                <FishboneViewer
                  labs={currentPatient.labs}
                  selectedLabId={selectedLab?.id || null}
                  onSelectLab={(id: string) => {
                    selectLab(id);
                    if (!isProvenanceDrawerOpen) toggleProvenanceDrawer();
                  }}
                />

                <LabAuditTable
                  labs={currentPatient.labs}
                  selectedLabId={selectedLab?.id || null}
                  onSelectLab={(id: string) => {
                    selectLab(id);
                    if (!isProvenanceDrawerOpen) toggleProvenanceDrawer();
                  }}
                  onOpenProvenanceDrawer={() => {
                    if (!isProvenanceDrawerOpen) toggleProvenanceDrawer();
                  }}
                />

                <AirwaySpineModule
                  airway={currentPatient.airway}
                  onUpdateAirway={(airway) => updateAirway(currentPatient.id, airway)}
                />

                <ORReadinessKanban />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: STAT BLOOD LABS & MOBILE IN-OT VIEW */}
        {activeTab === 'blood-labs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span>In-OT Anesthesiologist Phone Screen</span>
                  </h3>
                  <span className="rounded bg-blue-900 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                    Live Mobile Viewport
                  </span>
                </div>
                <MobileAnesthesiaBloodView
                  patientId={currentPatient.id}
                  onOpenAttestation={onOpenAttestation}
                  onOpenWhatsApp={onOpenWhatsApp}
                  onOpenQuestionnaire={() => setActiveTab('questionnaire')}
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

        {/* Tab 3: PRE-OP PATIENT QUESTIONNAIRE */}
        {activeTab === 'questionnaire' && (
          <div className="space-y-6">
            <PatientPreOpQuestionnaire
              patientId={currentPatient.id}
              onSaved={() => {
                // refreshed state
              }}
            />
          </div>
        )}

        {/* Tab 4: REGIONAL & ASRA */}
        {activeTab === 'regional' && (
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

        {/* Tab 5: OT DELAY & NPO DEFENSE */}
        {activeTab === 'ot-defense' && (
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

        {/* Tab 6: PATIENTS ROSTER */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name, MRN, or surgery..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {(['ALL', 'GREEN', 'AMBER', 'RED'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setPatientFilter(filter)}
                      className={'px-3 py-1 rounded text-xs font-bold transition ' + (
                        patientFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabler Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider bg-slate-900/60">
                    <tr>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">MRN / ID</th>
                      <th className="py-2.5 px-3">Procedure</th>
                      <th className="py-2.5 px-3">ASA Class</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredPatients.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => selectPatient(p.id)}
                        className={'hover:bg-slate-700/40 transition cursor-pointer ' + (
                          p.id === currentPatient.id ? 'bg-slate-700/30' : ''
                        )}
                      >
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-200 font-bold text-[11px]">
                            {p.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <span>{p.name}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{p.mrn}</td>
                        <td className="py-3 px-3 text-slate-300">{p.procedureName}</td>
                        <td className="py-3 px-3 font-bold text-blue-300">{p.asaStatus}</td>
                        <td className="py-3 px-3">
                          <span
                            className={'px-2 py-0.5 rounded text-[10px] font-bold ' + (
                              p.overallStatus === 'RED_HARD_STOP'
                                ? 'bg-rose-600 text-white'
                                : p.overallStatus === 'AMBER_CONDITIONAL'
                                ? 'bg-amber-600 text-white'
                                : 'bg-emerald-600 text-white'
                            )}
                          >
                            {p.overallStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectPatient(p.id);
                              setActiveTab('overview');
                            }}
                            className="rounded bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 text-[11px] font-bold transition"
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ClinicalNotes patientId={currentPatient.id} />
              <FHIRExport patient={currentPatient} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-6 px-4 text-center text-xs font-mono text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>Veracity OS v2.5 UAE Sovereign Enclave</span>
          <span>·</span>
          <span>DHA § 3060(a) Statutory Non-Device Exemption</span>
          <span>·</span>
          <span>Tabler UI Solid-Color Standard</span>
        </div>
      </footer>
    </div>
  );
};

export default TablerClinicalDashboard;
`;

fs.writeFileSync(path.join(__dirname, '../components/TablerClinicalDashboard.tsx'), content, 'utf8');
console.log('Successfully generated TablerClinicalDashboard.tsx');
