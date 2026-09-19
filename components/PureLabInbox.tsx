'use client';

import React, { useEffect, useState } from 'react';
import { usePatientStore } from '@/lib/store';
import { logAuditEvent } from '@/lib/audit-logger';
import { parseLabReport } from '@/lib/lab-parser';
import { PURELAB_DEMO_EMAILS } from '@/lib/purelab-demo';
import {
  extractReportMeta,
  isStaleReport,
  matchPatient,
  type MatchResult,
} from '@/lib/report-match';
import {
  determinePACSwimLane,
  evaluateOverallClearance,
} from '@/lib/rules-engine';
import type { ExtractedLabItem, PatientCase } from '@/lib/types';

const SEEN_KEY = 'hh-purelab-seen-v1';

function loadSeen(): Record<string, string> {
  try {
    if (typeof window === 'undefined') return {};
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) || '{}');
  } catch {
    return {};
  }
}

interface InboxItem {
  mailId: string;
  labs: ExtractedLabItem[];
  match: MatchResult;
  stale: boolean;
  accession: string | null;
}

export default function PureLabInbox() {
  const { patients, updatePatient, fetchPatientsFromApi } = usePatientStore();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [seen, setSeen] = useState<Record<string, string>>( {});
  const [boundIds, setBoundIds] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPatientsFromApi();
    setSeen(loadSeen());
  }, [fetchPatientsFromApi]);

  const checkInbox = () => {
    setFetching(true);
    // Simulated IMAP poll latency — real worker would fetch unseen here.
    setTimeout(() => {
      const next: InboxItem[] = PURELAB_DEMO_EMAILS.map((mail) => {
        const meta = extractReportMeta(mail.reportText);
        const match = matchPatient(meta, patients);
        const labs = parseLabReport(
          mail.reportText,
          'PURE_LAB',
          [],
          mail.attachmentName,
          match.patient
            ? { age: match.patient.age, gender: match.patient.gender }
            : { age: 40, gender: 'M' }
        );
        return {
          mailId: mail.id,
          labs,
          match,
          stale: isStaleReport(meta),
          accession: meta.accession,
        };
      });
      setItems(next);
      setFetching(false);
      logAuditEvent('INGESTION_STARTED' as any, 'purelab-inbox', `Demo inbox polled: ${next.length} synthetic PureLab emails`);
    }, 900);
  };

  const bindToCase = (item: InboxItem) => {
    const target: PatientCase | null = item.match.patient;
    if (!target) return;
    // Demo merge policy: the new report REPLACES the case lab set (latest report drives flags).
    const updated: PatientCase = { ...target, labs: item.labs };
    const clearance = evaluateOverallClearance(updated);
    const swimLane = determinePACSwimLane(updated);
    updatePatient(target.id, {
      labs: item.labs,
      overallStatus: clearance.status,
      primaryActionDirective: clearance.primaryDirective,
      swimLane,
    });
    const seenNext = { ...seen, [item.mailId]: item.accession || 'bound' };
    setSeen(seenNext);
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(seenNext));
    } catch {
      /* demo storage */
    }
    setBoundIds((b) => ({ ...b, [item.mailId]: target.mrn }));
    logAuditEvent(
      'INGESTION_COMPLETE' as any,
      target.id,
      `PureLab ${item.accession || 'report'} bound to ${target.mrn} (${item.match.basis})${item.stale ? ' — STALE REPORT, verify freshness' : ''} [synthetic demo]`
    );
  };

  const mailById = (id: string) => PURELAB_DEMO_EMAILS.find((m) => m.id === id)!;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={checkInbox}
          disabled={fetching}
          className="rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-bold text-white hover:bg-black/80 disabled:opacity-50 min-h-[44px]"
        >
          {fetching ? 'Polling pac-labs@… (demo)…' : items ? 'Re-poll inbox (demo)' : 'Check inbox — pac-labs@demo-clinic.ae'}
        </button>
        <span className="font-mono text-[10px] text-[#6b706b]">
          sender-allowlisted to results@purelab.com · SHA-256-style dedupe · 3 synthetic emails
        </span>
      </div>

      {items === null && !fetching && (
        <p className="text-xs text-[#6b706b]">
          Nothing fetched yet. The demo poller returns 3 synthetic PureLab emails: one exact MRN match,
          one unknown MRN (review queue), one stale report.
        </p>
      )}

      {items?.map((item) => {
        const mail = mailById(item.mailId);
        const already = seen[item.mailId];
        const bound = boundIds[item.mailId];
        const critical = item.labs.filter((l) => l.status.startsWith('CRITICAL')).length;
        const borderline = item.labs.filter((l) => l.status.startsWith('BORDERLINE')).length;
        return (
          <div key={item.mailId} className="rounded-xl border border-black/10 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-[#6b706b]">{mail.from}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1a1a1a]">{mail.subject}</span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${item.match.level === 'EXACT_MRN'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-[#1c7a3d]'
                : 'border-amber-400/40 bg-amber-500/10 text-[#7a5200]'
                }`}>
                {item.match.level.replace(/_/g, ' ')}
              </span>
              {item.stale && (
                <span className="shrink-0 rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#b3261e]">
                  STALE &gt;30d
                </span>
              )}
              {bound && (
                <span className="shrink-0 rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#1a1a1a]">
                  ✓ BOUND → {bound}
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-[10px] text-[#9a9ea6]">
              {mail.attachmentName} · {item.accession} · {item.labs.length} analytes parsed · {critical} critical · {borderline} borderline · {item.match.basis}
            </p>

            {item.stale && (
              <p className="mt-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-[11px] text-[#b3261e]">
                Stale-report rule: this result predates the 30-day freshness window. A real bind requires
                coordinator sign-off and usually a repeat draw — never silently drives flags.
              </p>
            )}

            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {item.labs.map((l) => (
                <div key={l.id} className="rounded-lg border border-black/10 bg-black/[0.03] px-2 py-1.5">
                  <p className="truncate text-[11px] font-semibold text-[#1a1a1a]">{l.name}</p>
                  <p className="font-mono text-[11px] text-[#6b706b]">
                    {l.value} {l.unit} · <span className={l.status.startsWith('CRITICAL') ? 'text-[#b3261e]' : l.status.startsWith('BORDERLINE') ? 'text-[#7a5200]' : 'text-[#1c7a3d]'}>{l.status}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {item.match.autoBindAllowed && !bound && (
                <button
                  type="button"
                  onClick={() => bindToCase(item)}
                  className="rounded-full bg-[#1a1a1a] px-3 py-2 text-[11px] font-bold text-white hover:bg-black/80 min-h-[44px]"
                >
                  Bind to {item.match.patient?.name} ({item.match.patient?.mrn})
                </button>
              )}
              {!item.match.autoBindAllowed && (
                <span className="rounded-lg border border-black/10 bg-black/[0.03] px-3 py-2 font-mono text-[10px] text-[#6b706b]">
                  Queued for coordinator review — no auto-bind below exact-MRN confidence
                </span>
              )}
              {already && !bound && (
                <span className="font-mono text-[10px] text-[#9a9ea6]">
                  Seen before ({already}) — dedupe would skip re-ingest
                </span>
              )}
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-[#9a9ea6]">{mail.note}</p>
          </div>
        );
      })}
    </div>
  );
}
