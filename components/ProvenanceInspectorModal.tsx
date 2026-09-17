'use client';

import React, { useMemo, useState } from 'react';
import { ShieldCheck, X, FileText, Crosshair, Fingerprint } from 'lucide-react';
import type { BoundingBox as VisionBoundingBox, ExtractedBiomarker } from '@/lib/vision-parser';
import type { BoundingBox as InternalBoundingBox, ExtractedLabItem } from '@/lib/types';

type ProvenanceBox = VisionBoundingBox | (InternalBoundingBox & { page?: number; confidence?: number });

export interface ProvenanceVerification {
  verifierName: string;
  timestampIso: string;
  signatureHash: string;
}

interface ProvenanceInspectorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  alertBody: string;
  guidelineTitle: string;
  guidelineReference: string;
  biomarkerLabel: string;
  biomarkerValue: string;
  status: string;
  provenance: ProvenanceBox;
  documentName: string;
  documentDataUrl?: string | null;
  onVerify: (verification: ProvenanceVerification) => void;
}

function normalizeBox(box: ProvenanceBox): { left: number; top: number; width: number; height: number; page: number; confidence: number } {
  if ('xMin' in box) {
    const b = box as VisionBoundingBox;
    return {
      left: b.xMin,
      top: b.yMin,
      width: Math.max(0.5, b.xMax - b.xMin),
      height: Math.max(0.5, b.yMax - b.yMin),
      page: b.page,
      confidence: b.confidence,
    };
  }
  const b = box as InternalBoundingBox & { page?: number; confidence?: number };
  const scale = b.xmax <= 1 && b.ymax <= 1 ? 100 : 1;
  return {
    left: b.xmin * scale,
    top: b.ymin * scale,
    width: Math.max(0.5, (b.xmax - b.xmin) * scale),
    height: Math.max(0.5, (b.ymax - b.ymin) * scale),
    page: b.page ?? 1,
    confidence: b.confidence ?? 0.9,
  };
}

export function biomarkerToModalProps(
  biomarker: ExtractedBiomarker,
  alertBody: string,
  guidelineTitle: string,
  guidelineReference: string,
  documentName: string
): Pick<
  ProvenanceInspectorModalProps,
  'title' | 'alertBody' | 'guidelineTitle' | 'guidelineReference' | 'biomarkerLabel' | 'biomarkerValue' | 'status' | 'provenance' | 'documentName'
> {
  return {
    title: `${biomarker.canonicalName} — ${biomarker.status}`,
    alertBody,
    guidelineTitle,
    guidelineReference,
    biomarkerLabel: biomarker.canonicalName,
    biomarkerValue: `${biomarker.normalizedValue} ${biomarker.normalizedUnit} (raw: ${biomarker.rawValue})`,
    status: biomarker.status,
    provenance: biomarker.provenance,
    documentName,
  };
}

export function labItemToModalProps(
  lab: ExtractedLabItem,
  guidelineTitle: string,
  guidelineReference: string
): Pick<
  ProvenanceInspectorModalProps,
  'title' | 'alertBody' | 'guidelineTitle' | 'guidelineReference' | 'biomarkerLabel' | 'biomarkerValue' | 'status' | 'provenance' | 'documentName'
> {
  return {
    title: `${lab.name} — ${lab.status.replace('_', ' ')}`,
    alertBody: lab.directive,
    guidelineTitle,
    guidelineReference,
    biomarkerLabel: lab.name,
    biomarkerValue: `${lab.value} ${lab.unit} (ref ${lab.refLow}–${lab.refHigh})`,
    status: lab.status,
    provenance: { ...lab.provenance.bbox, page: lab.provenance.page, confidence: lab.provenance.confidence },
    documentName: lab.provenance.documentName,
  };
}

export const ProvenanceInspectorModal: React.FC<ProvenanceInspectorModalProps> = ({
  open,
  onClose,
  title,
  alertBody,
  guidelineTitle,
  guidelineReference,
  biomarkerLabel,
  biomarkerValue,
  status,
  provenance,
  documentName,
  documentDataUrl,
  onVerify,
}) => {
  const [verifierName, setVerifierName] = useState('');
  const [signing, setSigning] = useState(false);
  const box = useMemo(() => normalizeBox(provenance), [provenance]);

  if (!open) return null;

  const handleVerify = async () => {
    if (verifierName.trim().length < 3 || signing) return;
    setSigning(true);
    try {
      const payload = `${documentName}|${biomarkerLabel}|${biomarkerValue}|${verifierName.trim()}|${new Date().toISOString()}`;
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
      const signatureHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      onVerify({
        verifierName: verifierName.trim(),
        timestampIso: new Date().toISOString(),
        signatureHash,
      });
      onClose();
    } finally {
      setSigning(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Provenance inspection for ${biomarkerLabel}`} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <div className="glass-panel animate-scale-in flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <p className="veracity-num text-[10.5px] uppercase tracking-[0.14em] text-sky-300">Provenance split-view</p>
            <h2 className="veracity-ui-label mt-1 truncate text-[16px] font-semibold text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close provenance inspector"             className="veracity-focus veracity-press rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2">
          <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
            <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Structured alert</p>
            <p className="veracity-ui-label mt-2 text-[13px] leading-relaxed text-slate-100">{alertBody}</p>
            <div className="glass-card-subtle mt-3 rounded-xl p-3">
              <p className="veracity-ui-label text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Guideline reference</p>
              <p className="veracity-ui-label mt-1 text-[12.5px] font-semibold text-white">{guidelineTitle}</p>
              <p className="veracity-num mt-1 text-[11px] leading-relaxed text-slate-400">{guidelineReference}</p>
            </div>
            <dl className="veracity-num mt-3 space-y-1.5 text-[11.5px] text-slate-300">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Marker</dt><dd className="text-right text-slate-100">{biomarkerLabel}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Value</dt><dd className="text-right text-slate-100">{biomarkerValue}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Status</dt><dd className="text-right text-slate-100">{status}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Source box</dt><dd className="text-right">p{box.page} · {box.left.toFixed(1)}, {box.top.toFixed(1)} · conf {box.confidence.toFixed(2)}</dd></div>
            </dl>
          </div>

          <div className="p-4">
            <p className="veracity-ui-label flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <FileText size={13} aria-hidden="true" /> {documentName} · page {box.page}
            </p>
            <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,#0d1524,#070c15)]" style={{ aspectRatio: '3 / 4' }}>
              {documentDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={documentDataUrl} alt={`Source document ${documentName}`} className="absolute inset-0 h-full w-full object-contain opacity-90" />
              ) : (
                <div aria-hidden="true" className="absolute inset-0 p-5">
                  <div className="h-3 w-2/3 rounded bg-white/15" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="mt-2.5 flex gap-2">
                      <div className="h-2.5 w-1/3 rounded bg-white/[0.07]" />
                      <div className="h-2.5 w-1/4 rounded bg-white/[0.05]" />
                      <div className="h-2.5 w-1/5 rounded bg-white/[0.07]" />
                    </div>
                  ))}
                  <p className="veracity-num mt-4 text-[10px] text-slate-500">Simulated rendering — upload the source PDF/image to overlay the true scan.</p>
                </div>
              )}
              <div
                aria-hidden="true"
                className="absolute rounded-[4px] border-2 border-cyan-300 bg-cyan-300/15 shadow-[0_0_18px_rgba(34,211,238,0.65)]"
                style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}
              />
              <span className="veracity-num absolute inline-flex items-center gap-1 rounded-md bg-cyan-300 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-950" style={{ left: `${Math.min(94, box.left)}%`, top: `calc(${Math.max(0, box.top)}% - 20px)` }}>
                <Crosshair size={10} aria-hidden="true" /> {box.confidence.toFixed(2)}
              </span>
            </div>
            <p className="veracity-num mt-2 text-[10.5px] text-slate-500">
              Overlay uses exact coordinates xMin {box.left.toFixed(2)}, yMin {box.top.toFixed(2)}, width {box.width.toFixed(2)}, height {box.height.toFixed(2)} (percent).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row sm:items-center">
          <label className="veracity-ui-label flex flex-1 items-center gap-2 text-[12px] text-slate-300">
            <Fingerprint size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
            <span className="sr-only">Verifying clinician name</span>
            <input
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
              placeholder="Verifying clinician name for signature"
              className="veracity-focus w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-white placeholder:text-slate-500"
              autoComplete="name"
            />
          </label>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifierName.trim().length < 3 || signing}
            className="veracity-focus veracity-ui-label inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={15} aria-hidden="true" />
            {signing ? 'Signing…' : 'Verify & Attest'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProvenanceInspectorModal;
