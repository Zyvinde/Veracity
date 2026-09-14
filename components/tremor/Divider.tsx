'use client';

import React from 'react';
import { cx } from '@/lib/tremor-utils';

export const Divider: React.FC<React.HTMLAttributes<HTMLHRElement>> = ({ className, ...props }) => (
  <hr className={cx('border-t border-white/10', className)} {...props} />
);
