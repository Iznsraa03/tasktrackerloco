// ============================================================
// LOCO 21 PRO — API: /api/tasks/[id]
// PUT    → update task fields (status, result, revision, approve, etc.)
// DELETE → delete task by ID
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import type { Task, Division, TaskStatus, TaskType, TaskPriority } from '@/src/types';

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

function serializeTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: mapStatus(t.status),
    priority: t.priority as TaskPriority,
    taskType: t.taskType as TaskType,
    partner: t.partnerEmp?.name ?? '',
    date: t.date,
    fileName: t.fileName ?? '',
    revisionCount: t.revisionCount,
    completedAt: t.completedAt ?? null,
    resultLink: t.resultLink ?? '',
    resultFile: t.resultFile ?? '',
    revisionNotes: t.revisions?.length > 0 ? t.revisions[0].notes : '',
    approvedBy: t.approvals?.map((a: any) => a.division.displayName) ?? [],
    assignee: t.assignee?.name ?? '',
    division: (t.assignee?.division?.displayName ?? 'Operation') as Division,
    project: t.project?.name ?? '',
  };
}

// Standard include for Task with all relations
const TASK_INCLUDE = {
  assignee: { include: { division: true } },
  partnerEmp: { select: { name: true } },
  project: { select: { name: true } },
  approvals: { include: { division: true } },
  revisions: { orderBy: { createdAt: 'desc' as const }, take: 1 },
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = request.headers.get('x-user-email');
    const body = await request.json();

    // Validasi otorisasi lintas-divisi untuk non-Admin
    if (userEmail) {
      const user = await prisma.employee.findUnique({ where: { email: userEmail }, include: { role: true } });
      if (user && user.role.name !== 'Admin') {
        const existingTask = await prisma.task.findUnique({ where: { id }, include: { assignee: true, partnerEmp: true } });
        if (!existingTask || (existingTask.assignee.divisionId !== user.divisionId && existingTask.partnerEmp?.divisionId !== user.divisionId)) {
          return NextResponse.json({ message: 'Akses ditolak: Anda hanya dapat mengubah tugas di divisi Anda.' }, { status: 403 });
        }
      }
    }

    // Build dynamic update payload — only scalar fields
    const data: Record<string, any> = {};
    if (body.status !== undefined)        data.status       = toPrismaStatus(body.status) as any;
    if (body.priority !== undefined)      data.priority     = body.priority as any;
    if (body.title !== undefined)         data.title        = body.title;
    if (body.description !== undefined)   data.description  = body.description;
    if (body.date !== undefined)          data.date         = body.date;
    if (body.fileName !== undefined)      data.fileName     = body.fileName;
    if (body.completedAt !== undefined)   data.completedAt  = body.completedAt;
    if (body.resultLink !== undefined)    data.resultLink   = body.resultLink;
    if (body.resultFile !== undefined)    data.resultFile   = body.resultFile;
    if (body.revisionCount !== undefined) data.revisionCount = body.revisionCount;

    // Resolve new partnerId if partner name changed
    if (body.partner !== undefined) {
      if (body.partner) {
        const partnerEmp = await prisma.employee.findFirst({ where: { name: body.partner } });
        data.partnerId = partnerEmp?.id ?? null;
      } else {
        data.partnerId = null;
      }
    }

    // Handle revision notes → insert new row into task_revisions table
    if (body.revisionNotes !== undefined && body.revisionNotes.trim() !== '') {
      const existing = await prisma.task.findUnique({ where: { id }, select: { revisionCount: true } });
      await prisma.taskRevision.create({
        data: {
          taskId: id,
          revisionNumber: existing?.revisionCount ?? 1,
          notes: body.revisionNotes,
        },
      });
    }

    // Handle approvedBy → upsert into task_approvals table
    if (body.approvedBy !== undefined && Array.isArray(body.approvedBy)) {
      for (const divDisplayName of body.approvedBy) {
        const divRec = await prisma.division.findFirst({
          where: { OR: [{ displayName: divDisplayName }, { name: divDisplayName }] }
        });
        if (divRec) {
          await prisma.taskApproval.upsert({
            where: { taskId_divisionId: { taskId: id, divisionId: divRec.id } },
            update: { approvedAt: new Date() },
            create: { taskId: id, divisionId: divRec.id },
          });
        }
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: TASK_INCLUDE as any,
    });

    return NextResponse.json(serializeTask(task));
  } catch (err: any) {
    console.error('[PUT /api/tasks/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Tugas tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Gagal mengupdate tugas.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = request.headers.get('x-user-email');

    // Validasi otorisasi lintas-divisi untuk non-Admin
    if (userEmail) {
      const user = await prisma.employee.findUnique({ where: { email: userEmail }, include: { role: true } });
      if (user && user.role.name !== 'Admin') {
        const existingTask = await prisma.task.findUnique({ where: { id }, include: { assignee: true, partnerEmp: true } });
        if (!existingTask || (existingTask.assignee.divisionId !== user.divisionId && existingTask.partnerEmp?.divisionId !== user.divisionId)) {
          return NextResponse.json({ message: 'Akses ditolak: Anda hanya dapat menghapus tugas di divisi Anda.' }, { status: 403 });
        }
      }
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: 'Tugas berhasil dihapus.' });
  } catch (err: any) {
    console.error('[DELETE /api/tasks/[id]]', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ message: 'Tugas tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Gagal menghapus tugas.' }, { status: 500 });
  }
}
