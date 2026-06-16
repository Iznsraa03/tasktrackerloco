'use client';
/**
 * CalendarPage — Task & Project calendar organism
 *
 * @level Organism
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { Task, Project, Employee } from '@/src/types';

interface CalendarPageProps {
  mode: 'task' | 'project';
  tasks: Task[];
  projects: Project[];
  employees: Employee[];
  currentUser: Employee;
  onViewTask: (taskId: string) => void;
  onViewProject: (project: Project) => void;
}

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAY_NAMES = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

function getProjectHue(id: string): string {
  const colors = ['bg-[#D2001A]','bg-purple-500','bg-pink-500','bg-orange-500','bg-indigo-500','bg-teal-500','bg-rose-500','bg-emerald-500'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CalendarPage({ mode, tasks, projects, employees, currentUser, onViewTask, onViewProject }: CalendarPageProps) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // Default to May
  const [todayStr, setTodayStr] = useState('2026-05-11');
  const [filterEmp, setFilterEmp] = useState('all');

  useEffect(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTodayStr(`${yyyy}-${mm}-${dd}`);
  }, []);

  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const filterEmployees = Array.from(
    new Set(
      employees
        .filter((e) => e.status === 'Aktif' && (isAdmin ? true : e.division === currentUser.division))
        .map((e) => e.name)
    )
  ).sort();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const curMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Build grid days
  const gridDays: (null | { day: number; dateStr: string })[] = [];
  for (let i = 0; i < startOffset; i++) gridDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push({ day: i, dateStr: `${curMonthStr}-${String(i).padStart(2, '0')}` });
  }
  while (gridDays.length % 7 !== 0) gridDays.push(null);

  const weeks: typeof gridDays[] = [];
  for (let i = 0; i < gridDays.length; i += 7) weeks.push(gridDays.slice(i, i + 7));

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {mode === 'task' ? 'Kalender Task' : 'Kalender Project'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {mode === 'task' ? 'Klik tanggal untuk melihat tugas hari itu.' : 'Visual timeline project yang berlangsung.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(isAdmin || isManager) && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm">
              <Filter size={13} className="text-slate-500" />
              <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer">
                <option value="all">Semua Karyawan</option>
                {filterEmployees.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <button onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
              else { setCurrentMonth(m => m - 1); }
            }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-slate-800 w-36 text-center text-sm">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
              else { setCurrentMonth(m => m + 1); }
            }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200/60 bg-slate-50">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`py-3 text-center text-xs font-bold uppercase ${i >= 5 ? 'text-[#D2001A]' : 'text-slate-600'}`}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        <div>
          {weeks.map((week, wIdx) => {
            // project bars for this week (project mode)
            let weekProjects: Project[] = [];
            if (mode === 'project') {
              const validDays = week.filter((d) => d !== null) as { day: number; dateStr: string }[];
              if (validDays.length > 0) {
                const ws = validDays[0].dateStr;
                const we = validDays[validDays.length - 1].dateStr;
                weekProjects = projects.filter((p) => {
                  if (!p.startDate) return false;
                  const end = p.endDate || p.startDate;
                  if (p.startDate > we || end < ws) return false;
                  if (filterEmp !== 'all' && p.projectOfficer !== filterEmp) return false;
                  return true;
                });
              }
            }

            return (
              <div key={wIdx} className="relative grid grid-cols-7 border-b border-slate-100 min-h-[110px] last:border-0">
                {week.map((dayObj, dIdx) => {
                  if (!dayObj) return <div key={`e-${wIdx}-${dIdx}`} className="border-r border-slate-100 bg-slate-50/50 p-2" />;

                  const isToday = dayObj.dateStr === todayStr;
                  let dayTasks: Task[] = [];
                  if (mode === 'task') {
                    dayTasks = tasks.filter((t) => {
                      if (t.date !== dayObj.dateStr) return false;
                      if (filterEmp !== 'all') return t.assignee === filterEmp || t.partner === filterEmp;
                      return true;
                    });
                  }

                  return (
                    <div
                      key={dayObj.day}
                      onClick={() => mode === 'task' && onViewTask(dayObj.dateStr)}
                      className={`border-r border-slate-100 p-2 transition-colors ${mode === 'task' ? 'cursor-pointer hover:bg-slate-50' : ''} ${isToday ? 'bg-[#D2001A]/5' : ''}`}
                    >
                      <div className="mb-1.5">
                        <span className={`text-xs font-bold inline-flex items-center justify-center ${isToday ? 'bg-[#D2001A] text-white w-6 h-6 rounded-full shadow-[0_0_8px_rgba(210,0,26,0.5)]' : 'text-slate-500'}`}>
                          {dayObj.day}
                        </span>
                      </div>
                      {mode === 'task' && (
                        <div className="space-y-1 overflow-y-auto custom-scrollbar max-h-[70px]">
                          {dayTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={(e) => { e.stopPropagation(); onViewTask(t.id); }}
                              className={`text-[9px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer ${t.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'Done' ? 'bg-slate-500/10 text-slate-400' : 'bg-orange-500/10 text-orange-400'}`}
                              title={t.title}
                            >
                              {t.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Project bars overlay */}
                {mode === 'project' && weekProjects.length > 0 && (
                  <div className="absolute top-8 left-0 right-0 grid grid-cols-7 pointer-events-none z-10 px-0.5 gap-y-1">
                    {weekProjects.map((p) => {
                      const pEnd = p.endDate || p.startDate;
                      const validDays = week.filter((d) => d !== null) as { day: number; dateStr: string }[];
                      const startIdx = week.findIndex((d) => d && d.dateStr === p.startDate);
                      const endIdx = week.findIndex((d) => d && d.dateStr === pEnd);
                      const colStart = startIdx !== -1 ? startIdx + 1 : 1;
                      const colEnd = endIdx !== -1 ? endIdx + 1 : 7;
                      const isContinuingFromPrev = startIdx === -1 && validDays.length > 0 && p.startDate < validDays[0].dateStr;
                      const isContinuingToNext = endIdx === -1 && validDays.length > 0 && pEnd > validDays[validDays.length - 1].dateStr;

                      return (
                        <div
                          key={p.id}
                          style={{ gridColumnStart: colStart, gridColumnEnd: colEnd + 1 }}
                          className="pointer-events-auto"
                          onClick={() => onViewProject(p)}
                        >
                          <div
                            className={`text-[9px] font-bold px-1.5 py-0.5 text-white truncate cursor-pointer hover:brightness-110 transition-all shadow-sm ${getProjectHue(p.id)} ${isContinuingFromPrev ? 'rounded-l-none' : 'rounded-l-sm'} ${isContinuingToNext ? 'rounded-r-none' : 'rounded-r-sm'}`}
                            title={p.name}
                          >
                            {p.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
