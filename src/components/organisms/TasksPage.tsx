'use client';
/**
 * TasksPage — Full task management list organism
 *
 * @level Organism
 * @composition Filters + Table + Action buttons + CSV Import
 *
 * Revisi:
 * - Hapus tampilan Task ID dari tabel
 * - Hapus kolom deskripsi langsung di tabel
 * - Baris tabel dapat diklik untuk membuka TaskDetailModal
 * - Dropdown status diganti tombol aksi kontekstual di modal
 * - Tombol Import CSV ditambahkan
 * - Admin dapat filter semua nama karyawan tanpa batasan divisi
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Filter, X, Sparkles, Upload, FileDown, ChevronDown, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import { TaskDetailModal } from './TaskDetailModal';
import type { Task, Project, Employee, TaskStatus } from '@/src/types';
import { getBusinessPeriod } from '@/src/lib/dateUtils';

interface ImportRow {
  title: string;
  description: string;
  project: string;
  assignee: string;
  partner: string;
  priority: string;
  taskType: string;
  date: string;
  _error?: string;
}

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
  onSubmitResult: (task: Task) => void;
  onBulkImport: (rows: ImportRow[]) => Promise<{ success: number; errors: string[] }>;
  onEdit: (task: Task) => void;
}

// ─── CSV Template kolom yang diharapkan ──────────────────────
const CSV_HEADERS = ['title', 'description', 'project', 'assignee', 'partner', 'priority', 'taskType', 'date'];

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
  onSubmitResult,
  onBulkImport,
  onEdit,
}: TasksPageProps) {
  const [filterMonth, setFilterMonth] = useState(initialMonthFilter);
  const [filterName, setFilterName] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState(initialStatusFilter);
  const [search, setSearch] = useState(initialSearch);

  // Modal detail task
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // CSV Import state
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setFilterStatus(initialStatusFilter);
  }, [initialStatusFilter]);

  useEffect(() => {
    setFilterMonth(initialMonthFilter);
  }, [initialMonthFilter]);

  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isKaryawan = currentUser.role === 'Karyawan';
  const taskMenuLabel = isAdmin ? 'Semua Tugas' : isManager ? 'Tugas Divisi' : 'Tugas Saya';

  // Admin melihat semua karyawan aktif; Manager hanya divisinya
  const filterEmployees = Array.from(
    new Set(
      employees
        .filter((e) => e.status === 'Aktif' && (isAdmin ? true : e.division === currentUser.division))
        .map((e) => e.name)
    )
  ).sort();

  const displayed = tasks.filter((t) => {
    const taskMonth = t.date ? (getBusinessPeriod(t.date)?.monthValue || '') : '';
    const matchMonth = filterMonth === 'all' || taskMonth === filterMonth;
    const matchName = filterName === 'all' || t.assignee === filterName || (t.partner && t.partner.split(', ').includes(filterName));
    const matchProject = filterProject === 'all' || t.project === filterProject;
    const matchStatus =
      filterStatus === 'all' ||
      t.status === filterStatus ||
      (filterStatus === 'Completed' && t.status === 'Approved');
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.date.includes(search) ||
      t.assignee.toLowerCase().includes(search.toLowerCase()) ||
      t.project.toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchName && matchProject && matchStatus && matchSearch;
  });

  const months = [['01','Januari'],['02','Februari'],['03','Maret'],['04','April'],['05','Mei'],['06','Juni'],['07','Juli'],['08','Agustus'],['09','September'],['10','Oktober'],['11','November'],['12','Desember']];

  const getStatusLabel = (task: Task): string => {
    if (task.status !== 'Done') return task.status;
    if (task.taskType === 'Support') {
      if (task.partner && !task.partner.split(', ').every((p) => task.approvedBy?.includes(p))) return 'Menunggu Pemohon';
      return 'Menunggu Manager';
    }
    return 'Menunggu Appv';
  };

  // ─── Import: Parse file (CSV/XLSX) ───────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        alert('File kosong atau hanya berisi header.');
        return;
      }

      // Cari baris header (maksimal 15 baris pertama)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(15, jsonData.length); i++) {
        if (!jsonData[i] || !Array.isArray(jsonData[i])) continue;
        const rowKeys = (jsonData[i] as any[]).map(h => String(h).trim().toLowerCase());
        if (rowKeys.includes('title') && rowKeys.includes('project')) {
          headerRowIndex = i;
          break;
        }
      }

      const rawHeaders = (jsonData[headerRowIndex] as any[]).map(h => String(h).trim().toLowerCase());

      const rows: ImportRow[] = jsonData.slice(headerRowIndex + 1).map((cols) => {
        if (!cols || !Array.isArray(cols)) cols = [];
        
        const getCol = (key: string) => {
          const idx = rawHeaders.indexOf(key.toLowerCase());
          return idx >= 0 && cols[idx] !== undefined && cols[idx] !== null ? String(cols[idx]).trim() : '';
        };

        let rawDate = getCol('date');
        // If XLSX parsed it as a Date object, it might be in cols[idx] as Date
        const dateIdx = rawHeaders.indexOf('date');
        if (dateIdx >= 0 && cols[dateIdx] instanceof Date) {
          const d = cols[dateIdx] as Date;
          rawDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const row: ImportRow = {
          title: getCol('title'),
          description: getCol('description'),
          project: getCol('project'),
          assignee: getCol('assignee'),
          partner: getCol('partner'),
          priority: getCol('priority') || 'Medium',
          taskType: getCol('tasktype') || 'Core',
          date: rawDate,
        };

        // Validasi lokal per baris
        const errs: string[] = [];
        if (!row.title) errs.push('Judul tugas kosong');
        if (!row.project) errs.push('Nama project kosong');
        if (!row.assignee) errs.push('Nama PIC/Assignee kosong');
        if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errs.push('Format tanggal tidak valid (gunakan YYYY-MM-DD)');
        if (!['High', 'Medium', 'Low'].includes(row.priority)) errs.push(`Priority tidak valid: ${row.priority}`);
        if (!['Core', 'Support', 'Colaboration', 'Improvement'].includes(row.taskType)) errs.push(`TaskType tidak valid: ${row.taskType}`);
        if (!employees.find(e => e.name === row.assignee)) errs.push(`Karyawan "${row.assignee}" tidak ditemukan`);
        if (!projects.find(p => p.name === row.project)) errs.push(`Project "${row.project}" tidak ditemukan`);

        if (errs.length > 0) row._error = errs.join(' | ');
        return row;
      });

      // Filter out completely empty rows
      const validDataRows = rows.filter(r => r.title || r.project || r.assignee);

      setImportRows(validDataRows);
      setShowImportPreview(true);
      setImportResult(null);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file. Pastikan format file benar (.csv atau .xlsx).');
    }
    // Reset input agar file yang sama bisa dipilih lagi
    e.target.value = '';
  };

  const sampleProject = projects.length > 0 ? projects[0].name : 'Contoh Project';
  const sampleEmployee = employees.length > 0 ? employees[0].name : 'Contoh Karyawan';

  const downloadExcelTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      CSV_HEADERS,
      ['Contoh Task', 'Deskripsi task', sampleProject, sampleEmployee, '', 'Medium', 'Core', '2026-12-31']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-import-task.xlsx");
    setShowTemplateMenu(false);
  };

  const dynamicCsvTemplateUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(
    CSV_HEADERS.join(',') + `\nContoh Task,Deskripsi task,${sampleProject},${sampleEmployee},,Medium,Core,2026-12-31`
  )}`;

  const handleExportData = (type: 'csv' | 'xlsx') => {
    const filterDetails = [
      `Filter Periode: ${filterMonth === 'all' ? 'Semua' : filterMonth}`,
      `Filter PIC/Assignee: ${filterName === 'all' ? 'Semua' : filterName}`,
      `Filter Project: ${filterProject === 'all' ? 'Semua' : filterProject}`,
      `Filter Status: ${filterStatus === 'all' ? 'Semua' : filterStatus}`,
      search ? `Pencarian: ${search}` : ''
    ].filter(Boolean);

    const exportHeaders = [...CSV_HEADERS, 'status'];
    
    const exportData = displayed.map(t => [
      t.title,
      t.description,
      t.project,
      t.assignee,
      t.partner || '',
      t.priority,
      t.taskType,
      t.date,
      t.status
    ]);

    const worksheetData = [
      ['Data Export Task Order'],
      ...filterDetails.map(f => [f]),
      [], // Empty row
      exportHeaders,
      ...exportData
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export Data');

    if (type === 'xlsx') {
      XLSX.writeFile(wb, 'export-task-order.xlsx');
    } else {
      const csvContent = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export-task-order.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setShowExportMenu(false);
  };

  const handleConfirmImport = async () => {
    const validRows = importRows.filter(r => !r._error);
    if (validRows.length === 0) return;
    setImportLoading(true);
    try {
      const result = await onBulkImport(validRows);
      setImportResult(result);
      if (result.success > 0) {
        setImportRows([]);
      }
    } catch (err) {
      console.error('[Import CSV]', err);
    } finally {
      setImportLoading(false);
    }
  };

  const selectClass = 'input-light w-full py-2 text-sm px-3';
  const hasInvalidRows = importRows.some(r => r._error);
  const validCount = importRows.filter(r => !r._error).length;

  return (
    <div className="animate-fade-in-up">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{taskMenuLabel}</h1>
          <p className="text-sm text-slate-500 mt-1">{displayed.length} tugas ditampilkan</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Ide Improvement */}
          <Button variant="secondary" size="sm" leftIcon={<Sparkles size={14} className="text-[#D2001A]" />} onClick={onAddImprovement}>
            Ide Improvement
          </Button>

          {/* Tombol Import & Export (Admin & Manager saja) */}
          {(isAdmin || isManager) && (
            <>
              <div className="relative">
                <button
                  onClick={() => { setShowExportMenu(!showExportMenu); setShowTemplateMenu(false); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg transition-colors"
                  title="Export Data"
                >
                  <Download size={14} /> Export <ChevronDown size={14} />
                </button>
                {showExportMenu && (
                  <div className="absolute top-full mt-1 right-0 w-36 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-10">
                    <button
                      onClick={() => handleExportData('csv')}
                      className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                    >
                      Export .CSV
                    </button>
                    <button
                      onClick={() => handleExportData('xlsx')}
                      className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Export .XLSX
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => { setShowTemplateMenu(!showTemplateMenu); setShowExportMenu(false); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg transition-colors"
                  title="Unduh template"
                >
                  <FileDown size={14} /> Template <ChevronDown size={14} />
                </button>
                {showTemplateMenu && (
                  <div className="absolute top-full mt-1 right-0 w-36 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-10">
                    <a
                      href={dynamicCsvTemplateUrl}
                      download="template-import-task.csv"
                      onClick={() => setShowTemplateMenu(false)}
                      className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                    >
                      Download .CSV
                    </a>
                    <button
                      onClick={downloadExcelTemplate}
                      className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Download .XLSX
                    </button>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload size={14} /> Import Data
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </label>
            </>
          )}

          {/* Tombol Buat Tugas */}
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onAddTask}>
            Buat Tugas
          </Button>
        </div>
      </div>

      {/* ── CSV Import Preview Modal ──────────────────────────── */}
      {isMounted && showImportPreview && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowImportPreview(false)}>
          <div className="w-full max-w-4xl my-8 bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Preview Import CSV</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {validCount} baris valid
                  {hasInvalidRows && ` • ${importRows.filter(r => r._error).length} baris error`}
                </p>
              </div>
              <button onClick={() => setShowImportPreview(false)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>

            {/* Tabel Preview */}
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 font-bold">#</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">Judul</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">Project</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">PIC</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">Tipe</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">Prioritas</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">Deadline</th>
                    <th className="px-4 py-3 text-slate-500 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importRows.map((row, i) => (
                    <tr key={i} className={row._error ? 'bg-red-50' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate">{row.title}</td>
                      <td className="px-4 py-3 text-slate-600">{row.project}</td>
                      <td className="px-4 py-3 text-slate-600">{row.assignee}</td>
                      <td className="px-4 py-3 text-slate-600">{row.taskType}</td>
                      <td className="px-4 py-3 text-slate-600">{row.priority}</td>
                      <td className="px-4 py-3 text-slate-600">{row.date}</td>
                      <td className="px-4 py-3">
                        {row._error ? (
                          <span className="text-red-500 font-bold text-[10px]" title={row._error}>❌ Error</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px]">✓ Valid</span>
                        )}
                        {row._error && (
                          <p className="text-[9px] text-red-400 mt-0.5 max-w-[200px]">{row._error}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hasil Import */}
            {importLoading && (
              <div className="mx-5 my-3 p-4 rounded-xl text-sm bg-blue-50 border border-blue-200 text-blue-700 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <p className="font-bold">Sedang memproses {validCount} tugas...</p>
                <p className="text-xs text-blue-500 text-center max-w-md">Sistem sedang melakukan sinkronisasi data secara massal. Harap tunggu sesaat.</p>
              </div>
            )}
            {!importLoading && importResult && (
              <div className={`mx-5 my-3 p-3 rounded-xl text-sm ${importResult.success > 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {importResult.success > 0
                  ? `✅ ${importResult.success} tugas berhasil diimport.`
                  : '❌ Tidak ada tugas yang berhasil diimport.'}
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 text-xs list-disc list-inside text-red-500">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 p-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowImportPreview(false)}>Batal</Button>
              <Button
                variant="primary"
                onClick={handleConfirmImport}
                disabled={validCount === 0 || importLoading || (importResult?.success ?? 0) > 0}
              >
                {importLoading ? 'Mengimport...' : `Import ${validCount} Tugas Valid`}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Filters ────────────────────────────────────────────── */}
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
              placeholder="Cari Judul, PIC, Project, Tanggal..."
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

      {/* ── Table ──────────────────────────────────────────────── */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedTask(task)}
                  title="Klik untuk melihat detail tugas"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800 group-hover:text-[#D2001A] transition-colors">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{task.project}</p>
                    {task.status === 'Revisi' && task.revisionNotes && (
                      <div className="mt-1.5 bg-orange-50 border border-orange-200 p-1.5 rounded-lg max-w-xs">
                        <p className="text-[10px] font-bold text-orange-500">Revisi: {task.revisionNotes}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800">{task.assignee}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-bold">{task.division}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={task.taskType} size="xs">{task.taskType}</Badge>
                    {task.partner && (
                      <p className="text-[10px] text-[#D2001A] mt-1">
                        {task.taskType === 'Support' ? 'Pemohon: ' : 'Partner: '}{task.partner}
                      </p>
                    )}
                    {(task.resultLink || task.resultFile) && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Ada bukti kerja</p>
                    )}
                    {task.briefFile && (
                      <p className="text-[10px] text-blue-500 font-bold mt-0.5">📎 Ada brief</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{task.date}</td>
                  <td className="px-5 py-4 text-center">
                    {task.status === 'Approved' && task.completedAt ? (
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
                </tr>
              ))}
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

      {/* ── Task Detail Modal ─────────────────────────────────── */}
      {isMounted && selectedTask && createPortal(
        <TaskDetailModal
          task={selectedTask}
          currentUser={currentUser}
          employees={employees}
          onClose={() => setSelectedTask(null)}
          onStatusChange={(taskId, status) => {
            onStatusChange(taskId, status);
            setSelectedTask(null);
          }}
          onApprove={(taskId) => {
            onApprove(taskId);
            setSelectedTask(null);
          }}
          onRevise={(task) => {
            onRevise(task);
            setSelectedTask(null);
          }}
          onDelete={(taskId) => {
            onDelete(taskId);
            setSelectedTask(null);
          }}
          onSubmitResult={(task) => {
            onSubmitResult(task);
          }}
          onEdit={(task) => {
            onEdit(task);
            setSelectedTask(null);
          }}
        />,
        document.body
      )}
    </div>
  );
}
