'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Droplets,
  Check,
  ClipboardCheck,
  Activity,
  Play,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { usePatientStore } from '@/lib/store';
import MobileAnesthesiaBloodView from '@/components/MobileAnesthesiaBloodView';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';

export type NavPillar = 'MEDS' | 'FASTING' | 'TESTS' | 'CONSOLE';

export interface VeracityHeroLandingProps {
  onLaunchConsole?: () => void;
  onNavigateSection?: (section: NavPillar) => void;
  onOpenIngestion?: () => void;
  onOpenAttestation?: () => void;
  onSelectPatient?: (patientId: string) => void;
  onOpenQuestionnaireModal?: () => void;
  onOpenBloodModal?: () => void;
}

const WHO_WE_SERVE = [
  { label: 'Day Surgery Centers', href: '#pillars' },
  { label: 'Anesthesia Groups', href: '#blood-view' },
  { label: 'DHA Enclaves', href: '#compliance' },
];

const WHAT_WE_OFFER = [
  { label: 'Pre-Op Questionnaire', href: '#questionnaire-section' },
  { label: 'In-OT Blood View', href: '#blood-view' },
  { label: 'OT Console', href: '#ot-console' },
];

function Dropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 py-2 hover:text-[#223140] transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-[#D3DCE2] bg-white shadow-[0_16px_48px_rgba(34,49,64,0.14)]">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block px-5 py-3 text-[13.5px] font-medium text-[#334155] transition-colors hover:bg-[#E4E9ED] hover:text-[#223140]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VeracityHeroLanding: React.FC<VeracityHeroLandingProps> = ({
  onLaunchConsole,
  onOpenAttestation,
}) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInteractiveModal, setShowInteractiveModal] = useState<'NONE' | 'QUESTIONNAIRE' | 'BLOOD'>('NONE');

  const { patients, currentPatientId } = usePatientStore();
  const activePatient = patients.find((p) => p.id === currentPatientId) || patients[0];

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleLaunchClick = () => {
    setMobileMenuOpen(false);
    if (onLaunchConsole) {
      onLaunchConsole();
    } else {
      const el = document.getElementById('ot-console');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E9ED] font-sans text-[#1E293B] selection:bg-[#223140] selection:text-white">
      {/* ── Pearl-style announcement bar ─────────────────────────── */}
      <div className="bg-[#223140] px-4 py-2.5 text-center text-[13px] leading-snug text-white">
        <span className="font-serif italic opacity-90">The 2026 Zero-Delay OT Report is here.</span>{' '}
        <a href="#value-matrix" className="ml-1 inline-flex items-center gap-1 font-bold underline-offset-4 hover:underline">
          Read it now <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* ── Pearl-style sticky nav ───────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#D3DCE2] bg-[#E4E9ED]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#223140] text-lg font-bold text-white shadow-[0_4px_12px_rgba(34,49,64,0.3)]">
              V
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-[20px] font-bold tracking-tight text-[#223140]">Veracity</span>
              <span className="-mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Perioperative Defense
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-[14px] font-medium text-[#334155] lg:flex">
            <Dropdown label="Who We Serve" items={WHO_WE_SERVE} />
            <Dropdown label="What We Offer" items={WHAT_WE_OFFER} />
            <a href="#pillars" className="py-2 transition-colors hover:text-[#223140]">
              Technology
            </a>
            <Dropdown
              label="Insights"
              items={[
                { label: 'Clinical Outcomes', href: '#value-matrix' },
                { label: 'Safety & Compliance', href: '#compliance' },
              ]}
            />
            <Dropdown
              label="About"
              items={[
                { label: 'Our Story', href: '#pillars' },
                { label: 'Contact Us', href: '#contact' },
              ]}
            />
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
              className="rounded-full border border-[#D3DCE2] bg-white px-4 py-2 text-xs font-bold text-[#223140] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:bg-[#EFF3F6]"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleLaunchClick}
              className="flex items-center gap-2 rounded-full bg-[#223140] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(34,49,64,0.3)] transition hover:bg-[#16222C]"
            >
              <span>Schedule Call</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-[#D3DCE2] bg-white p-2 text-[#223140] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-[#D3DCE2] bg-[#E4E9ED] px-4 pb-6 pt-3 shadow-lg lg:hidden">
            {[
              { label: 'Who We Serve — Day Surgery', href: '#pillars' },
              { label: 'What We Offer — Questionnaire', href: '#questionnaire-section' },
              { label: 'Technology', href: '#pillars' },
              { label: 'Clinical Outcomes', href: '#value-matrix' },
              { label: 'Safety', href: '#compliance' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-[#223140]"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowInteractiveModal('QUESTIONNAIRE');
                }}
                className="w-full rounded-full border border-[#D3DCE2] bg-white py-2.5 text-xs font-bold text-[#223140]"
              >
                Patient Intake Form
              </button>
              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full rounded-full bg-[#223140] py-2.5 text-xs font-bold text-white"
              >
                Schedule Call
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Pearl-style hero: 2-column, fluid video background ─────── */}
      <section className="relative overflow-hidden bg-[#E4E9ED]">
        {/* Iridescent fluid video background — parked right of the headline */}
        <div className="absolute inset-y-0 right-0 left-0 lg:left-[15%] z-0 overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            id="bg-video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4"
            className="w-full h-full object-cover object-[25%_center] opacity-85 mix-blend-multiply filter contrast-125 dark:invert dark:brightness-[0.35] dark:contrast-125 dark:mix-blend-screen dark:opacity-90"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#E4E9ED] via-[#E4E9ED]/70 to-[#E4E9ED]/20 dark:from-[#0A0B0E] dark:via-[#0A0B0E]/70 dark:to-[#0A0B0E]/20 pointer-events-none" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-24 lg:pt-20">
          {/* Left: copy */}
          <div className="max-w-[600px]">
            <p className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#223140]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#223140]" />
              Value-based perioperative defense
            </p>
            <h1 className="mt-5 font-serif text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-[#111827] sm:text-[52px] lg:text-[60px]">
              Unlock the full value of{' '}
              <span className="italic text-[#223140]">perioperative defense.</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] font-normal leading-relaxed text-[#475569]">
              Join surgical teams partnered with Veracity to succeed with autonomous
              clearance — actionable contraindication insights, fasting verification,
              and mobile blood triage before the patient enters theatre.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLaunchClick}
                className="flex items-center gap-2 rounded-full bg-[#223140] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(34,49,64,0.35)] transition hover:-translate-y-0.5 hover:bg-[#16222C]"
              >
                <span>Schedule Call</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
                className="flex items-center gap-2.5 rounded-full border border-[#D3DCE2] bg-white px-5 py-3.5 text-sm font-bold text-[#223140] shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition hover:bg-[#EFF3F6]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#223140]">
                  <Play className="h-3 w-3 fill-white text-white" />
                </span>
                <span>Watch Demo</span>
              </button>
            </div>
            <p className="mt-8 text-[13px] font-medium text-[#64748B]">
              0 Day Delays <span className="mx-1.5 text-[#CBD5E1]">|</span> 100% Contraindications Caught{' '}
              <span className="mx-1.5 text-[#CBD5E1]">|</span> 40+ DHA Centers
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-[#D3DCE2] pt-5">
              <div className="flex -space-x-2">
                {['DA', 'AG', 'NC', 'MH'].map((initials) => (
                  <div
                    key={initials}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#223140] text-[10px] font-bold text-white ring-2 ring-[#E4E9ED]"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-[13px] leading-snug text-[#475569]">
                Trusted by <span className="font-serif text-[15px] italic text-[#223140]">day surgery teams</span>
                <br />
                across the UAE & Gulf
              </p>
            </div>
          </div>

          {/* Right: product visual (CSS-only pearl + findings card, no video) */}
          <div className="relative mx-auto w-full max-w-[480px]">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#5A6E80_0%,#223140_45%,#0F1820_75%)] opacity-20 blur-2xl"
            />
            <div className="relative overflow-hidden pearl-card rounded-[24px] border border-[#D3DCE2] bg-white shadow-[0_24px_64px_rgba(34,49,64,0.16)]">
              <div className="flex items-center justify-between border-b border-[#D3DCE2] px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#223140] text-sm font-bold text-white">
                    V
                  </div>
                  <span className="text-sm font-bold text-[#111827]">OT Defense Console</span>
                </div>
                <span className="rounded-full border border-[#E5D3A3] bg-[#FAF4E3] px-3 py-1 font-mono text-[11px] font-bold text-[#8F6E14]">
                  ● LIVE
                </span>
              </div>
              <div className="space-y-5 px-6 py-6">
                <div className="flex items-baseline justify-between border-b border-[#F1EFE9] pb-3">
                  <h2 className="font-serif text-lg font-medium text-[#111827]">Latest findings</h2>
                  <span className="font-mono text-xs text-slate-400">{'//02'}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#111827]">
                    Contraceptive VTE Screen 09.17
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                    Caprini-weighted pill & HRT risk flagged before induction — hold plan attached.
                  </p>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight text-[#111827]">
                    Blood Triage Index 11.06
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                    K⁺, Hb and platelet cutoffs cleared across six labs in 4.8 minutes.
                  </p>
                </div>
                <svg viewBox="0 0 220 50" fill="none" aria-hidden="true" className="block h-auto w-full">
                  <path
                    d="M0 30 C10 30 12 45 18 45 C24 45 26 10 34 10 C42 10 44 40 52 40 C60 40 62 5 70 5 C78 5 80 42 88 42 C96 42 98 15 106 15 C114 15 116 38 124 38 C132 38 134 20 142 20 C150 20 152 35 160 35 C168 35 170 22 178 22 C186 22 188 32 196 32 C204 32 210 28 220 28"
                    stroke="#223140"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowInteractiveModal('BLOOD')}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#223140] py-3 text-[13px] font-bold text-white transition hover:bg-[#16222C]"
                >
                  <Droplets className="h-4 w-4" />
                  Open In-OT Mobile Blood View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pearl-style wave divider */}
        <div className="block w-full leading-[0]" aria-hidden="true">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="block h-[72px] w-full sm:h-[110px]">
            <path
              d="M0,64 C120,96 240,96 360,64 C480,32 600,32 720,64 C840,96 960,96 1080,64 C1200,32 1320,32 1440,64 L1440,120 L0,120 Z"
              fill="#FFFFFF"
            />
            <path
              d="M0,64 C120,96 240,96 360,64 C480,32 600,32 720,64 C840,96 960,96 1080,64 C1200,32 1320,32 1440,64"
              fill="none"
              stroke="#D3DCE2"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </section>

      {/* ── Our Solution: Pearl 3-card grid ──────────────────────── */}
      <section id="pillars" className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[720px] space-y-4 text-center">
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#223140]">
              Our Solution
            </p>
            <h2 className="font-serif text-[32px] font-normal leading-tight text-[#111827] sm:text-[40px]">
              The operating system for <span className="italic text-[#223140]">perioperative defense.</span>
            </h2>
            <p className="mx-auto max-w-[600px] text-[17px] leading-relaxed text-[#475569]">
              Veracity combines the screening, workflows, and attestation needed to
              make zero-delay surgery perform at scale.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div
              id="questionnaire-section"
              className="flex scroll-mt-28 flex-col pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#E4E9ED] p-8 transition hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(34,49,64,0.12)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#223140] text-white shadow-[0_4px_12px_rgba(34,49,64,0.25)]">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-[20px] font-bold text-[#111827]">Identify issues sooner</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#475569]">
                Smart WhatsApp intake catches contraceptive, smoking, psychiatric and
                cardiac risks before costs rise or cases cancel.
              </p>
              <button
                type="button"
                onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
                className="mt-6 w-full rounded-full border border-[#223140]/25 bg-white py-2.5 text-xs font-bold text-[#223140] transition hover:bg-[#223140] hover:text-white"
              >
                Try Interactive Questionnaire
              </button>
            </div>

            <div
              id="blood-view"
              className="flex scroll-mt-28 flex-col pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#E4E9ED] p-8 transition hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(34,49,64,0.12)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#223140] text-white shadow-[0_4px_12px_rgba(34,49,64,0.25)]">
                <Droplets className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-[20px] font-bold text-[#111827]">Take action with clarity</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#475569]">
                In-OT mobile triage gives K⁺, Hb, platelet and INR cutoffs with
                next-step guidance at the bedside.
              </p>
              <button
                type="button"
                onClick={() => setShowInteractiveModal('BLOOD')}
                className="mt-6 w-full rounded-full border border-[#223140]/25 bg-white py-2.5 text-xs font-bold text-[#223140] transition hover:bg-[#223140] hover:text-white"
              >
                Open In-OT Phone View
              </button>
            </div>

            <div className="flex flex-col pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#E4E9ED] p-8 transition hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(34,49,64,0.12)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#223140] text-white shadow-[0_4px_12px_rgba(34,49,64,0.25)]">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-[20px] font-bold text-[#111827]">Improve performance</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#475569]">
                The Tabler OT workspace tracks NPO clocks, GLP-1 holds and 1-tap
                attestation to drive on-time induction.
              </p>
              <button
                type="button"
                onClick={handleLaunchClick}
                className="mt-6 w-full rounded-full bg-[#223140] py-2.5 text-xs font-bold text-white transition hover:bg-[#16222C]"
              >
                Launch Tabler Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Program strategy: Pearl 2-card split ─────────────────── */}
      <section className="border-y border-[#D3DCE2] bg-[#E4E9ED] py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-[720px] space-y-4">
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#223140]">
              Clearance program strategy
            </p>
            <h2 className="font-serif text-[32px] font-normal leading-tight text-[#111827] sm:text-[40px]">
              Program strategy you <span className="italic text-[#223140]">can bank on.</span>
            </h2>
            <p className="max-w-[600px] text-[17px] leading-relaxed text-[#475569]">
              Leverage Veracity&apos;s portfolio of clearance pathways to maximize
              throughput and mitigate day-of-surgery exposure.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="pearl-card rounded-[24px] border border-[#D3DCE2] bg-white p-8 transition hover:shadow-[0_16px_48px_rgba(34,49,64,0.12)]">
              <h3 className="font-serif text-[22px] font-bold text-[#111827]">Pre-Op Defense</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#475569]">
                Replace fragmented paper forms with a smarter intake that turns
                pre-op screening into sustainable on-time performance.
              </p>
              <span className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-[#223140] hover:underline">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </div>
            <div className="pearl-card rounded-[24px] border border-[#D3DCE2] bg-white p-8 transition hover:shadow-[0_16px_48px_rgba(34,49,64,0.12)]">
              <h3 className="font-serif text-[22px] font-bold text-[#111827]">In-OT Triage</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#475569]">
                Extend defense to the theatre door with phone-first blood triage,
                fasting clocks and 1-tap statutory sign-off.
              </p>
              <span className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-[#223140] hover:underline">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleLaunchClick}
              className="rounded-full bg-[#223140] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(34,49,64,0.3)] transition hover:bg-[#16222C]"
            >
              Get Opportunity Analysis
            </button>
          </div>
        </div>
      </section>

      {/* ── Customer results: Pearl 4-stat band ──────────────────── */}
      <section id="value-matrix" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[640px] space-y-3 text-center">
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#223140]">
              Customer results
            </p>
            <h2 className="font-serif text-[32px] font-normal text-[#111827] sm:text-[40px]">
              Proven with care organizations <span className="italic text-[#223140]">at scale.</span>
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { v: '0', l: 'Day-of-surgery delays', s: 'Morning-of cancellations eliminated' },
              { v: '100%', l: 'Contraindications caught', s: 'VTE, QTc & cardiac risks pre-screened' },
              { v: '4.8 min', l: 'Avg in-OT PAC review', s: 'STAT triage & bedside sign-off' },
              { v: '100%', l: 'DHA § 3060(a) compliant', s: 'Sovereign UAE enclave residency' },
            ].map((stat) => (
              <div
                key={stat.l}
                className="pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#E4E9ED] p-6 text-center transition hover:shadow-[0_16px_40px_rgba(34,49,64,0.1)]"
              >
                <div className="font-serif text-[40px] font-bold leading-none text-[#223140] sm:text-[48px]">
                  {stat.v}
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-700">{stat.l}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{stat.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built for action: Pearl numbered steps + preview ─────── */}
      <section className="border-t border-[#D3DCE2] bg-[#E4E9ED] py-20">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-4">
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#223140]">
              Our product
            </p>
            <h2 className="font-serif text-[32px] font-normal text-[#111827] sm:text-[40px]">Built for <span className="italic text-[#223140]">action.</span></h2>
            <p className="max-w-[520px] text-[16px] leading-relaxed text-[#475569]">
              Get things done with prioritized signals, guided next steps and
              automated handoffs.
            </p>
            <ol className="mt-6 space-y-5">
              {[
                { n: '1', t: 'Generate signals', d: 'Synthesize intake answers, labs and fasting clocks.' },
                { n: '2', t: 'Take action', d: 'Prioritize patients, get holds, automate WhatsApp.' },
                { n: '3', t: 'Improve outcomes', d: 'Attest, induce on time, strengthen safety.' },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#223140] text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-serif text-[17px] font-bold text-[#111827]">{s.t}</p>
                    <p className="text-[13.5px] text-slate-500">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={handleLaunchClick}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#223140] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#16222C]"
            >
              Explore our technology <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#141E27] p-6 text-white shadow-[0_24px_64px_rgba(20,30,39,0.35)] sm:p-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-200">Live console preview</p>
            <div className="mt-4 space-y-3">
              {[
                { t: 'Patient prioritization', d: 'Who needs attention before induction.', c: 'bg-amber-400' },
                { t: 'Next-step guidance', d: 'Holds, workups and follow-ups.', c: 'bg-amber-300' },
                { t: 'Workflow automation', d: 'Outreach, scheduling, WhatsApp slips.', c: 'bg-sky-300' },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${f.c}`} />
                  <div>
                    <p className="text-sm font-bold">{f.t}</p>
                    <p className="text-xs text-slate-400">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid: Pearl 6-up ─────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[640px] space-y-3 text-center">
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#223140]">
              Platform depth
            </p>
            <h2 className="font-serif text-[32px] font-normal text-[#111827] sm:text-[40px]">
              Everything the OT needs, <span className="italic text-[#223140]">in one place.</span>
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: 'Smart questionnaire', d: 'Contraceptive, smoking, psych & cardiac capture on WhatsApp.', i: ClipboardCheck },
              { t: 'Mobile blood triage', d: 'K⁺, Hb, platelets, INR and troponin cutoffs in-OT.', i: Droplets },
              { t: 'Fasting & holds engine', d: '8-hour NPO clocks, GLP-1 and DOAC hold windows.', i: Activity },
              { t: 'EHR integration', d: 'FHIR R4 sync with existing records and workflows.', i: ShieldCheck },
              { t: 'Performance visibility', d: 'Delays, holds and attestation across every list.', i: Activity },
              { t: 'Enterprise security', d: 'UAE-North enclave, audit trail, role-based access.', i: ShieldCheck },
            ].map((f) => (
              <div
                key={f.t}
                className="pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#E4E9ED] p-6 transition hover:shadow-[0_16px_40px_rgba(34,49,64,0.1)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#223140] text-white">
                  <f.i className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-serif text-[18px] font-bold text-[#111827]">{f.t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trusted-by strip ─────────────────────────────────────── */}
      <section className="border-y border-[#D3DCE2] bg-[#E4E9ED] py-12">
        <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Trusted by leading care organizations
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 font-serif text-[17px] font-bold text-slate-400">
            {['Day Surgery UAE', 'Anesthesia Partners', 'DHA Enclave', 'Sante IPA', 'BayCare Plus', 'Holzer Health'].map(
              (brand) => (
                <span key={brand} className="transition-colors hover:text-[#223140]">
                  {brand}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Featured testimonial (Pearl quote slider → editorial quote) ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[860px] px-4 text-center sm:px-6">
          <p className="text-[15px] font-bold tracking-[0.3em] text-[#223140]">★★★★★</p>
          <blockquote className="mt-5 font-serif text-[26px] font-normal leading-snug text-[#111827] sm:text-[33px]">
            “Our partnership with <span className="italic text-[#223140]">Veracity</span> has deepened our
            tech-enablement capabilities — our network now delivers{' '}
            <span className="italic text-[#223140]">quality care</span> with zero day-of-surgery delays.”
          </blockquote>
          <div className="mt-7 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#223140] text-sm font-bold text-white shadow-[0_4px_12px_rgba(34,49,64,0.3)]">
              SA
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#111827]">Dr. Sara Ahmed, MD</p>
              <p className="text-xs text-slate-500">Chief of Anesthesia, Dubai Day Surgery Center</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance ───────────────────────────────────────────── */}
      <section id="compliance" className="scroll-mt-20 bg-white py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="pearl-card rounded-[24px] border border-[#D3DCE2] bg-[#E4E9ED] p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#223140] text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-[20px] font-bold text-[#111827]">
                    Clinical governance & DHA § 3060(a) compliance
                  </h3>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                    Sovereign UAE residency · Non-device CDS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#E5D3A3] bg-[#FAF4E3] px-3 py-1 text-xs font-bold text-[#8F6E14]">
                  UAE North Enclave
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                  FHIR R4 Certified
                </span>
              </div>
            </div>
            <p className="mt-5 max-w-[900px] text-[13px] leading-relaxed text-slate-600">
              Veracity operates under the statutory non-device CDS safe harbor. All
              recommendations display underlying guidelines (ASA 2023, ASRA 2024,
              ACOG 2024, ACC/AHA) and require final licensed anesthesiologist
              attestation. Data remains encrypted within sovereign UAE infrastructure.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 text-[13px] text-slate-600 sm:grid-cols-2">
              {[
                'Contraceptive & HRT VTE screening',
                'QTc & phenylephrine selection',
                '8-hour fasting verification',
                'Neuraxial platelet & INR clearance',
              ].map((li) => (
                <li key={li} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-[#8F6E14]" />
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA panel ────────────────────────────────────────────── */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-[#223140] px-6 py-14 text-center text-white shadow-[0_24px_64px_rgba(34,49,64,0.35)] sm:px-12">
            <h2 className="mx-auto max-w-[640px] font-serif text-[30px] font-normal leading-tight sm:text-[40px]">
              Bring <span className="italic text-amber-200">clarity</span> to perioperative defense.
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-relaxed text-white/70">
              Join surgical teams using Veracity to lead the transition to zero-delay,
              fully attested clearance. Start with a complimentary list analysis.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleLaunchClick}
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#223140] transition hover:bg-[#EFF3F6]"
              >
                Schedule Call
              </button>
              <button
                type="button"
                onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Get Opportunity Analysis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer id="contact" className="scroll-mt-20 bg-[#141E27] px-4 py-14 text-[13px] text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white font-bold text-[#223140]">
                V
              </div>
              <span className="font-serif text-[18px] font-bold text-white">Veracity</span>
            </div>
            <p className="mt-4 max-w-[300px] leading-relaxed">
              Veracity partners with surgical teams to succeed with autonomous
              clearance through screening, analytics and attestation.
            </p>
            <p className="mt-4">care@veracity.health</p>
          </div>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Solutions</p>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#pillars" className="transition-colors hover:text-white">Day Surgery Centers</a></li>
              <li><a href="#blood-view" className="transition-colors hover:text-white">Anesthesia Groups</a></li>
              <li><a href="#questionnaire-section" className="transition-colors hover:text-white">Pre-Op Screening</a></li>
              <li><a href="#ot-console" className="transition-colors hover:text-white">OT Console</a></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Resources</p>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#value-matrix" className="transition-colors hover:text-white">Clinical Outcomes</a></li>
              <li><a href="#compliance" className="transition-colors hover:text-white">Safety & Compliance</a></li>
              <li><a href="#pillars" className="transition-colors hover:text-white">Technology</a></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Company</p>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#pillars" className="transition-colors hover:text-white">About Veracity</a></li>
              <li><a href="/nova" className="transition-colors hover:text-white">Cinematic Experience</a></li>
              <li><a href="#contact" className="transition-colors hover:text-white">Contact Us</a></li>
              <li>
                <button type="button" onClick={handleLaunchClick} className="font-bold text-amber-200 hover:underline">
                  Launch OT Console
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1280px] flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 font-mono text-[11px] sm:flex-row">
          <span>All data processing complies with HIPAA and DHA governance.</span>
          <span>© 2026 Veracity. All rights reserved.</span>
        </div>
      </footer>

      {/* Interactive modal previews (unchanged behavior) */}
      {showInteractiveModal === 'QUESTIONNAIRE' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="relative my-8 w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setShowInteractiveModal('NONE')}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#D3DCE2] bg-white text-slate-700 shadow-md transition hover:bg-[#EFF3F6]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <PatientPreOpQuestionnaire
              patientId={activePatient.id}
              onClose={() => setShowInteractiveModal('NONE')}
            />
          </div>
        </div>
      )}

      {showInteractiveModal === 'BLOOD' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
          <div className="relative my-8 w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowInteractiveModal('NONE')}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#D3DCE2] bg-white text-slate-700 shadow-md transition hover:bg-[#EFF3F6]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <MobileAnesthesiaBloodView
              patientId={activePatient.id}
              onOpenAttestation={() => {
                setShowInteractiveModal('NONE');
                handleLaunchClick();
              }}
              onOpenWhatsApp={() => {
                setShowInteractiveModal('NONE');
                if (onOpenAttestation) onOpenAttestation();
              }}
              onOpenQuestionnaire={() => setShowInteractiveModal('QUESTIONNAIRE')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VeracityHeroLanding;
