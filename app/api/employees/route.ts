// ============================================================
// LOCO 21 PRO — API: /api/employees
// GET  → list all employees
// POST → create a new employee + kirim email verifikasi
// ============================================================

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/src/lib/prisma';
import { sendVerificationEmail } from '@/src/lib/email';
import type { Division, EmployeeRole, EmployeeStatus } from '@/src/types';

export async function GET() {
  try {
    const rows = await prisma.employee.findMany({ 
      orderBy: { name: 'asc' },
      include: { division: true, role: true }
    });
    const employees = rows.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      password: e.password,
      phone: e.phone,
      address: e.address,
      birthDate: e.birthDate,
      division: e.division.displayName as Division,
      jobTitle: e.jobTitle,
      role: e.role.name as EmployeeRole,
      status: e.status as EmployeeStatus,
    }));
    return NextResponse.json(employees);
  } catch (err) {
    console.error('[GET /api/employees]', err);
    return NextResponse.json({ message: 'Gagal mengambil data karyawan.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Find Division and Role IDs
    const divRec = await prisma.division.findFirst({
      where: { 
        OR: [
          { name: body.division },
          { displayName: body.division }
        ]
      }
    });
    const roleRec = await prisma.role.findFirst({
      where: { 
        OR: [
          { name: body.role ?? 'Karyawan' },
          { displayName: body.role ?? 'Karyawan' }
        ]
      }
    });

    if (!divRec || !roleRec) {
      return NextResponse.json({ message: 'Divisi atau Role tidak valid.' }, { status: 400 });
    }

    // Generate token verifikasi yang unik dan masa kedaluwarsanya (24 jam)
    const verificationToken = randomUUID();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 jam

    const emp = await prisma.employee.create({
      data: {
        name: body.name,
        email: body.email,
        password: '', // Password kosong — akan diisi karyawan via halaman verifikasi
        phone: body.phone ?? '',
        address: body.address ?? '',
        birthDate: body.birthDate ?? '',
        divisionId: divRec.id,
        jobTitle: body.jobTitle,
        roleId: roleRec.id,
        status: 'Menunggu',
        verificationToken,
        tokenExpires,
      },
      include: { division: true, role: true }
    });

    // Kirim email verifikasi (atau simulasi lokal)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const verificationLink = `${appUrl}/verify?token=${verificationToken}`;
    
    try {
      await sendVerificationEmail({
        toEmail: emp.email,
        toName: emp.name,
        verificationLink,
      });
    } catch (emailErr) {
      console.error('[POST /api/employees] Gagal mengirim email:', emailErr);
      // Jangan gagalkan request utama jika hanya email yang gagal
    }

    return NextResponse.json({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      password: emp.password,
      phone: emp.phone,
      address: emp.address,
      birthDate: emp.birthDate,
      division: emp.division.displayName as Division,
      jobTitle: emp.jobTitle,
      role: emp.role.name as EmployeeRole,
      status: emp.status,
      // Info tambahan untuk kebutuhan simulasi admin
      verificationLink,
    }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/employees]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Gagal menambah karyawan.' }, { status: 500 });
  }
}
