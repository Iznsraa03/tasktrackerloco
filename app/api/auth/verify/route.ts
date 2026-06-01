// ============================================================
// LOCO 21 PRO — API: /api/auth/verify
// GET  → validasi token & ambil data karyawan untuk ditampilkan di UI
// POST → simpan password baru & aktifkan akun karyawan
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// ─── GET: Validasi token dan kembalikan data karyawan ────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token tidak ditemukan.' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { verificationToken: token },
      include: { division: true, role: true },
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Link verifikasi tidak valid atau sudah pernah digunakan.' },
        { status: 404 }
      );
    }

    // Cek kedaluwarsa token
    if (!employee.tokenExpires || employee.tokenExpires < new Date()) {
      return NextResponse.json(
        { message: 'Link verifikasi sudah kedaluwarsa (lebih dari 24 jam). Hubungi Admin untuk mendapatkan link baru.' },
        { status: 410 } // 410 Gone = kedaluwarsa
      );
    }

    // Kembalikan data karyawan yang perlu diverifikasi (tanpa password & token)
    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      division: employee.division.displayName,
      jobTitle: employee.jobTitle,
      role: employee.role.displayName,
    });
  } catch (err) {
    console.error('[GET /api/auth/verify]', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// ─── POST: Simpan password & aktifkan akun ───────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body as { token: string; password: string };

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password minimal 8 karakter.' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { verificationToken: token },
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Link verifikasi tidak valid atau sudah pernah digunakan.' },
        { status: 404 }
      );
    }

    // Validasi ulang kedaluwarsa token
    if (!employee.tokenExpires || employee.tokenExpires < new Date()) {
      return NextResponse.json(
        { message: 'Link verifikasi sudah kedaluwarsa. Hubungi Admin untuk mendapatkan link baru.' },
        { status: 410 }
      );
    }

    // Simpan password, ubah status menjadi Aktif, hapus token
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        password,          // Simpan password plain text (konsisten dengan sistem login bawaan)
        status: 'Aktif',
        verificationToken: null,
        tokenExpires: null,
      },
    });

    console.log(`[POST /api/auth/verify] Akun berhasil diaktifkan: ${employee.email}`);

    return NextResponse.json({
      message: 'Akun berhasil diaktifkan! Silakan login dengan password Anda.',
      email: employee.email,
    });
  } catch (err) {
    console.error('[POST /api/auth/verify]', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
