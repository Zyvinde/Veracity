'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Activity } from 'lucide-react';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-500/20 to-blue-900/40 shadow-glow mb-6">
          <Activity className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight text-white">
          {t('notFound.title')}
        </h1>
        <p className="mt-3 max-w-md text-sm text-slate-400 font-sans">
          {t('notFound.description')}
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-gradient-to-r from-blue-600/20 to-blue-600/20 px-5 py-2.5 text-sm font-semibold text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/30 hover:text-white"
        >
          {t('notFound.returnDashboard')}
        </a>
      </div>
    </div>
  );
}
