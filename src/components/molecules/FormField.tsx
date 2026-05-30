'use client';
/**
 * FormField — Label + Input/Select + optional error
 *
 * @level Molecule
 * @composition Label (Atom) + Input/Select (Atom) + Error text
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-[#D2001A] ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[#D2001A]">{error}</p>
      )}
    </div>
  );
}
