'use client';

import React from 'react';

/**
 * High-performance, lightweight background for the OT console
 * Pure CSS gradient without expensive filters, SVG noise, or full-screen blurs.
 */
export default function ConsoleFiberBackground({
  fixed = false,
}: {
  fixed?: boolean;
  blurred?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`console-ambient pointer-events-none z-0 ${
        fixed ? 'fixed inset-0' : 'absolute inset-0'
      }`}
    >
      <div className="console-ambient-light" />
    </div>
  );
}

