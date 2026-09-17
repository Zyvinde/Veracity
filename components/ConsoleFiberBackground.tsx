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
            'linear-gradient(to bottom, rgba(10, 30, 54, 0.35), rgba(7, 23, 44, 0.5) 50%, rgba(4, 13, 24, 0.9))',
        }}
      />
    </div>
  );
}
