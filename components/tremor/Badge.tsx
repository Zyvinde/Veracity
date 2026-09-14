'use client';

import React from 'react';
import { cx } from '@/lib/tremor-utils';

type BadgeVariant = 'cleared' | 'caution' | 'stop' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  cleared: 'mist-pill-cleared',
  caution: 'mist-pill-caution',
  stop: 'mist-pill-stop',
  neutral: 'mist-pill-neutral',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', icon, className, children, ...props }) => (
  <span className={cx('mist-pill', variantClasses[variant], className)} {...props}>
    {icon}
    {children}
  </span>
);
