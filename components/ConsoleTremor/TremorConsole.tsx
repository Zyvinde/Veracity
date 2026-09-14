'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { usePatientStore } from '@/lib/store';
import { checkDrugInteractions } from '@/lib/rules-engine';
import type { ClearanceStatus } from '@/lib/types';
import { Card } from '@/components/ui/tremor/components/Card/Card';
import { Badge } from '@/components/ui/tremor/components/Badge/Badge';
import { Button } from '@/components/ui/tremor/components/Button/Button';
import { Divider } from '@/components/ui/tremor/components/Divider/Divider';
import { ProgressCircle } from '@/components/ui/tremor/components/ProgressCircle/ProgressCircle';
import { BarList } from '@/components/ui/tremor/components/BarList/BarList';
import { Callout } from '@/components/ui/tremor/components/Callout/Callout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tremor/components/Tabs/Tabs';
import { Tracker } from '@/components/ui/tremor/components/Tracker/Tracker';
import {
  Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell,
} from '@/components/ui/tremor/components/Table/Table';

import {
  Activity, Droplets,   ClipboardCheck, Stethoscope, Clock, Users,
  FileText, Search, Lock, Share2, Printer, History, Maximize2, Minimize2,
  AlertTriangle, CheckCircle2, HeartPulse, User, ChevronRight,
} from 'lucide-react';

import { PaneErrorBoundary } from './PaneErrorBoundary';
import TrafficLightBanner from '@/components/TrafficLightBanner';
import AirwaySpineModule from '@/components/AirwaySpineModule';
import type { AirwayExam } from '@/lib/types';
import CountdownTimers from '@/components/CountdownTimers';
import AllergyCard from '@/components/AllergyCard';
import { SurgeryCountdown } from '@/components/SurgeryCountdown';
import DrugInteractionAlert from '@/components/DrugInteractionAlert';
import ProvenanceInspector from '@/components/ProvenanceInspector';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import ClinicalNotes from '@/components/ClinicalNotes';

// Recharts-backed panes are code-split: they only load when their tab opens.
const LabsPane = dynamic(() => import('./panes/LabsPane').then((m) => m.LabsPane), {
  ssr: false,
  loading: () => <PaneFallback label="Loading laboratory console…" />,
});
const VitalsPane = dynamic(() => import('./panes/VitalsPane').then((m) => m.VitalsPane), {
  ssr: false,
  loading: () => <PaneFallback label="Loading telemetry…" />,
});

function PaneFallback({ label }: { label: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">{label}</p>
    </Card>
  );
}

type ConsoleTab = 'dashboard' | 'labs' | 'vitals' | 'defense' | 'regional' | 'intake' | 'notes' | 'roster';

const NAV_ITEMS: { id: ConsoleTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'labs', label: 'Blood Labs', icon: Droplets },
  { id: 'vitals', label: 'Vitals', icon: HeartPulse },
  { id: 'defense', label: 'Defense', icon: Clock },
  { id: 'regional', label: 'Regional', icon: Stethoscope },
  { id: 'intake', label: 'Intake', icon: ClipboardCheck },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'roster', label: 'Roster', icon: Users },
];

function statusBadgeVariant(status: ClearanceStatus): 'success' | 'warning' | 'error' {
  if (status === 'GREEN_CLEARED') return 'success';
  if (status === 'AMBER_CONDITIONAL') return 'warning';
  return 'error';
}

export interface TremorConsoleProps {
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp: () => void;
  onOpenAuditDrawer: () => void;
}

export default function TremorConsole({
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  onOpenAuditDrawer,
}: TremorConsoleProps) {
  const {
    patients, getCurrentPatient, getSelectedLab, selectPatient, selectLab,
    toggleProvenanceDrawer, isProvenanceDrawerOpen,
  } = usePatientStore();

  const currentPatient = getCurrentPatient();
  const selectedLab = getSelectedLab();
  const attestations = usePatientStore((s) => s.attestations);
  const [activeTab, setActiveTab] = useState<ConsoleTab>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const drugInteractions = useMemo(
    () => (currentPatient ? checkDrugInteractions(currentPatient.medications) : []),
    [currentPatient]
  );

  const activeHolds = useMemo(() => {
    let count = 0;
    patients.forEach((p) => {
      p.medications?.forEach((m) => {
        if (m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP') count++;
      });
    });
    return count;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const rosterBars = useMemo(
    () =>
      patients.map((p) => ({
        name: `${p.name} · ${p.mrn}`,
        value: p.labs.length,
        patientId: p.id,
      })),
    [patients]
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  if (!currentPatient || patients.length === 0) {
    return (
      <div className="dark min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Loading surgical roster…</p>
      </div>
    );
  }

  const attested = Boolean(attestations[currentPatient.id]);

  return (
    // Scoped `dark` forces Tremor Raw dark surfaces regardless of global theme.
    <div className="dark min-h-screen p-3 sm:p-6 lg:p-8 font-sans overflow-x-clip">
      {/* Mist-blue fog washes over the blurred fiber backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#c3d5e2]/25 via-[#9db4c6]/15 to-[#54687c]/30" />
        <div className="absolute inset-0 bg-sky-200/10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1560px] min-w-0 overflow-x-clip">
        <div className="flex flex-col md:flex-row gap-4 min-h-[960px]">
          {/* ── Icon rail ── */}
          <aside
            className="hidden md:flex w-[76px] shrink-0 flex-col items-center justify-between py-4 rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-[#0b1220]/70"
            aria-label="Clinical sections"
          >
            <div className="flex flex-col items-center gap-4 w-full px-2">
              <a
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 font-serif italic text-xl font-bold text-white shadow-md"
                title="Back to Veracity home"
              >
                V
              </a>
              <nav className="flex flex-col items-center gap-1 w-full" aria-label="Sections">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex flex-col items-center justify-center w-full py-2 rounded-lg text-[10px] font-semibold transition ${
                        isActive
                          ? 'bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-300'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      <span className="mt-1 leading-none">{item.label}</span>
                      {item.id === 'roster' && (
                        <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] font-bold text-white">
                          {patients.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-col items-center gap-2 w-full px-2 pt-3 border-t border-gray-200 dark:border-white/10">
              <Button variant="primary" onClick={onOpenAttestation} title="1-Tap DHA PAC Attestation" className="h-9 w-9 !p-0">
                <Lock className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={onOpenWhatsApp} title="Dispatch WhatsApp PAC Link" className="h-9 w-9 !p-0">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={onOpenPrintSlip} title="Print PAC Attestation Slip" className="h-9 w-9 !p-0">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={onOpenAuditDrawer} title="Audit Logs" className="h-9 w-9 !p-0">
                <History className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={toggleFullscreen} title="Fullscreen" className="h-9 w-9 !p-0">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <div
                className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-900 border border-sky-200 font-bold text-[10px] relative dark:bg-white/15 dark:text-white dark:border-white/25"
                title="Dr. Tariq Mansoor · Consultant Anaesthetist"
              >
                TM
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1220]" />
              </div>
            </div>
          </aside>

          {/* ── Main column ── */}
          <div className="flex-1 flex flex-col min-w-0 gap-4">
            {/* ── Header ── */}
            <Card className="!p-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                <div className="flex items-center gap-4 flex-1 max-w-2xl min-w-0">
                  <div className="hidden sm:flex flex-col leading-none shrink-0">
                    <span className="font-serif italic text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">
                      OT <span className="not-italic text-sky-700 dark:text-sky-300">Console</span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700/80 dark:text-sky-300/90">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      DHA § 3060(a)
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients, labs, medications…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                    <Badge variant="error">PANIC</Badge>
                  </span>
                  <span className="hidden sm:inline font-mono text-[11px] text-gray-500 dark:text-white/50">
                    {currentPatient.mrn}
                  </span>
                </div>
              </div>
            </Card>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConsoleTab)}>
              <Card className="!py-0 overflow-x-auto">
                <TabsList variant="line" className="w-full justify-start gap-1 px-3 border-gray-200 dark:border-white/10">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-1.5 font-sans">
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Card>

              {/* ═══ DASHBOARD ═══ */}
              <TabsContent value="dashboard" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
                  <Card className="p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-sky-200/70">Cases Today</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-white">{patients.length}</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">active surgical cases</p>
                  </Card>
                  <Card className="p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-sky-200/70">Active Holds</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-white">{activeHolds}</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">medication holds</p>
                  </Card>
                  <Card className="p-4 flex items-center gap-3">
                    <ProgressCircle value={attested ? 100 : 0} variant={attested ? 'success' : 'neutral'} radius={26} strokeWidth={6}>
                      <span className="font-mono text-[10px] font-bold">{attested ? '100%' : '0%'}</span>
                    </ProgressCircle>
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-sky-200/70">Attestation</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{attested ? 'Signed' : 'Pending'}</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-sky-200/70">Drug Alerts</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-white">{drugInteractions.length}</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">interactions flagged</p>
                  </Card>
                </div>

                <TrafficLightBanner patient={currentPatient} />

                {drugInteractions.length > 0 && <DrugInteractionAlert interactions={drugInteractions} />}

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 [&>*]:min-w-0">
                  <Card className="xl:col-span-3 p-0 overflow-hidden min-w-0">
                    <div className="px-5 pt-4 pb-1">
                      <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Surgical Roster</h3>
                      <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">labs per case · click to open</p>
                    </div>
                    <div className="p-4 tremor-subtle-bars">
                      <BarList
                        data={rosterBars}
                        valueFormatter={(v) => `${v} labs`}
                        sortOrder="none"
                        onValueChange={(bar: { patientId?: string }) => {
                          if (bar.patientId) selectPatient(bar.patientId);
                        }}
                      />
                    </div>
                  </Card>
                  <Card className="xl:col-span-2 p-5">
                    <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Current Case</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{currentPatient.name}</p>
                    <p className="font-mono text-[11px] text-gray-500 dark:text-white/50">
                      {currentPatient.mrn} · {currentPatient.procedureName}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={statusBadgeVariant(currentPatient.overallStatus)}>
                        {currentPatient.overallStatus.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="neutral">{currentPatient.asaStatus}</Badge>
                      <Badge variant="neutral">{currentPatient.swimLane.replace(/_/g, ' ')}</Badge>
                    </div>
                    <Divider className="my-4" />
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-white/70">{currentPatient.primaryActionDirective}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="primary" onClick={onOpenAttestation}>
                        <Lock className="h-3.5 w-3.5" /> Attest
                      </Button>
                      <Button variant="secondary" onClick={onOpenWhatsApp}>
                        <Share2 className="h-3.5 w-3.5" /> WhatsApp
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 [&>*]:min-w-0">
                  <Card className="p-5 min-w-0">
                    <CountdownTimers medications={currentPatient.medications} />
                  </Card>
                  <Card className="p-5 min-w-0">
                    <AllergyCard allergies={currentPatient.allergies || []} />
                  </Card>
                </div>

                <SurgeryCountdown patient={currentPatient} />
              </TabsContent>

              {/* ═══ LABS (code-split charts) ═══ */}
              <TabsContent value="labs" className="mt-4">
                <PaneErrorBoundary paneName="Laboratory">
                  <LabsPane
                    patient={currentPatient}
                    selectedLabId={selectedLab?.id || null}
                    onSelectLab={selectLab}
                    onOpenProvenance={toggleProvenanceDrawer}
                  />
                </PaneErrorBoundary>
              </TabsContent>

              {/* ═══ VITALS (code-split charts) ═══ */}
              <TabsContent value="vitals" className="mt-4">
                <PaneErrorBoundary paneName="Vitals telemetry">
                  <VitalsPane patient={currentPatient} />
                </PaneErrorBoundary>
              </TabsContent>

              {/* ═══ DEFENSE ═══ */}
              <TabsContent value="defense" className="mt-4 space-y-4">
                <Card className="p-5">
                  <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Perioperative Defense Board</h3>
                  <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">hold status per medication · hover for detail</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      {/* Tracker blocks colored by hold status */}
                      <DefenseTracker patient={currentPatient} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 font-mono text-[10px] text-gray-500 dark:text-white/50">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> CLEARED</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> HOLD REQUIRED</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> HARD STOP</span>
                  </div>
                </Card>
                <Card className="p-0 overflow-hidden">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Medication</TableHeaderCell>
                        <TableHeaderCell>Schedule</TableHeaderCell>
                        <TableHeaderCell>Hold Progress</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentPatient.medications.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.drugName}</TableCell>
                          <TableCell className="font-mono text-[11px]">{m.dosageSchedule}</TableCell>
                          <TableCell className="font-mono text-[11px]">
                            {m.lastDoseHoursAgo}h / {m.requiredHoldHours}h
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                m.status === 'CLEARED' ? 'success' : m.status === 'HOLD_REQUIRED' ? 'warning' : 'error'
                              }
                            >
                              {m.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
                {drugInteractions.length > 0 && <DrugInteractionAlert interactions={drugInteractions} />}
                <SurgeryCountdown patient={currentPatient} />
              </TabsContent>

              {/* ═══ REGIONAL ═══ */}
              <TabsContent value="regional" className="mt-4 space-y-4">
                <Card className="p-5">
                  <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Airway Risk Summary</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="neutral">Mallampati {currentPatient.airway.mallampati}</Badge>
                    <Badge variant="neutral">{currentPatient.airway.mouthOpeningCm} cm opening</Badge>
                    <Badge variant="neutral">{currentPatient.airway.neckMobility} neck</Badge>
                    <Badge
                      variant={
                        currentPatient.airway.riskTier === 'LOW'
                          ? 'success'
                          : currentPatient.airway.riskTier === 'MODERATE'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {currentPatient.airway.riskTier} RISK
                    </Badge>
                  </div>
                  {currentPatient.airway.riskTier !== 'LOW' && (
                    <div className="mt-3">
                      <Callout title="Difficult airway precautions" variant="warning" icon={AlertTriangle}>
                        Mallampati {currentPatient.airway.mallampati} with {currentPatient.airway.riskTier} risk tier —
                        ensure video laryngoscopy and difficult-airway trolley in theatre.
                      </Callout>
                    </div>
                  )}
                </Card>
                <AirwaySpineModule
                  airway={currentPatient.airway}
                  onUpdateAirway={(a: AirwayExam) => usePatientStore.getState().updateAirway(currentPatient.id, a)}
                />
                <AllergyCard allergies={currentPatient.allergies || []} />
              </TabsContent>

              {/* ═══ INTAKE ═══ */}
              <TabsContent value="intake" className="mt-4">
                <Card className="p-5">
                  <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Pre-Op Questionnaire</h3>
                  <p className="font-mono text-[11px] text-gray-500 dark:text-sky-200/60">
                    {currentPatient.questionnaireUpdatedAtIso
                      ? `Last synced ${new Date(currentPatient.questionnaireUpdatedAtIso).toLocaleString()}`
                      : 'Not yet completed for this case'}
                  </p>
                  <div className="mt-3">
                    <PatientPreOpQuestionnaire patientId={currentPatient.id} />
                  </div>
                </Card>
              </TabsContent>

              {/* ═══ NOTES ═══ */}
              <TabsContent value="notes" className="mt-4">
                <Card className="p-5">
                  <h3 className="font-serif text-base font-bold text-gray-900 dark:text-white">Clinical Notes</h3>
                  <div className="mt-3">
                    <ClinicalNotes patientId={currentPatient.id} />
                  </div>
                </Card>
              </TabsContent>

              {/* ═══ ROSTER ═══ */}
              <TabsContent value="roster" className="mt-4">
                <Card className="p-0 overflow-hidden">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Patient</TableHeaderCell>
                        <TableHeaderCell>Procedure</TableHeaderCell>
                        <TableHeaderCell>ASA</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell><span className="sr-only">Open</span></TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(searchQuery.trim() ? filteredPatients : patients).map((p) => (
                        <TableRow
                          key={p.id}
                          className={`cursor-pointer ${p.id === currentPatient.id ? 'bg-sky-50 dark:bg-sky-400/10' : ''}`}
                          onClick={() => {
                            selectPatient(p.id);
                            setActiveTab('dashboard');
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/70">
                                <User className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="block font-medium">{p.name}</span>
                                <span className="block font-mono text-[10px] text-gray-500 dark:text-white/45">{p.mrn}</span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate">{p.procedureName}</TableCell>
                          <TableCell className="font-mono text-[11px]">{p.asaStatus}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(p.overallStatus)}>
                              {p.overallStatus.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-white/30" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>

            {/* ── Provenance ── */}
            {isProvenanceDrawerOpen && (
              <Card className="p-5 min-w-0">
                <div className="flex items-center justify-end">
                  <Button variant="secondary" onClick={toggleProvenanceDrawer} className="!py-1.5 !px-3 text-xs">
                    Close
                  </Button>
                </div>
                <div className="mt-3">
                  <ProvenanceInspector
                    patient={currentPatient}
                    selectedLab={selectedLab}
                    onSelectLab={selectLab}
                    onClose={toggleProvenanceDrawer}
                  />
                </div>
              </Card>
            )}

            {/* ── Footer strip ── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pb-2 font-mono text-[10px] text-gray-400 dark:text-white/35">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Rules engine verified
              </span>
              <span>DHA § 3060(a)</span>
              <span>Dr. Tariq Mansoor · Consultant Anaesthetist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefenseTracker({ patient }: { patient: { medications: { id: string; drugName: string; status: string; lastDoseHoursAgo: number; requiredHoldHours: number }[] } }) {
  const colorFor = (s: string) =>
    s === 'CLEARED' ? 'bg-emerald-500' : s === 'HOLD_REQUIRED' ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <Tracker
      hoverEffect
      data={patient.medications.map((m) => ({
        key: m.id,
        color: colorFor(m.status),
        tooltip: `${m.drugName} — ${m.status.replace(/_/g, ' ')} (${m.lastDoseHoursAgo}h/${m.requiredHoldHours}h)`,
      }))}
    />
  );
}
