// ============================================================
// LOCO 21 PRO — API: /api/employees
// GET  → list all employees
// POST → create a new employee
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
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

    const emp = await prisma.employee.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password ?? 'password123',
        phone: body.phone ?? '',
        address: body.address ?? '',
        birthDate: body.birthDate ?? '',
        divisionId: divRec.id,
        jobTitle: body.jobTitle,
        roleId: roleRec.id,
        status: 'Menunggu',
      },
      include: { division: true, role: true }
    });
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
    }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/employees]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Gagal menambah karyawan.' }, { status: 500 });
  }
}
