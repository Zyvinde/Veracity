'use client';

import React from 'react';
import { Skeleton } from '@/components/ui-utils';

export default function Loading() {
  return (
    <div className="harvey-dashboard min-h-screen p-6">
      <div className="sticky top-0 z-40 border-b border-black/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-36 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1750px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-3">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="lg:col-span-3 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-72" />
              <Skeleton className="h-3 w-96" />
            </div>
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
