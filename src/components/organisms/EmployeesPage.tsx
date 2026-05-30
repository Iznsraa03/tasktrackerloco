'use client';
/**
 * EmployeesPage — Employee management table (Admin only)
 *
 * @level Organism
 */

import React from 'react';
import { Plus, Eye, Pencil, Trash2, Send, UserCircle } from 'lucide-react';
import Button from '../atoms/Button';
import type { Employee } from '@/src/types';

interface EmployeesPageProps {
  employees: Employee[];
  onAdd: () => void;
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onSimulateEmail: (emp: Employee) => void;
}

export default function EmployeesPage({
  employees, onAdd, onView, onEdit, onDelete, onSimulateEmail,
}: EmployeesPageProps) {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manajemen Karyawan</h1>
          <p className="text-sm text-slate-600 mt-1">{employees.length} karyawan terdaftar</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={onAdd}>
          Tambah Karyawan
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/60">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">Nama & Kontak</th>
                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">Divisi & Jabatan</th>
                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">Status & Role</th>
                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <UserCircle size={32} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-600">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">{emp.division}</p>
                    <p className="text-xs text-slate-600">{emp.jobTitle}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-yellow-50 text-yellow-600 border border-yellow-200'}`}>
                      {emp.status}
                    </span>
                    <p className="text-[10px] uppercase font-semibold text-slate-600 mt-1">{emp.role}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5 items-center">
                      {emp.status === 'Menunggu' && (
                        <button onClick={() => onSimulateEmail(emp)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#D2001A] bg-[#D2001A]/10 border border-[#D2001A]/20 px-2 py-1 rounded-lg hover:bg-[#D2001A]/20 transition-colors">
                          <Send size={10} /> Simulasi
                        </button>
                      )}
                      <button onClick={() => onView(emp)} title="Lihat Detail" className="p-1.5 rounded-lg text-slate-600 hover:text-[#D2001A] hover:bg-[#D2001A]/10 transition-colors"><Eye size={15} /></button>
                      <button onClick={() => onEdit(emp)} title="Edit Data" className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => onDelete(emp)} title="Hapus" className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
