'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import {
  ClipboardCheck,
  ShieldCheck,
  Activity,
  Layers,
  Users,
  Sparkles,
  Droplets,
  Bone,
} from 'lucide-react';

export type WorkspaceTab = 'overview' | 'checkup' | 'hematology' | 'regional' | 'risk-or' | 'patients';

interface MobileBottomNavProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  pendingChecksCount?: number;
  isCleared?: boolean;
  isVisible?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingChecksCount = 0,
  isCleared = false,
  isVisible = true,
}) => {
  const { t } = useI18n();

  const NAV_ITEMS: {
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number | null;
    badgeColor?: string;
  }[] = [
    {
      id: 'checkup',
      label: 'PAC Intake',
      icon: <ClipboardCheck className="h-5 w-5" />,
      badge: pendingChecksCount > 0 ? pendingChecksCount : '✓',
      badgeColor: pendingChecksCount > 0 ? 'bg-[#DC2626] text-white font-bold' : 'bg-white text-black font-bold',
    },
    {
      id: 'overview',
      label: 'Labs & Meds',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: 'hematology',
      label: 'Blood Bank',
      icon: <Droplets className="h-5 w-5" />,
    },
    {
      id: 'regional',
      label: 'Spine & Risk',
      icon: <Bone className="h-5 w-5" />,
    },
    {
      id: 'patients',
      label: 'Roster',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-white/[0.12] bg-[#08090C]/95 backdrop-blur-xl px-2 pt-2 pb-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onTabChange(item.id);
                // Scroll slightly up on mobile tab switch for better focus
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-[6px] transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF]'
              }`}
            >
              {/* Active Glow Pill */}
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 w-7 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}

              <div className="relative">
                <span className={`transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-[#94A3B8]'}`}>
                  {item.icon}
                </span>

                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-mono leading-none shadow-sm ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`mt-1 text-[10px] tracking-tight font-sans truncate max-w-full ${
                  isActive ? 'text-white font-semibold' : 'text-[#94A3B8]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default React.memo(MobileBottomNav);
