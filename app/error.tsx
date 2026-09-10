'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="text-center max-w-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-950/40 mb-6">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
          {t('error.title')}
        </h1>
        <p className="mt-3 text-sm text-slate-400 font-sans">
          {t('error.description')}
        </p>
        {error.digest && (
          <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900 p-2 font-mono text-xs text-slate-400">
            {t('error.errorId')} {error.digest}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500 font-mono">
          {error.message}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-gradient-to-r from-blue-600/20 to-blue-600/20 px-5 py-2.5 text-sm font-semibold text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/30 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            {t('error.retryLoad')}
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
          >
            {t('error.returnHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
