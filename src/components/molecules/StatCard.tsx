'use client';
/**
 * StatCard — Analytics metric display card
 *
 * @level Molecule
 * @composition Icon + Title + Value + Optional trend
 * @example <StatCard title="Total Tasks" value={42} icon={<CheckSquare />} color="blue" />
 */

import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

const colorMap: Record<string, { icon: string; glow: string; border: string }> = {
  blue:   { icon: 'bg-blue-600/20 text-blue-400',   glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]',  border: 'hover:border-blue-500/40' },
  green:  { icon: 'bg-emerald-500/10 text-emerald-600', glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]', border: 'hover:border-emerald-500/40' },
  yellow: { icon: 'bg-yellow-500/10 text-yellow-600', glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]',  border: 'hover:border-yellow-500/40' },
  red:    { icon: 'bg-[#D2001A]/10 text-[#D2001A]',     glow: 'hover:shadow-[0_0_20px_rgba(210,0,26,0.2)]',   border: 'hover:border-[#D2001A]/40' },
  purple: { icon: 'bg-purple-600/20 text-purple-400', glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]', border: 'hover:border-purple-500/40' },
  orange: { icon: 'bg-orange-600/20 text-orange-400', glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]', border: 'hover:border-orange-500/40' },
};

export default function StatCard({
  title,
  value,
  icon,
  color = 'red',
  subtitle,
  onClick,
  className = '',
}: StatCardProps) {
  const { icon: iconClass, glow, border } = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-slate-200/60 shadow-sm rounded-xl p-5 transition-all duration-250
        ${onClick ? 'cursor-pointer hover:-translate-y-1 group' : ''}
        ${glow} ${border}
        ${className}
      `}
    >
      {/* Hover hint */}
      {onClick && (
        <div className="flex items-center justify-between mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-bold text-[#D2001A] uppercase tracking-wider">
            Lihat Daftar →
          </span>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${iconClass} ${onClick ? 'group-hover:scale-110' : ''}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-600 font-medium truncate">{title}</p>
          <p className="text-2xl font-black text-slate-800 mt-0.5">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
