'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConsoleErrorBoundaryProps {
  children: React.ReactNode;
}

interface ConsoleErrorBoundaryState {
  failed: boolean;
}

/**
 * Last-resort guard for the console: a render crash (e.g. corrupt cached
 * patient data) shows a recovery screen instead of a black void, with a
 * one-tap reset that clears local storage and reloads from the server.
 */
export class ConsoleErrorBoundary extends React.Component<
  ConsoleErrorBoundaryProps,
  ConsoleErrorBoundaryState
> {
  constructor(props: ConsoleErrorBoundaryProps) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): ConsoleErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[ConsoleErrorBoundary]', error);
  }

  private handleReset = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('anterior-health-'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E9ED] p-6 font-sans">
        <div className="w-full max-w-md rounded-xl border border-[#D3DCE2] bg-[#EFF3F6] p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[#D97706]" aria-hidden="true" />
          <h1 className="mt-3 font-serif text-xl font-semibold text-[#223140]">
            Console failed to render
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5B6B78]">
            The saved local case data looks corrupt. Resetting clears the local
            cache and reloads fresh cases from the server — no server data is lost.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 w-full rounded-full bg-[#B3871C] px-5 py-2.5 text-[13px] font-bold text-white transition hover:brightness-105"
          >
            Reset local data &amp; reload
          </button>
        </div>
      </div>
    );
  }
}
