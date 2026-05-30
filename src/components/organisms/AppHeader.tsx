'use client';
/**
 * AppHeader — Top navigation bar organism
 *
 * @level Organism
 * @composition Bell notifications + User profile + Logout + Mobile menu toggle
 */

import React, { useState } from 'react';
import { Bell, LogOut, Menu, ChevronLeft, UserCircle } from 'lucide-react';
import NotificationItem from '../molecules/NotificationItem';
import type { Employee, Notification, Page } from '@/src/types';

interface AppHeaderProps {
  currentUser: Employee;
  notifications: Notification[];
  pageHistory: Page[];
  onBack: () => void;
  onLogout: () => void;
  onMobileMenuToggle: () => void;
  onNotificationClick: (taskId: string) => void;
}

export default function AppHeader({
  currentUser,
  notifications,
  pageHistory,
  onBack,
  onLogout,
  onMobileMenuToggle,
  onNotificationClick,
}: AppHeaderProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 backdrop-blur-md px-4 sm:px-6 shrink-0 z-30">
      {/* Left: hamburger + back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        {pageHistory.length > 0 && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all"
          >
            <ChevronLeft size={15} />
            Kembali
          </button>
        )}
      </div>

      {/* Right: bell + profile */}
      <div className="flex items-center gap-3 relative">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bell size={19} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D2001A] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200/60 z-50 overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60">
                  <h3 className="text-sm font-bold text-slate-800">Notifikasi</h3>
                  {notifications.length > 0 && (
                    <span className="text-xs font-bold bg-[#D2001A]/10 text-[#D2001A] border border-[#D2001A]/20 px-2 py-0.5 rounded-full">
                      {notifications.length} Baru
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClick={() => {
                          onNotificationClick(n.taskId);
                          setIsNotifOpen(false);
                        }}
                      />
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-600">
                      <Bell size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">Belum ada notifikasi baru.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* User profile */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{currentUser.name}</p>
            <p className="text-xs text-slate-500 truncate max-w-[140px]">{currentUser.jobTitle}</p>
          </div>
          <UserCircle size={30} className="text-slate-600" />
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Keluar"
          className="p-2 rounded-lg text-slate-600 hover:text-[#D2001A] hover:bg-[#D2001A]/10 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
