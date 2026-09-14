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
      className={`pointer-events-none -z-10 bg-[#071322] ${
        fixed ? 'fixed inset-0' : 'absolute inset-0'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1e36]/60 via-[#07172c]/80 to-[#040d18]" />
    </div>
  );
}

