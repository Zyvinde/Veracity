'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Clock,
  Droplets,
  ShieldAlert,
  FileCheck2,
  UploadCloud,
  History,
  MessageSquare,
  Printer,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Activity,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export type MedicareTab = 'overview' | 'checkup' | 'hematology' | 'regional' | 'risk-or' | 'patients';

interface MedicareSidebarRailProps {
  activeTab: MedicareTab;
  onTabChange: (tab: MedicareTab) => void;
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenWhatsApp?: () => void;
  onOpenPrintSlip: () => void;
  onOpenAuditDrawer: () => void;
  isAttested: boolean;
  activePatientCount?: number;
}

export const MedicareSidebarRail: React.FC<MedicareSidebarRailProps> = ({
  activeTab,
  onTabChange,
  onOpenIngestion,
  onOpenAttestation,
  onOpenWhatsApp,
  onOpenPrintSlip,
  onOpenAuditDrawer,
  isAttested,
  activePatientCount = 5,
}) => {
  const { t } = useI18n();

  const navItems: Array<{
    id: MedicareTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Command Hub',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'patients',
      label: 'Patient Roster',
      icon: <Users className="h-5 w-5" />,
      badge: String(activePatientCount),
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'checkup',
      label: 'PAC 11-Domains',
      icon: <ClipboardCheck className="h-5 w-5" />,
      badge: '11',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'regional',
      label: 'Airway & Regional',
      icon: <Stethoscope className="h-5 w-5" />,
    },
    {
      id: 'hematology',
      label: 'STAT Labs & Blood',
      icon: <Droplets className="h-5 w-5" />,
      badge: 'STAT',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'risk-or',
      label: 'Surgical Risk & OR',
      icon: <ShieldAlert className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      aria-label="Medicare Mini Sidebar Rail"
      className="hidden xl:flex flex-col justify-between w-20 shrink-0 border-r border-white/[0.08] bg-[#07080B] py-5 px-2.5 z-30 select-none sticky top-0 h-screen"
    >
      {/* Top Logo & Pulse Mark */}
      <div className="flex flex-col items-center space-y-6">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black hover:bg-neutral-200 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          title="Veracity Autonomous Surgical Defense"
        >
          <span className="font-serif font-black text-xl tracking-tighter text-black">V</span>
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#07080B]">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          </span>
        </a>

        {/* Primary Vertical Navigation Icons */}
        <nav className="flex flex-col items-center gap-2 w-full pt-3" role="tablist">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`group relative flex flex-col items-center justify-center w-full py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                {/* Active Left Glow Pill Indicator */}
                {isActive && (
                  <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-white shadow-[0_0_10px_#ffffff]" />
                )}

                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[9.5px] font-mono tracking-tight mt-1 text-center truncate max-w-[64px] font-medium scale-95 opacity-80 group-hover:opacity-100">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Action Shortcut Buttons & Physician Avatar */}
      <div className="flex flex-col items-center gap-2.5 pt-4 border-t border-white/[0.08] w-full">
        {/* Quick Ingest Button */}
        <button
          type="button"
          onClick={onOpenIngestion}
          title="Ingest EHR Lab / Patient File"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all"
        >
          <UploadCloud className="h-4 w-4" />
        </button>

        {/* Sign Attestation Button */}
        <button
          type="button"
          onClick={onOpenAttestation}
          title={isAttested ? 'PAC Attestation Verified' : 'Sign Digital PAC Attestation'}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            isAttested
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
              : 'border border-white/20 bg-white text-black hover:bg-neutral-200'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
        </button>

        {/* WhatsApp Fasting Dispatch */}
        {onOpenWhatsApp && (
          <button
            type="button"
            onClick={onOpenWhatsApp}
            title="Dispatch WhatsApp NPO Countdown"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}

        {/* Print PAC Slip */}
        <button
          type="button"
          onClick={onOpenPrintSlip}
          title="Print Legal PAC Clearance Slip"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:border-white/30 transition-all"
        >
          <Printer className="h-4 w-4" />
        </button>

        {/* Audit Log Drawer */}
        <button
          type="button"
          onClick={onOpenAuditDrawer}
          title="Cryptographic Audit Trail"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:border-white/30 transition-all"
        >
          <History className="h-4 w-4" />
        </button>

        {/* Duty Physician Profile */}
        <div
          className="mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-neutral-900 text-white font-serif font-bold text-xs relative cursor-pointer group"
          title="Dr. Tariq Al-Mansoor, DESA · Consultant Anaesthetist on Duty (DHA Lic #77491)"
        >
          <span>TA</span>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#07080B]" />
        </div>
      </div>
    </aside>
  );
};

export default React.memo(MedicareSidebarRail);
