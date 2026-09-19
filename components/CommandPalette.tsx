'use client';

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Activity,
  Droplets,
  ClipboardCheck,
  Stethoscope,
  Clock,
  Users,
  FileText,
  Lock,
  Plus,
  Printer,
  History,
  MessageCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { usePatientStore } from '@/lib/store';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNav?: (navId: string) => void;
  onOpenIngestion?: () => void;
  onOpenAttestation?: () => void;
  onOpenPrintSlip?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenAuditDrawer?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onSelectNav,
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  onOpenAuditDrawer,
}) => {
  const { patients, selectPatient } = usePatientStore();

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Clinical Command Palette" overlayClassName="cmdk-overlay" contentClassName="cmdk-root">
          <div className="cmdk-input-wrapper">
            <Search className="h-4 w-4 text-[#6b706b] shrink-0" />
            <Command.Input
              placeholder="Search patients, MRN, clinical protocols, or actions..."
              className="cmdk-input"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-black/15 bg-black/[0.04] px-2 py-0.5 text-[10px] font-mono text-[#6b706b]">
              ESC
            </kbd>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="py-6 text-center text-xs text-[#6b706b] font-mono">
              No clinical matching cases or protocols found.
            </Command.Empty>

            {/* Group 1: Patient Cases */}
            <Command.Group heading="Mock surgical cases (MVP demo)">
              {patients.map((p) => {
                const badgeColor =
                  p.overallStatus === 'RED_HARD_STOP'
                    ? 'bg-[#b3261e]/10 text-[#b3261e] border border-[#b3261e]/30'
                    : p.overallStatus === 'AMBER_CONDITIONAL'
                    ? 'bg-[#9a6700]/10 text-[#7a5200] border border-[#9a6700]/30'
                    : 'bg-[#1c7a3d]/10 text-[#1c7a3d] border border-[#1c7a3d]/30';

                const statusLabel =
                  p.overallStatus === 'RED_HARD_STOP'
                    ? 'STOP'
                    : p.overallStatus === 'AMBER_CONDITIONAL'
                    ? 'COND'
                    : 'CLEARED';

                return (
                  <Command.Item
                    key={p.id}
                    onSelect={() => {
                      selectPatient(p.id);
                      if (onSelectNav) onSelectNav('dashboard');
                      onOpenChange(false);
                    }}
                    className="cmdk-item group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1a1a]/[0.06] text-[#1a1a1a] border border-black/15 text-xs font-bold shrink-0">
                        {p.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-[#1a1a1a] text-xs transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#6b706b]">
                          {p.mrn} · {p.procedureName.split(' ')[0]} · {p.asaStatus}
                        </div>
                      </div>
                    </div>
                    <span className={`cmdk-item-badge ${badgeColor}`}>{statusLabel}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Group 2: Navigation Jumps */}
            <Command.Group heading="Clinical Workspace Sections">
              {[
                { id: 'dashboard', label: 'Dashboard & Vitals Overview', icon: Activity },
                { id: 'blood-labs', label: 'STAT Blood Investigation & Fishbone', icon: Droplets },
                { id: 'questionnaire', label: 'Pre-Op Medical Intake & Airway Assessment', icon: ClipboardCheck },
                { id: 'regional', label: 'Neuraxial Feasibility & Blood Bank Serology', icon: Stethoscope },
                { id: 'ot-defense', label: 'OT Delay & Day-of-Surgery Cancellation Hub', icon: Clock },
                { id: 'patients', label: 'Surgical Patient Directory & Status Roster', icon: Users },
                { id: 'notes', label: 'Clinical PAC Attestation Notes & FHIR JSON', icon: FileText },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <Command.Item
                    key={s.id}
                    onSelect={() => {
                      if (onSelectNav) onSelectNav(s.id);
                      onOpenChange(false);
                    }}
                    className="cmdk-item"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-[#6b706b] shrink-0" />
                      <span>{s.label}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[#9a9ea6]" />
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Group 3: Quick Direct Actions */}
            <Command.Group heading="Physician Direct Actions">
              {onOpenAttestation && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    onOpenAttestation();
                  }}
                  className="cmdk-item"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-[#1c7a3d] shrink-0" />
                    <span>Demo attestation (mock, no effect)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#1c7a3d]">MVP demo</span>
                </Command.Item>
              )}

              {onOpenIngestion && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    onOpenIngestion();
                  }}
                  className="cmdk-item"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="h-4 w-4 text-[#1a1a1a] shrink-0" />
                    <span>Ingest New Surgical Case (OCR / PDF)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6b706b]">Intake</span>
                </Command.Item>
              )}

              {onOpenWhatsApp && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    onOpenWhatsApp();
                  }}
                  className="cmdk-item"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4 text-[#1c7a3d] shrink-0" />
                    <span>Dispatch WhatsApp PAC Directive Slip</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#1c7a3d]">Patient Comms</span>
                </Command.Item>
              )}

              {onOpenPrintSlip && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    onOpenPrintSlip();
                  }}
                  className="cmdk-item"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="h-4 w-4 text-[#6b706b] shrink-0" />
                    <span>Print demo summary slip (mock)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6b706b]">PDF / Slip</span>
                </Command.Item>
              )}

              {onOpenAuditDrawer && (
                <Command.Item
                  onSelect={() => {
                    onOpenChange(false);
                    onOpenAuditDrawer();
                  }}
                  className="cmdk-item"
                >
                  <div className="flex items-center gap-2.5">
                    <History className="h-4 w-4 text-[#6b706b] shrink-0" />
                    <span>View demo audit log (local)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6b706b]">Security</span>
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>

          <div className="border-t border-black/10 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#6b706b] bg-black/[0.03]">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#1a1a1a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1c7a3d]" />
              <span>House Health Spotlight Engine</span>
            </div>
          </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
