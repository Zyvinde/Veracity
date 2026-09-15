import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PACInterviewWizard from '@/components/PACInterviewWizard';

export const metadata: Metadata = {
  title: 'Quick PAC Interview — House Health',
  description:
    'Short plain-language pre-anesthesia interview: meds, fasting 8h, allergies, teeth and surgery-day do’s. Patient + clinic verify modes.',
};

export default function PACPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white w-full overflow-x-hidden selection:bg-emerald-500/30">
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 font-serif italic text-2xl animate-pulse">
              V
            </div>
            <p className="text-sm font-semibold">Loading Quick PAC…</p>
          </div>
        }
      >
        <div className="w-full max-w-5xl mx-auto px-3 py-4 sm:px-6 sm:py-8 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/intake"
                className="text-xs font-mono text-white/70 hover:text-white transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] flex items-center shrink-0"
              >
                Full intake →
              </Link>
              <Link
                href="/console"
                className="text-xs font-mono text-sky-400 hover:text-sky-300 transition py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 min-h-[44px] flex items-center shrink-0"
              >
                OT Console →
              </Link>
            </div>
          </div>

          <PACInterviewWizard />
        </div>
      </Suspense>
    </div>
  );
}
