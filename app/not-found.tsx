'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Activity } from 'lucide-react';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="harvey-dashboard flex min-h-screen flex-col items-center justify-center text-[#1a1a1a] p-6">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-400/10 shadow-[0_0_24px_-6px_rgba(56,189,248,0.5)] mb-6">
          <Activity className="h-8 w-8 text-sky-300" />
        </div>
        <h1 className="veracity-serif-accent text-4xl text-[#1a1a1a]">
          {t('notFound.title')}
        </h1>
        <p className="veracity-ui-label mt-3 max-w-md text-sm text-[#6b706b]">
          {t('notFound.description')}
        </p>
        <a
          href="/"
          className="veracity-focus veracity-press mt-6 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
        >
          {t('notFound.returnDashboard')}
        </a>
      </div>
    </div>
  );
}
