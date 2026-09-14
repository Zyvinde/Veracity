'use client';

import React from 'react';
import { Card } from '@/components/ui/tremor/components/Card/Card';

interface PaneErrorBoundaryProps {
  paneName: string;
  children: React.ReactNode;
}

interface PaneErrorBoundaryState {
  failed: boolean;
}

/**
 * Isolates chart-pane crashes (recharts) so one failing visualization
 * can never blank an entire console tab.
 */
export class PaneErrorBoundary extends React.Component<PaneErrorBoundaryProps, PaneErrorBoundaryState> {
  constructor(props: PaneErrorBoundaryProps) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): PaneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[PaneErrorBoundary:${this.props.paneName}]`, error);
  }

  render() {
    if (this.state.failed) {
      return (
        <Card className="p-6 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {this.props.paneName} visualization unavailable
          </p>
          <p className="mt-1 font-mono text-[11px] text-gray-500 dark:text-white/50">
            Charts failed to render — clinical tables on other tabs are unaffected.
          </p>
        </Card>
      );
    }
    return this.props.children;
  }
}
