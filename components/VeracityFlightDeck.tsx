'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientStore, CLINICIANS } from '@/lib/store';
import { computeFastingCompliance } from '@/lib/rules-engine';
import type { ClearanceStatus, ExtractedLabItem, PatientCase, VitalsTrend } from '@/lib/types';
import { CommandPalette } from '@/components/CommandPalette';
import { PreOpSections } from '@/components/ConsolePreOp';
import { LabsPlusSections } from '@/components/ConsoleLabsPlus';
import { FlowSections } from '@/components/ConsoleFlow';
import ProvenanceInspectorModal, { labItemToModalProps } from '@/components/ProvenanceInspectorModal';
import { logAuditEvent } from '@/lib/audit-logger';
import { RULES_ENGINE_VERSION } from '@/lib/constants';
import type { AttestationRecord } from '@/lib/types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Droplet,
  FileCheck2,
  FileText,
  Grid,
  Maximize2,
  Minimize2,
  Pill,
  Plus,
  Printer,
  Search,
  Share2,
  ShieldCheck,
  History,
  Users,
} from 'lucide-react';

interface VeracityFlightDeckProps {
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp: () => void;
  onOpenAuditDrawer: () => void;
}

const STATUS_META: Record<ClearanceStatus, { label: string; dot: string; pill: string }> = {
  GREEN_CLEARED: { label: 'Cleared', dot: 'bg-[#1c7a3d]', pill: 'veracity-status-cleared' },
  AMBER_CONDITIONAL: { label: 'Conditional', dot: 'bg-[#9a6700]', pill: 'veracity-status-conditional' },
  RED_HARD_STOP: { label: 'Hard stop', dot: 'bg-[#b3261e]', pill: 'veracity-status-stop' },
};

function getInitials(name: string): string {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function dayGreeting(nowMs: number): string {
  const h = new Date(nowMs).getHours();
  if (h < 5) return 'Night roster';
  if (h < 12) return 'Morning roster';
  if (h < 17) return 'Afternoon roster';
  if (h < 21) return 'Evening roster';
  return 'Night roster';
}

function formatCountdown(hoursUntil: number): string {
  if (!Number.isFinite(hoursUntil) || hoursUntil < 0) return '--:--';
  const totalMinutes = Math.floor(hoursUntil * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function microBarPosition(lab: ExtractedLabItem): number {
  const span = lab.refHigh - lab.refLow;
  if (!Number.isFinite(span) || span <= 0) return 50;
  const extendedLow = lab.refLow - span * 0.6;
  const extendedHigh = lab.refHigh + span * 0.6;
  const pos = ((lab.value - extendedLow) / (extendedHigh - extendedLow)) * 100;
  return Math.max(2, Math.min(98, pos));
}

function microBarRefWindow(lab: ExtractedLabItem): { left: number; width: number } {
  const span = lab.refHigh - lab.refLow;
  if (!Number.isFinite(span) || span <= 0) return { left: 30, width: 40 };
  const extendedLow = lab.refLow - span * 0.6;
  const extendedSpan = span * 2.2;
  return {
    left: ((lab.refLow - extendedLow) / extendedSpan) * 100,
    width: (span / extendedSpan) * 100,
  };
}

function hrSparklinePoints(vitals: VitalsTrend[], width: number, height: number): string {
  const hrs = vitals.slice(-24).map((v) => v.heartRate).filter((n) => Number.isFinite(n));
  if (hrs.length < 2) return '';
  const min = Math.min(...hrs);
  const max = Math.max(...hrs);
  const span = max - min || 1;
  return hrs
    .map(
      (h, i) =>
        `${((i / (hrs.length - 1)) * width).toFixed(1)},${(height - 3 - ((h - min) / span) * (height - 6)).toFixed(1)}`
    )
    .join(' ');
}

const PRIORITY_LAB_ORDER = [
  'potassium',
  'hemoglobin',
  'creatinine',
  'platelet',
  'inr',
  'glucose',
  'hba1c',
  'sodium',
];

function sortLabsForTelemetry(labs: ExtractedLabItem[]): ExtractedLabItem[] {
  return [...labs].sort((a, b) => {
    const ai = PRIORITY_LAB_ORDER.findIndex((k) => a.name.toLowerCase().includes(k));
    const bi = PRIORITY_LAB_ORDER.findIndex((k) => b.name.toLowerCase().includes(k));
    const rankA = ai === -1 ? 99 : ai;
    const rankB = bi === -1 ? 99 : bi;
    if (rankA !== rankB) return rankA - rankB;
    const critA = a.status.startsWith('CRITICAL') ? 0 : a.status.startsWith('BORDERLINE') ? 1 : 2;
    const critB = b.status.startsWith('CRITICAL') ? 0 : b.status.startsWith('BORDERLINE') ? 1 : 2;
    return critA - critB;
  });
}

export const VeracityFlightDeck: React.FC<VeracityFlightDeckProps> = ({
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  onOpenAuditDrawer,
}) => {
  const patients = usePatientStore((s) => s.patients);
  const currentPatientId = usePatientStore((s) => s.currentPatientId);
  const selectPatient = usePatientStore((s) => s.selectPatient);
  const selectLab = usePatientStore((s) => s.selectLab);
  const setProvenanceDrawerOpen = usePatientStore((s) => s.setProvenanceDrawerOpen);
  const attestations = usePatientStore((s) => s.attestations);
  const activeClinicianId = usePatientStore((s) => s.activeClinicianId);
  const addAttestation = usePatientStore((s) => s.addAttestation);
  const uploadedPdfDataUrl = usePatientStore((s) => s.uploadedPdfDataUrl);

  const [commandOpen, setCommandOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [inspectedLabId, setInspectedLabId] = useState<string | null>(null);

  const currentPatient: PatientCase | undefined = useMemo(
    () => patients.find((p) => p.id === currentPatientId) ?? patients[0],
    [patients, currentPatientId]
  );

  const activeClinicianEarly = CLINICIANS.find((c) => c.id === activeClinicianId) ?? CLINICIANS[0];

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const openProvenanceForLab = useCallback(
    (lab: ExtractedLabItem) => {
      if (!currentPatient) return;
      selectLab(lab.id);
      setInspectedLabId(lab.id);
    },
    [currentPatient, selectLab]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (typing) return;
      // Don't hijack keyboard when user holds modifiers, uses screen-reader keys, or a modal is open.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const idx = patients.findIndex((p) => p.id === currentPatientId);
        if (idx === -1) return;
        const next = e.key === 'ArrowRight' ? (idx + 1) % patients.length : (idx - 1 + patients.length) % patients.length;
        e.preventDefault();
        selectPatient(patients[next].id);
        return;
      }
      const num = Number.parseInt(e.key, 10);
      if (Number.isInteger(num) && num >= 1 && num <= Math.min(9, patients.length)) {
        selectPatient(patients[num - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [patients, currentPatientId, selectPatient]);

  const counts = useMemo(() => {
    let cleared = 0;
    let conditional = 0;
    let stop = 0;
    let holds = 0;
    for (const p of patients) {
      if (p.overallStatus === 'GREEN_CLEARED') cleared += 1;
      else if (p.overallStatus === 'AMBER_CONDITIONAL') conditional += 1;
      else stop += 1;
      for (const m of p.medications) {
        if (m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP') holds += 1;
      }
    }
    return { cleared, conditional, stop, holds, total: patients.length };
  }, [patients]);

  const attestedCount = useMemo(() => {
    const ids = new Set(Object.keys(attestations));
    return patients.filter((p) => ids.has(p.id)).length;
  }, [patients, attestations]);

  const fasting = useMemo(() => {
    if (!currentPatient) return null;
    try {
      return computeFastingCompliance(currentPatient.scheduledTimeIso, new Date(nowMs));
    } catch {
      return null;
    }
  }, [currentPatient, nowMs]);

  const telemetryLabs = useMemo(
    () => (currentPatient ? sortLabsForTelemetry(currentPatient.labs).slice(0, 8) : []),
    [currentPatient]
  );

  const latestVitals = useMemo(() => {
    const v = currentPatient?.vitals;
    if (!v || v.length === 0) return null;
    return v[v.length - 1];
  }, [currentPatient]);

  const hrSparkline = useMemo(() => {
    if (!currentPatient?.vitals) return '';
    return hrSparklinePoints(currentPatient.vitals, 120, 36);
  }, [currentPatient]);

  const hardStopPatients = useMemo(() => patients.filter((p) => p.overallStatus === 'RED_HARD_STOP'), [patients]);

  const wasteEstimate = useMemo(() => {
    const avoidedMinutes = counts.stop * 45 + counts.conditional * 15;
    const recoveredUsd = (avoidedMinutes / 60) * 1200;
    return { avoidedMinutes, recoveredUsd };
  }, [counts]);

  const activeClinician = activeClinicianEarly;
  const currentMeta = currentPatient ? STATUS_META[currentPatient.overallStatus] : null;

  const inspectedLab = useMemo(
    () => telemetryLabs.find((l) => l.id === inspectedLabId) ?? null,
    [telemetryLabs, inspectedLabId]
  );

  const handleProvenanceVerify = useCallback(
    (verification: { verifierName: string; timestampIso: string; signatureHash: string }) => {
      if (!currentPatient || !inspectedLab) return;
      const record: AttestationRecord = {
        patientId: currentPatient.id,
        anesthesiologistName: verification.verifierName,
        licenseNumber: activeClinicianEarly?.license ?? 'UNVERIFIED',
        timestampIso: verification.timestampIso,
        signatureHash: verification.signatureHash,
        jurisdiction: 'UAE_MOHAP_DHA',
        acceptedClauses: [`Provenance verified: ${inspectedLab.name} (${inspectedLab.loinc}) from ${inspectedLab.provenance.documentName}`],
        rulesEngineVersion: RULES_ENGINE_VERSION,
      };
      addAttestation(record);
      logAuditEvent('ATTESTATION_SIGNED', currentPatient.id, `Provenance attested for ${inspectedLab.name} by ${verification.verifierName}`);
      setProvenanceDrawerOpen(true);
    },
    [currentPatient, inspectedLab, activeClinicianEarly, addAttestation, setProvenanceDrawerOpen]
  );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="harvey-dashboard flex min-h-screen w-full text-[#1a1a1a]">
      <nav aria-label="Console sections" className="hidden w-[68px] shrink-0 flex-col items-center gap-1.5 border-r border-[#1a1a1a]/[0.08] bg-white/70 py-4 backdrop-blur-xl md:flex">
        <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a] font-serif text-[22px] italic text-white">
          V
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <button type="button" onClick={() => scrollTo('veracity-roster')} aria-label="Surgical roster" title="Roster" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <Activity size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollTo('veracity-vitals')} aria-label="Vitals" title="Vitals" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <Clock3 size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollTo('veracity-checklist')} aria-label="Checklist" title="Checklist" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <FileText size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollTo('veracity-fishbone')} aria-label="Fishbone labs" title="Fishbone" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <Droplet size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollTo('veracity-kanban')} aria-label="OR kanban" title="Kanban" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <Grid size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={onOpenAuditDrawer} aria-label="Audit trail" title="Audit" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <History size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={onOpenIngestion} aria-label="Ingest document" title="Ingest" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            <Plus size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title="Fullscreen" className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-[10px] border border-black/10 text-[#6b706b] hover:bg-black/[0.04] hover:text-black">
            {isFullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
          </button>
          <button type="button" onClick={onOpenAttestation} aria-label={`Attest as ${activeClinician.name}`} title={activeClinician.name} className="veracity-focus veracity-press flex h-10 w-10 items-center justify-center rounded-full border border-[#1a1a1a]/20 bg-[#1a1a1a]/[0.05] text-[13px] font-semibold text-[#1a1a1a]">
            {activeClinician.initials}
          </button>
        </div>
      </nav>

      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <header className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-[background-color,border-color] duration-200 ${headerScrolled ? 'border-[#1a1a1a]/[0.12] bg-[#fafaf8]/90' : 'border-[#1a1a1a]/[0.08] bg-[#fafaf8]/75'}`}>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="veracity-focus veracity-press veracity-ui-label flex min-w-0 flex-1 items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-left text-[13px] text-[#6b706b] shadow-sm hover:border-black/20 hover:text-black sm:max-w-md"
              aria-label="Open command palette"
            >
              <Search size={15} aria-hidden="true" className="shrink-0 text-[#9a9ea6]" />
              <span className="truncate">Search patients, labs, actions…</span>
              <kbd className="veracity-num ml-auto hidden rounded-md border border-black/10 bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-[#6b706b] sm:inline">⌘K</kbd>
            </button>
            <span className="veracity-num inline-flex items-center gap-1.5 rounded-full border border-[#9a6700]/30 bg-[#9a6700]/[0.08] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#7a5200]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#9a6700]" />
              MVP PROTOTYPE · NOT FOR CLINICAL USE
            </span>
            {hardStopPatients.length > 0 ? (
              <button type="button" onClick={() => hardStopPatients[0] && selectPatient(hardStopPatients[0].id)} className="veracity-focus veracity-press veracity-num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold veracity-status-stop" aria-label={`${hardStopPatients.length} hard stops, review first`}>
                <AlertTriangle size={12} aria-hidden="true" />
                {hardStopPatients.length} HARD STOP{hardStopPatients.length === 1 ? '' : 'S'}
              </button>
            ) : (
              <span className="veracity-num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold veracity-status-cleared">
                <CheckCircle2 size={12} aria-hidden="true" />
                NO HARD STOPS
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={onOpenWhatsApp} aria-label="Share PAC update" className="veracity-focus veracity-press rounded-full border border-black/10 bg-white p-2 text-[#6b706b] shadow-sm hover:bg-black/[0.04] hover:text-black">
                <Share2 size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={onOpenPrintSlip} aria-label="Print PAC slip" className="veracity-focus veracity-press rounded-full border border-black/10 bg-white p-2 text-[#6b706b] shadow-sm hover:bg-black/[0.04] hover:text-black">
                <Printer size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={onOpenAttestation} className="veracity-focus veracity-press veracity-ui-label inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-4 py-2 text-[13px] font-semibold text-white hover:bg-black">
                <FileCheck2 size={15} aria-hidden="true" />
                Attest
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] space-y-8 px-4 py-5 sm:px-6 sm:py-6">
          <section aria-label="Day masthead" className="veracity-fade-up">
            <p className="veracity-eyebrow">
              Veracity OT Console · {new Date(nowMs).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {activeClinician.name}
            </p>
            <h1 className="veracity-serif-accent mt-2 text-[32px] leading-[1.1] text-[#1a1a1a] sm:text-[38px]" style={{ letterSpacing: '-0.035em' }}>
              {dayGreeting(nowMs)}, <span className="italic">in focus.</span>
            </h1>
            <p className="veracity-ui-label mt-2 text-[13px] text-[#6b706b]">
              {counts.total} cases on the board · {counts.stop > 0 ? `${counts.stop} hard stop${counts.stop === 1 ? '' : 's'} need${counts.stop === 1 ? 's' : ''} you first` : 'no hard stops'} · {counts.holds} active medication holds
            </p>
          </section>

          <section aria-label="Executive metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="veracity-card veracity-fade-up veracity-stagger-1 p-4">
              <div className="flex items-center justify-between">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Cases today</p>
                <span className="veracity-chip veracity-chip-tint-sky h-7 w-7" aria-hidden="true"><Users size={14} className="text-[#1a1a1a]" /></span>
              </div>
              <p className="veracity-num mt-2 text-[34px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{counts.total}</p>
              <p className="veracity-num mt-2.5 flex flex-wrap gap-1.5 text-[10.5px]">
                <span className="rounded-full px-2 py-0.5 veracity-status-cleared">{counts.cleared} cleared</span>
                <span className="rounded-full px-2 py-0.5 veracity-status-conditional">{counts.conditional} cond</span>
                <span className="rounded-full px-2 py-0.5 veracity-status-stop">{counts.stop} stop</span>
              </p>
            </div>
            <div className="veracity-card veracity-fade-up veracity-stagger-2 p-4">
              <div className="flex items-center justify-between">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Active med holds</p>
                <span className="veracity-chip veracity-chip-tint-amber h-7 w-7" aria-hidden="true"><Pill size={14} className="text-[#7a5200]" /></span>
              </div>
              <p className="veracity-num mt-2 text-[34px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{counts.holds}</p>
              <p className="veracity-ui-label mt-2.5 text-[12px] leading-snug text-[#6b706b]">Hold-required plus hard-stop clocks across roster.</p>
            </div>
            <div className="veracity-card veracity-fade-up veracity-stagger-3 p-4">
              <div className="flex items-center justify-between">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">NPO chronometer</p>
                <span className="veracity-chip h-7 w-7" aria-hidden="true"><Clock3 size={14} className="text-[#6b706b]" /></span>
              </div>
              <p className="veracity-num mt-2 text-[34px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{fasting ? formatCountdown(fasting.hoursUntilSurgery) : '--:--'}</p>
              <p className="veracity-ui-label mt-2.5 line-clamp-2 text-[12px] leading-snug text-[#6b706b]">{fasting ? fasting.recommendation : 'Select a case to compute fasting status.'}</p>
            </div>
            <div className="veracity-card veracity-fade-up veracity-stagger-4 p-4">
              <div className="flex items-center justify-between">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Attestation</p>
                <span className="veracity-chip veracity-chip-tint-green h-7 w-7" aria-hidden="true"><FileCheck2 size={14} className="text-[#1c7a3d]" /></span>
              </div>
              <p className="veracity-num mt-2 text-[34px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{counts.total === 0 ? '—' : `${Math.round((attestedCount / counts.total) * 100)}%`}</p>
              <p className="veracity-num mt-2.5 text-[12px] text-[#6b706b]">{attestedCount}/{counts.total} cases attested</p>
            </div>
          </section>

          <section id="veracity-roster" aria-label="Surgical day roster" className="veracity-fade-up scroll-mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="veracity-eyebrow">01 — Board</p>
                <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Surgical day <span className="italic">roster</span></h2>
              </div>
              <p className="veracity-num text-[11px] text-[#9a9ea6]">← → or 1–9 to move</p>
            </div>
            <div role="listbox" aria-label="Patients" aria-orientation="horizontal" className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {patients.map((p, idx) => {
                const meta = STATUS_META[p.overallStatus];
                const active = p.id === currentPatient?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectPatient(p.id)}
                    style={{ transition: 'background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out' }}
                    className={`veracity-focus flex w-[216px] shrink-0 flex-col gap-2 rounded-2xl border p-3 text-left ${active ? 'border-[#1a1a1a] bg-[#1a1a1a]/[0.04] shadow-sm' : 'veracity-tile hover:border-black/[0.16]'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] text-[11px] font-semibold text-[#1a1a1a]">
                        {getInitials(p.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="veracity-ui-label block truncate text-[13.5px] font-medium text-[#1a1a1a]">{p.name}</span>
                        <span className="veracity-num block truncate text-[10.5px] text-[#6b706b]">{String(idx + 1).padStart(2, '0')} · {p.mrn}</span>
                      </span>
                      <span aria-hidden="true" className={`ml-auto h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                    </span>
                    <span className="veracity-num truncate text-[11px] text-[#6b706b]">{p.procedureName}</span>
                    <span className={`veracity-num w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.pill}`}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            {currentPatient && currentMeta && (
              <div className="veracity-tile mt-3 flex flex-wrap items-center gap-2.5 p-3.5">
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${currentMeta.dot}`} />
                <p className="veracity-ui-label min-w-0 flex-1 text-[13px] leading-snug text-[#1a1a1a]">{currentPatient.primaryActionDirective}</p>
                <span className="veracity-num hidden text-[11px] text-[#9a9ea6] sm:inline">{currentPatient.id} · ASA {currentPatient.asaStatus.replace('ASA ', '')} · Tier {currentPatient.invasivenessTier}</span>
              </div>
            )}
          </section>

          {latestVitals && (
            <section id="veracity-vitals" aria-label="Recorded vitals" className="veracity-fade-up scroll-mt-20">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="veracity-eyebrow">02 — Vitals</p>
                  <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Last recorded <span className="italic">vitals</span></h2>
                </div>
                <p className="veracity-num text-[11px] text-[#9a9ea6]">
                  {new Date(latestVitals.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {currentPatient?.name}
                </p>
              </div>
              <div className="veracity-card mt-3 flex flex-wrap items-center gap-x-8 gap-y-4 p-4">
                <div>
                  <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Heart rate</p>
                  <p className="veracity-num mt-1 text-[34px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
                    {latestVitals.heartRate} <span className="text-[13px] font-medium text-[#6b706b]">bpm</span>
                  </p>
                </div>
                {hrSparkline && (
                  <svg viewBox="0 0 120 36" className="h-9 w-[120px] shrink-0" role="img" aria-label={`Heart rate trend, latest ${latestVitals.heartRate} bpm`}>
                    <polyline points={hrSparkline} fill="none" stroke="#1c7a3d" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                )}
                <div>
                  <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">NIBP</p>
                  <p className="veracity-num mt-1 text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{latestVitals.systolicBp}/{latestVitals.diastolicBp}</p>
                </div>
                <div>
                  <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">SpO2</p>
                  <p className="veracity-num mt-1 text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{latestVitals.spo2}<span className="text-[13px] font-medium text-[#6b706b]">%</span></p>
                </div>
                <div>
                  <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Temp</p>
                  <p className="veracity-num mt-1 text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{latestVitals.temperatureC}<span className="text-[13px] font-medium text-[#6b706b]">°C</span></p>
                </div>
              </div>
            </section>
          )}

          <section id="veracity-telemetry" aria-label="Blood investigation and telemetry" className="veracity-fade-up scroll-mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="veracity-eyebrow">03 — Labs</p>
                <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Blood <span className="italic">telemetry</span></h2>
              </div>
              <p className="veracity-ui-label text-[12px] text-[#6b706b]">{currentPatient ? `${currentPatient.name} · ${telemetryLabs.length} markers` : 'No case selected'}</p>
            </div>
            {telemetryLabs.length === 0 ? (
              <p className="veracity-ui-label veracity-tile mt-3 p-4 text-[13px] text-[#6b706b]">No biomarkers in this record yet. Ingest a lab report to populate telemetry.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {telemetryLabs.map((lab) => {
                  const window = microBarRefWindow(lab);
                  const pos = microBarPosition(lab);
                  const critical = lab.status.startsWith('CRITICAL');
                  return (
                    <article key={lab.id} className={critical ? 'veracity-tile-critical p-3.5' : 'veracity-tile p-3.5'}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="veracity-ui-label text-[12.5px] font-medium leading-snug text-[#1a1a1a]">{lab.name}</h3>
                        <span className={`veracity-num shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${critical ? 'veracity-status-stop' : lab.status.startsWith('BORDERLINE') ? 'veracity-status-conditional' : 'veracity-status-cleared'}`}>
                          {lab.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="veracity-num mt-2 text-[26px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
                        {lab.value.toLocaleString()} <span className="text-[12px] font-medium text-[#6b706b]">{lab.unit}</span>
                      </p>
                      <div className="mt-3" aria-hidden="true">
                        <div className="relative h-1 overflow-hidden rounded-full bg-black/[0.08]">
                          <div className="absolute inset-y-0 rounded-full bg-black/20" style={{ left: `${window.left}%`, width: `${window.width}%` }} />
                          <div className="absolute inset-y-[-2px] w-[2px] rounded bg-[#1a1a1a]" style={{ left: `calc(${pos}% - 1px)` }} />
                        </div>
                        <div className="veracity-num mt-1.5 flex justify-between text-[10px] text-[#9a9ea6]">
                          <span>{lab.refLow}</span>
                          <span>ref {lab.refLow}–{lab.refHigh}</span>
                          <span>{lab.refHigh}</span>
                        </div>
                      </div>
                      <p className="veracity-ui-label mt-2 line-clamp-2 min-h-[32px] text-[12px] leading-snug text-[#6b706b]">{lab.directive}</p>
                      <button
                        type="button"
                        onClick={() => openProvenanceForLab(lab)}
                        className="veracity-focus veracity-press veracity-num mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-[#6b706b] hover:border-black/30 hover:text-black"
                        aria-label={`Inspect provenance for ${lab.name}`}
                      >
                        <ShieldCheck size={12} aria-hidden="true" />
                        Provenance · p{lab.provenance.page}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-label="Theater waste avoidance" className="veracity-fade-up">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="veracity-eyebrow">04 — Yield</p>
                <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Waste <span className="italic">avoided</span></h2>
              </div>
              <span className="veracity-num rounded-full border border-[#9a6700]/25 bg-[#9a6700]/[0.08] px-2 py-0.5 text-[10px] font-semibold text-[#7a5200]">ESTIMATED · MODEL-BASED</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="veracity-tile p-4">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Theater minutes preserved</p>
                <p className="veracity-num mt-2 text-[28px] font-semibold leading-none tracking-tight text-[#1a1a1a]">{wasteEstimate.avoidedMinutes.toLocaleString()} <span className="text-[13px] font-medium text-[#6b706b]">min</span></p>
              </div>
              <div className="veracity-tile p-4">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Fixed overhead recovered</p>
                <p className="veracity-num mt-2 text-[28px] font-semibold leading-none tracking-tight text-[#1a1a1a]">${wasteEstimate.recoveredUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <p className="veracity-ui-label mt-2.5 text-[12px] leading-snug text-[#9a9ea6]">
              Estimated only: 45 min per hard stop plus 15 min per conditional at $1,200/hr. No measured theater time exists in this record; do not report as realized savings.
            </p>
          </section>

          {currentPatient && (
            <>
              <PreOpSections patient={currentPatient} />
              <LabsPlusSections patient={currentPatient} nowMs={nowMs} />
              <FlowSections patients={patients} currentPatient={currentPatient} onSelectPatient={selectPatient} />
            </>
          )}

          <section aria-label="Case actions" className="flex flex-wrap gap-2 pb-2">
            <button type="button" onClick={onOpenIngestion} className="veracity-focus veracity-press veracity-ui-label inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[13px] font-medium text-[#1a1a1a] shadow-sm hover:bg-black/[0.04]">
              <Plus size={15} aria-hidden="true" /> Ingest report
            </button>
            <button type="button" onClick={onOpenAttestation} className="veracity-focus veracity-press veracity-ui-label inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-black">
              <ShieldCheck size={15} aria-hidden="true" /> Verify &amp; attest
            </button>
            <button type="button" onClick={onOpenAuditDrawer} className="veracity-focus veracity-press veracity-ui-label inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[13px] font-medium text-[#1a1a1a] shadow-sm hover:bg-black/[0.04]">
              <History size={15} aria-hidden="true" /> Audit trail
            </button>
          </section>
        </main>
      </div>

      <nav aria-label="Console quick actions" className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around gap-1 rounded-2xl border border-black/10 bg-white/85 px-2 py-2 shadow-lg backdrop-blur-xl md:hidden">
        <button type="button" onClick={() => scrollTo('veracity-roster')} aria-label="Roster" className="veracity-focus flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[#6b706b]">
          <Activity size={18} aria-hidden="true" />
          <span className="veracity-ui-label text-[9.5px] font-semibold">Roster</span>
        </button>
        <button type="button" onClick={() => scrollTo('veracity-telemetry')} aria-label="Telemetry" className="veracity-focus flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[#6b706b]">
          <Clock3 size={18} aria-hidden="true" />
          <span className="veracity-ui-label text-[9.5px] font-semibold">Labs</span>
        </button>
        <button type="button" onClick={onOpenIngestion} aria-label="Ingest report" className="veracity-focus flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
          <Plus size={20} aria-hidden="true" />
        </button>
        <button type="button" onClick={onOpenAttestation} aria-label="Attest" className="veracity-focus flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[#6b706b]">
          <ShieldCheck size={18} aria-hidden="true" />
          <span className="veracity-ui-label text-[9.5px] font-semibold">Attest</span>
        </button>
        <button type="button" onClick={onOpenAuditDrawer} aria-label="Audit trail" className="veracity-focus flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[#6b706b]">
          <History size={18} aria-hidden="true" />
          <span className="veracity-ui-label text-[9.5px] font-semibold">Audit</span>
        </button>
      </nav>

      {inspectedLab && currentPatient && (
        <ProvenanceInspectorModal
          open={inspectedLab !== null}
          onClose={() => setInspectedLabId(null)}
          documentDataUrl={uploadedPdfDataUrl}
          onVerify={handleProvenanceVerify}
          {...labItemToModalProps(
            inspectedLab,
            'Local perioperative policy — verify against current ASA/ASRA guidance before acting',
            'Automated extraction is assistive only. Confirm the value against the source image and apply current institutional guidance; legacy GLP-1 wording in this console is historical.'
          )}
        />
      )}

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onOpenIngestion={() => {
          setCommandOpen(false);
          onOpenIngestion();
        }}
        onOpenAttestation={() => {
          setCommandOpen(false);
          onOpenAttestation();
        }}
        onOpenPrintSlip={() => {
          setCommandOpen(false);
          onOpenPrintSlip();
        }}
        onOpenWhatsApp={() => {
          setCommandOpen(false);
          onOpenWhatsApp();
        }}
        onOpenAuditDrawer={() => {
          setCommandOpen(false);
          onOpenAuditDrawer();
        }}
      />
    </div>
  );
};

export default VeracityFlightDeck;
