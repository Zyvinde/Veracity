'use client';

import React from 'react';

const FIBER_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4';

/**
 * Live fiber-optic backdrop for the OT console — same film as the landing,
 * graded mist-blue: cool tint wash, soft blur, deep bottom scrim so dark
 * frosted-glass cards + white type stay legible over the motion.
 * Pure CSS overlays — zero extra network cost beyond the shared video file.
 *
 * Props:
 * - fixed: pin to the viewport (dedicated /console page) instead of the
 *   parent section, so the backdrop stays put while the roster scrolls.
 * - blurred: add a frosted veil that melts the scene into one blurred wash.
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
      className={`pointer-events-none overflow-hidden bg-[#8fa9bc] ${
        fixed ? 'fixed inset-0' : 'absolute inset-0 rounded-[inherit]'
      }`}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        src={FIBER_VIDEO_URL}
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[1.5px] brightness-[0.88] saturate-[0.85]"
      />
      {/* Mist-blue grade — icy wash that pushes the footage toward pale blue */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#c3d5e2]/55 via-[#9db4c6]/40 to-[#54687c]/60" />
      <div className="absolute inset-0 bg-sky-200/15 mix-blend-overlay" />
      {/* Depth scrims — lift top light, anchor bottom for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 500px at 50% -8%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(900px 620px at 50% 115%, rgba(8,18,28,0.5), transparent 65%)',
        }}
      />
      {/* Frosted veil — melts the whole scene into one blurred wash */}
      {blurred && <div className="absolute inset-0 bg-[#5d7488]/35 backdrop-blur-md" />}
      {/* Fine grain to match Apple frosted texture */}
      <div className="grain absolute inset-0 opacity-60" />
    </div>
  );
}
