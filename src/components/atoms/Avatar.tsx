'use client';
/**
 * Avatar — Atomic user avatar with initials fallback
 *
 * @level Atom
 * @example <Avatar name="Muhammad Ridwan" size="md" />
 */

import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/** Maps a name string to a deterministic hue for the gradient */
function getHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

const sizeMap: Record<string, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6 text-[10px]', text: 'text-[9px]' },
  sm: { container: 'w-8 h-8 text-xs', text: 'text-[10px]' },
  md: { container: 'w-10 h-10 text-sm', text: 'text-xs' },
  lg: { container: 'w-12 h-12 text-base', text: 'text-sm' },
  xl: { container: 'w-16 h-16 text-xl', text: 'text-base' },
};

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const hue = getHue(name);
  const initials = getInitials(name);
  const { container } = sizeMap[size];

  return (
    <div
      className={`
        ${container} rounded-full flex items-center justify-center
        font-bold text-white shrink-0 select-none
        ring-2 ring-white/10
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 35%), hsl(${(hue + 60) % 360}, 80%, 25%))`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
