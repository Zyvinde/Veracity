'use client';

import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Pill,
  TrendingUp,
  AlertTriangle,
  Scissors,
  Users,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface MedicareStatCardsProps {
  onCardClick?: (tab: string) => void;
}

export const MedicareStatCards: React.FC<MedicareStatCardsProps> = ({ onCardClick }) => {
  const { t } = useI18n();

  return (
    <section aria-label="Medicare Perioperative Key Performance Metrics" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Stat Card 1: Active Surgeries Today */}
        <div
          onClick={() => onCardClick?.('overview')}
          className="group relative rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 via-[#0F1117] to-[#0A0B0E] p-4 sm:p-4.5 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-mono font-medium uppercase tracking-wider text-cyan-400/80">
                Surgeries Today
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  12
                </span>
                <span className="text-xs font-mono text-cyan-300/80 font-medium">Cases</span>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Scissors className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-white/[0.06] pt-2.5">
            <span className="text-neutral-400">4 Cleared · 2 In-OR</span>
            <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
              <TrendingUp className="h-3 w-3" />
              +8.3%
            </span>
          </div>

          {/* Mini Sparkline Visualization */}
          <div className="mt-2 h-4 w-full">
            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cyanSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,15 Q15,12 30,16 T60,8 T80,12 T100,4"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0,15 Q15,12 30,16 T60,8 T80,12 T100,4 L100,20 L0,20 Z"
                fill="url(#cyanSpark)"
              />
              <circle cx="100" cy="4" r="2.5" fill="#06B6D4" className="animate-pulse" />
            </svg>
          </div>
        </div>

        {/* Stat Card 2: PAC Clearance Rate */}
        <div
          onClick={() => onCardClick?.('checkup')}
          className="group relative rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 via-[#0F1117] to-[#0A0B0E] p-4 sm:p-4.5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-mono font-medium uppercase tracking-wider text-emerald-400/80">
                PAC Clearance Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  91.7<span className="text-emerald-400 text-lg">%</span>
                </span>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-white/[0.06] pt-2.5">
            <span className="text-neutral-400">11/12 Green Status</span>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9.5px] text-emerald-300 font-bold border border-emerald-500/30">
              TARGET &gt;90%
            </span>
          </div>

          {/* Mini Progress Bar Visualization */}
          <div className="mt-2.5 h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: '91.7%' }}
            />
          </div>
        </div>

        {/* Stat Card 3: High-Risk Medication Holds */}
        <div
          onClick={() => onCardClick?.('risk-or')}
          className="group relative rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-950/20 via-[#0F1117] to-[#0A0B0E] p-4 sm:p-4.5 transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-mono font-medium uppercase tracking-wider text-amber-400/80">
                High-Risk Drug Holds
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  3
                </span>
                <span className="text-xs font-mono text-amber-300/80 font-medium">Active Holds</span>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <Pill className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-white/[0.06] pt-2.5">
            <span className="text-neutral-400">GLP-1 7d · DOAC 48h GA / 72h neuraxial</span>
            <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
              <AlertTriangle className="h-3 w-3" />
              0 Breaches
            </span>
          </div>

          {/* Mini Sparkline */}
          <div className="mt-2 h-4 w-full">
            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="amberSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,8 Q20,18 40,10 T80,14 T100,6"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0,8 Q20,18 40,10 T80,14 T100,6 L100,20 L0,20 Z"
                fill="url(#amberSpark)"
              />
              <circle cx="100" cy="6" r="2.5" fill="#F59E0B" className="animate-pulse" />
            </svg>
          </div>
        </div>

        {/* Stat Card 4: STAT Lab Triage Queue */}
        <div
          onClick={() => onCardClick?.('hematology')}
          className="group relative rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 via-[#0F1117] to-[#0A0B0E] p-4 sm:p-4.5 transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-mono font-medium uppercase tracking-wider text-purple-400/80">
                STAT Lab Turnaround
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  14.2
                </span>
                <span className="text-xs font-mono text-purple-300/80 font-medium">min avg</span>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-white/[0.06] pt-2.5">
            <span className="text-neutral-400">Panic Cutoffs Checked</span>
            <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 px-1.5 py-0.2 text-[9.5px] text-purple-300 font-bold border border-purple-500/30">
              SUB-20M STAT
            </span>
          </div>

          {/* Mini Waveform Visualization */}
          <div className="mt-2 h-4 w-full">
            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="purpleSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,12 L20,12 L28,2 L36,18 L44,8 L50,12 L100,12"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="12" r="2.5" fill="#8B5CF6" className="animate-pulse" />
            </svg>
          </div>
        </div>

        {/* Stat Card 5: 8-Hour Fasting NPO Surveillance */}
        <div
          onClick={() => onCardClick?.('regional')}
          className="group relative rounded-xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 via-[#0F1117] to-[#0A0B0E] p-4 sm:p-4.5 transition-all duration-300 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] cursor-pointer overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-mono font-medium uppercase tracking-wider text-rose-400/80">
                NPO Fasting Telemetry
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  100<span className="text-rose-400 text-lg">%</span>
                </span>
                <span className="text-xs font-mono text-rose-300/80 font-medium">Verified</span>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-white/[0.06] pt-2.5">
            <span className="text-neutral-400">WhatsApp Surveillance</span>
            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
              <Zap className="h-3 w-3" />
              0 Aspiration
            </span>
          </div>

          {/* Mini Progress Bar */}
          <div className="mt-2.5 h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(MedicareStatCards);
