'use client';

import React from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import {
  User,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Scissors,
  Scale,
  Activity,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  MessageSquare,
  Printer,
  ChevronRight,
  Flame,
  Droplets,
  Zap,
} from 'lucide-react';

interface MedicarePatientCardProps {
  patient: PatientCase;
  isAttested: boolean;
  onOpenAttestation: () => void;
  onOpenWhatsApp?: () => void;
  onOpenPrintSlip: () => void;
}

export const MedicarePatientCard: React.FC<MedicarePatientCardProps> = ({
  patient,
  isAttested,
  onOpenAttestation,
  onOpenWhatsApp,
  onOpenPrintSlip,
}) => {
  const { t } = useI18n();
  const scheduledDate = new Date(patient.scheduledTimeIso);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const getInvasivenessBadge = (tier: number) => {
    switch (tier) {
      case 1:
        return { label: 'Tier 1 · Minor', color: 'text-white bg-white/10 border-white/30 font-semibold' };
      case 2:
        return { label: 'Tier 2 · Intermediate', color: 'text-amber-300 bg-amber-950/40 border-amber-500/40 font-semibold' };
      case 3:
        return { label: 'Tier 3 · Major', color: 'text-rose-400 bg-rose-950/40 border-rose-500/40 font-semibold' };
      case 4:
        return { label: 'Tier 4 · Complex', color: 'text-white bg-red-600 border-red-500 font-bold' };
      default:
        return { label: `Tier ${tier}`, color: 'text-neutral-400 bg-black border-white/[0.08]' };
    }
  };

  const invasiveness = getInvasivenessBadge(patient.invasivenessTier);

  // Derive Patient Initials
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Get Latest Physiological Vitals if available
  const latestVital = patient.vitals && patient.vitals.length > 0
    ? patient.vitals[patient.vitals.length - 1]
    : { systolicBp: 124, diastolicBp: 80, heartRate: 72, spo2: 99, temperatureC: 36.8, respiratoryRate: 14 };

  return (
    <div className="rounded-2xl border border-white/[0.10] bg-gradient-to-b from-[#12151E] via-[#0D0F16] to-[#090A0E] p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Top Patient Identity & Demographics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Avatar + Name + Core Metrics */}
        <div className="lg:col-span-6 space-y-3.5 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-4 lg:pb-0 lg:pr-5">
          <div className="flex items-start gap-3.5">
            {/* Patient Avatar Circle */}
            <div className="relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 via-white/10 to-transparent border border-white/20 text-white font-serif font-bold text-lg sm:text-xl shadow-md shrink-0">
              <span>{initials}</span>
              <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-[#0D0F16] ${
                patient.overallStatus === 'GREEN_CLEARED'
                  ? 'bg-emerald-400'
                  : patient.overallStatus === 'AMBER_CONDITIONAL'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`} />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {patient.name}
                </h2>
                <span className="rounded-md border border-cyan-500/40 bg-cyan-950/30 px-2 py-0.5 font-mono text-[10.5px] font-bold text-cyan-300">
                  {patient.mrn}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {patient.age}y / {patient.gender === 'F' ? 'Female' : 'Male'}
                </span>
              </div>

              {/* Physical Parameters Strip */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-black/60 px-2.5 py-1 text-neutral-200">
                  <Scale className="h-3 w-3 text-neutral-400" />
                  <span>{patient.weightKg} kg</span>
                  <span className="text-neutral-600">|</span>
                  <span>{patient.heightCm} cm</span>
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 ${
                  patient.bmi >= 30
                    ? 'border-amber-500/30 bg-amber-950/30 text-amber-300'
                    : 'border-white/[0.08] bg-black/60 text-neutral-200'
                }`}>
                  <span>BMI {patient.bmi.toFixed(1)}</span>
                </span>
                <span className="inline-flex items-center rounded-md border border-white/[0.12] bg-white/[0.06] px-2 py-1 text-white font-bold">
                  {patient.asaStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Physiological Vitals Strip (Medicare Style) */}
          <div className="rounded-xl border border-white/[0.06] bg-black/50 p-2.5 grid grid-cols-5 gap-1.5 text-center font-mono">
            <div className="p-1">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">NIBP</span>
              <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">{latestVital.systolicBp}/{latestVital.diastolicBp}</span>
              <span className="text-[8.5px] text-neutral-400">mmHg</span>
            </div>
            <div className="p-1 border-l border-white/[0.06]">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">PULSE</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 block mt-0.5">{latestVital.heartRate}</span>
              <span className="text-[8.5px] text-neutral-400">bpm</span>
            </div>
            <div className="p-1 border-l border-white/[0.06]">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">SpO2</span>
              <span className="text-xs sm:text-sm font-bold text-cyan-400 block mt-0.5">{latestVital.spo2}%</span>
              <span className="text-[8.5px] text-neutral-400">Room Air</span>
            </div>
            <div className="p-1 border-l border-white/[0.06]">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">TEMP</span>
              <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">{latestVital.temperatureC}°C</span>
              <span className="text-[8.5px] text-neutral-400">Oral</span>
            </div>
            <div className="p-1 border-l border-white/[0.06]">
              <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">RESP</span>
              <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">{latestVital.respiratoryRate}</span>
              <span className="text-[8.5px] text-neutral-400">/min</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Surgical Procedure & Schedule */}
        <div className="lg:col-span-3 space-y-3 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-4 lg:pb-0 lg:pr-5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Planned Procedure
            </span>
            <h3 className="font-sans text-sm sm:text-base font-semibold text-white mt-0.5">
              {patient.procedureName}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-mono border ${invasiveness.color}`}>
                <Scissors className="h-3 w-3" />
                <span>{invasiveness.label}</span>
              </span>
              <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10.5px] font-mono text-neutral-300">
                {patient.cptCode}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs font-mono text-neutral-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Surgical Facility & Quick Actions */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Clinical Team & Facility
            </span>
            <div className="mt-1 space-y-1 text-xs">
              <p className="font-sans text-white text-[11.5px] truncate" title={patient.facility}>
                {patient.facility.split(',')[0]}
              </p>
              <p className="text-[11px] text-neutral-400 font-mono truncate" title={patient.surgeon}>
                Surgeon: {patient.surgeon.split(',')[0]}
              </p>
              <p className="text-[11px] text-neutral-400 font-mono truncate" title={patient.anesthesiologist}>
                Anaesthetist: {patient.anesthesiologist.split(',')[0]}
              </p>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onOpenAttestation}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-xs font-bold transition-all shadow cursor-pointer ${
                isAttested
                  ? 'border border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>{isAttested ? 'Attested ✓' : 'Sign Attestation'}</span>
            </button>

            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                title="Dispatch WhatsApp NPO Telemetry"
                className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-500/20 text-emerald-400 px-2.5 py-2 text-xs font-mono transition cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>NPO WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPrintSlip}
              title="Print PAC Slip"
              className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 p-2 text-xs transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MedicarePatientCard);
