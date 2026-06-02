'use client';
/**
 * Sidebar — App navigation sidebar organism
 *
 * @level Organism
 * @composition NavItem (Molecule) + Logo + User Info
 */

import React from 'react';
import { 
  LayoutDashboard, CheckSquare, FolderOpen, Calendar,
  CalendarDays, Target, Users, X
} from 'lucide-react';
import NavItem from '../molecules/NavItem';
import type { Page, Employee } from '@/src/types';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  currentUser: Employee;
  notificationCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activePage,
  onNavigate,
  currentUser,
  notificationCount,
  isOpen,
  onClose,
}: SidebarProps) {
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';

  const taskLabel = isAdmin ? 'Semua Tugas' : isManager ? 'Tugas Divisi' : 'Tugas Saya';
  const kpiLabel = isAdmin ? 'KPI Seluruh Tim' : isManager ? 'KPI Divisi' : 'KPI Saya';

  const handleNav = (page: Page) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-slate-50 border-r border-slate-200/60
          transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/60 px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D2001A] flex items-center justify-center font-black text-white text-sm shadow-[0_0_12px_rgba(210,0,26,0.5)] p-1">
              <img src="/logo/LOGO%20LOCO%20WHITE.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 tracking-wider">LOCO 21</span>
              <span className="text-xs font-semibold text-[#D2001A] ml-1">PRO</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* User info pill */}
        <div className="mx-4 mt-4 px-3 py-2.5 bg-white rounded-xl border border-slate-200/60 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">Akses Saat Ini</p>
          <p className="text-sm font-bold text-slate-800">
            {currentUser.role}{' '}
            <span className="text-slate-500 font-normal text-xs">({currentUser.division})</span>
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-4 space-y-1">
          <p className="mb-3 text-[10px] font-bold tracking-widest text-slate-600 uppercase px-1">Menu Utama</p>

          <NavItem icon={<LayoutDashboard size={17} />} label="Dasbor Utama" isActive={activePage === 'dashboard'} onClick={() => handleNav('dashboard')} />
          <NavItem icon={<CheckSquare size={17} />} label={taskLabel} isActive={activePage === 'tasks'} onClick={() => handleNav('tasks')} badge={notificationCount > 0 ? notificationCount : undefined} />
          {(isAdmin || isManager) && (
            <NavItem icon={<FolderOpen size={17} />} label="Daftar Project" isActive={activePage === 'projects'} onClick={() => handleNav('projects')} />
          )}
          <NavItem icon={<Calendar size={17} />} label="Kalender Task" isActive={activePage === 'calendarTask'} onClick={() => handleNav('calendarTask')} />
          <NavItem icon={<CalendarDays size={17} />} label="Kalender Project" isActive={activePage === 'calendarProject'} onClick={() => handleNav('calendarProject')} />
          <NavItem icon={<Target size={17} />} label={kpiLabel} isActive={activePage === 'kpi'} onClick={() => handleNav('kpi')} />

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase px-1">Administrasi</p>
              </div>
              <NavItem icon={<Users size={17} />} label="Manajemen Karyawan" isActive={activePage === 'employees'} onClick={() => handleNav('employees')} />
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
