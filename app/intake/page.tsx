import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import PatientPreOpQuestionnaire from '@/components/PatientPreOpQuestionnaire';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Patient Pre-Op Assessment Demo — House Health MVP Prototype',
  description:
    'MVP prototype demo of a patient pre-op questionnaire with mock data. Not a medical device, not for clinical use.',
};

export default function IntakePage() {
  return (
    <div className="veracity-canvas min-h-screen text-white w-full overflow-x-hidden selection:bg-sky-500/30">
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="glass-card-subtle flex h-12 w-12 items-center justify-center rounded-2xl text-white font-serif italic text-2xl shadow-xl">
              V
            </div>
            <p className="text-sm font-semibold text-white">Loading Pre-Op Questionnaire…</p>
          </div>
        }
      >
        <div className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-8 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-300 hover:text-sky-200 transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/pac"
                className="text-xs font-mono text-emerald-300 hover:text-emerald-200 transition py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 min-h-[44px] flex items-center shrink-0"
              >
                Quick PAC (3 min) →
              </Link>
              <Link
                href="/console"
                className="text-xs font-mono text-sky-400 hover:text-sky-300 transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] flex items-center shrink-0"
              >
                OT Console →
              </Link>
            </div>
          </div>

          <PatientPreOpQuestionnaire isStandalonePage />
        </div>
      </Suspense>
    </div>
  );
}
