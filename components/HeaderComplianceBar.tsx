'use client';

import React from 'react';
import { PatientCase } from '@/lib/types';
import { useI18n, Locale } from '@/lib/i18n/context';
import {
  ShieldCheck,
  Lock,
  UploadCloud,
  ChevronDown,
  Activity,
  FileCheck2,
  Printer,
  MessageSquare,
  Globe2,
} from 'lucide-react';

interface HeaderComplianceBarProps {
  currentPatient: PatientCase;
  patients: PatientCase[];
  onSelectPatient: (patient: PatientCase) => void;
  onOpenIngestion: () => void;
  onOpenAttestation: () => void;
  onOpenPrintSlip: () => void;
  onOpenWhatsApp?: () => void;
  isAttested: boolean;
}

const LOCALE_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇦🇪' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

export const HeaderComplianceBar: React.FC<HeaderComplianceBarProps> = ({
  currentPatient,
  patients,
  onSelectPatient,
  onOpenIngestion,
  onOpenAttestation,
  onOpenPrintSlip,
  onOpenWhatsApp,
  isAttested,
}) => {
  const { t, locale, setLocale } = useI18n();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const langRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  React.useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  const currentLocale = LOCALE_OPTIONS.find((l) => l.code === locale) || LOCALE_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.10] bg-[#000000]/95 backdrop-blur-md">
      <div className="mx-auto flex flex-col gap-2 px-3 py-2 sm:px-6 lg:px-8">
        {/* Sovereign Tier */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/30 px-2.5 py-0.5 font-mono text-[10px] sm:text-[10.5px] font-medium text-red-200">
              <Lock className="h-3 w-3 text-[#EF4444]" aria-hidden="true" />
              <span>{t('common.hostedOn')}</span>
            </span>
            <span className="hidden xs:inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#0F1117] px-2.5 py-0.5 font-mono text-[10.5px] text-[#E2E8F0]">
              <ShieldCheck className="h-3 w-3 text-white" aria-hidden="true" />
              <span>{t('common.safeHarbor')}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[10.5px] font-mono text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white live-pulse-dot" aria-hidden="true" />
              <span>{t('common.realtimeStream')}</span>
            </span>
            <span className="text-[#64748B]">·</span>
            <span className="hidden sm:inline">NABIDH & FHIR R4 Connected</span>
          </div>
        </div>

        {/* Main Bar */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-white/20 bg-white/10 text-white">
              <Activity className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-serif text-lg sm:text-xl text-white font-medium tracking-tight">
                  House Health
                </span>
                <span className="rounded-[3px] bg-white px-1.5 py-0.2 text-[9px] sm:text-[9.5px] font-mono font-bold text-black border border-white">
                  CLINICAL CONSOLE
                </span>
              </div>
              <p className="hidden sm:block text-[10.5px] text-[#94A3B8] font-mono tracking-tight">Sovereign Perioperative Anesthesia &amp; Surgical Clearance</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
                className="flex items-center gap-1 sm:gap-1.5 rounded-[4px] border border-white/[0.10] bg-[#0F1117] px-2 py-1.5 text-xs font-medium text-[#E2E8F0] transition hover:border-white/30 hover:text-white focus:outline-none"
              >
                <Globe2 className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                <span className="text-[11px] sm:text-xs">{currentLocale.flag} <span className="hidden sm:inline">{currentLocale.label}</span></span>
                <ChevronDown className={`h-3 w-3 text-[#94A3B8] transition-transform ${langOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {langOpen && (
                <div role="listbox" aria-label="Language options" className="absolute right-0 mt-2 w-36 sm:w-40 origin-top-right rounded-[4px] border border-white/[0.12] bg-[#0F1117] p-1 shadow-2xl z-50 animate-scale-in">
                  {LOCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      role="option"
                      aria-selected={locale === opt.code}
                      onClick={() => { setLocale(opt.code); setLangOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs transition flex items-center gap-2 ${
                        locale === opt.code
                          ? 'bg-white text-black font-semibold'
                          : 'hover:bg-white/[0.06] text-[#E2E8F0]'
                      }`}
                    >
                      <span>{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Patient Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                aria-label={t('header.currentPatient', { name: currentPatient.name })}
                className="flex items-center gap-2 rounded-[4px] border border-white/[0.10] bg-[#0F1117] px-2.5 py-1 text-xs font-medium text-[#E2E8F0] transition hover:border-white/30 hover:text-white focus:outline-none max-w-[130px] sm:max-w-none truncate"
              >
                <div className="flex flex-col text-left truncate">
                  <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] hidden sm:block">{t('header.activeCase')}</span>
                  <span className="font-semibold text-white flex items-center gap-1 truncate text-[11px] sm:text-xs">
                    <span className="truncate">{currentPatient.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-white/70 font-mono hidden xs:inline">({currentPatient.mrn.split('-')[0]})</span>
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-[#94A3B8] shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {dropdownOpen && (
                <div role="listbox" aria-label={t('header.selectRoster')} className="absolute right-0 mt-2 w-72 origin-top-right rounded-[6px] border border-white/[0.12] bg-[#0F1117] p-1.5 shadow-2xl z-50 animate-scale-in">
                  <div className="px-2 py-1 text-[9.5px] font-semibold text-[#94A3B8] uppercase tracking-wider">{t('header.selectRoster')}</div>
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      role="option"
                      aria-selected={p.id === currentPatient.id}
                      onClick={() => { onSelectPatient(p); setDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-2 rounded-[4px] text-xs transition flex flex-col gap-0.5 ${
                        p.id === currentPatient.id
                          ? 'bg-white text-black font-semibold'
                          : 'hover:bg-white/[0.04] text-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${p.id === currentPatient.id ? 'text-black font-bold' : 'text-white'}`}>{p.name}</span>
                        <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full ${
                          p.id === currentPatient.id
                            ? 'bg-black text-white font-bold'
                            : p.overallStatus === 'GREEN_CLEARED'
                            ? 'bg-white/10 text-white border border-white/30 font-bold'
                            : p.overallStatus === 'AMBER_CONDITIONAL'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                            : 'bg-red-950/80 text-red-200 border border-red-500/50'
                        }`}>
                          {p.overallStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className={`text-[10.5px] flex items-center gap-1.5 font-mono truncate ${p.id === currentPatient.id ? 'text-neutral-700' : 'text-[#94A3B8]'}`}>
                        <span>{p.procedureName}</span>
                        <span>·</span>
                        <span>{p.facility.split(',')[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Ingest Button (Desktop) */}
            <button
              type="button"
              onClick={onOpenIngestion}
              className="hidden sm:flex items-center gap-1.5 rounded-[4px] border border-white/[0.10] bg-[#0F1117] px-2.5 py-1.5 text-xs font-medium text-[#E2E8F0] transition hover:border-white/30 hover:text-white"
            >
              <UploadCloud className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              <span>{t('header.ingestLab')}</span>
            </button>

            {/* Primary Sign Attestation Button */}
            <button
              type="button"
              onClick={onOpenAttestation}
              aria-label={isAttested ? t('header.attested') : t('header.signAttestation')}
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                isAttested
                  ? 'border border-white/40 bg-white/15 text-white hover:bg-white/20'
                  : 'bg-white text-black hover:bg-neutral-200 shadow-sm'
              }`}
            >
              <FileCheck2 className={`h-3.5 w-3.5 ${isAttested ? 'text-white' : 'text-black'}`} aria-hidden="true" />
              <span className="hidden xs:inline">{isAttested ? t('header.attested') : t('header.signAttestation')}</span>
            </button>

            {/* WhatsApp PAC Button */}
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="flex items-center gap-1.5 rounded-[4px] border border-white/20 bg-[#000000] px-2 sm:px-3 py-1.5 text-xs font-medium text-white transition hover:border-white/40 hover:bg-white/5 active:scale-95"
                title={t('header.sendWhatsApp')}
              >
                <MessageSquare className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                <span className="hidden md:inline">{t('header.whatsappPAC')}</span>
              </button>
            )}

            {/* Print Slip Button */}
            <button
              type="button"
              onClick={onOpenPrintSlip}
              className="hidden sm:flex items-center gap-1.5 rounded-[4px] border border-white/[0.10] bg-[#0F1117] px-2.5 py-1.5 text-xs font-medium text-[#E2E8F0] transition hover:border-white/30 hover:text-white"
              title={t('header.printOfficial')}
            >
              <Printer className="h-3.5 w-3.5 text-[#94A3B8]" aria-hidden="true" />
              <span className="hidden lg:inline">{t('header.printSlip')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(HeaderComplianceBar);
