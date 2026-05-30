'use client';
/**
 * KPIPage — KPI scorecard for all/scoped employees
 *
 * @level Organism
 */

import React, { useState } from 'react';
import { UserCircle } from 'lucide-react';
import { calculateKPI } from '@/src/lib/kpi';
import type { Employee, Task } from '@/src/types';

interface KPIPageProps {
  employees: Employee[];
  tasks: Task[];
  currentUser: Employee;
}

interface KPIBarProps { label: string; value: number; weight: string; color: string; detail: string }

function KPIBar({ label, value, weight, color, detail }: KPIBarProps) {
  return (
    <div className={`${color} border rounded-xl p-4 flex flex-col justify-between shadow-sm`}>
      <div>
        <p className="text-xs font-bold mb-1 opacity-80">{label}</p>
        <p className="text-2xl font-black">{value.toFixed(1)}</p>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200/50">
        <p className="text-[10px] font-bold opacity-70">{weight}</p>
        <p className="text-[9px] opacity-60 mt-0.5 leading-tight">{detail}</p>
      </div>
    </div>
  );
}

export default function KPIPage({ employees, tasks, currentUser }: KPIPageProps) {
  const [kpiMonth, setKpiMonth] = useState('all');
  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';

  const scopedEmployees = employees
    .filter((e) => e.status === 'Aktif')
    .filter((e) =>
      isAdmin ? true : isManager ? e.division === currentUser.division : e.email === currentUser.email
    );

  const months = [['04','April'],['05','Mei'],['06','Juni']];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Key Performance Indicator</h1>
          <p className="text-sm text-slate-600 mt-1">Evaluasi performa berdasarkan tugas yang disetujui (Approved).</p>
        </div>
        <select
          value={kpiMonth}
          onChange={(e) => setKpiMonth(e.target.value)}
          className="input-light border border-slate-200 px-4 py-2 text-sm w-full sm:w-auto"
        >
          <option value="all">Semua Periode</option>
          {months.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>

      <div className="space-y-6">
        {scopedEmployees.map((emp) => {
          const kpi = calculateKPI(emp, tasks, kpiMonth);
          const scoreColor = kpi.kpiScore >= 8 ? 'text-emerald-600' : kpi.kpiScore >= 6 ? 'text-[#D2001A]' : kpi.kpiScore >= 4 ? 'text-yellow-600' : 'text-orange-600';
          return (
            <div key={emp.id} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:border-[#D2001A]/30 hover:shadow-md transition-all duration-250">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <UserCircle size={40} className="text-slate-400 shrink-0" />
                  <div>
                    <h2 className="text-lg font-black text-slate-800">{emp.name}</h2>
                    <p className="text-sm text-slate-600">{emp.jobTitle} — {emp.division}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-3xl font-black ${scoreColor}`}>
                    {kpi.kpiScore.toFixed(2)}
                    <span className="text-sm text-slate-400">/10</span>
                  </p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Total Score</p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KPIBar
                  label="Productivity"
                  value={kpi.productivityScore}
                  weight="Bobot 40%"
                  color="bg-[#D2001A]/5 border-[#D2001A]/20 text-[#D2001A]"
                  detail={`${kpi.taskCompleted} dari ${kpi.totalTask} disetujui`}
                />
                <KPIBar
                  label="Quality"
                  value={kpi.qualityScore}
                  weight="Bobot 20%"
                  color="bg-purple-500/10 border-purple-500/20 text-purple-600"
                  detail={`Total ${kpi.totalRevision} catatan revisi`}
                />
                <KPIBar
                  label="Discipline"
                  value={kpi.disciplineScore}
                  weight="Bobot 30%"
                  color="bg-teal-500/10 border-teal-500/20 text-teal-600"
                  detail={`${kpi.taskOnTime} tepat waktu dari ${kpi.taskCompleted} Appv`}
                />
                <KPIBar
                  label="Teamwork"
                  value={kpi.teamworkScore}
                  weight="Bobot 5%"
                  color="bg-orange-500/10 border-orange-500/20 text-orange-600"
                  detail={`${kpi.supportTask} dari ${kpi.totalSupportTask} disetujui`}
                />
                <KPIBar
                  label="Initiative"
                  value={kpi.initiativeScore}
                  weight="Bobot 5%"
                  color="bg-pink-500/10 border-pink-500/20 text-pink-600"
                  detail={`${kpi.improvementTask} dari ${kpi.totalImprovementTask} disetujui`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
