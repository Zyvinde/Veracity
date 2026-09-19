'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { PatientCase } from '@/lib/types';
import {
  checkDrugInteractions,
  evaluateAnemiaOptimization,
  evaluateSerology,
  predictPRBCUnits,
  generateMorningMedDirectives,
  computeFastingCompliance,
} from '@/lib/rules-engine';

function Pill({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'idle'; children: React.ReactNode }) {
  const cls =
    tone === 'ok' ? 'veracity-status-cleared' : tone === 'warn' ? 'veracity-status-conditional' : tone === 'bad' ? 'veracity-status-stop' : 'rounded-full border border-black/10 bg-black/[0.04] text-[#6b706b]';
  return <span className={`veracity-num shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{children}</span>;
}

function findLab(patient: PatientCase, keys: string[]) {
  const lower = patient.labs.map((l) => ({ l, n: l.name.toLowerCase() }));
  for (const k of keys) {
    const hit = lower.find(({ n }) => n.includes(k));
    if (hit) return hit.l;
  }
  return null;
}

/**
 * ConsoleLabsPlus — restored labs & blood modules (old FishboneViewer,
 * LabAuditTable, BiomarkerSafetyCutoffs, PreOpAnemiaOptimizer, SerologyBloodBank,
 * PRBCTransfusionPredictor, CountdownTimers, SurgeryCountdown,
 * MorningMedDirectives, DrugInteractionAlert), rebuilt Harvey-styled on the
 * retained rules-engine functions.
 */
export const LabsPlusSections: React.FC<{ patient: PatientCase; nowMs: number }> = ({ patient, nowMs }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const anemia = useMemo(() => {
    try { return evaluateAnemiaOptimization(patient); } catch { return null; }
  }, [patient]);
  const serology = useMemo(() => {
    try { return evaluateSerology(patient); } catch { return null; }
  }, [patient]);
  const prbc = useMemo(() => {
    try { return predictPRBCUnits(patient); } catch { return null; }
  }, [patient]);
  const morningMeds = useMemo(() => {
    try { return generateMorningMedDirectives(patient); } catch { return []; }
  }, [patient]);
  const interactions = useMemo(() => {
    try { return checkDrugInteractions(patient.medications); } catch { return []; }
  }, [patient]);
  const fasting = useMemo(() => {
    try { return computeFastingCompliance(patient.scheduledTimeIso, new Date(nowMs)); } catch { return null; }
  }, [patient, nowMs]);

  const bones: { label: string; keys: string[] }[] = [
    { label: 'Hgb', keys: ['hemoglobin', 'hgb', 'hb'] },
    { label: 'Hct', keys: ['hematocrit', 'hct'] },
    { label: 'WBC', keys: ['wbc', 'leukocyte', 'white'] },
    { label: 'Plt', keys: ['platelet', 'plt'] },
    { label: 'Na', keys: ['sodium', ' na'] },
    { label: 'K', keys: ['potassium'] },
    { label: 'Cr', keys: ['creatinine'] },
    { label: 'Glu', keys: ['glucose'] },
  ];
  const criticalCount = patient.labs.filter((l) => l.status.startsWith('CRITICAL')).length;

  return (
    <>
      <section id="veracity-fishbone" aria-label="Lab fishbone" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">08 — Fishbone</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Lab <span className="italic">fishbone</span></h2>
          </div>
          <p className="veracity-ui-label text-[12px] text-[#6b706b]">{criticalCount > 0 ? `${criticalCount} critical — audit below` : 'Schematic overview, values from record'}</p>
        </div>
        <div className="veracity-card mt-3 overflow-x-auto p-4">
          <div className="grid min-w-[560px] grid-cols-4 gap-x-6 gap-y-4">
            {bones.map((b) => {
              const lab = findLab(patient, b.keys);
              const bad = lab?.status.startsWith('CRITICAL');
              return (
                <div key={b.label} className="border-b-2 border-[#1a1a1a]/70 pb-1.5">
                  <p className="veracity-num text-[10px] font-semibold tracking-wider text-[#6b706b]">{b.label}</p>
                  <p className={`veracity-num mt-0.5 text-[20px] font-semibold leading-none ${bad ? 'text-[#b3261e]' : 'text-[#1a1a1a]'}`}>
                    {lab ? lab.value.toLocaleString() : '—'}
                  </p>
                  <p className="veracity-num mt-0.5 text-[10px] text-[#9a9ea6]">{lab ? lab.unit : 'not in record'}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t border-black/10 pt-2.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Audit trail</p>
            <ul className="mt-1.5 space-y-1">
              {patient.labs.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span className="veracity-num truncate text-[11px] text-[#1a1a1a]">{l.name} · p{l.provenance.page} · {(l.provenance.confidence * 100).toFixed(0)}%</span>
                  <Pill tone={l.status.startsWith('CRITICAL') ? 'bad' : l.status.startsWith('BORDERLINE') ? 'warn' : 'ok'}>{l.status.replace('_', ' ')}</Pill>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="veracity-bloodbank" aria-label="Anemia, serology and transfusion" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">09 — Blood bank</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Anemia, serology <span className="italic">&amp; transfusion</span></h2>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className={anemia && anemia.isAnemic ? 'veracity-tile-critical p-3.5' : 'veracity-tile p-3.5'}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">Anemia optimization</h3>
              {anemia && <Pill tone={anemia.isAnemic ? (anemia.severity === 'SEVERE' ? 'bad' : 'warn') : 'ok'}>{anemia.severity}</Pill>}
            </div>
            <p className="veracity-num mt-2 text-[26px] font-semibold leading-none text-[#1a1a1a]">{anemia ? anemia.hemoglobin : '—'}<span className="text-[12px] font-medium text-[#6b706b]"> g/dL</span></p>
            <p className="veracity-ui-label mt-2 line-clamp-2 text-[12px] leading-snug text-[#6b706b]">{anemia ? anemia.ironProtocol : 'Not computed.'}</p>
            {anemia && <p className="veracity-num mt-1 text-[11px] text-[#6b706b]">{anemia.timeline} · {anemia.expectedImprovement}</p>}
          </div>
          <div className="veracity-tile p-3.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">Serology &amp; crossmatch</h3>
              {serology && <Pill tone={serology.crossmatchStatus === 'COMPATIBLE' ? 'ok' : serology.crossmatchStatus === 'INCOMPATIBLE' ? 'bad' : 'idle'}>{serology.crossmatchStatus.replace('_', ' ')}</Pill>}
            </div>
            {serology ? (
              <ul className="mt-2 space-y-1">
                <li className="flex justify-between"><span className="veracity-ui-label text-[12px] text-[#6b706b]">Group</span><span className="veracity-num text-[12px] font-semibold text-[#1a1a1a]">{serology.bloodGroup} {serology.rhFactor === 'POSITIVE' ? '+' : '−'}</span></li>
                <li className="flex justify-between"><span className="veracity-ui-label text-[12px] text-[#6b706b]">HIV 1/2</span><span className="veracity-num text-[12px] text-[#1a1a1a]">{serology.hiv1_2.replace('_', ' ')}</span></li>
                <li className="flex justify-between"><span className="veracity-ui-label text-[12px] text-[#6b706b]">HBsAg</span><span className="veracity-num text-[12px] text-[#1a1a1a]">{serology.hbsAg.replace('_', ' ')}</span></li>
                <li className="flex justify-between"><span className="veracity-ui-label text-[12px] text-[#6b706b]">Anti-HCV</span><span className="veracity-num text-[12px] text-[#1a1a1a]">{serology.antiHCV.replace('_', ' ')}</span></li>
              </ul>
            ) : (
              <p className="veracity-ui-label mt-2 text-[12px] text-[#6b706b]">No serology on file.</p>
            )}
          </div>
          <div className="veracity-tile p-3.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="veracity-ui-label text-[12.5px] font-medium text-[#1a1a1a]">pRBC predictor</h3>
              {prbc && <Pill tone={prbc.predictedUnits > 1 ? 'warn' : 'ok'}>{prbc.predictedUnits}U</Pill>}
            </div>
            <p className="veracity-num mt-2 text-[26px] font-semibold leading-none text-[#1a1a1a]">{prbc ? prbc.predictedUnits : '—'}<span className="text-[12px] font-medium text-[#6b706b]"> units</span></p>
            <p className="veracity-ui-label mt-2 line-clamp-2 text-[12px] leading-snug text-[#6b706b]">{prbc ? prbc.recommendation : 'Not computed.'}</p>
            {prbc && prbc.riskFactors.length > 0 && (
              <p className="veracity-num mt-1 line-clamp-2 text-[11px] text-[#6b706b]">{prbc.riskFactors.slice(0, 3).join(' · ')}</p>
            )}
          </div>
        </div>
      </section>

      <section id="veracity-clocks" aria-label="Hold clocks and morning directives" className="veracity-fade-up scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="veracity-eyebrow">10 — Clocks</p>
            <h2 className="veracity-serif-accent mt-1 text-[24px] text-[#1a1a1a]">Holds, fasting <span className="italic">&amp; morning meds</span></h2>
          </div>
          {mounted && fasting && <p className="veracity-num text-[11px] text-[#9a9ea6]">{fasting.recommendation}</p>}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="veracity-tile p-3.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Medication hold clocks ({patient.medications.length})</p>
            {patient.medications.length === 0 ? (
              <p className="veracity-ui-label mt-2 text-[12px] text-[#6b706b]">No tracked medications.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {patient.medications.slice(0, 5).map((m) => {
                  const pct = Math.min(100, Math.max(0, (m.lastDoseHoursAgo / Math.max(1, m.requiredHoldHours)) * 100));
                  return (
                    <li key={m.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="veracity-ui-label truncate text-[12px] text-[#1a1a1a]">{m.drugName}</span>
                        <Pill tone={m.status === 'HARD_STOP' ? 'bad' : m.status === 'HOLD_REQUIRED' ? 'warn' : 'ok'}>{m.status.replace(/_/g, ' ')}</Pill>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/[0.08]">
                        <div className="h-full rounded-full bg-[#1a1a1a]/70" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="veracity-num mt-0.5 text-[10px] text-[#9a9ea6]">{m.lastDoseHoursAgo}h elapsed / {m.requiredHoldHours}h required</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="veracity-tile p-3.5">
            <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Morning-of-surgery directives</p>
            {morningMeds.length === 0 ? (
              <p className="veracity-ui-label mt-2 text-[12px] text-[#6b706b]">No directives generated.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {morningMeds.slice(0, 5).map((d, i) => (
                  <li key={`${d.drugName}-${i}`} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="veracity-ui-label truncate text-[12px] text-[#1a1a1a]">{d.drugName} · {d.timing}</p>
                      <p className="veracity-ui-label line-clamp-1 text-[11px] text-[#6b706b]">{d.reason}</p>
                    </div>
                    <Pill tone={d.action === 'HOLD' || d.action === 'OMIT' ? 'warn' : 'ok'}>{d.action.replace(/_/g, ' ')}</Pill>
                  </li>
                ))}
              </ul>
            )}
            {interactions.length > 0 && (
              <div className="mt-2.5 border-t border-black/10 pt-2">
                <p className="veracity-ui-label text-[11px] font-medium uppercase tracking-[0.1em] text-[#6b706b]">Drug interactions ({interactions.length})</p>
                <ul className="mt-1 space-y-1">
                  {interactions.slice(0, 3).map((x, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="veracity-ui-label truncate text-[12px] text-[#1a1a1a]">{x.drug1} + {x.drug2}</span>
                      <Pill tone={x.severity === 'CONTRAINDICATED' || x.severity === 'MAJOR' ? 'bad' : x.severity === 'MODERATE' ? 'warn' : 'idle'}>{x.severity}</Pill>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default LabsPlusSections;
