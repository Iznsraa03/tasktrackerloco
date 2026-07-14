// ============================================================
// LOCO 21 PRO — API: /api/bootstrap
// GET → returns employees, projects, and tasks in one request
//       to minimize round-trips on initial app load.
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import type { Division, TaskStatus, TaskType, TaskPriority, ProjectStatus, EmployeeRole, EmployeeStatus } from '@/src/types';

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

export async function GET(request: Request) {
  try {
    const userEmail = request.headers.get('x-user-email');
    let taskWhereClause: any = {};

    if (userEmail) {
      const user = await prisma.employee.findUnique({
        where: { email: userEmail },
        include: { role: true },
      });
      if (user && user.role.name !== 'Admin') {
        taskWhereClause = {
          OR: [
            { assignee: { divisionId: user.divisionId } },
            { partners: { some: { divisionId: user.divisionId } } },
          ],
        };
      }
    }

    // Run all three queries in parallel for performance
    const [employeeRows, projectRows, taskRows] = await Promise.all([
      prisma.employee.findMany({ 
        orderBy: { name: 'asc' },
        include: { division: true, role: true }
      }),
      prisma.project.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: { projectOfficer: true }
      }),
      prisma.task.findMany({
        where: taskWhereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { include: { division: true } },
          partners: { select: { name: true, divisionId: true } },
          project: { select: { name: true } },
          approvals: { include: { division: true, approvedBy: true } },
          revisions: { orderBy: { createdAt: 'desc' } }, // Semua revisi
        },
      }),
    ]);

    const employees = employeeRows.map((e) => ({
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

    const projects = projectRows.map((p) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      startDate: p.startDate,
      endDate: p.endDate,
      venue: p.venue,
      status: p.status as ProjectStatus,
      projectOfficer: p.projectOfficer?.name ?? '',
    }));

    const tasks = taskRows.map((t) => ({
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
      revisionNotes: t.revisions.length > 0 ? t.revisions[0].notes : '',
      approvedBy: t.approvals.map(a => a.approvedBy?.name ?? a.division.displayName),
      assignee: t.assignee?.name ?? '',
      division: t.assignee?.division?.displayName ?? 'Operation',
      project: t.project?.name ?? '',
      revisions: t.revisions.map((r: any) => ({
        id: r.id,
        revisionNumber: r.revisionNumber,
        notes: r.notes,
        revisedByName: r.revisedByName,
        createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
      })),
    }));

    return NextResponse.json({ employees, projects, tasks });
  } catch (err) {
    console.error('[GET /api/bootstrap]', err);
    return NextResponse.json({ message: 'Gagal memuat data awal.' }, { status: 500 });
  }
}
