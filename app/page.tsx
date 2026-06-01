'use client';
/**
 * app/page.tsx — Root application page (LOCO 21 PRO)
 *
 * This is the single-page app shell. All state lives here,
 * delegated to page-level organisms and modals.
 *
 * Architecture: Page → Template → Organisms → Molecules → Atoms
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import AppLayout from '@/src/components/templates/AppLayout';
import DashboardPage from '@/src/components/organisms/DashboardPage';
import TasksPage from '@/src/components/organisms/TasksPage';
import ProjectsPage from '@/src/components/organisms/ProjectsPage';
import KPIPage from '@/src/components/organisms/KPIPage';
import CalendarPage from '@/src/components/organisms/CalendarPage';
import EmployeesPage from '@/src/components/organisms/EmployeesPage';
import {
  TaskModal, ResultModal, RevisionModal, ProjectModal,
  EmployeeAddModal, EmployeeEditModal, EmployeeDeleteModal, EmployeeViewModal,
} from '@/src/components/organisms/AppModals';
import { api } from '@/src/lib/api';
import type {
  Employee, Project, Task, Page, Notification,
  NewTaskForm, NewProjectForm, NewEmployeeForm, ResultSubmission,
} from '@/src/types';

// ─── Default form states ───────────────────────────────────────
const defaultNewTask = (): NewTaskForm => ({
  division: 'Operation',
  assignee: '',
  project: '',
  title: '',
  description: '',
  taskType: 'Core',
  partner: '',
  date: '',
  fileName: '',
  revisionCount: 0,
  completedAt: null,
  resultLink: '',
  resultFile: '',
  approvedBy: [],
});

const defaultNewEmployee = (): NewEmployeeForm => ({
  name: '',
  email: '',
  phone: '',
  division: 'Operation',
  jobTitle: '',
  role: 'Karyawan',
  birthDate: '',
});

const defaultNewProject = (): NewProjectForm => ({
  name: '',
  client: '',
  startDate: '',
  endDate: '',
  venue: '',
  status: 'Fix',
  projectOfficer: '',
});

// ─── Login Screen ──────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (user: Employee) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const employees = await api.employees.getAll();
      const found = employees.find((emp) => emp.email === email && emp.password === password);
      if (found) {
        // Blokir login jika akun belum diverifikasi
        if (found.status === 'Menunggu') {
          setError('Akun Anda belum aktif. Silakan lakukan verifikasi melalui link yang dikirimkan ke email Anda terlebih dahulu.');
        } else {
          api.auth.save(email, true);
          onLogin(found);
        }
      } else {
        setError('Email atau password tidak sesuai.');
      }
    } catch {
      setError('Gagal menghubungi server. Pastikan koneksi aktif.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Glow backdrop */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D2001A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#D2001A] rounded-2xl shadow-[0_0_30px_rgba(210,0,26,0.5)] mb-4">
            <span className="text-2xl font-black text-white">L</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">LOCO 21 <span className="text-[#D2001A]">PRO</span></h1>
          <p className="text-slate-600 text-sm mt-2">Sistem Manajemen Tugas Internal</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-2xl">
          <h2 className="text-xl font-black text-slate-800 mb-6">Masuk ke Akun</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm p-3 rounded-xl mb-5">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-light w-full py-3 px-4 text-sm"
                placeholder="email@pt-anda.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-light w-full py-3 px-4 pr-10 text-sm"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-white bg-[#D2001A] hover:bg-[#b00015] transition-all shadow-[0_0_16px_rgba(210,0,26,0.35)] hover:shadow-[0_0_24px_rgba(210,0,26,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-6">Password default: <span className="text-slate-700 font-mono">password123</span></p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  // Core data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Navigation
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Task filters (for cross-page navigation)
  const [taskInitialStatus, setTaskInitialStatus] = useState('all');
  const [taskInitialMonth, setTaskInitialMonth] = useState('all');
  const [taskInitialSearch, setTaskInitialSearch] = useState('');

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskForm>(defaultNewTask());
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Result modal
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [resultSubmission, setResultSubmission] = useState<ResultSubmission>({ type: 'link', value: '', fileName: '' });

  // Revision modal
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [taskToRevise, setTaskToRevise] = useState<Task | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Project modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<NewProjectForm>(defaultNewProject());

  // Employee modals
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<NewEmployeeForm>(defaultNewEmployee());
  const [addEmpError, setAddEmpError] = useState('');
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editEmpError, setEditEmpError] = useState('');
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  // ─── Bootstrap — load all data from MySQL in one request ────
  useEffect(() => {
    const savedEmail = api.auth.getEmail();
    const savedLoggedIn = api.auth.getLoggedIn();

    api.bootstrap()
      .then(({ employees: emps, projects: projs, tasks: tsks }) => {
        setEmployees(emps);
        setProjects(projs);
        setTasks(tsks);
        if (savedLoggedIn && savedEmail) {
          const user = emps.find((e) => e.email === savedEmail);
          if (user) { setCurrentUser(user); setIsLoggedIn(true); }
        }
      })
      .catch((err) => console.error('[Bootstrap]', err))
      .finally(() => setAppLoading(false));
  }, []);

  // ─── Navigation ──────────────────────────────────────────────
  const navigateTo = useCallback((page: Page) => {
    setPageHistory((h) => [...h, activePage]);
    setActivePage(page);
  }, [activePage]);

  const goBack = useCallback(() => {
    setPageHistory((h) => {
      const prev = [...h];
      const last = prev.pop() ?? 'dashboard';
      setActivePage(last);
      return prev;
    });
  }, []);

  const handleSidebarNav = useCallback((page: Page) => {
    setPageHistory([]);
    setActivePage(page);
    setSelectedProject(null);
    setTaskInitialStatus('all');
    setTaskInitialMonth('all');
    setTaskInitialSearch('');
  }, []);

  // ─── Notifications ───────────────────────────────────────────
  const notifications = React.useMemo<Notification[]>(() => {
    if (!currentUser) return [];
    const isAdmin = currentUser.role === 'Admin';
    const isManager = currentUser.role === 'Manager';
    const result: Notification[] = [];

    tasks.forEach((t) => {
      // Notify assignee about revisions
      if (t.status === 'Revisi' && t.assignee === currentUser.name) {
        result.push({ id: `rev-${t.id}`, taskId: t.id, type: 'revision', title: `Revisi: ${t.title}`, message: t.revisionNotes, bgColor: '' });
      }
      // Notify about tasks waiting for approval
      if (t.status === 'Done') {
        const partnerHasApproved = t.taskType === 'Support' && t.approvedBy?.includes(t.partner);
        if (isAdmin) {
          result.push({ id: `appv-${t.id}`, taskId: t.id, type: 'need_approval', title: `Menunggu Appv: ${t.title}`, message: `Assignee: ${t.assignee} | Divisi: ${t.division}`, bgColor: '' });
        } else if (t.taskType === 'Support' && currentUser.name === t.partner && !partnerHasApproved) {
          result.push({ id: `support-${t.id}`, taskId: t.id, type: 'need_approval', title: `Approval Diminta: ${t.title}`, message: `${t.assignee} menyelesaikan task support Anda.`, bgColor: '' });
        } else if (isManager) {
          const assigneeEmp = employees.find((e) => e.name === t.assignee);
          if (assigneeEmp?.division === currentUser.division && !t.approvedBy?.includes(currentUser.division)) {
            result.push({ id: `mgr-${t.id}`, taskId: t.id, type: 'need_approval', title: `Approval: ${t.title}`, message: `${t.assignee} menyelesaikan tugas ini.`, bgColor: '' });
          }
        }
      }
    });

    return result.slice(0, 10);
  }, [tasks, currentUser, employees]);

  // ─── Scoped tasks for current user ───────────────────────────
  const scopedTasks = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return tasks;
    if (currentUser.role === 'Manager') return tasks.filter((t) => t.division === currentUser.division || t.partner !== '' && employees.find((e) => e.name === t.partner)?.division === currentUser.division);
    return tasks.filter((t) => t.assignee === currentUser.name || t.partner === currentUser.name);
  }, [tasks, currentUser, employees]);

  // ─── Task Handlers ────────────────────────────────────────────
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.tasks.create(newTask);
      setTasks((prev) => [created, ...prev]);
      setIsTaskModalOpen(false);
      setNewTask(defaultNewTask());
    } catch (err: any) {
      console.error('[handleAddTask]', err);
      alert(err?.response?.data?.message ?? 'Gagal membuat tugas.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (newStatus === 'Done') {
      const task = tasks.find((t) => t.id === taskId);
      if (task) { setTaskToComplete(task); setIsResultModalOpen(true); return; }
    }
    try {
      const updated = await api.tasks.update(taskId, { status: newStatus as Task['status'] });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch (err) {
      console.error('[handleStatusChange]', err);
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToComplete) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const updated = await api.tasks.update(taskToComplete.id, {
        status: 'Done',
        completedAt: today,
        resultLink: resultSubmission.type === 'link' ? resultSubmission.value : '',
        resultFile: resultSubmission.type === 'file' ? resultSubmission.fileName : '',
      });
      setTasks((prev) => prev.map((t) => t.id === taskToComplete.id ? updated : t));
      setIsResultModalOpen(false);
      setTaskToComplete(null);
      setResultSubmission({ type: 'link', value: '', fileName: '' });
    } catch (err) {
      console.error('[handleSubmitResult]', err);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    if (!currentUser) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newApprovedBy = [...(task.approvedBy ?? []), currentUser.name, currentUser.division];
    const isAdmin = currentUser.role === 'Admin';

    let finalStatus: Task['status'] = task.status;
    if (isAdmin) { finalStatus = 'Approved'; }
    else if (task.taskType === 'Support') {
      const partnerEmp = employees.find((e) => e.name === task.partner);
      const partnerMgrApproved = newApprovedBy.includes(partnerEmp?.division ?? '');
      if (partnerMgrApproved) finalStatus = 'Approved';
    } else if (task.taskType === 'Colaboration') {
      const assigneeEmp = employees.find((e) => e.name === task.assignee);
      const partnerEmp = employees.find((e) => e.name === task.partner);
      if (newApprovedBy.includes(assigneeEmp?.division ?? '') && newApprovedBy.includes(partnerEmp?.division ?? '')) finalStatus = 'Approved';
    } else {
      finalStatus = 'Approved';
    }

    try {
      const updated = await api.tasks.update(taskId, { status: finalStatus, approvedBy: newApprovedBy });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch (err) {
      console.error('[handleApproveTask]', err);
    }
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToRevise) return;
    try {
      const updated = await api.tasks.update(taskToRevise.id, {
        status: 'Revisi',
        revisionCount: taskToRevise.revisionCount + 1,
        revisionNotes,
      });
      setTasks((prev) => prev.map((t) => t.id === taskToRevise.id ? updated : t));
      setIsRevisionModalOpen(false);
      setTaskToRevise(null);
      setRevisionNotes('');
    } catch (err) {
      console.error('[handleRevise]', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.tasks.remove(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('[handleDeleteTask]', err);
    }
  };

  const generateAIDescription = async () => {
    if (!newTask.title) return;
    setIsGeneratingAI(true);
    await new Promise((r) => setTimeout(r, 1500));
    setNewTask((prev) => ({
      ...prev,
      description: `Berdasarkan judul "${prev.title}", tugas ini mencakup kegiatan perencanaan, eksekusi, dan evaluasi yang terstruktur. Pastikan semua output terdokumentasi dengan baik dan sesuai dengan standar yang berlaku di ${prev.division}.`,
    }));
    setIsGeneratingAI(false);
  };

  // ─── Project Handlers ─────────────────────────────────────────
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.projects.create(newProject);
      setProjects((prev) => [created, ...prev]);
      setIsProjectModalOpen(false);
      setNewProject(defaultNewProject());
    } catch (err: any) {
      console.error('[handleAddProject]', err);
      alert(err?.response?.data?.message ?? 'Gagal menambah proyek.');
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject) return;
    try {
      const updated = await api.projects.update(editProject.id, editProject);
      setProjects((prev) => prev.map((p) => p.id === editProject.id ? updated : p));
      setEditProject(null);
    } catch (err: any) {
      console.error('[handleUpdateProject]', err);
      alert(err?.response?.data?.message ?? 'Gagal mengupdate proyek.');
    }
  };

  // ─── Employee Handlers ─────────────────────────────────────────
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.employees.create({
        ...newEmployee,
        address: '',
        password: 'password123',
      });
      setEmployees((prev) => [...prev, created]);
      setIsAddEmpModalOpen(false);
      setNewEmployee(defaultNewEmployee());
      setAddEmpError('');
    } catch (err: any) {
      console.error('[handleAddEmployee]', err);
      setAddEmpError(err?.response?.data?.message ?? 'Gagal menambah karyawan.');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    try {
      const updated = await api.employees.update(editEmployee.id, editEmployee);
      setEmployees((prev) => prev.map((e) => e.id === editEmployee.id ? updated : e));
      setEditEmployee(null);
      setEditEmpError('');
    } catch (err: any) {
      console.error('[handleUpdateEmployee]', err);
      setEditEmpError(err?.response?.data?.message ?? 'Gagal mengupdate karyawan.');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteEmployee) return;
    try {
      await api.employees.remove(deleteEmployee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deleteEmployee.id));
      setDeleteEmployee(null);
    } catch (err) {
      console.error('[handleDeleteEmployee]', err);
    }
  };

  const handleSimulateEmail = async (emp: Employee) => {
    // Mengambil link verifikasi baru dari API dan menyalinnya ke clipboard
    // (menggantikan fungsi lama yang langsung mengaktifkan karyawan)
    try {
      // Coba ambil link dari API — atau buat langsung di sisi klien
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      // Panggil endpoint untuk resend / ambil link verifikasi aktif
      const res = await fetch(`/api/auth/verify-link?id=${emp.id}`);
      if (res.ok) {
        const { verificationLink } = await res.json();
        try {
          await navigator.clipboard.writeText(verificationLink);
          alert(`✅ Link verifikasi berhasil disalin ke clipboard!\n\n${verificationLink}\n\nBagikan link ini kepada ${emp.name} untuk melakukan aktivasi akun.`);
        } catch {
          // Fallback jika clipboard API tidak tersedia
          alert(`🔗 Link Verifikasi untuk ${emp.name}:\n\n${verificationLink}\n\nSalin link di atas dan bagikan kepada karyawan.`);
        }
      } else {
        const data = await res.json();
        alert(`⚠️ ${data.message ?? 'Token verifikasi tidak ditemukan atau sudah tidak aktif. Coba tambahkan ulang karyawan.'}`);
      }
    } catch (err) {
      console.error('[handleSimulateEmail]', err);
      alert('Gagal mengambil link verifikasi. Periksa koneksi server.');
    }
  };

  // ─── Calendar / Notification cross-nav ────────────────────────
  const handleCalendarViewTask = (searchValue: string) => {
    setTaskInitialSearch(searchValue);
    setTaskInitialStatus('all');
    setTaskInitialMonth('all');
    navigateTo('tasks');
  };

  const handleCalendarViewProject = (proj: Project) => {
    setSelectedProject(proj);
    navigateTo('projectDetail');
  };

  const handleNotificationClick = (taskId: string) => {
    setTaskInitialSearch(taskId);
    setTaskInitialStatus('all');
    setTaskInitialMonth('all');
    handleSidebarNav('tasks');
  };

  // ─── Loading state ─────────────────────────────────────────────
  if (appLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[#D2001A] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(210,0,26,0.5)] animate-pulse">
            <span className="text-xl font-black text-white">L</span>
          </div>
          <Loader2 size={20} className="text-[#D2001A] animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); setIsLoggedIn(true); }} />;
  }

  const isAdmin = currentUser.role === 'Admin';

  // ─── Render active page content ───────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            currentUser={currentUser}
            tasks={scopedTasks}
            projects={projects}
            onNavigateToTasks={(status, month) => {
              setTaskInitialStatus(status ?? 'all');
              setTaskInitialMonth(month ?? 'all');
              setTaskInitialSearch('');
              navigateTo('tasks');
            }}
            onNavigateToProject={(proj) => { setSelectedProject(proj); navigateTo('projectDetail'); }}
            navigateTo={navigateTo}
          />
        );
      case 'tasks':
        return (
          <TasksPage
            tasks={scopedTasks}
            projects={projects}
            employees={employees}
            currentUser={currentUser}
            initialStatusFilter={taskInitialStatus}
            initialMonthFilter={taskInitialMonth}
            initialSearch={taskInitialSearch}
            onAddTask={() => {
              const task = defaultNewTask();
              if (!isAdmin) {
                task.assignee = currentUser.name;
                task.division = currentUser.division;
              }
              setNewTask(task);
              setIsTaskModalOpen(true);
            }}
            onAddImprovement={() => {
              const task = defaultNewTask();
              task.taskType = 'Improvement';
              task.assignee = currentUser.name;
              task.division = currentUser.division;
              setNewTask(task);
              setIsTaskModalOpen(true);
            }}
            onStatusChange={handleStatusChange}
            onApprove={handleApproveTask}
            onRevise={(task) => { setTaskToRevise(task); setIsRevisionModalOpen(true); }}
            onDelete={handleDeleteTask}
          />
        );
      case 'projects':
        return (
          <ProjectsPage
            projects={projects}
            tasks={tasks}
            currentUser={currentUser}
            onAddProject={() => setIsProjectModalOpen(true)}
            onEditProject={(p) => setEditProject(p)}
            onViewProject={(p) => { setSelectedProject(p); navigateTo('projectDetail'); }}
          />
        );
      case 'projectDetail':
        if (!selectedProject) { handleSidebarNav('dashboard'); return null; }
        return (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-white mb-1">{selectedProject.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="font-medium text-blue-400">Klien: {selectedProject.client || 'Internal'}</span>
                <span>•</span>
                <span>PO: {selectedProject.projectOfficer}</span>
                <span>•</span>
                <span>{selectedProject.startDate} s/d {selectedProject.endDate}</span>
              </div>
            </div>
            <div className="glass-card rounded-xl border border-white/[0.05] p-4 sm:p-6">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] border-b border-white/[0.05]">
                    <tr>
                      <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase">Nama Tugas</th>
                      <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase">Penerima</th>
                      <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase">Status</th>
                      <th className="py-3 px-4 text-xs text-slate-600 font-bold uppercase">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {tasks.filter((t) => t.project === selectedProject.name).map((task) => (
                      <tr key={task.id}
                        onClick={() => { setTaskInitialSearch(task.id); setTaskInitialStatus('all'); setTaskInitialMonth('all'); navigateTo('tasks'); }}
                        className="hover:bg-white/[0.02] cursor-pointer transition-colors group">
                        <td className="py-4 px-4 font-medium text-slate-300 group-hover:text-blue-400 transition-colors">{task.title}</td>
                        <td className="py-4 px-4 text-slate-500">{task.assignee}</td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.status === 'Approved' ? 'badge-approved' : task.status === 'Done' ? 'badge-done' : 'badge-todo'}`}>{task.status}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-xs">{task.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'calendarTask':
        return (
          <CalendarPage
            mode="task"
            tasks={scopedTasks}
            projects={projects}
            employees={employees}
            currentUser={currentUser}
            onViewTask={handleCalendarViewTask}
            onViewProject={handleCalendarViewProject}
          />
        );
      case 'calendarProject':
        return (
          <CalendarPage
            mode="project"
            tasks={scopedTasks}
            projects={projects}
            employees={employees}
            currentUser={currentUser}
            onViewTask={handleCalendarViewTask}
            onViewProject={handleCalendarViewProject}
          />
        );
      case 'kpi':
        return <KPIPage employees={employees} tasks={tasks} currentUser={currentUser} />;
      case 'employees':
        if (!isAdmin) { handleSidebarNav('dashboard'); return null; }
        return (
          <EmployeesPage
            employees={employees}
            onAdd={() => setIsAddEmpModalOpen(true)}
            onView={(e) => setViewEmployee(e)}
            onEdit={(e) => setEditEmployee(e)}
            onDelete={(e) => setDeleteEmployee(e)}
            onSimulateEmail={handleSimulateEmail}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AppLayout
        currentUser={currentUser}
        activePage={activePage}
        pageHistory={pageHistory}
        notifications={notifications}
        onNavigate={handleSidebarNav}
        onBack={goBack}
        onLogout={() => { api.auth.clear(); setIsLoggedIn(false); setCurrentUser(null); }}
        onNotificationClick={handleNotificationClick}
      >
        {renderPage()}
      </AppLayout>

      {/* ─── All Modals ─── */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={newTask}
        employees={employees}
        projects={projects}
        currentUser={currentUser}
        isGeneratingAI={isGeneratingAI}
        onClose={() => setIsTaskModalOpen(false)}
        onChange={(updates) => setNewTask((prev) => ({ ...prev, ...updates }))}
        onSubmit={handleAddTask}
        onGenerateAI={generateAIDescription}
      />

      <ResultModal
        isOpen={isResultModalOpen}
        task={taskToComplete}
        submission={resultSubmission}
        onClose={() => { setIsResultModalOpen(false); setTaskToComplete(null); }}
        onChange={(updates) => setResultSubmission((prev) => ({ ...prev, ...updates }))}
        onFileChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setResultSubmission((prev) => ({ ...prev, fileName: file.name, value: '' }));
        }}
        onSubmit={handleSubmitResult}
      />

      <RevisionModal
        isOpen={isRevisionModalOpen}
        task={taskToRevise}
        notes={revisionNotes}
        onClose={() => { setIsRevisionModalOpen(false); setTaskToRevise(null); }}
        onNotesChange={setRevisionNotes}
        onSubmit={handleRevise}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        mode="add"
        project={newProject}
        employees={employees}
        onClose={() => setIsProjectModalOpen(false)}
        onChange={(updates) => setNewProject((prev) => ({ ...prev, ...updates }))}
        onSubmit={handleAddProject}
      />

      {editProject && (
        <ProjectModal
          isOpen
          mode="edit"
          project={editProject}
          employees={employees}
          onClose={() => setEditProject(null)}
          onChange={(updates) => setEditProject((prev) => prev ? { ...prev, ...updates } : null)}
          onSubmit={handleUpdateProject}
        />
      )}

      <EmployeeAddModal
        isOpen={isAddEmpModalOpen}
        employee={newEmployee}
        error={addEmpError}
        onClose={() => { setIsAddEmpModalOpen(false); setAddEmpError(''); }}
        onChange={(updates) => setNewEmployee((prev) => ({ ...prev, ...updates }))}
        onSubmit={handleAddEmployee}
      />

      <EmployeeEditModal
        isOpen={!!editEmployee}
        employee={editEmployee}
        error={editEmpError}
        onClose={() => { setEditEmployee(null); setEditEmpError(''); }}
        onChange={(updates) => setEditEmployee((prev) => prev ? { ...prev, ...updates } : null)}
        onSubmit={handleUpdateEmployee}
      />

      <EmployeeDeleteModal
        employee={deleteEmployee}
        onClose={() => setDeleteEmployee(null)}
        onConfirm={handleDeleteEmployee}
      />

      <EmployeeViewModal
        employee={viewEmployee}
        onClose={() => setViewEmployee(null)}
      />
    </>
  );
}
