'use client';
/**
 * Input — Atomic component for text input fields
 *
 * @level Atom
 * @example <Input placeholder="Search..." value={val} onChange={...} />
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  error?: string;
}

export default function Input({
  leftAddon,
  rightAddon,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="relative w-full">
      {leftAddon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
          {leftAddon}
        </div>
      )}
      <input
        className={`
          input-light border border-slate-200 w-full py-2.5 text-sm
          ${leftAddon ? 'pl-9' : 'pl-4'}
          ${rightAddon ? 'pr-9' : 'pr-4'}
          ${error ? 'border-[#D2001A] focus:border-[#D2001A] focus:shadow-[0_0_0_3px_rgba(210,0,26,0.1)]' : ''}
          ${className}
        `}
        {...props}
      />
      {rightAddon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 z-10">
          {rightAddon}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-[#D2001A]">{error}</p>
      )}
    </div>
  );
}
