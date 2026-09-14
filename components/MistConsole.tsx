'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { usePatientStore } from '@/lib/store';
import { cx } from '@/lib/tremor-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/tremor/Card';
import { Badge } from '@/components/tremor/Badge';
import { Button } from '@/components/tremor/Button';
import { Divider } from '@/components/tremor/Divider';
import { ProgressCircle } from '@/components/tremor/ProgressCircle';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/tremor/Table';
import { Callout } from '@/components/tremor/Callout';
import ConsoleFiberBackground from '@/components/ConsoleFiberBackground';

import {
  Activity, Droplets, ClipboardCheck, Stethoscope, Clock, Users,
  FileText, Search, Lock, Share2, Printer, History, Maximize2, Minimize2,
  AlertTriangle, CheckCircle2, HeartPulse, Zap, ShieldCheck, User,
  ChevronRight, Timer, Pill,
} from 'lucide-react';

import LabAuditTable from '@/components/LabAuditTable';
import FishboneViewer from '@/components/FishboneViewer';
import TrafficLightBanner from '@/components/TrafficLightBanner';
import AirwaySpineModule from '@/components/AirwaySpineModule';
import CountdownTimers from '@/components/CountdownTimers';
import AllergyCard from '@/components/AllergyCard';
import { SurgeryCountdown } from '@/components/SurgeryCountdown';
import DrugInteractionAlert from '@/components/DrugInteractionAlert';
import ProvenanceInspector from '@/components/ProvenanceInspector';
import { logAuditEvent } from '@/lib/audit-logger';

type MistNavTab = 'dashboard' | 'blood-labs' | 'regional' | 'ot-defense' | 'notes' | 'patients';

const NAV_ITEMS = [
  { id: 'dashboard' as MistNavTab, label: 'Dashboard', icon: Activity },
  { id: 'blood-labs' as MistNavTab, label: 'Blood Labs', icon: Droplets },
  { id: 'regional' as MistNavTab, label: 'Regional', icon: Stethoscope },
  { id: 'ot-defense' as MistNavTab, label: 'Defense', icon: Clock },
  { id: 'patients' as MistNavTab, label: 'Roster', icon: Users },
  { id: 'notes' as MistNavTab, label: 'Notes', icon: FileText },
];

interface MistConsoleProps {
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp: () => void;
  onOpenAuditDrawer: () => void;
}

export default function MistConsole({
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  onOpenAuditDrawer,
}: MistConsoleProps) {
  const {
    patients, getCurrentPatient, getSelectedLab, selectPatient, selectLab,
    toggleProvenanceDrawer, isProvenanceDrawerOpen,
  } = usePatientStore();

  const currentPatient = getCurrentPatient();
  const selectedLab = getSelectedLab();
  const [activeNav, setActiveNav] = useState<MistNavTab>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const drugInteractions = useMemo(() => {
    if (!currentPatient) return [];
    const { checkDrugInteractions } = require('@/lib/rules-engine');
    return checkDrugInteractions(currentPatient);
  }, [currentPatient]);

  const activeHolds = useMemo(() => {
    let count = 0;
    patients.forEach((p) => {
      p.medications?.forEach((m) => {
        if (m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP') count++;
      });
    });
    return count;
  }, [patients]);

  const npoCompliant = useMemo(() => {
    if (!currentPatient) return 0;
    return currentPatient.medications?.filter((m: any) => m.npoCompliant).length || 0;
  }, [currentPatient]);

  const npoTotal = currentPatient?.medications?.length || 1;
  const attestationCount = usePatientStore((s) => Object.keys(s.attestations).length);
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q));
  }, [patients, searchQuery]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  if (!currentPatient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white font-serif italic text-2xl shadow-xl animate-pulse backdrop-blur-md">V</div>
        <p className="text-sm font-semibold text-white">Loading surgical roster…</p>
      </div>
    );
  }

  const statusPillVariant = (status: string): 'cleared' | 'caution' | 'stop' | 'neutral' => {
    if (status === 'GREEN_CLEARED') return 'cleared';
    if (status === 'AMBER_CONDITIONAL') return 'caution';
    return 'stop';
  };

  return (
    <div className="console-canvas w-full min-h-screen p-0 m-0 text-white/90 font-sans selection:bg-sky-500 selection:text-white">
      <div className="mist-shell w-full min-h-screen rounded-none overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-screen w-full">

          {/* ─── MIST ICON RAIL (76px) ─── */}
          <aside className="mist-rail hidden md:flex w-[76px] shrink-0 flex-col items-center justify-between z-30 py-4" aria-label="Clinical sections">
            <div className="flex flex-col items-center gap-5 w-full px-2">
              <a href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-serif italic text-xl font-bold shadow-md shadow-sky-500/25" title="Home" aria-label="Home">
                V
              </a>
              <nav className="flex flex-col items-center gap-1.5 w-full" aria-label="Sections">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeNav === item.id;
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" onClick={() => setActiveNav(item.id)} title={item.label} aria-label={item.label} aria-current={isActive ? 'page' : undefined}
                      className={cx('mist-rail-btn group relative flex flex-col items-center justify-center w-full py-2.5 rounded-xl cursor-pointer',
                        isActive ? 'mist-rail-active font-bold' : 'text-white/60 hover:text-white/90 hover:bg-white/8'
                      )}>
                      <Icon className={cx('h-[18px] w-[18px]', isActive ? 'text-sky-300' : 'text-white/60 group-hover:text-white/85')} />
                      <span className="text-[10px] font-semibold tracking-tight mt-1 text-center leading-none">{item.label}</span>
                      {item.id === 'patients' && (
                        <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white shadow-xs">{patients.length}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-col items-center gap-2 w-full px-2 pt-3 border-t border-white/15">
              <button type="button" onClick={onOpenAttestation} title="Attestation" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white hover:bg-white/90 text-slate-900 transition cursor-pointer shadow-md shadow-black/30">
                <Lock className="h-4 w-4" />
              </button>
              <button type="button" onClick={onOpenWhatsApp} title="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer">
                <Share2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={onOpenPrintSlip} title="Print" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer">
                <Printer className="h-4 w-4" />
              </button>
              <button type="button" onClick={onOpenAuditDrawer} title="Audit" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer">
                <History className="h-4 w-4" />
              </button>
              <button type="button" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 text-white/80 hover:text-white transition cursor-pointer">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white border border-white/25 font-bold text-[10px] cursor-pointer ring-2 ring-white/25" title="Dr. Tariq Mansoor">
                <span>TM</span>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/30" />
              </div>
            </div>
          </aside>

          {/* ─── MAIN BODY ─── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* ─── MIST HEADER ─── */}
            <header className="mist-header sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-4 flex-1 max-w-2xl min-w-0">
                <div className="hidden sm:flex flex-col leading-none shrink-0">
                  <span className="font-serif italic text-[22px] font-bold tracking-tight text-white">
                    OT <span className="text-sky-300 not-italic">Console</span>
                  </span>
                  <span className="mist-eyebrow mt-1 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    DHA § 3060(a)
                  </span>
                </div>
                <div className="relative flex-1 rounded-full transition">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/45" />
                  <input type="text" placeholder="Search patients, labs, medications…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="mist-input w-full pl-10 pr-4 py-2.5 text-xs font-sans" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-400/30 px-3 py-1.5 text-rose-300 text-[11px] font-bold cursor-pointer hover:bg-rose-500/25 transition">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>PANIC</span>
                </div>
                <button type="button" onClick={() => setNotifOpen(!notifOpen)} className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition cursor-pointer">
                  <Activity className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center rounded-full bg-sky-500 px-1 text-[8px] font-bold text-white shadow-xs">3</span>
                </button>
                <button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white border border-white/25 font-bold text-[10px] cursor-pointer hover:bg-white/25 transition">
                  <User className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* ─── MOBILE NAV ─── */}
            <div className="md:hidden flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-white/10">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => setActiveNav(item.id)}
                    className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer shrink-0',
                      activeNav === item.id ? 'bg-white/18 text-white border border-white/25' : 'text-white/55 hover:text-white/80 border border-transparent'
                    )}>
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* ─── CONTENT ─── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">

              {/* ─── STAT TILES ─── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="mist-tile mist-stat-stagger animate-console-rise p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mist-eyebrow">Cases Today</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-400/20 text-sky-300 border border-sky-300/25"><Activity className="h-4 w-4" /></span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono tracking-tight">{patients.length}</div>
                  <div className="text-[10px] font-mono text-white/50 mt-0.5">active surgical cases</div>
                </div>
                <div className="mist-tile mist-stat-stagger animate-console-rise p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mist-eyebrow">Active Holds</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-300/25"><AlertTriangle className="h-4 w-4" /></span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono tracking-tight">{activeHolds}</div>
                  <div className="text-[10px] font-mono text-white/50 mt-0.5">medication holds</div>
                </div>
                <div className="mist-tile mist-stat-stagger animate-console-rise p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mist-eyebrow">NPO Status</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-300 border border-emerald-300/25"><Timer className="h-4 w-4" /></span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white font-mono tracking-tight">{npoCompliant}</span>
                    <span className="text-sm font-mono text-white/40">/ {npoTotal}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${(npoCompliant / npoTotal) * 100}%` }} />
                  </div>
                </div>
                <div className="mist-tile mist-stat-stagger animate-console-rise p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mist-eyebrow">Attestation</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/20 text-violet-300 border border-violet-300/25"><ShieldCheck className="h-4 w-4" /></span>
                  </div>
                  <ProgressCircle value={attestationCount > 0 ? 100 : 0} size="sm" color="#a78bfa" />
                  <div className="text-[10px] font-mono text-white/50 mt-1.5">{attestationCount > 0 ? 'Signed' : 'Pending'}</div>
                </div>
              </div>

              {/* ─── PATIENT ROSTER STRIP ─── */}
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-1 min-w-max">
                  {filteredPatients.map((p) => {
                    const isActive = p.id === currentPatient.id;
                    return (
                      <button key={p.id} type="button" onClick={() => selectPatient(p.id)}
                        className={cx('mist-tile flex items-center gap-3 px-4 py-3 min-w-[220px] cursor-pointer text-left transition',
                          isActive && 'ring-2 ring-sky-400/50 !border-sky-300/40 !bg-sky-500/12'
                        )}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/20 shrink-0">
                          <User className="h-4 w-4 text-white/70" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                          <div className="text-[10px] font-mono text-white/50 truncate">{p.mrn} · {p.procedureName}</div>
                        </div>
                        <Badge variant={statusPillVariant(p.overallStatus)} className="shrink-0 text-[8px]">
                          {p.overallStatus.replace('_', ' ')}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── TAB CONTENT ─── */}

              {activeNav === 'dashboard' && (
                <div className="space-y-5">
                  <TrafficLightBanner patient={currentPatient} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Card>
                      <CardHeader>
                        <CardTitle>Blood Investigation Console</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <LabAuditTable
                          labs={currentPatient.labs}
                          selectedLabId={selectedLab?.id || null}
                          onSelectLab={selectLab}
                          onOpenProvenanceDrawer={toggleProvenanceDrawer}
                        />
                      </CardContent>
                    </Card>
                    {selectedLab && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Biomarker Detail</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <FishboneViewer labs={currentPatient.labs} selectedLabId={selectedLab?.id || null} onSelectLab={selectLab} />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <CountdownTimers medications={currentPatient.medications} />
                    <AirwaySpineModule airway={currentPatient.airway} onUpdateAirway={(a) => usePatientStore.getState().updateAirway(currentPatient.id, a)} />
                  </div>
                  {drugInteractions.length > 0 && <DrugInteractionAlert interactions={drugInteractions} />}
                  <AllergyCard allergies={currentPatient.allergies || []} />
                </div>
              )}

              {activeNav === 'blood-labs' && (
                <div className="space-y-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>Full Laboratory Audit</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <LabAuditTable
                        labs={currentPatient.labs}
                        selectedLabId={selectedLab?.id || null}
                        onSelectLab={selectLab}
                        onOpenProvenanceDrawer={toggleProvenanceDrawer}
                      />
                    </CardContent>
                  </Card>
                  {selectedLab && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Provenance & Biomarker</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FishboneViewer labs={currentPatient.labs} selectedLabId={selectedLab?.id || null} onSelectLab={selectLab} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeNav === 'regional' && (
                <div className="space-y-5">
                  <AirwaySpineModule airway={currentPatient.airway} onUpdateAirway={(a) => usePatientStore.getState().updateAirway(currentPatient.id, a)} />
                  <AllergyCard allergies={currentPatient.allergies || []} />
                </div>
              )}

              {activeNav === 'ot-defense' && (
                <div className="space-y-5">
                  <CountdownTimers medications={currentPatient.medications} />
                  <SurgeryCountdown patient={currentPatient} />
                  {drugInteractions.length > 0 && <DrugInteractionAlert interactions={drugInteractions} />}
                </div>
              )}

              {activeNav === 'notes' && (
                <div className="space-y-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>Clinical Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea placeholder="Add clinical notes for this case…" rows={8}
                        className="mist-input w-full p-3.5 text-xs font-sans leading-relaxed resize-none rounded-xl" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeNav === 'patients' && (
                <div className="space-y-3">
                  {filteredPatients.map((p) => (
                    <button key={p.id} type="button" onClick={() => { selectPatient(p.id); setActiveNav('dashboard'); }}
                      className="w-full mist-tile flex items-center gap-4 px-5 py-4 cursor-pointer text-left">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 shrink-0">
                        <User className="h-5 w-5 text-white/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] font-mono text-white/50">{p.mrn} · {p.procedureName} · Age {p.age}</div>
                      </div>
                      <Badge variant={statusPillVariant(p.overallStatus)}>
                        {p.overallStatus.replace('_', ' ')}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* ─── PROVENANCE SIDEBAR ─── */}
          {isProvenanceDrawerOpen && activeNav === 'dashboard' && (
            <div className="hidden lg:block w-[380px] shrink-0 border-l border-white/12 overflow-y-auto">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Provenance</span>
                  <button type="button" onClick={toggleProvenanceDrawer} className="text-[10px] text-white/45 hover:text-white transition cursor-pointer">Close</button>
                </div>
                <ProvenanceInspector patient={currentPatient} selectedLab={selectedLab} onSelectLab={selectLab} onClose={toggleProvenanceDrawer} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
