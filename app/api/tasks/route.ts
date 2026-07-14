// ============================================================
// LOCO 21 PRO — API: /api/tasks
// GET  → list all tasks (with flat assignee/partner/project names)
// POST → create a new task (resolves assigneeId, partnerId, projectId by name)
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import type { Task, Division, TaskStatus, TaskType, TaskPriority } from '@/src/types';

// Prisma TaskStatus enum key → frontend display string
function mapStatus(s: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    To_Do: 'To Do',
    In_Progress: 'In Progress',
    Revisi: 'Revisi',
    Done: 'Done',
    Approved: 'Approved',
  };
  return map[s] ?? (s as TaskStatus);
}

// Frontend display string → Prisma TaskStatus enum key
function toPrismaStatus(s: string): string {
  const map: Record<string, string> = {
    'To Do': 'To_Do',
    'In Progress': 'In_Progress',
    Revisi: 'Revisi',
    Done: 'Done',
    Approved: 'Approved',
  };
  return map[s] ?? s;
}

// Serialize a Prisma task row with its includes into the frontend Task shape
function serializeTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: mapStatus(t.status),
    priority: t.priority as TaskPriority,
    taskType: t.taskType as TaskType,
    partner: t.partners?.map((p: any) => p.name).join(', ') ?? '',
    date: t.date,
    fileName: t.fileName ?? '',
    briefFile: t.briefFile ?? '',
    revisionCount: t.revisionCount,
    completedAt: t.completedAt ?? null,
    resultLink: t.resultLink ?? '',
    resultFile: t.resultFile ?? '',
    revisionNotes: t.revisions?.length > 0 ? t.revisions[0].notes : '',
    approvedBy: t.approvals?.map((a: any) => a.division.displayName) ?? [],
    assignee: t.assignee?.name ?? '',
    division: (t.assignee?.division?.displayName ?? 'Operation') as Division,
    project: t.project?.name ?? '',
    revisions: t.revisions?.map((r: any) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      notes: r.notes,
      revisedByName: r.revisedByName,
      createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    })) ?? [],
  };
}

export async function GET(request: Request) {
  try {
    const userEmail = request.headers.get('x-user-email');
    let whereClause: any = {};

    if (userEmail) {
      const user = await prisma.employee.findUnique({
        where: { email: userEmail },
        include: { role: true },
      });
      if (user && user.role.name !== 'Admin') {
        whereClause = {
          OR: [
            { assignee: { divisionId: user.divisionId } },
            { partners: { some: { divisionId: user.divisionId } } },
          ],
        };
      }
    }

    const rows = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { include: { division: true } },
        partners: { select: { name: true, divisionId: true } },
        project: { select: { name: true } },
        approvals: { include: { division: true } },
        revisions: { orderBy: { createdAt: 'desc' } }, // Semua revisi untuk modal detail
      },
    });
    return NextResponse.json(rows.map(serializeTask));
  } catch (err) {
    console.error('[GET /api/tasks]', err);
    return NextResponse.json({ message: 'Gagal mengambil data tugas.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = request.headers.get('x-user-email');
    const body = await request.json();

    // Resolve assignee by name
    const assigneeEmp = await prisma.employee.findFirst({
      where: { name: body.assignee },
      include: { division: true },
    });
    if (!assigneeEmp) {
      return NextResponse.json({ message: `Karyawan "${body.assignee}" tidak ditemukan.` }, { status: 422 });
    }

    if (body.division && assigneeEmp.division?.displayName !== body.division && assigneeEmp.division?.name !== body.division) {
      return NextResponse.json({ message: `Karyawan "${body.assignee}" bukan berasal dari divisi ${body.division}.` }, { status: 400 });
    }

    // Validasi otorisasi pembuatan tugas untuk non-Admin
    if (userEmail) {
      const user = await prisma.employee.findUnique({
        where: { email: userEmail },
        include: { role: true },
      });
      if (user && user.role.name !== 'Admin') {
        if (assigneeEmp.divisionId !== user.divisionId) {
          return NextResponse.json({ message: 'Anda hanya diizinkan membuat tugas untuk divisi Anda sendiri.' }, { status: 403 });
        }
      }
    }

    // Resolve project by name
    const proj = await prisma.project.findFirst({
      where: { name: body.project },
    });
    if (!proj) {
      return NextResponse.json({ message: `Proyek "${body.project}" tidak ditemukan.` }, { status: 422 });
    }

    // Resolve multiple partners by name (optional)
    let partnersConnect: { id: string }[] = [];
    if (body.partner) {
      const partnerNames = body.partner.split(', ');
      const partnerEmps = await prisma.employee.findMany({
        where: { name: { in: partnerNames } },
      });
      partnersConnect = partnerEmps.map((emp) => ({ id: emp.id }));
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? '',
        status: 'To_Do' as any,
        priority: (body.priority ?? 'Medium') as any,
        taskType: (body.taskType ?? 'Core') as any,
        date: body.date,
        fileName: body.fileName ?? '',
        briefFile: body.briefFile ?? '',
        revisionCount: 0,
        completedAt: null,
        resultLink: '',
        resultFile: '',
        assigneeId: assigneeEmp.id,
        projectId: proj.id,
        partners: { connect: partnersConnect },
      },
      include: {
        assignee: { include: { division: true } },
        partners: { select: { name: true, divisionId: true } },
        project: { select: { name: true } },
        approvals: { include: { division: true } },
        revisions: { orderBy: { createdAt: 'desc' } },
      },
    });

    return NextResponse.json(serializeTask(task), { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks]', err);
    return NextResponse.json({ message: 'Gagal membuat tugas.' }, { status: 500 });
  }
}
