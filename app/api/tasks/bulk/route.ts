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
      createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    })) ?? [],
  };
}

export async function POST(request: Request) {
  try {
    const userEmail = request.headers.get('x-user-email');
    const body = await request.json();
    const rows = Array.isArray(body) ? body : [];

    if (rows.length === 0) {
      return NextResponse.json({ success: 0, errors: ['Payload kosong.'], createdTasks: [] });
    }

    // 1. Fetch lookup maps to avoid N+1 queries
    const allEmployees = await prisma.employee.findMany({ include: { division: true, role: true } });
    const allProjects = await prisma.project.findMany();

    const empMap = new Map(allEmployees.map(e => [e.name, e]));
    const projMap = new Map(allProjects.map(p => [p.name, p]));
    
    // Auth logic
    const currentUser = userEmail ? allEmployees.find(e => e.email === userEmail) : null;
    const isAdmin = currentUser?.role?.name === 'Admin';

    let success = 0;
    const errors: string[] = [];
    const operations: any[] = [];

    // 2. Validate in-memory
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowTitle = row.title || `Baris ${i + 1}`;

      const assigneeEmp = empMap.get(row.assignee);
      if (!assigneeEmp) {
        errors.push(`"${rowTitle}": Karyawan "${row.assignee}" tidak ditemukan.`);
        continue;
      }

      if (row.division && assigneeEmp.division?.displayName !== row.division && assigneeEmp.division?.name !== row.division) {
        errors.push(`"${rowTitle}": Karyawan "${row.assignee}" bukan berasal dari divisi ${row.division}.`);
        continue;
      }

      if (currentUser && !isAdmin) {
        if (assigneeEmp.divisionId !== currentUser.divisionId) {
          errors.push(`"${rowTitle}": Anda hanya diizinkan membuat tugas untuk divisi Anda sendiri.`);
          continue;
        }
      }

      const proj = projMap.get(row.project);
      if (!proj) {
        errors.push(`"${rowTitle}": Proyek "${row.project}" tidak ditemukan.`);
        continue;
      }

      let partnersConnect: { id: string }[] = [];
      if (row.partner) {
        const partnerNames = row.partner.split(', ');
        for (const pname of partnerNames) {
          const pEmp = empMap.get(pname);
          if (pEmp) {
            partnersConnect.push({ id: pEmp.id });
          }
        }
      }

      operations.push(
        prisma.task.create({
          data: {
            title: row.title,
            description: row.description ?? '',
            status: 'To_Do' as any,
            priority: (row.priority ?? 'Medium') as any,
            taskType: (row.taskType ?? 'Core') as any,
            date: row.date,
            fileName: row.fileName ?? '',
            briefFile: row.briefFile ?? '',
            revisionCount: 0,
            completedAt: null,
            resultLink: '',
            resultFile: '',
            assigneeId: assigneeEmp.id,
            projectId: proj.id,
            partners: { connect: partnersConnect },
          },
        })
      );
    }

    // 3. Execute bulk transaction atomically
    let createdTasks: any[] = [];
    if (operations.length > 0) {
      const rawCreated = await prisma.$transaction(operations, {
        timeout: 30000, // 30 seconds
      });
      success = rawCreated.length;

      // Fetch full task data with includes in a single query
      const createdIds = rawCreated.map((t: any) => t.id);
      createdTasks = await prisma.task.findMany({
        where: { id: { in: createdIds } },
        include: {
          assignee: { include: { division: true } },
          partners: { select: { name: true, divisionId: true } },
          project: { select: { name: true } },
          approvals: { include: { division: true } },
          revisions: { orderBy: { createdAt: 'desc' } },
        },
      });
    }

    return NextResponse.json({ success, errors, createdTasks: createdTasks.map(serializeTask) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tasks/bulk]', err);
    return NextResponse.json({ message: 'Gagal memproses bulk import.' }, { status: 500 });
  }
}
