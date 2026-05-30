'use client';
/**
 * NavItem — Sidebar navigation button
 *
 * @level Molecule
 * @composition Icon + Label + Active state
 */

import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

export default function NavItem({ icon, label, isActive, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 group relative
        ${isActive
          ? 'bg-[#D2001A] text-white shadow-[0_0_16px_rgba(210,0,26,0.35)] border border-[#D2001A]/50'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
        }
      `}
    >
      <span className={`shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
