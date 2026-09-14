'use client';

import React from 'react';
import { cx } from '@/lib/tremor-utils';

type ButtonVariant = 'primary' | 'ghost' | 'white';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'mist-btn mist-btn-primary px-4 py-2.5',
  ghost: 'mist-btn mist-btn-ghost px-4 py-2.5',
  white: 'mist-btn mist-btn-white px-4 py-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', icon, className, children, ...props }, ref) => (
    <button ref={ref} className={cx(variantClasses[variant], className)} {...props}>
      {icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
