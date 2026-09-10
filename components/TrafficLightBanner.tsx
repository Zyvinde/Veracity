'use client';

import React from 'react';
import { PatientCase, ClearanceStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n/context';
import {
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  HeartPulse,
  Activity,
  PhoneCall,
  Video,
  UserCheck,
  Zap,
} from 'lucide-react';

interface TrafficLightBannerProps {
  patient: PatientCase;
}

export const TrafficLightBanner: React.FC<TrafficLightBannerProps> = ({ patient }) => {
  const { t } = useI18n();

  const getStatusStyles = (status: ClearanceStatus) => {
    switch (status) {
      case 'GREEN_CLEARED':
        return {
          badgeClass: 'status-badge status-cleared',
          dotClass: 'bg-emerald-500',
          title: t('trafficLight.clearedTitle'),
          subtext: t('trafficLight.clearedSubtext'),
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-200 dark:text-emerald-400" aria-hidden="true" />,
          accentColor: 'text-[#223140] dark:text-emerald-300',
          directiveBorder: 'border-emerald-300/40 bg-[#F0FDF4] dark:border-emerald-500/25 dark:bg-emerald-500/[0.07]',
        };
      case 'AMBER_CONDITIONAL':
        return {
          badgeClass: 'status-badge status-conditional',
          dotClass: 'bg-amber-500',
          title: t('trafficLight.conditionalTitle'),
          subtext: t('trafficLight.conditionalSubtext'),
          icon: <AlertTriangle className="h-5 w-5 text-amber-200 dark:text-amber-400" aria-hidden="true" />,
          accentColor: 'text-amber-900 dark:text-amber-300',
          directiveBorder: 'border-amber-300/40 bg-[#FFFBEB] dark:border-amber-500/25 dark:bg-amber-500/[0.07]',
        };
      case 'RED_HARD_STOP':
        return {
          badgeClass: 'status-badge status-stop',
          dotClass: 'bg-rose-600',
          title: t('trafficLight.hardStopTitle'),
          subtext: t('trafficLight.hardStopSubtext'),
          icon: <OctagonAlert className="h-5 w-5 text-rose-200 dark:text-rose-400" aria-hidden="true" />,
          accentColor: 'text-rose-900 dark:text-rose-300',
          directiveBorder: 'border-rose-300/40 bg-[#FEF2F2] dark:border-rose-500/25 dark:bg-rose-500/[0.07]',
        };
    }
  };

  const getSwimLaneDetails = (lane: string) => {
    switch (lane) {
      case 'LANE_1_VIRTUAL':
        return { label: t('trafficLight.lane1'), description: t('trafficLight.lane1Desc'), icon: <Video className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />, badgeClass: 'border-emerald-300 bg-emerald-500/20 text-emerald-100 font-semibold' };
      case 'LANE_2_TELEPHONIC':
        return { label: t('trafficLight.lane2'), description: t('trafficLight.lane2Desc'), icon: <PhoneCall className="h-3.5 w-3.5 text-amber-200" aria-hidden="true" />, badgeClass: 'border-amber-300 bg-amber-500/20 text-amber-800 font-semibold' };
      case 'LANE_3_IN_PERSON':
      default:
        return { label: t('trafficLight.lane3'), description: t('trafficLight.lane3Desc'), icon: <UserCheck className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />, badgeClass: 'border-rose-300 bg-rose-500/20 text-rose-800 font-semibold' };
    }
  };

  const currentStyles = getStatusStyles(patient.overallStatus);
  const swimLane = getSwimLaneDetails(patient.swimLane);

  return (
    <section
      role="status"
      aria-label={`Clearance status: ${patient.overallStatus.replace(/_/g, ' ')}`}
      className="glass-console rounded-2xl p-5 sm:p-6 shadow-xs text-white/90"
    >
      <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 sm:gap-3.5">
          <div className="rounded-xl bg-white/10 p-3 border border-white/20 shrink-0">
            {currentStyles.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${currentStyles.dotClass}`} aria-hidden="true" />
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                patient.overallStatus === 'RED_HARD_STOP'
                  ? 'glass-badge-stop'
                  : patient.overallStatus === 'AMBER_CONDITIONAL'
                  ? 'glass-badge-conditional'
                  : 'glass-badge-cleared'
              }`}>
                {currentStyles.title}
              </span>
              <span className="text-[11px] text-white/60 font-mono" suppressHydrationWarning>
                Rule Engine Verified · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-white/75 font-medium">{currentStyles.subtext}</p>
          </div>
        </div>

        <div className={`rounded-xl border p-4 md:max-w-md w-full md:w-auto ${currentStyles.directiveBorder}`}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/75 font-mono">
            <Zap className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
            <span>{t('trafficLight.primaryDirective')}</span>
          </div>
          <p className={`mt-1 text-xs font-bold leading-relaxed ${currentStyles.accentColor}`}>
            {patient.primaryActionDirective}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-white/15">
        <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-white/70 font-mono">
            <span>{t('trafficLight.asaStatus')}</span>
            <Activity className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-extrabold text-base text-white font-mono">{patient.asaStatus}</span>
            <span className="text-[10px] text-white/70">
              ({patient.asaStatus === 'ASA I' ? t('trafficLight.healthy') : patient.asaStatus === 'ASA II' ? t('trafficLight.mildSystemic') : t('trafficLight.severeSystemic')})
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-white/70 font-mono">
            <span>{t('trafficLight.cardiacRisk')}</span>
            <HeartPulse className="h-3.5 w-3.5 text-sky-200" aria-hidden="true" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-extrabold text-base text-white font-mono">{patient.rcriClass}</span>
            <span className="text-[10px] text-white/70 font-mono">(MACE)</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-white/70 font-mono">
            <span>{t('trafficLight.stopBang')}</span>
            <span className={`text-[10px] font-bold ${patient.stopBangScore >= 3 ? 'text-amber-200' : 'text-emerald-200'}`}>
              {patient.stopBangScore >= 3 ? t('trafficLight.moderateOSA') : t('trafficLight.lowOSA')}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-extrabold text-base text-white font-mono">{patient.stopBangScore} / 8</span>
            <span className="text-[10px] text-white/70 font-mono">pts</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-white/70 font-mono">
            <span>{t('trafficLight.telePacLane')}</span>
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${swimLane.badgeClass}`}>
              {swimLane.icon}
              <span className="truncate">{swimLane.label.split(':')[1] || swimLane.label}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(TrafficLightBanner);
