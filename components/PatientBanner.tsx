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
} from 'lucide-react';

interface PatientBannerProps {
  patient: PatientCase;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ patient }) => {
  const { t } = useI18n();
  const scheduledDate = new Date(patient.scheduledTimeIso);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  const getInvasivenessBadge = (tier: number) => {
    switch (tier) {
      case 1: return { label: 'Tier 1 · Minor', color: 'text-white bg-white/10 border-white/30 font-semibold' };
      case 2: return { label: 'Tier 2 · Intermediate', color: 'text-amber-300 bg-amber-950/30 border-amber-500/40 font-semibold' };
      case 3: return { label: 'Tier 3 · Major', color: 'text-[#EF4444] bg-red-950/40 border-red-500/40 font-semibold' };
      case 4: return { label: 'Tier 4 · Complex', color: 'text-white bg-red-600 border-red-500 font-bold' };
      default: return { label: `Tier ${tier}`, color: 'text-[#94A3B8] bg-[#000000] border-white/[0.08]' };
    }
  };

  const invasiveness = getInvasivenessBadge(patient.invasivenessTier);

  return (
    <section aria-label={t('patientBanner.demographics', { name: patient.name })} className="rounded-[6px] border border-white/[0.10] bg-[#0F1117] p-4 sm:p-5 shadow-none">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-3.5 lg:pb-0 lg:pr-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
            <span>{t('patientBanner.title')}</span>
            <span>·</span>
            <span className="text-[#E2E8F0]">{t('patientBanner.mrn')}: <strong className="text-[#EF4444] font-mono">{patient.mrn}</strong></span>
          </div>
          <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
            <h1 className="font-serif text-xl sm:text-2xl tracking-wide text-white font-bold">{patient.name}</h1>
            <span className="text-xs font-mono text-[#94A3B8]">{patient.age}y / {patient.gender === 'F' ? t('patientBanner.female') : t('patientBanner.male')}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/[0.08] bg-[#000000] px-2.5 py-1 font-mono text-[#E2E8F0]">
              <Scale className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
              <span>{patient.weightKg} kg</span>
              <span className="text-[#64748B]">|</span>
              <span>{patient.heightCm} cm</span>
            </span>
            <span className={`inline-flex items-center gap-1 rounded-[4px] border px-2.5 py-1 font-mono text-xs font-medium ${
              patient.bmi >= 30 ? 'border-amber-500/30 bg-amber-950/20 text-amber-300' : 'border-white/[0.08] bg-[#000000] text-[#E2E8F0]'
            }`}>
              <span>BMI {patient.bmi.toFixed(1)}</span>
              <span className="text-[10px] text-[#94A3B8]">({patient.bmi >= 30 ? t('patientBanner.obeseClassI') : t('patientBanner.normalOverweight')})</span>
            </span>
            <span className="inline-flex items-center rounded-[4px] border border-red-500/40 bg-red-950/40 px-2.5 py-1 font-mono text-xs text-red-200 font-bold">
              <span>CPT {patient.cptCode}</span>
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] pb-3.5 lg:pb-0 lg:pr-5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">{t('patientBanner.plannedProcedure')}</div>
          <div className="mt-1 font-sans text-sm sm:text-base font-medium text-white">{patient.procedureName}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-xs font-mono ${invasiveness.color}`}>
              <Scissors className="h-3 w-3" aria-hidden="true" />
              <span>{invasiveness.label}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-[#94A3B8] font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
              <span>{formattedDate}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
              <span>{formattedTime}</span>
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col justify-between gap-2 text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <Building2 className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
              <span className="font-medium uppercase tracking-wide text-[#E2E8F0]">{t('patientBanner.facility')}</span>
            </div>
            <p className="mt-1 font-sans text-white line-clamp-2">{patient.facility}</p>
          </div>
          <div className="grid grid-cols-1 gap-1 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">{t('common.surgeon')}</span>
              <span className="text-[#E2E8F0] truncate max-w-[170px]" title={patient.surgeon}>{patient.surgeon}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">{t('common.anesthesiologist')}</span>
              <span className="text-red-300 font-semibold truncate max-w-[170px]" title={patient.anesthesiologist}>{patient.anesthesiologist}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(PatientBanner);
