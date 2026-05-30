'use client';
/**
 * NotificationItem — Single notification entry in the bell dropdown
 *
 * @level Molecule
 * @composition Icon + Title + Message
 */

import React from 'react';
import type { Notification } from '@/src/types';
import { MessageSquareWarning, CheckCircle2, Bell } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const iconMap = {
  revision:     { icon: MessageSquareWarning, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  approved:     { icon: CheckCircle2,         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  need_approval:{ icon: Bell,                 color: 'text-[#D2001A]',   bg: 'bg-[#D2001A]/10' },
};

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { icon: Icon, color, bg } = iconMap[notification.type];

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
    >
      <div className={`mt-0.5 shrink-0 ${bg} p-2 rounded-full`}>
        <Icon size={14} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 leading-tight truncate">{notification.title}</p>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
      </div>
    </button>
  );
}
