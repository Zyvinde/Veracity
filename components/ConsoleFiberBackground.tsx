'use client';

import React from 'react';

/**
 * Atmospheric mist blue backdrop for the OT console
 * Multi-layer blue mist with ambient glow, volumetric lighting, and subtle grain.
 */
export default function ConsoleFiberBackground({
  fixed = false,
  blurred = false,
}: {
  fixed?: boolean;
  blurred?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden bg-[#071322] ${
        fixed ? 'fixed inset-0 z-0' : 'absolute inset-0 rounded-[inherit] z-0'
      }`}
    >
      {/* Mist blue volumetric lighting layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1e36]/80 via-[#07172c]/90 to-[#040d18]" />
      <div className="absolute inset-0 bg-[radial-gradient(1300px_700px_at_50%_-10%,rgba(56,189,248,0.25),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_15%_35%,rgba(14,165,233,0.18),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_650px_at_85%_75%,rgba(2,132,199,0.20),transparent_70%)]" />
      <div className="absolute inset-0 bg-sky-400/5 mix-blend-screen" />

      {/* Frosted veil */}
      {blurred && <div className="absolute inset-0 bg-[#05111f]/30 backdrop-blur-[2px]" />}
      
      {/* Fine mist grain */}
      <div className="grain absolute inset-0 opacity-25" />
    </div>
  );
}

