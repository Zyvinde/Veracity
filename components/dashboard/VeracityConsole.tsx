'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePatientStore } from '@/lib/store';
import { Activity, Bell, Search } from 'lucide-react';
import { RosterPanel } from './RosterPanel';
import { CaseFlightDeck } from './CaseFlightDeck';
import { ProvenanceDrawer } from './ProvenanceDrawer';
import { formatClockTime } from './ui';

export interface VeracityConsoleProps {
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp: () => void;
  onOpenAuditDrawer: () => void;
}

export default function VeracityConsole({
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  onOpenAuditDrawer,
}: VeracityConsoleProps) {
  const { patients, getCurrentPatient, selectPatient } = usePatientStore();
  const attestations = usePatientStore((s) => s.attestations) || {};
  const currentPatient = getCurrentPatient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount gate: mock schedule times are generated at module evaluation, so
  // server HTML and the first client render can straddle a minute boundary.
  // The static skeleton is identical on both sides → clean hydration always.
  // Client-only clock (mount guard avoids SSR hydration mismatches on live times).
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Escape dismisses the provenance drawer from anywhere in the console.
  useEffect(() => {
    if (!isProvenanceOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProvenanceOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isProvenanceOpen]);

  const stats = useMemo(() => {
    let cleared = 0;
    let blocked = 0;
    let review = 0;
    let holds = 0;
    let hardStops = 0;
    let firstCriticalDrug: string | null = null;
    patients.forEach((p) => {
      if (p.overallStatus === 'GREEN_CLEARED') cleared += 1;
      else if (p.overallStatus === 'RED_HARD_STOP') blocked += 1;
      else review += 1;
      p.medications?.forEach((m) => {
        if (m.status === 'HOLD_REQUIRED' || m.status === 'HARD_STOP') holds += 1;
        if (m.status === 'HARD_STOP') {
          hardStops += 1;
          if (!firstCriticalDrug) firstCriticalDrug = m.drugName.split(' (')[0];
        }
      });
    });
    const pending = patients.filter((p) => !attestations[p.id]).length;
    // Operational estimate: each active hold risks ~15 min wheels-in delay if
    // unmanaged — the number the defense workflow is designed to reclaim.
    const preventedMin = holds * 15;
    const earliest = [...patients].map((p) => p.scheduledTimeIso).sort()[0];
    return { cleared, blocked, review, holds, hardStops, firstCriticalDrug, pending, preventedMin, earliest };
  }, [patients, attestations]);

  if (!currentPatient || patients.length === 0) {
    return (
      <div className="min-h-screen w-full bg-[#E4E9ED] flex items-center justify-center p-8">
        <p className="font-sans text-sm font-semibold text-[#223140]">Loading surgical slate…</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-[#E4E9ED] text-[#223140] flex flex-col antialiased" aria-busy="true">
        <div className="max-w-[1600px] w-full mx-auto px-6 py-6 flex-1 flex flex-col gap-6">
          <div className="h-14 bg-white border border-[#D3DCE2] rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#D3DCE2] rounded-xl p-5 h-[132px] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            <div className="lg:col-span-5 bg-white border border-[#D3DCE2] rounded-xl min-h-[420px] animate-pulse" />
            <div className="lg:col-span-7 bg-white border border-[#D3DCE2] rounded-xl min-h-[420px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#E4E9ED] text-[#223140] flex flex-col antialiased">
      {/* ── A. Header / Command Bar ── */}
      <header className="h-14 bg-white border border-[#D3DCE2] rounded-xl px-5 mx-6 mt-4 flex items-center justify-between shadow-xs shrink-0 gap-3">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <Activity className="h-5 w-5 text-[#B3871C] shrink-0" aria-hidden="true" />
          <span className="font-bold text-sm text-[#223140] font-sans whitespace-nowrap">Veracity OT Console</span>
          <span className="hidden md:inline bg-[#EFF3F6] text-[#5B6B78] text-[10px] font-mono px-2 py-0.5 rounded border border-[#D3DCE2] whitespace-nowrap">
            DHA §3060(a) Validated
          </span>
        </div>
        <div className="hidden lg:block flex-1 max-w-md mx-6 min-w-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5B6B78]" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, labs, medications…"
              aria-label="Global search"
              className="w-96 max-w-full bg-[#EFF3F6] border border-[#D3DCE2] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#223140] font-sans placeholder-[#5B6B78] focus:outline-none focus:ring-1 focus:ring-[#B3871C]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-[#FEF2F2] border border-[#F87171] text-[#DC2626] font-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" aria-hidden="true" />
            PANIC OVERRIDE
          </span>
          <button
            type="button"
            onClick={onOpenAuditDrawer}
            aria-label="Notifications"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D3DCE2] bg-white text-[#5B6B78] transition hover:text-[#223140]"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenAuditDrawer}
            aria-label="Anesthesiologist profile"
            title="Dr. Tariq Mansoor · Consultant Anaesthetist"
            className="bg-[#EFF3F6] border border-[#D3DCE2] px-3 py-1 text-xs font-medium rounded-lg text-[#223140] font-sans"
          >
            TM
          </button>
        </div>
      </header>

      {/* ── Page container ── */}
      <div className="max-w-[1600px] w-full mx-auto px-6 py-6 flex-1 flex flex-col gap-6 min-w-0">
        {/* ── B. 4-column stat strip ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 [&>*]:min-w-0">
          <div className="bg-white border border-[#D3DCE2] rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5B6B78] to-[#B3871C]" aria-hidden="true" />
            <p className="text-[10px] font-mono text-[#5B6B78] uppercase tracking-wider">Cases Today</p>
            <p className="mt-1"><span className="font-serif text-3xl font-bold text-[#223140] tabular-nums">{patients.length}</span></p>
            <p className="mt-1 font-mono text-[11px] text-[#5B6B78] tabular-nums">
              {stats.cleared} Cleared • {stats.blocked} Blocked • {stats.review} Review
            </p>
          </div>
          <div className="bg-white border border-[#D3DCE2] rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5B6B78] to-[#B3871C]" aria-hidden="true" />
            <p className="text-[10px] font-mono text-[#5B6B78] uppercase tracking-wider">Active Drug Holds</p>
            <p className="mt-1"><span className="font-serif text-3xl font-bold text-[#223140] tabular-nums">{stats.holds}</span></p>
            <p className="mt-1.5">
              {stats.hardStops > 0 ? (
                <span className="text-[10px] font-mono bg-[#FEF2F2] text-[#DC2626] px-2 py-0.5 rounded font-bold">
                  {stats.hardStops} Critical DOAC{stats.firstCriticalDrug ? ` · ${stats.firstCriticalDrug}` : ''}
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-[#ECFDF5] text-[#059669] px-2 py-0.5 rounded font-bold">
                  No critical holds
                </span>
              )}
            </p>
          </div>
          <div className="bg-white border border-[#D3DCE2] rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5B6B78] to-[#B3871C]" aria-hidden="true" />
            <p className="text-[10px] font-mono text-[#5B6B78] uppercase tracking-wider">Physician Attestation</p>
            <p className="mt-1"><span className="font-serif text-2xl font-bold text-[#223140]">{stats.pending > 0 ? `${stats.pending} Pending` : 'All signed'}</span></p>
            <p className="mt-1.5 font-mono text-[11px] text-[#5B6B78]">Awaiting final sign-off</p>
          </div>
          <div className="bg-white border border-[#D3DCE2] rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5B6B78] to-[#B3871C]" aria-hidden="true" />
            <p className="text-[10px] font-mono text-[#5B6B78] uppercase tracking-wider">Estimated Prevented Delay</p>
            <p className="mt-1"><span className="font-serif text-3xl font-bold text-[#059669] tabular-nums">+{stats.preventedMin}m</span></p>
            <p className="mt-1.5">
              <span className="text-[10px] font-mono bg-[#ECFDF5] text-[#059669] px-2 py-0.5 rounded font-bold">
                {formatClockTime(stats.earliest)} Wheels-in
              </span>
            </p>
          </div>
        </div>

        {/* ── C. Main stage grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 [&>*]:min-w-0">
          <div className="lg:col-span-5 min-w-0">
            <RosterPanel
              patients={patients}
              currentPatientId={currentPatient.id}
              searchQuery={searchQuery}
              onSelectPatient={(id) => selectPatient(id)}
            />
          </div>
          <div className="lg:col-span-7 min-w-0">
            <CaseFlightDeck
              patient={currentPatient}
              attested={Boolean(attestations[currentPatient.id])}
              now={now}
              onOpenAttestation={onOpenAttestation}
              onOpenWhatsApp={onOpenWhatsApp}
              onOpenIngestion={onOpenIngestion}
              onOpenPrintSlip={onOpenPrintSlip}
              onInspectPdf={() => setIsProvenanceOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* ── Provenance slide-out drawer ── */}
      <ProvenanceDrawer
        open={isProvenanceOpen}
        patient={currentPatient}
        onClose={() => setIsProvenanceOpen(false)}
      />
    </div>
  );
}
