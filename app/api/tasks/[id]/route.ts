// ============================================================
// LOCO 21 PRO — API: /api/tasks/[id]
// PUT    → update task fields (status, result, revision, approve, etc.)
//          + Validasi RBAC transisi status
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
    partner: t.partners?.map((p: any) => p.name).join(', ') ?? '',
    date: t.date,
    fileName: t.fileName ?? '',
    briefFile: t.briefFile ?? '',
    revisionCount: t.revisionCount,
    completedAt: t.completedAt ?? null,
    resultLink: t.resultLink ?? '',
    resultFile: t.resultFile ?? '',
    revisionNotes: t.revisions?.length > 0 ? t.revisions[0].notes : '',
    approvedBy: t.approvals?.map((a: any) => a.approvedBy?.name ?? a.division.displayName) ?? [],
    assignee: t.assignee?.name ?? '',
    division: (t.assignee?.division?.displayName ?? 'Operation') as Division,
    project: t.project?.name ?? '',
    // Riwayat revisi lengkap untuk TaskDetailModal
    revisions: t.revisions?.map((r: any) => ({
      id: r.id,
      revisionNumber: r.revisionNumber,
      notes: r.notes,
      revisedByName: r.revisedByName,
      createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    })) ?? [],
  };
}

// Standard include for Task with all relations
const TASK_INCLUDE = {
  assignee: { include: { division: true } },
  partners: { select: { name: true, divisionId: true } },
  project: { select: { name: true } },
  approvals: { include: { division: true, approvedBy: true } },
  revisions: { orderBy: { createdAt: 'desc' as const } }, // Semua revisi untuk modal detail
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userEmail = request.headers.get('x-user-email');
    const body = await request.json();

    // Fetch user untuk validasi RBAC
    let user: any = null;
    let userRole: string | null = null;
    if (userEmail) {
      user = await prisma.employee.findUnique({ where: { email: userEmail }, include: { role: true } });
      userRole = user?.role?.name ?? null;
    }

    // Fetch task yang ada
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { assignee: true, partners: true },
    });

    if (!existingTask) {
      return NextResponse.json({ message: 'Tugas tidak ditemukan.' }, { status: 404 });
    }

    // Validasi otorisasi lintas-divisi untuk non-Admin
    if (user && userRole !== 'Admin') {
      if (
        existingTask.assignee.divisionId !== user.divisionId &&
        !existingTask.partners.some((p: any) => p.divisionId === user.divisionId)
      ) {
        return NextResponse.json(
          { message: 'Akses ditolak: Anda hanya dapat mengubah tugas di divisi Anda.' },
          { status: 403 }
        );
      }
    }

    // ── VALIDASI RBAC TRANSISI STATUS ───────────────────────
    if (body.status !== undefined && user && userRole) {
      const fromStatus = mapStatus(existingTask.status);
      const toStatus = body.status as string;

      // Tidak ada perubahan status, skip validasi
      if (fromStatus !== toStatus) {
        if (userRole === 'Karyawan') {
          // Karyawan hanya boleh mengubah tugas yang ditugaskan kepadanya
          const isOwner =
            existingTask.assigneeId === user.id ||
            existingTask.partners.some((p: any) => p.id === user.id);

          if (!isOwner) {
            return NextResponse.json(
              { message: 'Akses ditolak: Anda bukan pelaksana atau partner tugas ini.' },
              { status: 403 }
            );
          }

          // Aturan transisi yang diizinkan untuk Karyawan
          const allowedTransitions: Record<string, string[]> = {
            'To Do': ['In Progress'],
            'In Progress': ['Done'],
            'Revisi': ['In Progress', 'Done'],
          };
          const allowed = allowedTransitions[fromStatus] ?? [];
          if (!allowed.includes(toStatus)) {
            return NextResponse.json(
              { message: `Anda tidak dapat mengubah status dari "${fromStatus}" ke "${toStatus}". Perubahan status ini memerlukan peran Manager atau Admin.` },
              { status: 403 }
            );
          }

          // Karyawan wajib menyertakan bukti hasil saat mengubah ke Done
          if (toStatus === 'Done' && !body.resultLink && !body.resultFile) {
            return NextResponse.json(
              { message: 'Wajib menyertakan tautan URL atau file bukti hasil kerja saat menandai tugas sebagai selesai.' },
              { status: 422 }
            );
          }
        }

        if (userRole === 'Manager' || userRole === 'Admin') {
          // Manager/Admin HANYA boleh approve atau revisi dari status Done (DIBATALKAN - Bebas ganti status)
          // Manager/Admin tidak boleh memindahkan tugas ke To Do atau In Progress (DIBATALKAN - Bebas ganti status)
          
          // Revisi wajib disertai catatan revisi
          if (toStatus === 'Revisi' && !body.revisionNotes?.trim()) {
            return NextResponse.json(
              { message: 'Catatan revisi wajib diisi saat mengembalikan tugas untuk diperbaiki.' },
              { status: 422 }
            );
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────

    // Build dynamic update payload — only scalar fields
    const data: Record<string, any> = {};
    if (body.status !== undefined)        data.status        = toPrismaStatus(body.status) as any;
    if (body.priority !== undefined)      data.priority      = body.priority as any;
    if (body.title !== undefined)         data.title         = body.title;
    if (body.description !== undefined)   data.description   = body.description;
    if (body.date !== undefined)          data.date          = body.date;
    if (body.fileName !== undefined)      data.fileName      = body.fileName;
    if (body.briefFile !== undefined)     data.briefFile     = body.briefFile;
    if (body.completedAt !== undefined)   data.completedAt   = body.completedAt;
    if (body.resultLink !== undefined)    data.resultLink    = body.resultLink;
    if (body.resultFile !== undefined)    data.resultFile    = body.resultFile;
    if (body.revisionCount !== undefined) data.revisionCount = body.revisionCount;

    if (body.taskType !== undefined)      data.taskType      = body.taskType as any;
    if (body.priority !== undefined)      data.priority      = body.priority as any;

    // Resolve new assigneeId if assignee name changed
    if (body.assignee !== undefined) {
      const assigneeEmp = await prisma.employee.findFirst({
        where: { name: body.assignee },
        include: { division: true },
      });
      if (!assigneeEmp) {
        return NextResponse.json({ message: `Karyawan "${body.assignee}" tidak ditemukan.` }, { status: 422 });
      }

      // Validasi otorisasi jika non-Admin
      if (user && userRole !== 'Admin') {
        if (assigneeEmp.divisionId !== user.divisionId) {
          return NextResponse.json({ message: 'Anda hanya diizinkan memberikan tugas kepada karyawan di divisi Anda sendiri.' }, { status: 403 });
        }
      }
      data.assigneeId = assigneeEmp.id;
    }

    // Resolve new projectId if project name changed
    if (body.project !== undefined) {
      const proj = await prisma.project.findFirst({
        where: { name: body.project },
      });
      if (!proj) {
        return NextResponse.json({ message: `Proyek "${body.project}" tidak ditemukan.` }, { status: 422 });
      }
      data.projectId = proj.id;
    }

    // Resolve new partners if partner name changed
    if (body.partner !== undefined) {
      if (body.partner) {
        const partnerNames = body.partner.split(', ');
        const partnerEmps = await prisma.employee.findMany({ where: { name: { in: partnerNames } } });
        data.partners = {
          set: partnerEmps.map((emp) => ({ id: emp.id })),
        };
      } else {
        data.partners = {
          set: [],
        };
      }
    }

    // Handle revision notes → insert new row into task_revisions table
    if (body.revisionNotes !== undefined && body.revisionNotes.trim() !== '') {
      const existing = await prisma.task.findUnique({ where: { id }, select: { revisionCount: true } });
      await prisma.taskRevision.create({
        data: {
          taskId: id,
          revisionNumber: (existing?.revisionCount ?? 0) + 1,
          notes: body.revisionNotes,
          revisedByName: (user?.name || "Admin").split(' - ')[0].trim(),
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
            update: { approvedAt: new Date(), approvedById: user?.id },
            create: { taskId: id, divisionId: divRec.id, approvedById: user?.id },
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
        const existingTask = await prisma.task.findUnique({ where: { id }, include: { assignee: true, partners: true } });
        if (!existingTask || (existingTask.assignee.divisionId !== user.divisionId && !existingTask.partners.some((p: any) => p.divisionId === user.divisionId))) {
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
