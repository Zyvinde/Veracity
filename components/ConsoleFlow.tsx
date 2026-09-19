'use client';

import React, { useMemo, useState } from 'react';
import type { ClearanceStatus, PatientCase } from '@/lib/types';
import {
  evaluatePostOpRisk,
  generateERASTimeline,
} from '@/lib/rules-engine';
import { evaluatePRO, type PostOpPRO } from '@/lib/pro-monitoring';

function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'idle'; children: React.ReactNode }) {
  const cls =
    tone === 'ok' ? 'veracity-status-cleared' : tone === 'warn' ? 'veracity-status-conditional' : tone === 'bad' ? 'veracity-status-stop' : 'rounded-full border border-black/10 bg-black/[0.04] text-[#6b706b]';
  return <span className={`veracity-num shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{children}</span>;
}

const NOTES_KEY = 'anterior-health-clinical-notes';

function loadNotes(patientId: string): string {
  try {
    const raw = localStorage.getItem(`${NOTES_KEY}:${patientId}`);
    return raw ?? '';
  } catch { return ''; }
}

/**
 * ConsoleFlow — restored flow & accountability modules (old ORReadinessKanban,
 * OTDelayPreventionHub actions, ERASTimeline, PostOpMonitor, PostOpRiskCalculator,
 * FHIRExport, DigitalPACCard, ClinicalNotes, TrafficLightBanner, QualityAnalytics),
 * rebuilt Harvey-styled on the retained engine functions.
 */
export const FlowSections: React.FC<{
  patients: PatientCase[];
  currentPatient: PatientCase;
  onSelectPatient: (id: string) => void;
}> = ({ patients, currentPatient, onSelectPatient }) => {
  const postOpRisk = useMemo(() => {
    try { return evaluatePostOpRisk(currentPatient); } catch { return null; }
  }, [currentPatient]);
  const eras = useMemo(() => {
    try { return generateERASTimeline(currentPatient); } catch { return []; }
  }, [currentPatient]);

  const [pro, setPro] = useState<PostOpPRO>({ postOpDay: 1, pain0_10: 3, nausea: false, feverC: 37.0, woundRedness: false, opioidUse: 0, ambulated: true });
  const proEval = useMemo(() => {
    try { return evaluatePRO(pro); } catch { return null; }
  }, [pro]);

  const [notes, setNotes] = useState(() => loadNotes(currentPatient.id));
  const [notesSaved, setNotesSaved] = useState(false);
  const [fhirCopied, setFhirCopied] = useState(false);

  const saveNotes = () => {
    try { localStorage.setItem(`${NOTES_KEY}:${currentPatient.id}`, notes); setNotesSaved(true); setTimeout(() => setNotesSaved(false), 1500); } catch { /* noop */ }
  };

  const fhirBundle = useMemo(() => ({
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      { resource: { resourceType: 'Patient', id: currentPatient.mrn, name: currentPatient.name, gender: currentPatient.gender, birthDate: undefined, age: currentPatient.age } },
      { resource: { resourceType: 'Procedure', code: currentPatient.cptCode, display: currentPatient.procedureName, asa: currentPatient.asaStatus } },
      ...currentPatient.labs.map((l) => ({ resource: { resourceType: 'Observation', code: l.loinc, display: l.name, value: l.value, unit: l.unit, status: l.status } })),
    ],
  }), [currentPatient]);

  const copyFhir = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
      setFhirCopied(true); setTimeout(() => setFhirCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  const downloadFhir = () => {
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fhir-${currentPatient.mrn}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns: { status: ClearanceStatus; title: string }[] = [
    { status: 'GREEN_CLEARED', title: 'Ready' },
    { status: 'AMBER_CONDITIONAL', title: 'Conditional' },
    { status: 'RED_HARD_STOP', title: 'Hard stop' },
  ];
  const counts = useMemo(() => ({
    cleared: patients.filter((p) => p.overallStatus === 'GREEN_CLEARED').length,
    conditional: patients.filter((p) => p.overallStatus === 'AMBER_CONDITIONAL').length,
    stop: patients.filter((p) => p.overallStatus === 'RED_HARD_STOP').length,
  }), [patients]);
  const total = Math.max(1, patients.length);

  return (
    <>
      <section id="veracity-kanban" aria-label="OR readiness kanban" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">11 — Flow</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">OR readiness <span className="italic">kanban</span></h2>
          </div>
          <p className="veracity-num text-[11px] text-[#9a9ea6]">Select a card to load the case</p>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {columns.map((col) => {
            const cards = patients.filter((p) => p.overallStatus === col.status);
            return (
              <div key={col.status} className="veracity-card p-3">
                <div className="flex items-center justify-between">
                  <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">{col.title}</p>
                  <span className="veracity-num text-[11px] font-semibold text-[#1a1a1a]">{cards.length}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {cards.length === 0 && <p className="veracity-ui-label text-[12px] text-[#9a9ea6]">No cases.</p>}
                  {cards.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPatient(p.id)}
                      className={`veracity-focus veracity-press block w-full rounded-xl border p-2.5 text-left ${p.id === currentPatient.id ? 'border-[#1a1a1a] bg-[#1a1a1a]/[0.04]' : 'border-black/10 bg-white hover:border-black/25'}`}
                    >
                      <p className="veracity-ui-label truncate text-[12.5px] font-medium text-[#1a1a1a]">{p.name}</p>
                      <p className="veracity-num truncate text-[10.5px] text-[#6b706b]">{p.procedureName} · {p.surgeon}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className={`mt-3 flex flex-wrap items-center gap-2.5 rounded-2xl border p-3.5 ${currentPatient.overallStatus === 'GREEN_CLEARED' ? 'border-[#1c7a3d]/25 bg-[#1c7a3d]/[0.06]' : currentPatient.overallStatus === 'AMBER_CONDITIONAL' ? 'border-[#9a6700]/25 bg-[#9a6700]/[0.06]' : 'border-[#b3261e]/25 bg-[#b3261e]/[0.06]'}`}>
          <Pill tone={currentPatient.overallStatus === 'GREEN_CLEARED' ? 'ok' : currentPatient.overallStatus === 'AMBER_CONDITIONAL' ? 'warn' : 'bad'}>
            {currentPatient.overallStatus.replace(/_/g, ' ')}
          </Pill>
          <p className="veracity-ui-label min-w-0 flex-1 text-[13px] text-[#1a1a1a]">{currentPatient.primaryActionDirective}</p>
        </div>
      </section>

      <section id="veracity-eras" aria-label="ERAS and post-op" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">12 — Recovery</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">ERAS <span className="italic">&amp; post-op</span></h2>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="veracity-tile p-3.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">ERAS pathway</p>
            {eras.length === 0 ? (
              <p className="veracity-ui-label mt-2 text-[12px] text-[#6b706b]">No pathway events.</p>
            ) : (
              <ol className="mt-2 space-y-0">
                {eras.slice(0, 6).map((e, i) => (
                  <li key={i} className="flex gap-2.5 border-l-2 border-black/10 py-1.5 pl-3">
                    <div className="min-w-0">
                      <p className="veracity-ui-label text-[12px] font-medium text-[#1a1a1a]">{e.title} <span className="veracity-num font-normal text-[#9a9ea6]">{e.timeLabel}</span></p>
                      <p className="veracity-ui-label line-clamp-1 text-[11px] text-[#6b706b]">{e.description}</p>
                    </div>
                    <span className="veracity-num ml-auto shrink-0 text-[10px] text-[#9a9ea6]">{e.status}</span>
                  </li>
                ))}
              </ol>
            )}
            {postOpRisk && (
              <div className="mt-2.5 border-t border-black/10 pt-2">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Post-op risk</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill tone={postOpRisk.akiRisk === 'LOW' ? 'ok' : postOpRisk.akiRisk === 'MODERATE' ? 'warn' : 'bad'}>AKI {postOpRisk.akiRisk}</Pill>
                  <Pill tone={postOpRisk.vteRisk === 'LOW' ? 'ok' : postOpRisk.vteRisk === 'MODERATE' ? 'warn' : 'bad'}>VTE {postOpRisk.vteRisk}</Pill>
                  <Pill tone="idle">Caprini {postOpRisk.capriniScore}</Pill>
                </div>
                {postOpRisk.recommendations.length > 0 && (
                  <p className="veracity-ui-label mt-1.5 line-clamp-2 text-[12px] text-[#6b706b]">{postOpRisk.recommendations[0]}</p>
                )}
              </div>
            )}
          </div>
          <div className="veracity-tile p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">PRO check-in (Day 0–7)</p>
              {proEval && <Pill tone={proEval.severity === 'GREEN' ? 'ok' : proEval.severity === 'AMBER' ? 'warn' : 'bad'}>{proEval.severity}</Pill>}
            </div>
            <label className="veracity-ui-label mt-2.5 block text-[12px] text-[#1a1a1a]">
              Pain {pro.pain0_10}/10
              <input type="range" min={0} max={10} value={pro.pain0_10} onChange={(e) => setPro({ ...pro, pain0_10: Number(e.target.value) })} className="mt-1 w-full accent-[#1a1a1a]" aria-label="Pain score" />
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="veracity-ui-label flex items-center gap-1.5 text-[12px] text-[#1a1a1a]">
                <input type="checkbox" checked={pro.nausea} onChange={(e) => setPro({ ...pro, nausea: e.target.checked })} className="accent-[#1a1a1a]" /> Nausea
              </label>
              <label className="veracity-ui-label flex items-center gap-1.5 text-[12px] text-[#1a1a1a]">
                <input type="checkbox" checked={pro.woundRedness} onChange={(e) => setPro({ ...pro, woundRedness: e.target.checked })} className="accent-[#1a1a1a]" /> Wound redness
              </label>
              <label className="veracity-ui-label flex items-center gap-1.5 text-[12px] text-[#1a1a1a]">
                <input type="checkbox" checked={pro.ambulated} onChange={(e) => setPro({ ...pro, ambulated: e.target.checked })} className="accent-[#1a1a1a]" /> Ambulated
              </label>
              <label className="veracity-ui-label flex items-center gap-1.5 text-[12px] text-[#1a1a1a]">
                Fever
                <input type="number" step={0.1} value={pro.feverC} onChange={(e) => setPro({ ...pro, feverC: Number(e.target.value) })} className="glass-input w-16 rounded-lg px-1.5 py-1 text-[12px]" aria-label="Temperature Celsius" />
              </label>
            </div>
            {proEval && (
              <>
                <p className="veracity-ui-label mt-2.5 text-[12px] leading-snug text-[#1a1a1a]">{proEval.directive}</p>
                {proEval.flags.length > 0 && <p className="veracity-num mt-1 text-[11px] text-[#6b706b]">{proEval.flags.slice(0, 3).join(' · ')}</p>}
              </>
            )}
          </div>
        </div>
      </section>

      <section id="veracity-exchange" aria-label="Exchange and notes" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">13 — Exchange</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">FHIR, PAC card <span className="italic">&amp; notes</span></h2>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="veracity-tile p-3.5">
            <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">FHIR export</h3>
            <p className="veracity-ui-label mt-1 text-[12px] text-[#6b706b]">Bundle/collection · Patient + Procedure + {currentPatient.labs.length} Observations</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button type="button" onClick={copyFhir} className="veracity-focus veracity-press veracity-ui-label rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] hover:bg-black/[0.04]">
                {fhirCopied ? 'Copied ✓' : 'Copy JSON'}
              </button>
              <button type="button" onClick={downloadFhir} className="veracity-focus veracity-press veracity-ui-label rounded-full bg-[#1a1a1a] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-black">
                Download
              </button>
            </div>
          </div>
          <div className="veracity-tile p-3.5">
            <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">Digital PAC card</h3>
            <p className="veracity-num mt-2 text-[15px] font-semibold text-[#1a1a1a]">{currentPatient.name}</p>
            <p className="veracity-num text-[11px] text-[#6b706b]">{currentPatient.mrn} · {currentPatient.procedureName}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone={currentPatient.overallStatus === 'GREEN_CLEARED' ? 'ok' : currentPatient.overallStatus === 'AMBER_CONDITIONAL' ? 'warn' : 'bad'}>{currentPatient.overallStatus.replace(/_/g, ' ')}</Pill>
              <Pill tone="idle">ASA {currentPatient.asaStatus.replace('ASA ', '')}</Pill>
            </div>
            <p className="veracity-ui-label mt-2 line-clamp-2 text-[12px] text-[#6b706b]">{currentPatient.primaryActionDirective}</p>
          </div>
          <div className="veracity-tile p-3.5">
            <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">Clinical notes</h3>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
              rows={3}
              placeholder="Shift note for this case…"
              className="glass-input mt-2 w-full rounded-xl px-2.5 py-2 text-[12px]"
              aria-label="Clinical notes"
            />
            <button type="button" onClick={saveNotes} className="veracity-focus veracity-press veracity-ui-label mt-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] hover:bg-black/[0.04]">
              {notesSaved ? 'Saved ✓' : 'Save locally'}
            </button>
          </div>
        </div>
        <div className="veracity-card mt-2.5 p-4">
          <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Board quality</p>
          {(['cleared', 'conditional', 'stop'] as const).map((k) => {
            const v = counts[k];
            const pct = Math.round((v / total) * 100);
            return (
              <div key={k} className="mt-2 flex items-center gap-2.5">
                <span className="veracity-num w-24 shrink-0 text-[11px] capitalize text-[#6b706b]">{k}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.08]">
                  <div className="h-full rounded-full bg-[#1a1a1a]/70" style={{ width: `${pct}%` }} />
                </div>
                <span className="veracity-num w-16 shrink-0 text-right text-[11px] text-[#1a1a1a]">{v}/{total}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default FlowSections;
