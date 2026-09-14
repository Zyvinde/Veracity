'use client';

import React from 'react';
import { cx } from '@/lib/tremor-utils';

type CalloutColor = 'sky' | 'emerald' | 'amber' | 'rose' | 'neutral';

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: CalloutColor;
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}

const colorClasses: Record<CalloutColor, string> = {
  sky: 'border-sky-300/40 bg-sky-50/15 text-sky-200',
  emerald: 'border-emerald-300/40 bg-emerald-50/15 text-emerald-200',
  amber: 'border-amber-300/40 bg-amber-50/15 text-amber-200',
  rose: 'border-rose-300/40 bg-rose-50/15 text-rose-200',
  neutral: 'border-white/20 bg-white/8 text-white/80',
};

export const Callout: React.FC<CalloutProps> = ({ color = 'sky', icon, title, className, children, ...props }) => (
  <div className={cx('rounded-xl border p-3.5 flex items-start gap-2.5', colorClasses[color], className)} {...props}>
    {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
    <div className="min-w-0">
      {title && <span className="block font-mono text-[10px] font-bold uppercase tracking-wider mb-0.5">{title}</span>}
      <span className="text-xs leading-relaxed">{children}</span>
    </div>
  </div>
);
