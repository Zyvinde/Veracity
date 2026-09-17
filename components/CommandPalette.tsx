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
            <Search className="h-4 w-4 text-sky-300 shrink-0" />
            <Command.Input
              placeholder="Search patients, MRN, clinical protocols, or actions..."
              className="cmdk-input"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/60">
              ESC
            </kbd>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="py-6 text-center text-xs text-white/50 font-mono">
              No clinical matching cases or protocols found.
            </Command.Empty>

            {/* Group 1: Patient Cases */}
            <Command.Group heading="Active Surgical Cases (DHA Registered)">
              {patients.map((p) => {
                const badgeColor =
                  p.overallStatus === 'RED_HARD_STOP'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : p.overallStatus === 'AMBER_CONDITIONAL'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';

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
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-bold shrink-0">
                        {p.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-white text-xs group-hover:text-sky-200 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-white/60">
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
                      <Icon className="h-4 w-4 text-sky-300 shrink-0" />
                      <span>{s.label}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/40" />
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
                    <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>1-Tap DHA PAC Attestation</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300">DHA § 3060</span>
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
                    <Plus className="h-4 w-4 text-sky-300 shrink-0" />
                    <span>Ingest New Surgical Case (OCR / PDF)</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300">Intake</span>
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
                    <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Dispatch WhatsApp PAC Directive Slip</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300">Patient Comms</span>
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
                    <Printer className="h-4 w-4 text-white/70 shrink-0" />
                    <span>Print Formal Medical Clearance Slip</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/60">PDF / Slip</span>
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
                    <History className="h-4 w-4 text-white/70 shrink-0" />
                    <span>View Sovereign DHA Audit Trail Log</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/60">Security</span>
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>

          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-white/50 bg-black/30">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>House Health Spotlight Engine</span>
            </div>
          </div>
    </Command.Dialog>
  );
};

export default CommandPalette;
