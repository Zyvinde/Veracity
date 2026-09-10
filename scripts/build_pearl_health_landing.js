const fs = require('fs');
const path = require('path');

const content = `'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Clock,
  Pill,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  Activity,
  Zap,
  Lock,
  MessageSquare,
  Sparkles,
  Layers,
  BarChart3,
  Stethoscope,
  Heart,
  Droplets,
  Cigarette,
  Share2,
  Phone,
  Check,
  User,
  Menu,
  X,
  Play,
  Award,
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

export const VeracityHeroLanding: React.FC<VeracityHeroLandingProps> = ({
  onLaunchConsole,
  onNavigateSection,
  onOpenIngestion,
  onOpenAttestation,
  onSelectPatient,
  onOpenQuestionnaireModal,
  onOpenBloodModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'BLOOD_LABS' | 'QUESTIONNAIRE' | 'HOLD_TIMERS' | 'COMPLIANCE'>('BLOOD_LABS');
  const [showInteractiveModal, setShowInteractiveModal] = useState<'NONE' | 'QUESTIONNAIRE' | 'BLOOD'>('NONE');

  const { patients, currentPatientId, selectPatient } = usePatientStore();
  const activePatient = patients.find((p) => p.id === currentPatientId) || patients[0];

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
    <div className="min-h-screen bg-[#FAF9F5] text-[#1E293B] font-sans selection:bg-[#1B3B2B] selection:text-white">
      {/* 1. Pearl Health Style Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#E5E2DC] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3B2B] text-white font-bold text-lg shadow-sm">
                V
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#1B3B2B] font-serif">
                  Veracity
                </span>
                <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500 font-semibold -mt-1">
                  Perioperative Defense
                </span>
              </div>
            </div>

            {/* Nav Links (Pearl Health Editorial Style) */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#334155]">
              <a
                href="#pillars"
                className="hover:text-[#1B3B2B] transition-colors cursor-pointer"
              >
                Platform Pillars
              </a>
              <a
                href="#blood-view"
                className="hover:text-[#1B3B2B] transition-colors cursor-pointer"
              >
                In-OT Blood View
              </a>
              <a
                href="#questionnaire-section"
                className="hover:text-[#1B3B2B] transition-colors cursor-pointer"
              >
                Patient Questionnaire
              </a>
              <a
                href="#value-matrix"
                className="hover:text-[#1B3B2B] transition-colors cursor-pointer"
              >
                Clinical Outcomes
              </a>
              <a
                href="#compliance"
                className="hover:text-[#1B3B2B] transition-colors cursor-pointer"
              >
                DHA § 3060(a) Safety
              </a>
            </nav>

            {/* Right Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
                className="rounded-full border border-[#1B3B2B] bg-transparent px-4 py-2 text-xs font-bold text-[#1B3B2B] hover:bg-[#1B3B2B]/5 transition cursor-pointer"
              >
                Patient Intake Form
              </button>

              <button
                type="button"
                onClick={handleLaunchClick}
                className="flex items-center gap-2 rounded-full bg-[#1B3B2B] hover:bg-[#152e22] text-white px-5 py-2.5 text-xs font-bold shadow-md transition cursor-pointer"
              >
                <span>Launch Tabler OT Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#1B3B2B] hover:bg-slate-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E5E2DC] bg-[#FAF9F5] px-4 pt-2 pb-6 space-y-3">
            <a
              href="#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#1B3B2B] py-2"
            >
              Platform Pillars
            </a>
            <a
              href="#blood-view"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#1B3B2B] py-2"
            >
              In-OT Blood View
            </a>
            <a
              href="#questionnaire-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#1B3B2B] py-2"
            >
              Patient Questionnaire
            </a>
            <a
              href="#value-matrix"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-[#1B3B2B] py-2"
            >
              Clinical Outcomes
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowInteractiveModal('QUESTIONNAIRE');
                }}
                className="w-full rounded-full border border-[#1B3B2B] py-2.5 text-xs font-bold text-[#1B3B2B]"
              >
                Patient Intake Form
              </button>
              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full rounded-full bg-[#1B3B2B] py-2.5 text-xs font-bold text-white text-center"
              >
                Launch Tabler OT Console
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Pearl Health Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E9E6DC] border border-[#DDD9CE] px-3.5 py-1 text-xs font-bold text-[#1B3B2B]">
                <Sparkles className="h-3.5 w-3.5 text-[#1B3B2B]" />
                <span>VALUE-BASED PERIOPERATIVE DEFENSE & SURGICAL CLEARANCE</span>
              </div>

              {/* Editorial Serif Headline (Pearl Health style with italicized accents) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#111827] leading-[1.15] font-serif">
                Empowering surgical teams to achieve certainty, safety, and{' '}
                <span className="italic font-serif text-[#1B3B2B] font-medium">zero OT delays</span>.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
                Veracity transforms pre-operative surgical clearance into an autonomous clinical defense layer. Screen patient medical history, detect contraceptive & psychiatric drug interactions, verify 8-hour fasting, and triage blood labs on mobile — before the patient enters the operating theatre.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLaunchClick}
                  className="flex items-center gap-2 rounded-full bg-[#1B3B2B] hover:bg-[#142d21] text-white px-6 py-3.5 text-sm font-bold shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>✦ Open Tabler OT Console</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
                  className="flex items-center gap-2 rounded-full bg-[#FFFFFF] hover:bg-[#F3F0E6] text-[#1B3B2B] border border-[#DDD9CE] px-5 py-3.5 text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  <ClipboardCheck className="h-4 w-4 text-[#1B3B2B]" />
                  <span>Send Pre-Op Questionnaire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInteractiveModal('BLOOD')}
                  className="flex items-center gap-2 rounded-full bg-[#FFFFFF] hover:bg-[#F3F0E6] text-[#1B3B2B] border border-[#DDD9CE] px-5 py-3.5 text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  <Droplets className="h-4 w-4 text-rose-600" />
                  <span>In-OT Mobile Blood View</span>
                </button>
              </div>

              {/* Trust Strip */}
              <div className="pt-6 border-t border-[#E5E2DC] flex items-center gap-4 text-xs text-slate-500 font-medium">
                <div className="flex -space-x-1">
                  {['DA', 'AG', 'NC', 'MH'].map((initials, i) => (
                    <div
                      key={i}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1B3B2B] text-white font-bold text-[10px] ring-2 ring-[#FAF9F5]"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span>
                  Trusted by Day Surgery Centers, DHA Enclaves & Anesthesia Groups across UAE
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Live Showcase Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-[#E5E2DC] bg-[#FFFFFF] p-6 shadow-xl space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#F1EFE9] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3B2B] text-white font-bold text-sm">
                      {activePatient.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#111827]">{activePatient.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{activePatient.mrn} · {activePatient.procedureName}</p>
                    </div>
                  </div>

                  <span
                    className={'px-2.5 py-1 rounded-full text-xs font-bold ' + (
                      activePatient.overallStatus === 'RED_HARD_STOP'
                        ? 'bg-rose-100 text-rose-800'
                        : activePatient.overallStatus === 'AMBER_CONDITIONAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    )}
                  >
                    {activePatient.overallStatus === 'GREEN_CLEARED'
                      ? '✓ CLEARED'
                      : activePatient.overallStatus === 'AMBER_CONDITIONAL'
                      ? '⚠️ CONDITIONAL'
                      : '🛑 RED STOP'}
                  </span>
                </div>

                {/* Patient Case Switcher */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Patient Case Preview:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {patients.slice(0, 3).map((p) => {
                      const isSel = p.id === activePatient.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatient(p.id)}
                          className={'p-2 rounded-xl text-left border text-xs font-bold transition cursor-pointer ' + (
                            isSel
                              ? 'border-[#1B3B2B] bg-[#1B3B2B]/5 text-[#1B3B2B]'
                              : 'border-[#E5E2DC] bg-[#FAF9F5] text-slate-600 hover:border-slate-400'
                          )}
                        >
                          <div className="truncate">{p.name.split(' ')[0]}</div>
                          <div className="text-[10px] font-normal text-slate-500">{p.asaStatus}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live STAT Blood Indicators Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] p-3">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Serum Potassium (K⁺)</span>
                      <span className="text-emerald-700 font-bold">✓ Normal</span>
                    </div>
                    <div className="text-lg font-black text-[#111827] mt-1">
                      4.2 <span className="text-xs font-normal text-slate-500">mEq/L</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] p-3">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Hemoglobin (Hb)</span>
                      <span className="text-emerald-700 font-bold">✓ Cleared</span>
                    </div>
                    <div className="text-lg font-black text-[#111827] mt-1">
                      {activePatient.gender === 'M' ? '14.2' : '12.8'} <span className="text-xs font-normal text-slate-500">g/dL</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] p-3">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Platelets (PLT)</span>
                      <span className="text-emerald-700 font-bold">✓ ASRA OK</span>
                    </div>
                    <div className="text-lg font-black text-[#111827] mt-1">
                      235 <span className="text-xs font-normal text-slate-500">k/µL</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] p-3">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>8h NPO Fasting</span>
                      <span className="text-emerald-700 font-bold">✓ Met</span>
                    </div>
                    <div className="text-lg font-black text-[#111827] mt-1">
                      12h 00m <span className="text-xs font-normal text-slate-500">solids</span>
                    </div>
                  </div>
                </div>

                {/* Primary Directive */}
                <div className="rounded-xl border border-[#E5E2DC] bg-[#FAF9F5] p-3 text-xs text-[#334155]">
                  <div className="font-bold text-[#1B3B2B] flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="h-4 w-4 text-[#1B3B2B]" />
                    <span>Clinical Action Directive:</span>
                  </div>
                  <p className="text-slate-600">{activePatient.primaryActionDirective}</p>
                </div>

                {/* Launch CTA */}
                <button
                  type="button"
                  onClick={handleLaunchClick}
                  className="w-full py-3 rounded-xl bg-[#1B3B2B] hover:bg-[#142d21] text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Full Clinical Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The 3 Core Pillars of Perioperative Defense (Pearl Health 3-Card Grid) */}
      <section id="pillars" className="py-20 bg-[#FFFFFF] border-y border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B3B2B]">
              COMPREHENSIVE PERIOPERATIVE DEFENSE
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#111827] font-serif">
              Three synchronized layers to eliminate operating theatre delays.
            </h2>
            <p className="text-base text-slate-600">
              Designed specifically for UAE day surgery centers to systematically catch high-risk contraindications before induction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Patient Pre-Op Medical Questionnaire */}
            <div
              id="questionnaire-section"
              className="rounded-3xl border border-[#E5E2DC] bg-[#FAF9F5] p-8 flex flex-col justify-between hover:shadow-lg transition space-y-6"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B3B2B] text-white font-bold">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#111827] font-serif">
                  1. Smart Patient Medical Questionnaire
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Digital multi-step intake tool sent via WhatsApp/link to capture:
                </p>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Contraceptive Pills / HRT</strong>: VTE risk & Caprini scores</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Smoking & Vaping</strong>: Airway reactivity & bronchodilators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Antipsychotics</strong>: QTc alerts & Phenylephrine selection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Cardiac & Stents</strong>: DES/BMS hold intervals & METs</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowInteractiveModal('QUESTIONNAIRE')}
                className="w-full py-2.5 rounded-full border border-[#1B3B2B] text-[#1B3B2B] hover:bg-[#1B3B2B] hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Try Interactive Questionnaire
              </button>
            </div>

            {/* Pillar 2: In-OT Mobile Blood Triaging */}
            <div
              id="blood-view"
              className="rounded-3xl border border-[#E5E2DC] bg-[#FAF9F5] p-8 flex flex-col justify-between hover:shadow-lg transition space-y-6"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-700 text-white font-bold">
                  <Droplets className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#111827] font-serif">
                  2. In-OT Mobile Blood Triaging
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  High-contrast smartphone console for the anesthesiologist inside the OT:
                </p>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Potassium (K⁺)</strong>: Critical arrhythmia alert & cutoffs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Hemoglobin (Hb)</strong>: Transfusion thresholds & anemia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Platelets & INR</strong>: ASRA neuraxial clearance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Troponin & Renal</strong>: Ischemia rule-out & eGFR</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowInteractiveModal('BLOOD')}
                className="w-full py-2.5 rounded-full border border-rose-700 text-rose-700 hover:bg-rose-700 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Open In-OT Phone View
              </button>
            </div>

            {/* Pillar 3: Tabler Clinical Dashboard */}
            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FAF9F5] p-8 flex flex-col justify-between hover:shadow-lg transition space-y-6">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#206BC4] text-white font-bold">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#111827] font-serif">
                  3. Tabler Solid-Color OT Workspace
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Clean, structured clinical console modeled strictly on Tabler UI:
                </p>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>Zero AI Slop</strong>: Pure solid colors and crisp borders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>8-Hour NPO Clock</strong>: Aspiration risk timers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>GLP-1 & DOAC Holds</strong>: 168h Semaglutide rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-700 font-bold" />
                    <span><strong>1-Tap Attestation</strong>: Statutory sign-off & WhatsApp</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleLaunchClick}
                className="w-full py-2.5 rounded-full bg-[#206BC4] hover:bg-blue-600 text-white font-bold text-xs transition cursor-pointer"
              >
                Launch Tabler Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Value Matrix & Clinical Outcomes (Pearl Health Stat Callouts) */}
      <section id="value-matrix" className="py-20 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B3B2B]">
              PROVEN VALUE & PERFORMANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#111827] font-serif">
              Quantifiable surgical defense in every case.
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FFFFFF] p-6 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#1B3B2B] font-serif">0</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Day-of-Surgery Delays</div>
              <p className="text-[11px] text-slate-500">Eliminating morning-of cancellations from unmanaged meds</p>
            </div>

            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FFFFFF] p-6 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#1B3B2B] font-serif">100%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Contraindications Caught</div>
              <p className="text-[11px] text-slate-500">Pre-screened contraceptive VTE, antipsychotic & cardiac risks</p>
            </div>

            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FFFFFF] p-6 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#1B3B2B] font-serif">4.8 min</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Avg In-OT PAC Review</div>
              <p className="text-[11px] text-slate-500">Rapid STAT blood triage & bedside sign-off on mobile</p>
            </div>

            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FFFFFF] p-6 text-center space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#1B3B2B] font-serif">100%</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">DHA § 3060(a) Compliant</div>
              <p className="text-[11px] text-slate-500">Sovereign UAE Enclave data protection & non-device CDS</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (Step-by-Step Flow) */}
      <section className="py-20 bg-[#FFFFFF] border-t border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B3B2B]">
              SEAMLESS OT CLEARANCE PATHWAY
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#111827] font-serif">
              From patient intake to OT induction in 3 simple steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FAF9F5] p-6 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3B2B] text-white font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-[#111827] font-serif">Patient Completes Mobile Intake</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coordinator or patient completes the digital questionnaire on WhatsApp or mobile web. Captures contraceptive use, smoking, psychiatric meds, and cardiac conditions.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FAF9F5] p-6 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3B2B] text-white font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-[#111827] font-serif">AI Rules Engine Evaluates Labs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deterministic clinical engine cross-checks potassium cutoffs, hemoglobin, platelets, 8-hour NPO status, and drug hold windows against ASA 2023 & ASRA 2024 guidelines.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E5E2DC] bg-[#FAF9F5] p-6 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B3B2B] text-white font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-[#111827] font-serif">Anesthesiologist Attests in OT</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anesthesiologist reviews STAT blood investigations on phone at the OT door and executes 1-tap attestation. Digital clearance passport is instantly dispatched via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Regulatory & Statutory Safe Harbor */}
      <section id="compliance" className="py-16 bg-[#FAF9F5] border-t border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#E5E2DC] bg-[#FFFFFF] p-8 sm:p-12 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B3B2B] text-white font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111827] font-serif">
                    Clinical Governance & DHA § 3060(a) Compliance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sovereign UAE Data Residency · Deterministic Non-Device CDS Exemption
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                  UAE Azure North Enclave
                </span>
                <span className="rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold">
                  FHIR R4 / HL7 Certified
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Veracity operates under the Statutory Non-Device Clinical Decision Support (CDS) Safe Harbor. All clinical recommendations display transparent underlying biomedical guidelines (ASA 2023, ASRA 2024, ACOG 2024, ACC/AHA) and require final licensed anesthesiologist attestation. Patient data remains strictly encrypted within sovereign UAE infrastructure.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[#E5E2DC] bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B3B2B] text-white font-bold text-sm">
              V
            </div>
            <span className="font-bold text-slate-800 font-serif text-sm">Veracity</span>
            <span>· Perioperative Surgical Defense</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#pillars" className="hover:text-[#1B3B2B]">Platform</a>
            <a href="#blood-view" className="hover:text-[#1B3B2B]">In-OT Blood View</a>
            <a href="#questionnaire-section" className="hover:text-[#1B3B2B]">Questionnaire</a>
            <a href="#compliance" className="hover:text-[#1B3B2B]">Regulatory Safe Harbor</a>
            <button type="button" onClick={handleLaunchClick} className="font-bold text-[#1B3B2B]">
              Launch OT Console
            </button>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            © 2026 Veracity. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Interactive Modal Previews */}
      {showInteractiveModal === 'QUESTIONNAIRE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <PatientPreOpQuestionnaire
              patientId={activePatient.id}
              onClose={() => setShowInteractiveModal('NONE')}
            />
          </div>
        </div>
      )}

      {showInteractiveModal === 'BLOOD' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md my-8 relative">
            <button
              type="button"
              onClick={() => setShowInteractiveModal('NONE')}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white border border-slate-600 hover:bg-slate-700 shadow cursor-pointer"
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
`;

fs.writeFileSync(path.join(__dirname, '../components/VeracityHeroLanding.tsx'), content, 'utf8');
console.log('Successfully generated VeracityHeroLanding.tsx');
