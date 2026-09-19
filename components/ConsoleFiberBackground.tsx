'use client';

import React from 'react';

export default function ConsoleFiberBackground({
  fixed = false,
}: {
  fixed?: boolean;
  blurred?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none z-0 ${fixed ? 'fixed inset-0' : 'absolute inset-0'}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 26% at 50% 0%, rgba(26, 26, 26, 0.06), rgba(26, 26, 26, 0) 70%), linear-gradient(to bottom, #fafaf8 0%, #f4f2ec 60%, #edeae2 100%)',
        }}
      />
    </div>
  );
}
