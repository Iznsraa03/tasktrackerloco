'use client';
/**
 * TasksPage — Full task management list organism
 *
 * @level Organism
 * @composition Filters + Table + Action buttons
 */

import React, { useState } from 'react';
import { Plus, Search, Filter, X, Trash2, Sparkles, ExternalLink } from 'lucide-react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import type { Task, Project, Employee, TaskStatus } from '@/src/types';

interface TasksPageProps {
  tasks: Task[];
  projects: Project[];
  employees: Employee[];
  currentUser: Employee;
  initialStatusFilter?: string;
  initialMonthFilter?: string;
  initialSearch?: string;
  onAddTask: () => void;
  onAddImprovement: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onApprove: (taskId: string) => void;
  onRevise: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TasksPage({
  tasks,
  projects,
  employees,
  currentUser,
  initialStatusFilter = 'all',
  initialMonthFilter = 'all',
  initialSearch = '',
  onAddTask,
  onAddImprovement,
  onStatusChange,
  onApprove,
  onRevise,
  onDelete,
}: TasksPageProps) {
  const [filterMonth, setFilterMonth] = useState(initialMonthFilter);
  const [filterName, setFilterName] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);
  const [search, setSearch] = useState(initialSearch);

  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isKaryawan = currentUser.role === 'Karyawan';
  const taskMenuLabel = isAdmin ? 'Semua Tugas' : isManager ? 'Tugas Divisi' : 'Tugas Saya';

  const filterEmployees = employees
    .filter((e) => e.status === 'Aktif' && (isAdmin ? true : e.division === currentUser.division))
    .map((e) => e.name).sort();

  const displayed = tasks.filter((t) => {
    const taskMonth = t.date ? t.date.substring(5, 7) : '';
    const matchMonth = filterMonth === 'all' || taskMonth === filterMonth;
    const matchName = filterName === 'all' || t.assignee === filterName || t.partner === filterName;
    const matchProject = filterProject === 'all' || t.project === filterProject;
    const matchStatus =
      filterStatus === 'all' ||
      t.status === filterStatus ||
      (filterStatus === 'Completed' && (t.status === 'Done' || t.status === 'Approved'));
    const matchSearch = !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search);
    return matchMonth && matchName && matchProject && matchStatus && matchSearch;
  });

  const months = [['01','Januari'],['02','Februari'],['03','Maret'],['04','April'],['05','Mei'],['06','Juni'],['07','Juli'],['08','Agustus'],['09','September'],['10','Oktober'],['11','November'],['12','Desember']];

  const getStatusLabel = (task: Task): string => {
    if (task.status !== 'Done') return task.status;
    if (task.taskType === 'Support') {
      if (!task.approvedBy?.includes(task.partner)) return 'Menunggu Pemohon';
      return 'Menunggu Manager';
    }
    return 'Menunggu Appv';
  };

  const canActOnTask = (task: Task): { canApprove: boolean; canRevisi: boolean; canDelete: boolean } => {
    const assigneeEmp = employees.find((e) => e.name === task.assignee);
    const partnerEmp = employees.find((e) => e.name === task.partner);
    const isAssigneeManager = isManager && assigneeEmp?.division === currentUser.division;
    const isPartnerManager = isManager && partnerEmp?.division === currentUser.division;
    const isSupport = task.taskType === 'Support';
    const partnerHasApproved = isSupport ? task.approvedBy?.includes(task.partner) : false;

    let canApprove = false;
    let canRevisi = false;

    if (task.status === 'Done') {
      if (isAdmin) { canApprove = true; canRevisi = true; }
      else if (isSupport) {
        if (currentUser.name === task.partner && !partnerHasApproved) { canApprove = true; canRevisi = true; }
        else if (isPartnerManager && partnerHasApproved && !task.approvedBy?.includes(partnerEmp?.division ?? '')) { canApprove = true; canRevisi = true; }
      } else if (task.taskType === 'Colaboration' && partnerEmp && assigneeEmp?.division !== partnerEmp?.division) {
        if ((isAssigneeManager || isPartnerManager) && !task.approvedBy?.includes(currentUser.division)) { canApprove = true; canRevisi = true; }
      } else {
        if (isAssigneeManager && !task.approvedBy?.includes(currentUser.division)) { canApprove = true; canRevisi = true; }
      }
    }
    const canDelete = isAdmin || isAssigneeManager || isPartnerManager;
    return { canApprove, canRevisi, canDelete };
  };

  const selectClass = 'input-light w-full py-2 text-sm px-3';

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{taskMenuLabel}</h1>
          <p className="text-sm text-slate-500 mt-1">{displayed.length} tugas ditampilkan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Sparkles size={14} className="text-[#D2001A]" />} onClick={onAddImprovement}>
            Ide Improvement
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onAddTask}>
            Buat Tugas
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200/60 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={13} />
            <input
              type="text"
              placeholder="Cari Task ID, Judul, Tanggal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-light w-full pl-9 pr-8 py-2 text-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#D2001A]">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 block">Bulan</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectClass}>
              <option value="all">Semua Bulan</option>
              {months.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 block">Nama</label>
            <select value={filterName} onChange={(e) => setFilterName(e.target.value)} disabled={isKaryawan} className={selectClass}>
              <option value="all">Semua Nama</option>
              {filterEmployees.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 block">Project</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={selectClass}>
              <option value="all">Semua Project</option>
              {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1.5 block">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
              <option value="all">Semua Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Revisi">Revisi</option>
              <option value="Completed">Selesai (Done & Appv)</option>
              <option value="Done">Menunggu Appv</option>
              <option value="Approved">Approved Saja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-5 py-4">Tugas & Project</th>
                <th className="px-5 py-4">Ditugaskan Ke</th>
                <th className="px-5 py-4">Tipe & Hasil</th>
                <th className="px-5 py-4">Deadline</th>
                <th className="px-5 py-4 text-center">Tepat Waktu</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((task) => {
                const { canApprove, canRevisi, canDelete } = canActOnTask(task);
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{task.id} • {task.project}</p>
                      {task.status === 'Revisi' && task.revisionNotes && (
                        <div className="mt-2 bg-orange-500/8 border border-orange-500/20 p-2 rounded-lg max-w-xs">
                          <p className="text-[10px] font-bold text-orange-400">Revisi: {task.revisionNotes}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800">{task.assignee}</span>
                      <p className="text-[10px] text-slate-600 mt-0.5 font-bold">{task.division}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={task.taskType} size="xs">{task.taskType}</Badge>
                      {task.partner && (
                        <p className="text-[10px] text-[#D2001A] mt-1">
                          {task.taskType === 'Support' ? 'Pemohon: ' : 'Partner: '}{task.partner}
                        </p>
                      )}
                      {task.resultLink && (
                        <a href={task.resultLink} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-500">
                          <ExternalLink size={10} /> Lihat Hasil
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{task.date}</td>
                    <td className="px-5 py-4 text-center">
                      {task.completedAt ? (
                        task.completedAt <= task.date
                          ? <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">Ya</span>
                          : <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold">Terlambat</span>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={task.status as TaskStatus} size="xs">{getStatusLabel(task)}</Badge>
                      {task.revisionCount > 0 && (
                        <span className="block mt-1.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded w-max">
                          {task.revisionCount}x Direvisi
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end items-center gap-1.5 flex-wrap">
                        {canApprove && (
                          <button onClick={() => onApprove(task.id)}
                            className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded-md transition-colors">
                            Approve
                          </button>
                        )}
                        {canRevisi && (
                          <button onClick={() => onRevise(task)}
                            className="text-[10px] font-bold text-white bg-orange-500 hover:bg-orange-400 px-2 py-1 rounded-md transition-colors">
                            Revisi
                          </button>
                        )}
                        <select
                          value={task.status}
                          onChange={(e) => onStatusChange(task.id, e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-md p-1 text-slate-700 cursor-pointer"
                          disabled={task.status === 'Approved' || (currentUser.name !== task.assignee && currentUser.name !== task.partner && !isAdmin && !isManager)}
                        >
                          {task.status === 'Revisi' && <option value="Revisi">Revisi</option>}
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                          {task.status === 'Approved' && <option value="Approved">Approved</option>}
                        </select>
                        {canDelete && (
                          <button
                            onClick={() => { if (confirm('Hapus tugas ini?')) onDelete(task.id); }}
                            className="p-1 text-slate-600 hover:text-[#D2001A] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayed.length === 0 && (
            <div className="p-10 text-center">
              <Search size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-600 font-medium">Tidak ada tugas yang sesuai filter.</p>
              <button
                onClick={() => { setSearch(''); setFilterMonth('all'); setFilterStatus('all'); setFilterProject('all'); setFilterName('all'); }}
                className="mt-3 text-sm text-[#D2001A] hover:underline"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
