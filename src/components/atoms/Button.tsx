'use client';
/**
 * Button — Atomic component for user actions
 *
 * @level Atom
 * @example <Button variant="primary" size="md">Click me</Button>
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[#D2001A] hover:bg-[#B30015] text-white border border-[#D2001A]/50 shadow-[0_0_12px_rgba(210,0,26,0.3)] hover:shadow-[0_0_20px_rgba(210,0,26,0.5)] hover:-translate-y-0.5',
  secondary:
    'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-transparent',
  danger:
    'bg-red-600/90 hover:bg-red-500 text-white border border-red-500/50 hover:-translate-y-0.5',
  success:
    'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/50 hover:-translate-y-0.5',
  warning:
    'bg-orange-500/90 hover:bg-orange-400 text-white border border-orange-400/50 hover:-translate-y-0.5',
};

const sizeStyles: Record<string, string> = {
  xs: 'px-2.5 py-1 text-[11px] rounded-md gap-1',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-2.5 text-base rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {rightIcon && !isLoading && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
