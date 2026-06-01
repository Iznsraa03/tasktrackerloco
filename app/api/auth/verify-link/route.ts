// ============================================================
// LOCO 21 PRO — API: /api/auth/verify-link
// GET  → ambil atau buat ulang link verifikasi aktif untuk admin
// Digunakan oleh tombol "Salin Link" di halaman Karyawan
// ============================================================

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID karyawan tidak ditemukan.' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      return NextResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    if (employee.status === 'Aktif') {
      return NextResponse.json({ message: 'Karyawan ini sudah aktif dan tidak memerlukan verifikasi.' }, { status: 400 });
    }

    // Jika token lama ada dan masih valid, kembalikan link yang sama
    const now = new Date();
    if (employee.verificationToken && employee.tokenExpires && employee.tokenExpires > now) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loco21event.com';
      const verificationLink = `${appUrl}/verify?token=${employee.verificationToken}`;
      return NextResponse.json({ verificationLink });
    }

    // Token kedaluwarsa atau belum ada — generate token baru
    const newToken = randomUUID();
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.employee.update({
      where: { id },
      data: {
        verificationToken: newToken,
        tokenExpires: newExpires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://loco21event.com';
    const verificationLink = `${appUrl}/verify?token=${newToken}`;

    console.log(`[GET /api/auth/verify-link] Link baru dibuat untuk ${employee.email}: ${verificationLink}`);

    return NextResponse.json({ verificationLink });
  } catch (err) {
    console.error('[GET /api/auth/verify-link]', err);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
