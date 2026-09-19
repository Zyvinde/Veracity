'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePatientStore } from '@/lib/store';
import { getAuditLog, logAuditEvent } from '@/lib/audit-logger';
import PureLabInbox from '@/components/PureLabInbox';
import {
  EMPTY_BASELINE,
  buildCallQueue,
  computePilotMetrics,
  crossCheckSchedule,
  loadBaseline,
  loadDayBefore,
  parseOTScheduleCsv,
  saveBaseline,
  saveDayBefore,
  type DayBeforeMap,
  type OTScheduleRow,
  type PilotBaseline,
} from '@/lib/pilot';

function num(v: string, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export default function PilotWorkspace() {
  const { patients, attestations, fetchPatientsFromApi, fetchAttestationsFromApi, selectPatientByMrn } =
    usePatientStore();

  useEffect(() => {
    fetchPatientsFromApi();
    fetchAttestationsFromApi();
  }, [fetchPatientsFromApi, fetchAttestationsFromApi]);

  const [baseline, setBaseline] = useState<PilotBaseline>(EMPTY_BASELINE);
  const [draft, setDraft] = useState<PilotBaseline>(EMPTY_BASELINE);
  const [dayBefore, setDayBefore] = useState<DayBeforeMap>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [csvRows, setCsvRows] = useState<OTScheduleRow[] | null>(null);

  useEffect(() => {
    const b = loadBaseline();
    setBaseline(b);
    setDraft(b);
    setDayBefore(loadDayBefore());
  }, []);

  const queue = useMemo(() => buildCallQueue(patients), [patients]);
  const metrics = useMemo(
    () => computePilotMetrics(patients, attestations, getAuditLog(), dayBefore, baseline),
    [patients, attestations, dayBefore, baseline]
  );
  const check = useMemo(
    () => (csvRows ? crossCheckSchedule(csvRows, patients) : null),
    [csvRows, patients]
  );

  const baselineCancelRate =
    baseline.scheduled > 0 ? (baseline.cancelledDayOf / baseline.scheduled) * 100 : null;

  const saveBaselineDraft = () => {
    saveBaseline(draft);
    setBaseline(draft);
    logAuditEvent('PILOT_BASELINE_SAVED' as any, 'pilot', `Baseline saved: ${draft.scheduled} scheduled, ${draft.cancelledDayOf} day-of cancels`);
  };

  const toggleCheck = (patientId: string, key: 'npoConfirmed' | 'medsConfirmed' | 'escortConfirmed') => {
    setDayBefore((prev) => {
      const cur = prev[patientId] || { npoConfirmed: false, medsConfirmed: false, escortConfirmed: false };
      const next = {
        ...prev,
        [patientId]: { ...cur, [key]: !cur[key], updatedAtIso: new Date().toISOString() },
      };
      saveDayBefore(next);
      return next;
    });
    logAuditEvent('DAYBEFORE_CHECK' as any, patientId, `Day-before ${key} toggled (demo)`);
  };

  const runCsv = () => {
    setCsvRows(parseOTScheduleCsv(csvText));
  };

  const statusColor = (s: string) =>
    s === 'RED_HARD_STOP'
      ? 'text-[#b3261e] border-rose-500/40 bg-rose-500/10'
      : s === 'AMBER_CONDITIONAL'
        ? 'text-[#7a5200] border-amber-500/40 bg-amber-500/10'
        : 'text-[#1c7a3d] border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#7a5200] font-bold">
            MVP Demo · Pilot toolkit · Mock data
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl text-[#1a1a1a]">
            Pilot board <span className="italic text-[#6b706b]">for the clinic visit.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#6b706b]">
            Baseline metrics, coordinator call queue, day-before checklist, and OT-list cross-check —
            the pieces that decide adoption. Demo storage only (this browser), no real PHI.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/console" className="rounded-full bg-[#1a1a1a] px-4 py-2.5 text-xs font-bold text-white hover:bg-black/80 min-h-[44px] flex items-center">
            OT Console
          </Link>
          <Link href="/" className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs text-[#1a1a1a] hover:bg-black/[0.04] min-h-[44px] flex items-center">
            Home
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <section aria-label="Pilot metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Mock cases', value: String(metrics.total), sub: `${metrics.cleared} green · ${metrics.conditional} amber · ${metrics.hardStop} red` },
          { label: 'Out of demo scope', value: String(metrics.outOfScope), sub: 'Peds / pregnant / ASA V-E / tier-4' },
          { label: 'Avg flags / case', value: String(metrics.avgFlagsPerCase), sub: `max ${metrics.maxFlags} · ${metrics.overloadedCases} overloaded (>5)` },
          { label: 'Day-before complete', value: `${metrics.checklistComplete}/${metrics.total}`, sub: 'NPO + meds + escort confirmed' },
          { label: 'Demo attestations', value: String(metrics.attested), sub: 'mock signatures, no effect' },
          { label: 'Signed on RED (demo)', value: String(metrics.overridesOnRed), sub: 'needs rationale — see console' },
          { label: 'Baseline day-of cancels', value: baselineCancelRate === null ? '—' : `${baselineCancelRate.toFixed(1)}%`, sub: baseline.periodLabel },
          { label: 'Baseline triage time', value: baseline.triageMinutesPerCase ? `${baseline.triageMinutesPerCase} min` : '—', sub: 'per case, pre-pilot' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-black/10 bg-white p-4 backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#6b706b]">{c.label}</p>
            <p className="mt-1 font-serif text-3xl text-[#1a1a1a]">{c.value}</p>
            <p className="mt-1 text-xs text-[#6b706b]">{c.sub}</p>
          </div>
        ))}
      </section>

      {metrics.overloadedCases > 0 && (
        <div role="note" className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-[#7a5200]">
          Alert-fatigue risk (demo): {metrics.overloadedCases} case(s) carry &gt;5 demo flags. In a real pilot,
          any rule overridden &gt;80% of the time gets demoted or fixed — flags nobody reads are worse than no flags.
        </div>
      )}

      {/* Baseline editor */}
      <section aria-label="Baseline editor" className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 backdrop-blur-md">
        <h2 className="font-serif text-xl text-[#1a1a1a]">1 · Baseline <span className="italic text-[#6b706b]">(fill in with your dad before the visit)</span></h2>
        <p className="mt-1 text-xs text-[#6b706b]">
          4–6 weeks of site history. Without this, no improvement claim survives the first question.
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(
            [
              ['periodLabel', 'Period label', 'text'],
              ['scheduled', 'Scheduled', 'number'],
              ['cancelledDayOf', 'Day-of cancels', 'number'],
              ['delayedCases', 'Delayed cases', 'number'],
              ['delayedMinutesTotal', 'Delay minutes', 'number'],
              ['triageMinutesPerCase', 'Triage min/case', 'number'],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="font-mono text-[10px] uppercase text-[#6b706b]">{label}</span>
              <input
                type={type}
                value={String(draft[key])}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [key]: type === 'number' ? num(e.target.value) : e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-xs text-[#1a1a1a] focus:outline-none focus:border-sky-300"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={saveBaselineDraft}
          className="mt-3 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black/80 min-h-[44px]"
        >
          Save baseline (demo browser storage)
        </button>
      </section>

      {/* Call queue */}
      <section aria-label="Coordinator call queue" className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 backdrop-blur-md">
        <h2 className="font-serif text-xl text-[#1a1a1a]">2 · Coordinator call queue <span className="italic text-[#6b706b]">(highest risk first)</span></h2>
        <p className="mt-1 text-xs text-[#6b706b]">
          The nurse&apos;s list: who to phone today, why, and what to say. Tap a row for the script + day-before checks.
        </p>
        <div className="mt-3 divide-y divide-black/10">
          {queue.map((q, i) => {
            const c = dayBefore[q.patient.id] || { npoConfirmed: false, medsConfirmed: false, escortConfirmed: false };
            const done = c.npoConfirmed && c.medsConfirmed && c.escortConfirmed;
            const open = expanded === q.patient.id;
            return (
              <div key={q.patient.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : q.patient.id)}
                  className="flex w-full items-center gap-3 text-left min-h-[44px]"
                  aria-expanded={open}
                >
                  <span className="font-mono text-xs text-[#9a9ea6] w-6 shrink-0">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#1a1a1a]">
                      {q.patient.name} <span className="font-mono text-[10px] text-[#6b706b]">{q.patient.mrn}</span>
                    </span>
                    <span className="block truncate text-[11px] text-[#6b706b]">
                      {q.patient.procedureName} · {Math.round(q.hoursToSurgery)}h to surgery · {q.reasons[0]}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${statusColor(q.patient.overallStatus)}`}>
                    {q.patient.overallStatus.replace(/_/g, ' ')}
                  </span>
                  {q.outOfScope.length > 0 && (
                    <span className="shrink-0 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#86198f]">
                      OUT OF SCOPE
                    </span>
                  )}
                  {done && (
                    <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#1c7a3d]">
                      ✓ DAY-BEFORE DONE
                    </span>
                  )}
                </button>
                {open && (
                  <div className="mt-2 ml-9 space-y-2 rounded-xl border border-black/10 bg-white p-3">
                    {q.outOfScope.length > 0 && (
                      <p className="text-[11px] text-[#86198f]">Scope: {q.outOfScope.join(' · ')}</p>
                    )}
                    <ul className="space-y-1">
                      {q.script.map((s, k) => (
                        <li key={k} className="text-xs text-[#3f4440]">• {s}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(
                        [
                          ['npoConfirmed', 'NPO confirmed'],
                          ['medsConfirmed', 'Meds confirmed'],
                          ['escortConfirmed', 'Escort confirmed'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleCheck(q.patient.id, key)}
                          aria-pressed={c[key]}
                          className={`rounded-lg border px-3 py-2 text-[11px] font-bold min-h-[44px] ${c[key]
                            ? 'border-emerald-400/50 bg-emerald-500/15 text-[#1c7a3d]'
                            : 'border-black/10 bg-black/[0.03] text-[#6b706b] hover:bg-black/[0.04]'
                            }`}
                        >
                          {c[key] ? '✓ ' : ''}{label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            selectPatientByMrn(q.patient.mrn);
                          } catch {
                            /* demo */
                          }
                        }}
                        className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-[11px] font-bold text-[#1a1a1a] min-h-[44px]"
                      >
                        <Link href="/console">Open in console →</Link>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {queue.length === 0 && <p className="py-4 text-xs text-[#6b706b]">No mock cases loaded.</p>}
        </div>
      </section>

      {/* OT schedule cross-check */}
      <section aria-label="OT schedule cross-check" className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 backdrop-blur-md">
        <h2 className="font-serif text-xl text-[#1a1a1a]">3 · OT-list cross-check <span className="italic text-[#6b706b]">(paste the day&apos;s list)</span></h2>
        <p className="mt-1 text-xs text-[#6b706b]">
          CSV with header <span className="font-mono">mrn,name,procedure,date</span>. Matches against the demo roster by MRN —
          unmatched rows are cases with no demo file (the adoption killer if this list is long).
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={4}
          placeholder={'mrn,name,procedure,date\nDHA-892144-AE,Fatima Al-Mansoor,Laparoscopic Cholecystectomy,2026-09-20'}
          className="mt-3 w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-xs text-[#1a1a1a] focus:outline-none focus:border-sky-300"
        />
        <button
          type="button"
          onClick={runCsv}
          className="mt-2 rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black/80 min-h-[44px]"
        >
          Cross-check ({csvText ? parseOTScheduleCsv(csvText).length : 0} rows)
        </button>
        {check && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
              <p className="font-mono text-[11px] font-bold text-[#1c7a3d]">MATCHED · {check.matched.length}</p>
              {check.matched.map((r) => (
                <p key={r.mrn} className="mt-1 text-xs text-[#3f4440]">{r.mrn} — {r.name}</p>
              ))}
              {check.matched.length === 0 && <p className="mt-1 text-xs text-[#6b706b]">None.</p>}
            </div>
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="font-mono text-[11px] font-bold text-[#b3261e]">NO DEMO FILE · {check.unmatched.length}</p>
              {check.unmatched.map((r, k) => (
                <p key={`${r.mrn}-${k}`} className="mt-1 text-xs text-[#3f4440]">{r.mrn || '(no MRN)'} — {r.name || r.procedure}</p>
              ))}
              {check.unmatched.length === 0 && <p className="mt-1 text-xs text-[#6b706b]">None — full coverage.</p>}
            </div>
          </div>
        )}
      </section>

      {/* Scope + liability memo */}
      <section aria-label="PureLab inbox" className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 backdrop-blur-md">
        <h2 className="font-serif text-xl text-[#1a1a1a]">5 · PureLab inbox <span className="italic text-[#6b706b]">(email → PAC, synthetic demo)</span></h2>
        <p className="mt-1 text-xs text-[#6b706b]">
          Simulates the dad workflow: PureLab emails results to pac-labs@, the poller parses, exact-MRN
          matches bind in one tap, everything else queues for review. Try binding Fatima&apos;s report —
          her console case updates.
        </p>
        <div className="mt-3">
          <PureLabInbox />
        </div>
      </section>

      <section aria-label="Pilot scope and liability" className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 sm:p-5">
        <h2 className="font-serif text-xl text-[#7a5200]">4 · Scope &amp; liability boundary <span className="italic">(read aloud at the visit)</span></h2>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#7a5200]">
          <li>• This is an <strong>MVP prototype with mock data</strong>. Not a medical device. No DHA/MOHAP clearance. Not for diagnosis, triage, or autonomous decisions.</li>
          <li>• The <strong>physician always decides</strong>. Demo flags are suggestions; override is always allowed and always logged with a reason.</li>
          <li>• Demo scope is <strong>adult elective tiers 1–3 only</strong>. Pediatrics, pregnancy, ASA V/E, and tier-4 complex cases are out of scope and routed to senior review.</li>
          <li>• Proposed pilot is <strong>shadow-mode, 2 weeks, no EHR write, no real PHI</strong> in this build. Stop rule: any safety concern from the supervising anesthesiologist pauses the pilot immediately.</li>
          <li>• Success is pre-registered against the <strong>baseline above</strong>: day-of cancellations, delay minutes, triage minutes per case, override rate.</li>
        </ul>
      </section>
    </div>
  );
}
