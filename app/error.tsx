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
    <div className="veracity-canvas flex min-h-screen flex-col items-center justify-center text-slate-100 p-6">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl veracity-status-stop mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="veracity-serif-accent text-3xl text-white">
          {t('error.title')}
        </h1>
        <p className="veracity-ui-label mt-3 text-sm text-slate-400">
          {t('error.description')}
        </p>
        {error.digest && (
          <p className="veracity-num mt-3 rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-slate-400">
            {t('error.errorId')} {error.digest}
          </p>
        )}
        <p className="veracity-num mt-2 text-xs text-slate-500">
          {error.message}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="veracity-focus veracity-press inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            {t('error.retryLoad')}
          </button>
          <a
            href="/"
            className="veracity-focus veracity-press inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
          >
            {t('error.returnHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
