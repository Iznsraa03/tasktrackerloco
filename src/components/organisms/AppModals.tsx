'use client';
/**
 * AppModals — All dialog modals bundled for the app
 *
 * @level Organism
 * Handles: Task, Result, Revision, Project, Employee (Add/Edit/View/Delete)
 */

import React from 'react';
import { X, CheckCircle2, MessageSquareWarning, AlertTriangle, UploadCloud, UserCircle, Sparkles, Loader2 } from 'lucide-react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import type {
  Task, Employee, Project,
  NewTaskForm, NewProjectForm, NewEmployeeForm,
  ResultSubmission, Division, TaskType, ProjectStatus, EmployeeRole
} from '@/src/types';

// ─── Shared Modal Shell ────────────────────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="w-full my-8" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const inputClass = 'input-light border border-slate-200 w-full py-2.5 px-4 text-sm';
const selectClass = 'input-light border border-slate-200 w-full py-2.5 px-3 text-sm';

// ─── 1. Task Modal ─────────────────────────────────────────────
interface TaskModalProps {
  isOpen: boolean;
  task: NewTaskForm;
  employees: Employee[];
  projects: Project[];
  currentUser: Employee;
  isGeneratingAI: boolean;
  onClose: () => void;
  onChange: (updates: Partial<NewTaskForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateAI: () => void;
}

export function TaskModal({ isOpen, task, employees, projects, currentUser, isGeneratingAI, onClose, onChange, onSubmit, onGenerateAI }: TaskModalProps) {
  if (!isOpen) return null;
  const isAdmin = currentUser.role === 'Admin';
  const isKaryawan = currentUser.role === 'Karyawan';

  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-lg font-black text-slate-900">
            {isKaryawan && task.taskType === 'Improvement' ? 'Form Inisiatif Improvement' : 'Form Task Order Baru'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <FormField label="Tipe Tugas" required>
            <select
              required value={task.taskType}
              onChange={(e) => {
                const t = e.target.value as TaskType;
                let assignee = task.assignee, partner = task.partner, division = task.division;
                if (isKaryawan) {
                  if (t === 'Support') { assignee = ''; partner = currentUser.name; }
                  else { assignee = currentUser.name; partner = ''; division = currentUser.division; }
                }
                onChange({ taskType: t, assignee, partner, division });
              }}
              className={selectClass}
            >
              <option value="Core">Core Task (Tugas Utama Harian)</option>
              <option value="Support">Support (Request Bantuan)</option>
              <option value="Colaboration">Colaboration (Kerjasama Setara)</option>
              <option value="Improvement">Improvement (Inisiatif Perbaikan)</option>
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Divisi Tujuan" required>
              <select
                required value={task.division}
                disabled={!isAdmin && task.taskType !== 'Support'}
                onChange={(e) => onChange({ division: e.target.value as Division, assignee: '' })}
                className={selectClass}
              >
                {['Operation','Admin & Finance','Marketing','Creative & Program'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Ditugaskan Ke (PIC)" required>
              <select
                required value={task.assignee}
                disabled={isKaryawan && task.taskType !== 'Support'}
                onChange={(e) => onChange({ assignee: e.target.value })}
                className={selectClass}
              >
                <option value="" disabled>-- Pilih Karyawan --</option>
                {employees.filter((e) => e.status === 'Aktif' && e.division === task.division).map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </FormField>
          </div>

          {(task.taskType === 'Colaboration' || task.taskType === 'Support') && (
            <div className="bg-orange-500/5 border border-orange-500/15 p-4 rounded-xl">
              <FormField label={task.taskType === 'Support' ? 'Pemohon Bantuan (Requestor)' : 'Partner Kolaborasi'} required>
                <select
                  required value={task.partner}
                  disabled={isKaryawan && task.taskType === 'Support'}
                  onChange={(e) => onChange({ partner: e.target.value })}
                  className={selectClass}
                >
                  <option value="" disabled>-- Pilih --</option>
                  {employees.filter((e) => e.status === 'Aktif' && e.name !== task.assignee).map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </FormField>
            </div>
          )}

          <FormField label="Event / Project Terkait" required>
            <select required value={task.project} onChange={(e) => onChange({ project: e.target.value })} className={selectClass}>
              <option value="" disabled>-- Pilih Project --</option>
              {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </FormField>

          <FormField label="Judul Tugas (Task)" required>
            <input required type="text" value={task.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Contoh: Desain Banner A" className={inputClass} />
          </FormField>

          <FormField label="Deskripsi Detail">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-600">Jelaskan detail pekerjaan</span>
              <button type="button" onClick={onGenerateAI} disabled={isGeneratingAI || !task.title}
                className="flex items-center gap-1.5 text-xs font-bold text-[#D2001A] bg-[#D2001A]/10 border border-[#D2001A]/20 px-2.5 py-1 rounded-lg hover:bg-[#D2001A]/20 transition-all">
                {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Draft AI
              </button>
            </div>
            <textarea
              required value={task.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className={`${inputClass} min-h-[90px] resize-none`}
              placeholder="Penjelasan tugas..."
            />
          </FormField>

          <FormField label="Tanggal Deadline" required>
            <input required type="date" value={task.date} onChange={(e) => onChange({ date: e.target.value })} className={inputClass} />
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary">Simpan Order</Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

// ─── 2. Result Modal ───────────────────────────────────────────
interface ResultModalProps {
  isOpen: boolean;
  task: Task | null;
  submission: ResultSubmission;
  onClose: () => void;
  onChange: (updates: Partial<ResultSubmission>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResultModal({ isOpen, task, submission, onClose, onChange, onFileChange, onSubmit }: ResultModalProps) {
  if (!isOpen || !task) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />Serahkan Hasil Pekerjaan
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="flex gap-4">
            {(['link','file'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={t} checked={submission.type === t} onChange={() => onChange({ type: t, value: '', fileName: '' })} className="accent-[#D2001A]" />
                <span className="text-sm text-slate-700">{t === 'link' ? 'Link URL' : 'Upload File'}</span>
              </label>
            ))}
          </div>
          {submission.type === 'link' ? (
            <FormField label="Tautan (URL)" required>
              <input type="url" required placeholder="https://..." value={submission.value} onChange={(e) => onChange({ value: e.target.value })} className={inputClass} />
            </FormField>
          ) : (
            <FormField label="Pilih File">
              <label className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <UploadCloud size={16} className="text-slate-500" />
                <span className="text-sm text-slate-600">{submission.fileName || 'Klik untuk Upload'}</span>
                <input type="file" className="hidden" onChange={onFileChange} />
              </label>
              {submission.fileName && <p className="text-xs text-emerald-600 mt-1">{submission.fileName}</p>}
            </FormField>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="success">Kirim & Selesai</Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

// ─── 3. Revision Modal ─────────────────────────────────────────
interface RevisionModalProps {
  isOpen: boolean;
  task: Task | null;
  notes: string;
  onClose: () => void;
  onNotesChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RevisionModal({ isOpen, task, notes, onClose, onNotesChange, onSubmit }: RevisionModalProps) {
  if (!isOpen || !task) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <MessageSquareWarning size={18} className="text-orange-400" />Form Revisi
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <FormField label="Poin-poin Revisi" required>
            <textarea
              required autoFocus rows={5}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Tuliskan catatan perbaikan yang diperlukan..."
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="warning">Kirim Revisi</Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

// ─── 4. Project Modal ──────────────────────────────────────────
interface ProjectModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  project: NewProjectForm | Project;
  employees: Employee[];
  onClose: () => void;
  onChange: (updates: Partial<NewProjectForm | Project>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProjectModal({ isOpen, mode, project, employees, onClose, onChange, onSubmit }: ProjectModalProps) {
  if (!isOpen) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-lg font-black text-slate-900">{mode === 'add' ? 'Tambah Project Baru' : 'Edit Project'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <FormField label="Nama Event / Project" required>
            <input required type="text" value={(project as NewProjectForm).name || ''} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} placeholder="Contoh: Kampanye Q4" />
          </FormField>
          <FormField label="Klien / Perusahaan" required>
            <input required type="text" value={(project as NewProjectForm).client || ''} onChange={(e) => onChange({ client: e.target.value })} className={inputClass} placeholder="PT ABC atau Internal" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tanggal Mulai" required>
              <input required type="date" value={(project as NewProjectForm).startDate || ''} onChange={(e) => onChange({ startDate: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Tanggal Selesai" required>
              <input required type="date" min={(project as NewProjectForm).startDate || ''} value={(project as NewProjectForm).endDate || ''} onChange={(e) => onChange({ endDate: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status" required>
              <select required value={(project as NewProjectForm).status || 'Fix'} onChange={(e) => onChange({ status: e.target.value as ProjectStatus })} className={selectClass}>
                {(['Fix','Pitching','Pending','Cancel'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Project Officer" required>
              <select required value={(project as NewProjectForm).projectOfficer || ''} onChange={(e) => onChange({ projectOfficer: e.target.value })} className={selectClass}>
                <option value="" disabled>-- Pilih PO --</option>
                {employees.filter((e) => e.status === 'Aktif').map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary">{mode === 'add' ? 'Simpan Project' : 'Update Project'}</Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

// ─── 5. Employee Add Modal ─────────────────────────────────────
interface EmployeeAddModalProps {
  isOpen: boolean;
  employee: NewEmployeeForm;
  error: string;
  onClose: () => void;
  onChange: (updates: Partial<NewEmployeeForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmployeeAddModal({ isOpen, employee, error, onClose, onChange, onSubmit }: EmployeeAddModalProps) {
  if (!isOpen) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-lg font-black text-slate-900">Tambah Karyawan Baru</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">{error}</div>}
          <FormField label="Nama Lengkap" required>
            <input required type="text" value={employee.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} placeholder="Budi Santoso" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <input required type="email" value={employee.email} onChange={(e) => onChange({ email: e.target.value })} className={inputClass} placeholder="email@pt-anda.com" />
            </FormField>
            <FormField label="No. HP" required>
              <input required type="tel" value={employee.phone} onChange={(e) => onChange({ phone: e.target.value })} className={inputClass} placeholder="08123..." />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Divisi" required>
              <select required value={employee.division} onChange={(e) => onChange({ division: e.target.value as Division })} className={selectClass}>
                {(['Operation','Admin & Finance','Marketing','Creative & Program'] as const).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Tanggal Lahir" required>
              <input required type="date" value={employee.birthDate || ''} onChange={(e) => onChange({ birthDate: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Jabatan" required>
              <input required type="text" value={employee.jobTitle} onChange={(e) => onChange({ jobTitle: e.target.value })} className={inputClass} placeholder="Staff..." />
            </FormField>
            <FormField label="Role Sistem" required>
              <select required value={employee.role} onChange={(e) => onChange({ role: e.target.value as EmployeeRole })} className={selectClass}>
                <option value="Karyawan">Karyawan</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary">Kirim Link Registrasi</Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

// ─── 6. Employee Edit Modal ────────────────────────────────────
interface EmployeeEditModalProps {
  isOpen: boolean;
  employee: Employee | null;
  error: string;
  onClose: () => void;
  onChange: (updates: Partial<Employee>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmployeeEditModal({ isOpen, employee, error, onClose, onChange, onSubmit }: EmployeeEditModalProps) {
  if (!isOpen || !employee) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-lg font-black text-slate-900">Edit Data Karyawan</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">{error}</div>}
          <FormField label="Nama Lengkap" required>
            <input required type="text" value={employee.name} onChange={(e) => onChange({ name: e.target.value })} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <input required type="email" value={employee.email} onChange={(e) => onChange({ email: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="No. HP" required>
              <input required type="tel" value={employee.phone} onChange={(e) => onChange({ phone: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Divisi" required>
              <select required value={employee.division} onChange={(e) => onChange({ division: e.target.value as Division })} className={selectClass}>
                {(['Operation','Admin & Finance','Marketing','Creative & Program'] as const).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Tanggal Lahir" required>
              <input required type="date" value={employee.birthDate || ''} onChange={(e) => onChange({ birthDate: e.target.value })} className={inputClass} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Jabatan" required>
              <input required type="text" value={employee.jobTitle} onChange={(e) => onChange({ jobTitle: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Role Sistem" required>
              <select required value={employee.role} onChange={(e) => onChange({ role: e.target.value as EmployeeRole })} className={selectClass}>
                <option value="Karyawan">Karyawan</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit" variant="primary">Update Karyawan</Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

// ─── 7. Employee Delete Confirm ────────────────────────────────
interface EmployeeDeleteModalProps {
  employee: Employee | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function EmployeeDeleteModal({ employee, onClose, onConfirm }: EmployeeDeleteModalProps) {
  if (!employee) return null;
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-sm mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 border border-red-200 rounded-full flex items-center justify-center mb-5">
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">Hapus Karyawan?</h3>
        <p className="text-sm text-slate-500 mb-6">Yakin ingin menghapus data <strong className="text-slate-800">{employee.name}</strong>? Aksi ini tidak dapat dibatalkan.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Batal</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>Ya, Hapus</Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── 8. Employee View Modal ────────────────────────────────────
interface EmployeeViewModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export function EmployeeViewModal({ employee, onClose }: EmployeeViewModalProps) {
  if (!employee) return null;
  const fields = [
    { label: 'Jabatan', value: employee.jobTitle },
    { label: 'Role Sistem', value: employee.role },
    { label: 'Email', value: employee.email, full: true },
    { label: 'No. Handphone', value: employee.phone, full: true },
    { label: 'Tanggal Lahir', value: employee.birthDate || '-' },
    { label: 'Status', value: employee.status },
    { label: 'Alamat', value: employee.address || '-', full: true },
  ];
  return (
    <ModalShell onClose={onClose}>
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-base font-black text-slate-900">Detail Karyawan</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={16} /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
            <UserCircle size={48} className="text-slate-400 shrink-0" />
            <div>
              <h4 className="text-lg font-black text-slate-900">{employee.name}</h4>
              <p className="text-sm text-slate-500">{employee.id} • {employee.division}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {fields.map(({ label, value, full }) => (
              <div key={label} className={full ? 'col-span-2' : ''}>
                <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">{label}</span>
                <span className="font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </ModalShell>
  );
}
