// ============================================================
// LOCO 21 PRO — API: /api/projects
// GET  → list all projects
// POST → create a new project
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import type { ProjectStatus } from '@/src/types';

export async function GET() {
  try {
    const rows = await prisma.project.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { projectOfficer: true }
    });
    const projects = rows.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      startDate: p.startDate,
      endDate: p.endDate,
      venue: p.venue,
      status: p.status as ProjectStatus,
      projectOfficer: p.projectOfficer?.name ?? '',
    }));
    return NextResponse.json(projects);
  } catch (err) {
    console.error('[GET /api/projects]', err);
    return NextResponse.json({ message: 'Gagal mengambil data proyek.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    let projectOfficerId = null;
    if (body.projectOfficer) {
      const po = await prisma.employee.findFirst({ where: { name: body.projectOfficer } });
      if (po) projectOfficerId = po.id;
    }

    const proj = await prisma.project.create({
      data: {
        name: body.name,
        client: body.client,
        startDate: body.startDate,
        endDate: body.endDate,
        venue: body.venue,
        status: body.status as any,
        projectOfficerId,
      },
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
    }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/projects]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ message: 'Nama proyek sudah ada.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Gagal menambah proyek.' }, { status: 500 });
  }
}
