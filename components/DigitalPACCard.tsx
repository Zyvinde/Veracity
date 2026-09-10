'use client';

import React from 'react';
import { PatientCase, AttestationRecord } from '@/lib/types';
import {
  FileCheck2,
  Printer,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  Lock,
  QrCode,
  Sparkles,
  ExternalLink,
  Clock,
  Pill,
  Activity,
  HeartPulse,
  UserCheck,
  Share2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface DigitalPACCardProps {
  patient: PatientCase;
  attestationRecord: AttestationRecord | null;
  onOpenPrintSlip: () => void;
  onOpenAttestation: () => void;
  onOpenWhatsApp: () => void;
}

export const DigitalPACCard: React.FC<DigitalPACCardProps> = ({
  patient,
  attestationRecord,
  onOpenPrintSlip,
  onOpenAttestation,
  onOpenWhatsApp,
}) => {
  const { t } = useI18n();
  const isCleared = patient.overallStatus === 'GREEN_CLEARED';
  const isAmber = patient.overallStatus === 'AMBER_CONDITIONAL';
  const isRed = patient.overallStatus === 'RED_HARD_STOP';

  const scheduledDate = new Date(patient.scheduledTimeIso);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getStatusColor = () => {
    if (isCleared) {
      return {
        badge: 'glass-badge-cleared font-bold',
        title: t('trafficLight.clearedTitle'),
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-200" />,
      };
    }
    if (isAmber) {
      return {
        badge: 'glass-badge-conditional font-bold',
        title: t('trafficLight.conditionalTitle'),
        icon: <AlertTriangle className="h-4 w-4 text-amber-200" />,
      };
    }
    return {
      badge: 'glass-badge-stop font-bold',
      title: t('trafficLight.hardStopTitle'),
      icon: <OctagonAlert className="h-4 w-4 text-rose-200" />,
    };
  };

  const statusTheme = getStatusColor();
  const isUAE = patient.mrn.includes('DHA') || patient.facility.includes('Dubai');

  return (
    <div className="glass-console rounded-2xl p-5 sm:p-6 shadow-xs">
      {/* Top Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-sky-200 shadow-xs">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-xl sm:text-2xl tracking-wide text-white font-normal">
                {t('digitalPac.title')}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white border border-white/30">
                {t('digitalPac.sovereignCert')}
              </span>
            </div>
            <p className="text-xs text-white/70 font-mono mt-1">
              {t('digitalPac.certNo')} #{patient.id} · {t('digitalPac.mrn')} <span className="text-white font-semibold">{patient.mrn}</span>
            </p>
          </div>
        </div>

        {/* Clearance Verdict Badge */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-bold tracking-wider ${statusTheme.badge}`}>
            {statusTheme.icon}
            <span>{statusTheme.title}</span>
          </div>
        </div>
      </div>

      {/* Primary Clinical Directive Box */}
      <div className="my-4 rounded-xl border glass-soft p-4">
        <div className="flex items-center justify-between text-xs font-mono text-white/70 uppercase tracking-wider mb-1.5">
          <span className="font-bold text-white/90">{t('common.directive')}</span>
          <span className="text-white/60 font-normal">
            {isUAE ? t('digitalPac.jurisdictionUae') : t('digitalPac.jurisdictionIndia')}
          </span>
        </div>
        <p className="font-sans text-sm font-medium text-white/85 leading-relaxed">
          {patient.primaryActionDirective}
        </p>
      </div>

      {/* High-Density PAC Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 my-4">
        {/* ASA Classification */}
        <div className="rounded-xl border glass-soft p-3.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
            {t('digitalPac.asaPhysical')}
          </span>
          <div className="mt-1 font-mono text-base font-bold text-white">
            {patient.asaStatus}
          </div>
          <span className="text-[11px] text-white/70 font-sans">
            {patient.asaStatus === 'ASA I' ? t('digitalPac.normalHealthy') : patient.asaStatus === 'ASA II' ? t('digitalPac.mildDisease') : t('digitalPac.severeSystemic')}
          </span>
        </div>

        {/* Revised Cardiac Risk (RCRI) */}
        <div className="rounded-xl border glass-soft p-3.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
            {t('digitalPac.cardiacRcri')}
          </span>
          <div className="mt-1 font-mono text-base font-bold text-white">
            {patient.rcriClass}
          </div>
          <span className="text-[11px] text-white/70 font-sans">{t('digitalPac.maceRisk')}</span>
        </div>

        {/* STOP-Bang OSA Score */}
        <div className="rounded-xl border glass-soft p-3.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
            {t('digitalPac.stopBang')}
          </span>
          <div className="mt-1 font-mono text-base font-bold text-white">
            {patient.stopBangScore} / 8 pts
          </div>
          <span className={`text-[11px] font-medium ${patient.stopBangScore >= 3 ? 'text-amber-200 font-semibold' : 'text-white/75'}`}>
            {patient.stopBangScore >= 3 ? t('digitalPac.moderateRisk') : t('digitalPac.lowRisk')}
          </span>
        </div>

        {/* Airway & Fasting */}
        <div className="rounded-xl border glass-soft p-3.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 block">
            {t('digitalPac.airwayFasting')}
          </span>
          <div className="mt-1 font-mono text-base font-bold text-rose-200">
            {patient.airway.mallampati}
          </div>
          <span className="text-[11px] text-white/70 font-sans">{t('digitalPac.midnightNpo')}</span>
        </div>
      </div>

      {/* Attestation Status & Action Controls */}
      <div className="rounded-xl border glass-soft p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
            attestationRecord
              ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-200'
              : 'border-rose-300/40 bg-rose-500/20 text-rose-200'
          }`}>
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-white text-sm">
                {attestationRecord?.anesthesiologistName || patient.anesthesiologist}
              </span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                attestationRecord ? 'glass-badge-cleared' : 'glass-badge-stop'
              }`}>
                {attestationRecord ? t('digitalPac.digitallySigned') : t('digitalPac.pendingAttestation')}
              </span>
            </div>
            <p className="font-mono text-[11px] text-white/70 mt-0.5">
              License: <span className="text-white/90 font-semibold">{attestationRecord?.licenseNumber || 'DHA-MED-2026-99014'}</span> · Hash: <span className="text-white/60">{attestationRecord?.signatureHash || '0x7f83b165...'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Send WhatsApp CTA */}
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl glass-input border px-3.5 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 hover:text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-emerald-200" />
            <span>{t('digitalPac.sendWhatsApp')}</span>
          </button>

          {/* View Print Slip */}
          <button
            type="button"
            onClick={onOpenPrintSlip}
            className="flex items-center justify-center gap-1.5 rounded-xl glass-input border px-3.5 py-2 text-xs font-medium text-white/85 hover:bg-white/10 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4 text-white/70" />
            <span className="hidden xs:inline">{t('digitalPac.viewSlip')}</span>
          </button>

          {/* Sign / Update Attestation */}
          <button
            type="button"
            onClick={onOpenAttestation}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-white/85 px-4 py-2 text-xs font-bold text-slate-900 shadow-md shadow-black/40 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-white" />
            <span>{attestationRecord ? t('digitalPac.updateSignoff') : t('digitalPac.tapSign')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalPACCard;
