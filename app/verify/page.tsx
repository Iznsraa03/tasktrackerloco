'use client';
/**
 * app/verify/page.tsx — Halaman Verifikasi Akun Karyawan Baru
 *
 * 4 state UI:
 *   1. Loading    → shimmer elegan saat validasi token
 *   2. Error      → pesan yang jelas jika token invalid/kedaluwarsa
 *   3. Setup Form → form verifikasi data + buat password dengan indikator kekuatan
 *   4. Success    → animasi centang + tombol direct-login
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle,
  Lock, User, Briefcase, Building2, Mail, Loader2,
  ShieldCheck, ArrowRight
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface EmployeeData {
  id: string;
  name: string;
  email: string;
  division: string;
  jobTitle: string;
  role: string;
}

type PageState = 'loading' | 'error' | 'form' | 'success';

// ─── Password Strength ──────────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Sangat Lemah', color: '#EF4444' };
  if (score === 2) return { score, label: 'Lemah', color: '#F97316' };
  if (score === 3) return { score, label: 'Cukup', color: '#F59E0B' };
  if (score === 4) return { score, label: 'Kuat', color: '#22C55E' };
  return { score: 5, label: 'Sangat Kuat', color: '#10B981' };
}

// ─── Komponen utama (inner, menggunakan useSearchParams) ────
function VerifyPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  // Validasi token saat mount
  const validateToken = useCallback(async () => {
    if (!token) {
      setErrorMessage('Tautan tidak valid. Pastikan Anda membuka link dari email yang dikirimkan.');
      setPageState('error');
      return;
    }
    try {
      const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message ?? 'Terjadi kesalahan. Silakan hubungi Admin.');
        setPageState('error');
        return;
      }
      setEmployeeData(data);
      setPageState('form');
    } catch {
      setErrorMessage('Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.');
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password minimal harus 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message ?? 'Gagal mengaktifkan akun. Coba lagi.');
        setIsSubmitting(false);
        return;
      }

      // Langsung alihkan ke halaman login (root)
      router.push('/');
    } catch {
      setFormError('Koneksi terputus. Pastikan internet Anda aktif dan coba lagi.');
      setIsSubmitting(false);
    }
  };

  // ─── Render: Loading ──────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D2001A]/6 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D2001A] rounded-2xl shadow-[0_0_40px_rgba(210,0,26,0.45)] mb-6 mx-auto">
            <span className="text-3xl font-black text-white">L</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-10 shadow-2xl">
            <Loader2 size={36} className="text-[#D2001A] animate-spin mx-auto mb-5" />
            <p className="text-slate-600 font-medium">Memvalidasi tautan verifikasi…</p>
            <p className="text-slate-400 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Error ────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md text-center animate-[fadeInUp_0.35s_ease_forwards]" style={{ animationName: 'fadeInUp' }}>
          <div className="bg-white rounded-2xl border border-slate-200/60 p-10 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-3">Tautan Tidak Valid</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">{errorMessage}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-amber-700 text-xs leading-relaxed">
                  Hubungi Admin sistem untuk mendapatkan tautan verifikasi baru yang aktif.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Success ──────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/6 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-10 shadow-2xl">
            {/* Animated success icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-40" />
              <div className="relative w-20 h-20 bg-emerald-50 border-2 border-emerald-300 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Akun Berhasil Aktif! 🎉</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              Selamat datang di tim, <strong className="text-slate-800">{employeeData?.name}</strong>!
            </p>
            <p className="text-slate-400 text-xs mb-8">
              Password Anda telah tersimpan dan akun Anda sudah aktif. Silakan login untuk memulai.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-2 bg-[#D2001A] hover:bg-[#b5001a] text-white font-bold py-3 rounded-xl shadow-[0_4px_20px_rgba(210,0,26,0.35)] transition-all hover:shadow-[0_6px_28px_rgba(210,0,26,0.5)] hover:-translate-y-0.5"
            >
              Masuk ke Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Form ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#EFEFEF] flex items-start justify-center p-4 pt-8 pb-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#D2001A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#D2001A] rounded-2xl shadow-[0_0_30px_rgba(210,0,26,0.45)] mb-4">
            <span className="text-xl font-black text-white">L</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">LOCO 21 <span className="text-[#D2001A]">PRO</span></h1>
          <p className="text-slate-500 text-sm mt-1">Aktivasi Akun Karyawan Baru</p>
        </div>

        {/* Card Utama */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">
          
          {/* Selamat Datang Header */}
          <div className="bg-gradient-to-r from-[#D2001A] to-[#a30015] p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-base">Halo, {employeeData?.name}! 👋</h2>
                <p className="text-white/70 text-xs mt-0.5">Verifikasi data Anda dan buat password akun</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Kartu Verifikasi Data */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Data Anda yang Terdaftar</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5">
                  <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Lengkap</p>
                    <p className="text-sm font-semibold text-slate-800">{employeeData?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-slate-800 break-all">{employeeData?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2 size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Divisi</p>
                    <p className="text-sm font-semibold text-slate-800">{employeeData?.division}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Briefcase size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jabatan</p>
                    <p className="text-sm font-semibold text-slate-800">{employeeData?.jobTitle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Password */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Lock size={15} className="text-[#D2001A]" />
                  Buat Password Akun Anda
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  {formError}
                </div>
              )}

              {/* Password Baru */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Password Baru <span className="text-[#D2001A]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="input-light border border-slate-200 w-full py-2.5 pl-4 pr-10 text-sm"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                {/* Indikator kekuatan password */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: i <= strength.score ? strength.color : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Konfirmasi Password <span className="text-[#D2001A]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password di atas"
                    className={`input-light border w-full py-2.5 pl-4 pr-10 text-sm ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-300 bg-red-50/50'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {confirmPassword && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                      {confirmPassword === password
                        ? <CheckCircle2 size={14} className="text-emerald-500" />
                        : <XCircle size={14} className="text-red-400" />
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#D2001A] hover:bg-[#b5001a] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-[0_4px_20px_rgba(210,0,26,0.3)] transition-all hover:shadow-[0_6px_28px_rgba(210,0,26,0.45)] hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Mengaktifkan Akun…</>
                ) : (
                  <><ShieldCheck size={16} /> Aktifkan Akun & Simpan Password</>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-5">
          Tautan ini hanya dapat digunakan sekali. Jika ada masalah, hubungi Admin.
        </p>
      </div>
    </div>
  );
}

// ─── Export default dengan Suspense boundary ──────────────
// Diperlukan karena useSearchParams() membutuhkan Suspense di Next.js App Router
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <Loader2 size={36} className="text-[#D2001A] animate-spin" />
      </div>
    }>
      <VerifyPageInner />
    </Suspense>
  );
}
