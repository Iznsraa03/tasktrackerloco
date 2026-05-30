// ============================================================
// LOCO 21 PRO — API: /api/employees/[id]
// PUT    → update employee by ID
// DELETE → delete employee by ID
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import type { Division, EmployeeRole } from '@/src/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      birthDate: body.birthDate,
      jobTitle: body.jobTitle,
      status: body.status,
      ...(body.password ? { password: body.password } : {}),
    };

    if (body.division) {
      const divRec = await prisma.division.findFirst({
        where: { OR: [{ name: body.division }, { displayName: body.division }] }
      });
      if (divRec) updateData.divisionId = divRec.id;
    }

    if (body.role) {
      const roleRec = await prisma.role.findFirst({
        where: { OR: [{ name: body.role }, { displayName: body.role }] }
      });
      if (roleRec) updateData.roleId = roleRec.id;
    }

    const emp = await prisma.employee.update({
      where: { id },
      data: updateData,
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
    });
  } catch (err: any) {
    console.error('[PUT /api/employees/[id]]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'Email sudah digunakan.' }, { status: 409 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Gagal mengupdate karyawan.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ message: 'Karyawan berhasil dihapus.' });
  } catch (err: any) {
    console.error('[DELETE /api/employees/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Gagal menghapus karyawan.' }, { status: 500 });
  }
}
