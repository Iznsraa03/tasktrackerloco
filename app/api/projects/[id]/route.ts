// ============================================================
// LOCO 21 PRO — API: /api/projects/[id]
// PUT → update project by ID
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {
      name: body.name,
      client: body.client,
      startDate: body.startDate,
      endDate: body.endDate,
      venue: body.venue,
      status: body.status as any,
    };

    if (body.projectOfficer) {
      const po = await prisma.employee.findFirst({ where: { name: body.projectOfficer } });
      if (po) updateData.projectOfficerId = po.id;
    }

    const proj = await prisma.project.update({
      where: { id },
      data: updateData,
      include: { projectOfficer: true }
    });
    
    return NextResponse.json({
      id: proj.id,
      name: proj.name,
      client: proj.client,
      startDate: proj.startDate,
      endDate: proj.endDate,
      venue: proj.venue,
      status: proj.status,
      projectOfficer: proj.projectOfficer?.name ?? '',
    });
  } catch (err: any) {
    console.error('[PUT /api/projects/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Proyek tidak ditemukan.' }, { status: 404 });
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'Nama proyek sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Gagal mengupdate proyek.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: 'Proyek berhasil dihapus.' });
  } catch (err: any) {
    console.error('[DELETE /api/projects/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Proyek tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Gagal menghapus proyek.' }, { status: 500 });
  }
}
