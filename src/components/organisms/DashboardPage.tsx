'use client';
/**
 * DashboardPage — Main analytics dashboard organism
 *
 * @level Organism
 * @composition StatCards + Active Projects + AI Summary section
 */

import React, { useState } from 'react';
import {
  CheckSquare, Clock, FileText, CheckCircle2,
  FolderOpen, CalendarDays, Sparkles, Loader2,
  TrendingUp, AlertTriangle, Building2
} from 'lucide-react';
import StatCard from '../molecules/StatCard';
import Badge from '../atoms/Badge';
import type { Task, Project, Employee, Page, ProjectStatus } from '@/src/types';
import { getBusinessPeriod } from '@/src/lib/dateUtils';

interface DashboardPageProps {
  currentUser: Employee;
  tasks: Task[];
  projects: Project[];
  onNavigateToTasks: (status?: string, month?: string) => void;
  onNavigateToProject: (project: Project) => void;
  navigateTo: (page: Page) => void;
}

export default function DashboardPage({
  currentUser,
  tasks,
  projects,
  onNavigateToTasks,
  onNavigateToProject,
}: DashboardPageProps) {
  const [dashboardMonth, setDashboardMonth] = useState('all');
  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const scopeLabel = isAdmin ? 'perusahaan' : isManager ? `divisi ${currentUser.division}` : 'Anda';

  /* Filter tasks to relevant scope */
  const filtered = tasks.filter((t) => {
    const matchMonth =
      dashboardMonth === 'all' ||
      (t.date && getBusinessPeriod(t.date)?.monthValue === dashboardMonth);
    return matchMonth;
  });

  /* Project analytics */
  const activeProjects = projects.map((proj) => {
    const tasksInProj = filtered.filter((t) => t.project === proj.name);
    const completedTasks = tasksInProj.filter((t) => t.status === 'Approved').length;
    const totalTasks = tasksInProj.length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const assigneeStats: Record<string, { name: string; completed: number; total: number }> = {};
    tasksInProj.forEach((t) => {
      if (!assigneeStats[t.assignee]) assigneeStats[t.assignee] = { name: t.assignee, completed: 0, total: 0 };
      assigneeStats[t.assignee].total += 1;
      if (t.status === 'Approved') assigneeStats[t.assignee].completed += 1;
    });
    const sorted = Object.values(assigneeStats).sort((a, b) => b.completed - a.completed);
    const topAchiever = sorted.length > 0 && sorted[0].completed > 0 ? sorted[0] : null;
    const bottomAchiever = sorted.length > 1 && topAchiever && sorted[sorted.length - 1].completed < topAchiever.completed ? sorted[sorted.length - 1] : null;

    return { ...proj, tasksInProj, completedTasks, totalTasks, progress, topAchiever, bottomAchiever };
  }).filter((p) => {
    if (dashboardMonth === 'all') return true;
    const startM = p.startDate ? getBusinessPeriod(p.startDate)?.monthValue : undefined;
    const endM = p.endDate ? getBusinessPeriod(p.endDate)?.monthValue : startM;
    return startM === dashboardMonth || endM === dashboardMonth || p.tasksInProj.length > 0;
  });

  const generateSummary = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    const active = filtered.filter((t) => t.status === 'To Do' || t.status === 'In Progress');
    if (active.length === 0) {
      setAiSummary('Tidak ada tugas aktif saat ini. Seluruh pekerjaan dalam periode ini telah diselesaikan dengan baik. Pertahankan semangat dan konsistensi ini!');
    } else {
      setAiSummary(`Terdapat ${active.length} tugas aktif di ${scopeLabel} yang memerlukan perhatian. Pastikan setiap tugas memiliki progress yang terukur dan deadline terpantau dengan baik. Fokus pada prioritas tinggi terlebih dahulu untuk menjaga produktivitas tim.`);
    }
    setIsGenerating(false);
  };

  const months = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  return (
    <div className="animate-fade-in-up">
      {/* Header row */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Selamat datang, {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ringkasan analitik aktivitas {scopeLabel}.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-slate-200/60 shadow-sm">
          <CalendarDays size={16} className="text-[#D2001A]" />
          <select
            value={dashboardMonth}
            onChange={(e) => setDashboardMonth(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-[#D2001A] focus:ring-0 outline-none cursor-pointer"
          >
            <option value="all">Semua Periode</option>
            {months.slice(1).map((m, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Tugas"
          value={filtered.length}
          icon={<CheckSquare size={22} />}
          color="red"
          onClick={() => onNavigateToTasks('all', dashboardMonth)}
        />
        <StatCard
          title="Belum Dikerjakan"
          value={filtered.filter((t) => t.status === 'To Do').length}
          icon={<Clock size={22} />}
          color="yellow"
          onClick={() => onNavigateToTasks('To Do', dashboardMonth)}
        />
        <StatCard
          title="Sedang Dikerjakan"
          value={filtered.filter((t) => t.status === 'In Progress').length}
          icon={<FileText size={22} />}
          color="red"
          onClick={() => onNavigateToTasks('In Progress', dashboardMonth)}
        />
        <StatCard
          title="Tugas Selesai"
          value={filtered.filter((t) => t.status === 'Approved').length}
          icon={<CheckCircle2 size={22} />}
          color="green"
          onClick={() => onNavigateToTasks('Completed', dashboardMonth)}
        />
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FolderOpen size={18} className="text-slate-500" />
            Project / Event Aktif
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onNavigateToProject(proj)}
                className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm cursor-pointer group hover:border-[#D2001A]/30 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(210,0,26,0.15)] transition-all duration-250"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 line-clamp-2 pr-2 group-hover:text-[#D2001A] transition-colors" title={proj.name}>
                    {proj.name}
                  </h3>
                  <Badge variant={proj.status as ProjectStatus} size="xs">{proj.status}</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-5">
                  <Building2 size={12} />
                  <span className="truncate">{proj.client}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600">Progres ({proj.completedTasks}/{proj.totalTasks})</span>
                    <span className="font-bold text-slate-400">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3">
                    <div className={`h-1.5 rounded-full transition-all ${proj.progress === 100 ? 'bg-emerald-500' : 'bg-[#D2001A]'}`} style={{ width: `${proj.progress}%` }} />
                  </div>
                  {!!(proj.topAchiever || proj.bottomAchiever) && currentUser.role !== 'Karyawan' && (
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      {proj.topAchiever && (
                        <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2">
                          <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"><TrendingUp size={9} /> Top</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{proj.topAchiever.name}</p>
                          <p className="text-[10px] text-slate-600">{proj.topAchiever.completed} selesai</p>
                        </div>
                      )}
                      {proj.bottomAchiever && (
                        <div className="flex-1 bg-orange-500/5 border border-orange-500/20 rounded-lg p-2 text-right">
                          <p className="text-[9px] text-orange-400 font-bold flex items-center justify-end gap-1"><AlertTriangle size={9} /> Perlu Push</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{proj.bottomAchiever.name}</p>
                          <p className="text-[10px] text-slate-600">{proj.bottomAchiever.completed} selesai</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      <div className="bg-[#D2001A]/5 rounded-xl p-6 border border-[#D2001A]/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <Sparkles size={18} className="text-[#D2001A]" />
            Analisis AI: Beban Kerja
          </h2>
          <button
            onClick={generateSummary}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-[#D2001A]/10 hover:bg-[#D2001A]/20 border border-[#D2001A]/30 px-3 py-1.5 text-xs font-bold text-[#D2001A] transition-all"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiSummary ? 'Perbarui' : 'Buat Ringkasan AI'}
          </button>
        </div>
        {aiSummary ? (
          <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-4">
            Klik tombol di atas untuk mendapatkan analisis beban kerja dari AI.
          </p>
        )}
      </div>
    </div>
  );
}
