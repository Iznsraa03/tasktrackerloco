'use client';
/**
 * Badge — Atomic status/label indicator pill
 *
 * @level Atom
 * @example <Badge variant="approved">Approved</Badge>
 */

import React from 'react';
import type { TaskStatus } from '@/src/types';

type BadgeVariant = TaskStatus | 'Fix' | 'Pitching' | 'Pending' | 'Cancel' | 'High' | 'Medium' | 'Low' | 'Core' | 'Support' | 'Colaboration' | 'Improvement' | 'custom';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

const variantMap: Record<string, string> = {
  'Approved':     'badge-approved',
  'Done':         'badge-done',
  'Revisi':       'badge-revisi',
  'In Progress':  'badge-inprogress',
  'To Do':        'badge-todo',
  'Fix':          'bg-emerald-50 text-emerald-600 border border-emerald-200',
  'Pitching':     'bg-blue-50 text-[#D2001A] border border-[#D2001A]/20',
  'Pending':      'bg-yellow-50 text-yellow-600 border border-yellow-200',
  'Cancel':       'bg-red-50 text-red-600 border border-red-200',
  'High':         'bg-red-50 text-red-600 border border-red-200',
  'Medium':       'bg-yellow-50 text-yellow-600 border border-yellow-200',
  'Low':          'bg-slate-50 text-slate-600 border border-slate-200',
  'Core':         'bg-[#D2001A]/10 text-[#D2001A] border border-[#D2001A]/20',
  'Support':      'bg-orange-50 text-orange-600 border border-orange-200',
  'Colaboration': 'bg-purple-50 text-purple-600 border border-purple-200',
  'Improvement':  'bg-pink-50 text-pink-600 border border-pink-200',
};

const sizeMap: Record<string, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] rounded',
  sm: 'px-2 py-0.5 text-xs rounded-md',
  md: 'px-2.5 py-1 text-sm rounded-lg',
};

export default function Badge({
  variant = 'custom',
  children,
  className = '',
  size = 'sm',
}: BadgeProps) {
  const colorClass = variantMap[variant as string] ?? 'bg-slate-50 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex items-center font-semibold tracking-tight ${colorClass} ${sizeMap[size]} ${className}`}>
      {children}
    </span>
  );
}
