'use client';

import React from 'react';
import { cx } from '@/lib/tremor-utils';

interface ProgressCircleProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  showLabel?: boolean;
}

const sizeMap = { sm: 36, md: 48, lg: 64 };
const strokeMap = { sm: 3, md: 4, lg: 5 };
const fontSizeMap = { sm: '8px', md: '10px', lg: '12px' };

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 'md',
  color = '#6ee7b7',
  className,
  showLabel = true,
}) => {
  const dim = sizeMap[size];
  const stroke = strokeMap[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className={cx('relative inline-flex items-center justify-center', className)}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute font-mono font-bold text-white" style={{ fontSize: fontSizeMap[size] }}>
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};
