'use client';
/**
 * TaskDetailModal — Modal detail tugas lengkap
 *
 * @level Organism
 * Menampilkan: Detail tugas, deskripsi, riwayat revisi, approval history,
 *              bukti hasil kerja, file brief, dan aksi kontekstual berbasis role.
 */

import React, { useState } from 'react';
import {
  X, FileText, Link2, Download, ExternalLink, CheckCircle2,
  MessageSquareWarning, Clock, AlertTriangle, User, Users,
  FolderOpen, Calendar, Tag, Zap, History, ShieldCheck, Loader2, Edit, Eye,
} from 'lucide-react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import { FilePreviewModal } from './FilePreviewModal';
import type { Task, Employee, TaskStatus } from '@/src/types';

interface TaskDetailModalProps {
  task: Task | null;
  currentUser: Employee;
  employees: Employee[];
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onApprove: (taskId: string) => void;
  onRevise: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSubmitResult: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

// ─── Helper: Badge warna prioritas ───────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles[priority] ?? styles.Medium}`}>
      {priority}
    </span>
  );
}

// ─── Helper: Tampilkan file hasil kerja ─────────────────────
function ResultDisplay({ 
  resultLink, 
  resultFile,
  onPreview,
}: { 
  resultLink: string; 
  resultFile: string;
  onPreview: (url: string, name: string) => void;
}) {
  if (!resultLink && !resultFile) return null;

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const previewableExtensions = [...imageExtensions, 'pdf'];
  const fileExt = resultFile.split('.').pop()?.toLowerCase() ?? '';
  const isImage = imageExtensions.includes(fileExt);
  const isPreviewable = previewableExtensions.includes(fileExt);
  const fileName = resultFile.split('/').pop() ?? 'bukti-hasil-kerja';

  return (
    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Bukti Hasil Kerja</p>
      {resultLink && (
        <a
          href={resultLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-500 transition-colors max-w-full"
        >
          <ExternalLink size={14} className="shrink-0" />
          <span className="truncate min-w-0">{resultLink}</span>
        </a>
      )}
      {resultFile && (
        <div className="mt-2">
          {isImage ? (
            <div className="mt-1 rounded-lg overflow-hidden border border-emerald-200 max-w-sm">
              <img
                src={resultFile}
                alt="Bukti hasil kerja"
                className="w-full object-contain max-h-48"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <a
              href={resultFile}
              download
              className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-500 transition-colors"
            >
              <Download size={14} />
              Unduh File
            </a>
            {isPreviewable && (
              <button
                onClick={() => onPreview(resultFile, fileName)}
                className="flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-500 transition-colors"
              >
                <Eye size={14} />
                Pratinjau
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Tampilkan file brief ────────────────────────────
function BriefDisplay({ 
  briefFile,
  onPreview,
}: { 
  briefFile: string;
  onPreview: (url: string, name: string) => void;
}) {
  if (!briefFile) return null;
  const fileName = briefFile.split('/').pop() ?? 'brief';
  const fileExt = fileName.split('.').pop()?.toLowerCase() ?? '';
  const isPreviewable = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'].includes(fileExt);

  return (
    <div className="flex items-center gap-2 mt-1">
      <a
        href={briefFile}
        download
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-[#D2001A] transition-colors group"
      >
        <FileText size={14} className="text-slate-400 group-hover:text-[#D2001A] shrink-0" />
        <span className="truncate font-medium">{fileName}</span>
        <Download size={12} className="ml-auto text-slate-400 group-hover:text-[#D2001A] shrink-0" />
      </a>
      {isPreviewable && (
        <button
          onClick={() => onPreview(briefFile, fileName)}
          className="flex items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
          title="Pratinjau Berkas"
        >
          <Eye size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────
export function TaskDetailModal({
  task,
  currentUser,
  employees,
  onClose,
  onStatusChange,
  onApprove,
  onRevise,
  onDelete,
  onSubmitResult,
  onEdit,
}: TaskDetailModalProps) {
  const [deletePending, setDeletePending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const handlePreview = (url: string, name: string) => {
    setPreviewUrl(url);
    setPreviewName(name);
  };

  if (!task) return null;

  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isKaryawan = currentUser.role === 'Karyawan';
  const isAssignee = currentUser.name === task.assignee;
  const isPartner = task.partner ? task.partner.split(', ').includes(currentUser.name) : false;
  const isOwner = isAssignee || isPartner;

  // ─── Logika Aksi yang Tersedia ────────────────────────────
  const canStartTask = isKaryawan && isOwner && task.status === 'To Do';
  const canSubmitResult = isKaryawan && isOwner && (task.status === 'In Progress' || task.status === 'Revisi');

  // Manager/Admin: approve atau revisi dari status Done
  const canApproveOrRevise = task.status === 'Done' && (isAdmin || isManager);
  const assigneeEmp = employees.find((e) => e.name === task.assignee);
  const partnerNames = task.partner ? task.partner.split(', ') : [];
  const partnerEmps = employees.filter((e) => partnerNames.includes(e.name));
  
  const allPartnersHaveApproved = partnerNames.length > 0 && partnerNames.every((p) => task.approvedBy?.includes(p));
  const currentUserIsPartner = partnerNames.includes(currentUser.name);
  const currentUserPartnerHasApproved = task.approvedBy?.includes(currentUser.name);

  const allPartnerMgrsHaveApproved = partnerEmps.length > 0 && partnerEmps.every((e) => task.approvedBy?.includes(e.division));
  const assigneeMgrHasApproved = task.approvedBy?.includes(assigneeEmp?.division ?? '') ?? false;

  const canApprove = (() => {
    if (!canApproveOrRevise) return false;
    if (isAdmin) return true;
    
    if (task.taskType === 'Support') {
      if (currentUserIsPartner && !currentUserPartnerHasApproved) return true;
      if (isManager && allPartnersHaveApproved) {
        const managedPartner = partnerEmps.find(e => e.division === currentUser.division);
        if (managedPartner && !task.approvedBy?.includes(managedPartner.division)) return true;
      }
      return false;
    } else if (task.taskType === 'Colaboration') {
      if (isManager && assigneeEmp && currentUser.division === assigneeEmp.division && !assigneeMgrHasApproved) return true;
      if (isManager) {
        const managedPartner = partnerEmps.find(e => e.division === currentUser.division);
        if (managedPartner && !task.approvedBy?.includes(managedPartner.division)) return true;
      }
      return false;
    }
    return isManager;
  })();
  const canRevise = canApproveOrRevise;

  const canDelete = isAdmin || isManager;

  const handleDelete = () => {
    setDeletePending(true);
    onDelete(task.id);
    onClose();
  };

  // ─── Status label yang user-friendly ──────────────────────
  const statusLabel =
    task.status === 'Done'
      ? task.taskType === 'Support' && !allPartnersHaveApproved
        ? 'Menunggu Pemohon'
        : 'Menunggu Approval'
      : task.status;

  // ─── Format tanggal ───────────────────────────────────────
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const isOnTime = task.completedAt && task.status === 'Approved'
    ? task.completedAt <= task.date
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl my-4 bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={task.taskType} size="xs">{task.taskType}</Badge>
                <PriorityBadge priority={task.priority} />
                {isAdmin || isManager ? (
                  <select
                    value={task.status}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === task.status) return;
                      if (val === 'Done') {
                        onSubmitResult(task);
                      } else if (val === 'Revisi') {
                        onRevise(task);
                      } else if (val === 'Approved') {
                        onApprove(task.id);
                      } else {
                        onStatusChange(task.id, val);
                      }
                      onClose();
                    }}
                    className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded outline-none focus:ring-2 focus:ring-[#D2001A]/20 transition-colors cursor-pointer"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Revisi">Revisi</option>
                    <option value="Done">Done</option>
                    <option value="Approved">Approved</option>
                  </select>
                ) : (
                  <Badge variant={task.status as TaskStatus} size="xs">{statusLabel}</Badge>
                )}
                {task.revisionCount > 0 && (
                  <span className="text-[10px] font-bold text-orange-300 bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 rounded">
                    {task.revisionCount}x Direvisi
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{task.title}</h2>
              <p className="text-slate-400 text-sm mt-1">{task.project}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">

          {/* Kolom Kiri: Info Utama & Konten */}
          <div className="md:col-span-3 p-5 sm:p-6 space-y-5">

            {/* Assignee & Partner */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User size={10} /> Pelaksana (PIC)
                </p>
                <p className="font-semibold text-slate-800">{task.assignee}</p>
                <p className="text-xs text-slate-500">{task.division}</p>
              </div>
              {task.partner && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Users size={10} /> {task.taskType === 'Support' ? 'Pemohon' : 'Partner'}
                  </p>
                  <p className="font-semibold text-slate-800">{task.partner}</p>
                </div>
              )}
            </div>

            {/* Info Baris Kedua: Project, Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FolderOpen size={10} /> Project
                </p>
                <p className="font-medium text-slate-700 text-sm">{task.project}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar size={10} /> Deadline
                </p>
                <p className="font-medium text-slate-700 text-sm">{formatDate(task.date)}</p>
                {isOnTime !== null && (
                  <p className={`text-[10px] font-bold mt-0.5 ${isOnTime ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isOnTime ? '✓ Tepat Waktu' : '✗ Terlambat'}
                  </p>
                )}
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Tugas</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-xl p-3">
                {task.description || <span className="italic text-slate-400">Tidak ada deskripsi.</span>}
              </p>
            </div>

            {/* File Brief */}
            {task.briefFile && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FileText size={10} /> File Brief
                </p>
                <BriefDisplay briefFile={task.briefFile} onPreview={handlePreview} />
              </div>
            )}

            {/* Bukti Hasil Kerja */}
            {(task.resultLink || task.resultFile) && (
              <ResultDisplay 
                resultLink={task.resultLink} 
                resultFile={task.resultFile} 
                onPreview={handlePreview}
              />
            )}

            {/* Catatan Revisi Aktif */}
            {task.status === 'Revisi' && task.revisionNotes && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquareWarning size={10} /> Catatan Revisi Aktif
                </p>
                <p className="text-sm text-orange-700 leading-relaxed">{task.revisionNotes}</p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: History & Approval */}
          <div className="md:col-span-2 p-5 sm:p-6 space-y-5 bg-slate-50/50">

            {/* Riwayat Approval */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <ShieldCheck size={10} /> Riwayat Approval
              </p>
              {task.approvedBy && task.approvedBy.length > 0 ? (
                <div className="space-y-2">
                  {task.approvedBy.map((div, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      </div>
                      <span className="font-medium text-slate-700">{div}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada approval.</p>
              )}
              <div className="mt-4 pt-4 border-t border-slate-200">
                {task.taskType === 'Support' && !allPartnersHaveApproved && (
                  <span className="flex items-center gap-1 text-slate-500 text-xs"><Clock size={12}/> Menunggu Appv Pemohon</span>
                )}
                {task.taskType === 'Support' && allPartnersHaveApproved && !allPartnerMgrsHaveApproved && (
                  <span className="flex items-center gap-1 text-slate-500 text-xs"><Clock size={12}/> Menunggu Appv Manager Terkait</span>
                )}
                {task.taskType === 'Colaboration' && (!assigneeMgrHasApproved || !allPartnerMgrsHaveApproved) && (
                  <span className="flex items-center gap-1 text-slate-500 text-xs"><Clock size={12}/> Menunggu Appv Manager Terkait</span>
                )}
              </div>
            </div>

            {/* Riwayat Revisi */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <History size={10} /> Riwayat Revisi ({task.revisions?.length ?? task.revisionCount})
              </p>
              {task.revisions && task.revisions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {task.revisions.map((rev) => (
                    <div key={rev.id} className="bg-white border border-orange-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-orange-500">
                          Revisi #{rev.revisionNumber}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada revisi.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer Aksi ────────────────────────────────────────── */}
        <div className="border-t border-slate-100 bg-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Aksi Karyawan */}
            {canStartTask && (
              <button
                onClick={() => { onStatusChange(task.id, 'In Progress'); onClose(); }}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg transition-colors"
              >
                <Zap size={14} /> Mulai Kerja
              </button>
            )}
            {canSubmitResult && (
              <button
                onClick={() => { onSubmitResult(task); onClose(); }}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 size={14} /> Serahkan Hasil
              </button>
            )}

            {/* Aksi Manager/Admin */}
            {canApprove && (
              <button
                onClick={() => { onApprove(task.id); onClose(); }}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors"
              >
                <ShieldCheck size={14} /> Approve
              </button>
            )}
            {canRevise && (
              <button
                onClick={() => { onRevise(task); onClose(); }}
                className="flex items-center gap-1.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 px-3 py-2 rounded-lg transition-colors"
              >
                <MessageSquareWarning size={14} /> Revisi
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Tugas */}
            {canDelete && onEdit && (
              <button
                onClick={() => { onEdit(task); onClose(); }}
                className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 px-3 py-2 rounded-lg transition-all"
              >
                <Edit size={14} />
                Edit
              </button>
            )}
            {/* Hapus Tugas */}
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm(`Hapus tugas "${task.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
                    handleDelete();
                  }
                }}
                disabled={deletePending}
                className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-3 py-2 rounded-lg transition-all"
              >
                {deletePending ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                Hapus
              </button>
            )}
            <Button variant="secondary" onClick={onClose}>Tutup</Button>
          </div>
        </div>
      </div>

      <FilePreviewModal
        isOpen={!!previewUrl}
        fileUrl={previewUrl}
        fileName={previewName}
        onClose={() => setPreviewUrl(null)}
      />
    </div>
  );
}

export default TaskDetailModal;
