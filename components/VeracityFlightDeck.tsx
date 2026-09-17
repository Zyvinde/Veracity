'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientStore, CLINICIANS } from '@/lib/store';
import { computeFastingCompliance } from '@/lib/rules-engine';
import type { ClearanceStatus, ExtractedLabItem, PatientCase } from '@/lib/types';
import { CommandPalette } from '@/components/CommandPalette';
import ProvenanceInspectorModal, { labItemToModalProps } from '@/components/ProvenanceInspectorModal';
import { logAuditEvent } from '@/lib/audit-logger';
import { RULES_ENGINE_VERSION } from '@/lib/constants';
import type { AttestationRecord } from '@/lib/types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Maximize2,
  Minimize2,
  Plus,
  Printer,
  Search,
  Share2,
  ShieldCheck,
  History,
} from 'lucide-react';

interface VeracityFlightDeckProps {
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp: () => void;
  onOpenAuditDrawer: () => void;
}

const STATUS_META: Record<ClearanceStatus, { label: string; dot: string; pill: string }> = {
  GREEN_CLEARED: { label: 'Cleared', dot: 'bg-[#34C759]', pill: 'veracity-status-cleared' },
  AMBER_CONDITIONAL: { label: 'Conditional', dot: 'bg-[#FF9500]', pill: 'veracity-status-conditional' },
  RED_HARD_STOP: { label: 'Hard stop', dot: 'bg-[#FF3B30]', pill: 'veracity-status-stop' },
};

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
  const [inspectedLabId, setInspectedLabId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const currentPatient: PatientCase | undefined = useMemo(
    () => patients.find((p) => p.id === currentPatientId) ?? patients[0],
    [patients, currentPatientId]
  );

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const activeClinicianEarly = CLINICIANS.find((c) => c.id === activeClinicianId) ?? CLINICIANS[0];

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
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) return;
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
    <div className="veracity-canvas flex min-h-screen w-full text-slate-100">
      <nav aria-label="Console sections" className="veracity-animated hidden w-[72px] shrink-0 flex-col items-center gap-2 border-r border-white/[0.08] bg-black/30 py-4 backdrop-blur-xl md:flex">
        <div aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-slate-100 to-slate-400 font-serif text-2xl italic text-slate-950 shadow-lg">
          V
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <button type="button" onClick={() => scrollTo('veracity-roster')} aria-label="Surgical roster" title="Roster" className="veracity-focus flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Activity size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollTo('veracity-telemetry')} aria-label="Blood telemetry" title="Telemetry" className="veracity-focus flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Clock3 size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={onOpenAuditDrawer} aria-label="Audit trail" title="Audit" className="veracity-focus flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white">
            <History size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={onOpenIngestion} aria-label="Ingest document" title="Ingest" className="veracity-focus flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title="Fullscreen" className="veracity-focus flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10">
            {isFullscreen ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}
          </button>
          <button type="button" onClick={onOpenAttestation} aria-label={`Attest as ${activeClinician.name}`} title={activeClinician.name} className="veracity-focus flex h-11 w-11 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/15 text-sm font-semibold text-sky-100">
            {activeClinician.initials}
          </button>
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#06090E]/80 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="veracity-focus veracity-ui-label flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-[13px] text-slate-300 transition hover:border-white/20 hover:text-white sm:max-w-md"
              aria-label="Open command palette"
            >
              <Search size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
              <span className="truncate">Search patients, labs, actions…</span>
              <kbd className="veracity-num ml-auto hidden rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-300 sm:inline">⌘K</kbd>
            </button>
            <span className="veracity-num inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-200">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              CDS EVALUATION ONLY
            </span>
            {hardStopPatients.length > 0 ? (
              <button type="button" onClick={() => hardStopPatients[0] && selectPatient(hardStopPatients[0].id)} className="veracity-focus veracity-num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold veracity-status-stop" aria-label={`${hardStopPatients.length} hard stops, review first`}>
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
              <button type="button" onClick={onOpenWhatsApp} aria-label="Share PAC update" className="veracity-focus rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10">
                <Share2 size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={onOpenPrintSlip} aria-label="Print PAC slip" className="veracity-focus rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10">
                <Printer size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={onOpenAttestation} className="veracity-focus veracity-ui-label inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[12.5px] font-semibold text-slate-950 transition hover:bg-white">
                <FileCheck2 size={15} aria-hidden="true" />
                Attest
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] space-y-3 px-3 py-3 sm:px-5 sm:py-4">
          <section aria-label="Executive metrics" className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            <div className="glass-panel rounded-2xl p-3.5">
              <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Cases today</p>
              <p className="veracity-num mt-1 text-[26px] font-semibold leading-none text-white">{counts.total}</p>
              <p className="veracity-num mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
                <span className="rounded-full px-2 py-0.5 veracity-status-cleared">{counts.cleared} cleared</span>
                <span className="rounded-full px-2 py-0.5 veracity-status-conditional">{counts.conditional} cond</span>
                <span className="rounded-full px-2 py-0.5 veracity-status-stop">{counts.stop} stop</span>
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-3.5">
              <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Active med holds</p>
              <p className="veracity-num mt-1 text-[26px] font-semibold leading-none text-white">{counts.holds}</p>
              <p className="veracity-ui-label mt-2 text-[11.5px] leading-snug text-slate-400">Hold-required plus hard-stop clocks across roster.</p>
            </div>
            <div className="glass-panel rounded-2xl p-3.5">
              <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">NPO chronometer</p>
              <p className="veracity-num mt-1 text-[26px] font-semibold leading-none text-white">{fasting ? formatCountdown(fasting.hoursUntilSurgery) : '--:--'}</p>
              <p className="veracity-ui-label mt-2 line-clamp-2 text-[11.5px] leading-snug text-slate-400">{fasting ? fasting.recommendation : 'Select a case to compute fasting status.'}</p>
            </div>
            <div className="glass-panel rounded-2xl p-3.5">
              <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Attestation compliance</p>
              <p className="veracity-num mt-1 text-[26px] font-semibold leading-none text-white">{counts.total === 0 ? '—' : `${Math.round((attestedCount / counts.total) * 100)}%`}</p>
              <p className="veracity-num mt-2 text-[11px] text-slate-400">{attestedCount}/{counts.total} cases attested</p>
            </div>
          </section>

          <section id="veracity-roster" aria-label="Surgical day roster" className="glass-panel scroll-mt-20 rounded-2xl p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="veracity-serif-accent text-[21px] text-white">Surgical day <span className="text-sky-300">roster</span></h2>
              <p className="veracity-num text-[10.5px] text-slate-500">← → or 1–9 to move · Enter opens provenance</p>
            </div>
            <div role="listbox" aria-label="Patients" aria-orientation="horizontal" className="mt-3 flex gap-2 overflow-x-auto pb-1">
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
                    className={`veracity-focus flex w-[188px] shrink-0 flex-col gap-1.5 rounded-xl border p-2.5 text-left transition ${active ? 'border-sky-300/50 bg-sky-400/10' : 'glass-card-subtle hover:border-white/20'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span className="veracity-num text-[10px] text-slate-400">{String(idx + 1).padStart(2, '0')} · {p.mrn}</span>
                    </span>
                    <span className="veracity-ui-label truncate text-[13px] font-semibold text-white">{p.name}</span>
                    <span className="veracity-num truncate text-[10.5px] text-slate-400">{p.procedureName}</span>
                    <span className={`veracity-num w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.pill}`}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            {currentPatient && currentMeta && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-black/30 p-3">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${currentMeta.dot}`} />
                <p className="veracity-ui-label min-w-0 flex-1 text-[12.5px] leading-snug text-slate-200">{currentPatient.primaryActionDirective}</p>
                <span className="veracity-num hidden text-[10.5px] text-slate-500 sm:inline">{currentPatient.id} · ASA {currentPatient.asaStatus.replace('ASA ', '')} · Tier {currentPatient.invasivenessTier}</span>
              </div>
            )}
          </section>

          <section id="veracity-telemetry" aria-label="Blood investigation and telemetry" className="glass-panel scroll-mt-20 rounded-2xl p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="veracity-serif-accent text-[21px] text-white">Blood <span className="text-sky-300">telemetry</span></h2>
              <p className="veracity-ui-label text-[11.5px] text-slate-400">{currentPatient ? `${currentPatient.name} · ${telemetryLabs.length} markers` : 'No case selected'}</p>
            </div>
            {telemetryLabs.length === 0 ? (
              <p className="veracity-ui-label mt-3 rounded-xl border border-white/10 bg-black/30 p-4 text-[12.5px] text-slate-300">No biomarkers in this record yet. Ingest a lab report to populate telemetry.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {telemetryLabs.map((lab) => {
                  const window = microBarRefWindow(lab);
                  const pos = microBarPosition(lab);
                  const critical = lab.status.startsWith('CRITICAL');
                  return (
                    <article key={lab.id} className={`glass-card-subtle rounded-xl p-3 ${critical ? 'border-[#FF3B30]/40' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="veracity-ui-label text-[12px] font-semibold leading-snug text-slate-100">{lab.name}</h3>
                        <span className={`veracity-num shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${critical ? 'veracity-status-stop' : lab.status.startsWith('BORDERLINE') ? 'veracity-status-conditional' : 'veracity-status-cleared'}`}>
                          {lab.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="veracity-num mt-1.5 text-[20px] font-semibold leading-none text-white">
                        {lab.value.toLocaleString()} <span className="text-[11px] font-medium text-slate-400">{lab.unit}</span>
                      </p>
                      <div className="mt-2.5" aria-hidden="true">
                        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="absolute inset-y-0 rounded-full bg-white/20" style={{ left: `${window.left}%`, width: `${window.width}%` }} />
                          <div className="absolute inset-y-[-2px] w-[2px] rounded bg-sky-300" style={{ left: `calc(${pos}% - 1px)` }} />
                        </div>
                        <div className="veracity-num mt-1 flex justify-between text-[9.5px] text-slate-500">
                          <span>{lab.refLow}</span>
                          <span>ref {lab.refLow}–{lab.refHigh}</span>
                          <span>{lab.refHigh}</span>
                        </div>
                      </div>
                      <p className="veracity-ui-label mt-2 line-clamp-2 min-h-[30px] text-[11px] leading-snug text-slate-400">{lab.directive}</p>
                      <button
                        type="button"
                        onClick={() => openProvenanceForLab(lab)}
                        className="veracity-focus veracity-num mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sky-300/25 bg-sky-400/10 px-2 py-1 text-[10.5px] font-semibold text-sky-200 transition hover:bg-sky-400/20"
                        aria-label={`Inspect provenance for ${lab.name}`}
                      >
                        <ShieldCheck size={12} aria-hidden="true" />
                        PROVENANCE · p{lab.provenance.page}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-label="Theater waste avoidance" className="glass-panel rounded-2xl p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="veracity-serif-accent text-[21px] text-white">Waste <span className="text-sky-300">avoided</span></h2>
              <span className="veracity-num rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">ESTIMATED · MODEL-BASED</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="glass-card-subtle rounded-xl p-3">
                <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Theater minutes preserved</p>
                <p className="veracity-num mt-1 text-[24px] font-semibold text-white">{wasteEstimate.avoidedMinutes.toLocaleString()} min</p>
              </div>
              <div className="glass-card-subtle rounded-xl p-3">
                <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Fixed overhead recovered</p>
                <p className="veracity-num mt-1 text-[24px] font-semibold text-white">${wasteEstimate.recoveredUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <p className="veracity-ui-label mt-2 text-[11px] leading-snug text-slate-500">
              Estimated only: 45 min per hard stop plus 15 min per conditional at $1,200/hr. No measured theater time exists in this record; do not report as realized savings.
            </p>
          </section>

          <section aria-label="Case actions" className="flex flex-wrap gap-2 pb-2">
            <button type="button" onClick={onOpenIngestion} className="veracity-focus veracity-ui-label inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10">
              <Plus size={15} aria-hidden="true" /> Ingest report
            </button>
            <button type="button" onClick={onOpenAttestation} className="veracity-focus veracity-ui-label inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2.5 text-[13px] font-semibold text-slate-950 transition hover:bg-white">
              <ShieldCheck size={15} aria-hidden="true" /> Verify &amp; attest
            </button>
            <button type="button" onClick={onOpenAuditDrawer} className="veracity-focus veracity-ui-label inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/10">
              <History size={15} aria-hidden="true" /> Audit trail
            </button>
          </section>
        </main>
      </div>

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
