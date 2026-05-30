'use client';
/**
 * AppLayout — Template that wraps all app content with Sidebar + Header
 *
 * @level Template
 * @composition Sidebar (Organism) + AppHeader (Organism) + Page slot
 */

import React, { useState } from 'react';
import Sidebar from '../organisms/Sidebar';
import AppHeader from '../organisms/AppHeader';
import type { Employee, Notification, Page } from '@/src/types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentUser: Employee;
  activePage: Page;
  pageHistory: Page[];
  notifications: Notification[];
  onNavigate: (page: Page) => void;
  onBack: () => void;
  onLogout: () => void;
  onNotificationClick: (taskId: string) => void;
}

export default function AppLayout({
  children,
  currentUser,
  activePage,
  pageHistory,
  notifications,
  onNavigate,
  onBack,
  onLogout,
  onNotificationClick,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        currentUser={currentUser}
        notificationCount={notifications.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader
          currentUser={currentUser}
          notifications={notifications}
          pageHistory={pageHistory}
          onBack={onBack}
          onLogout={onLogout}
          onMobileMenuToggle={() => setSidebarOpen((v) => !v)}
          onNotificationClick={onNotificationClick}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
