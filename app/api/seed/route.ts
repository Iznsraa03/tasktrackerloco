// ============================================================
// LOCO 21 PRO — API: /api/seed
// POST → seeds initial employees & projects into MySQL
//        Only seeds if each table is currently EMPTY (safe to re-run).
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

const EMPLOYEES_SEED = [
  { name: 'Super Admin', email: 'superadmin@admin.com', phone: '08110000001', address: 'Makassar', birthDate: '1990-01-01', division: 'Operation', jobTitle: 'Direktur Operasional', role: 'Admin', status: 'Aktif', password: 'admin@751' },
];

const PROJECTS_SEED = [
  { name: 'Promo Ramadhan 2026', client: 'PT Maju Bersama', startDate: '2026-03-01', endDate: '2026-03-30', venue: 'Jakarta Selatan', status: 'Fix', projectOfficer: 'Isti Trisnawati' },
  { name: 'Maintenance Tahunan', client: 'Internal', startDate: '2026-04-15', endDate: '2026-04-16', venue: 'Data Center Pusat', status: 'Pending', projectOfficer: 'Muhammad Ridwan Zain' },
  { name: 'Rebranding Perusahaan', client: 'Internal', startDate: '2026-05-10', endDate: '2026-06-10', venue: 'Head Office', status: 'Pitching', projectOfficer: 'Rideks' },
  { name: 'Peluncuran Produk Q3', client: 'PT Cipta Karya', startDate: '2026-05-15', endDate: '2026-05-25', venue: 'Makassar', status: 'Fix', projectOfficer: 'Rideks' },
];

export async function POST() {
  try {
    // Ensure master data (divisions & roles) exists
    const divisionDefaults = [
      { name: 'Operation', displayName: 'Operation' },
      { name: 'Admin_Finance', displayName: 'Admin & Finance' },
      { name: 'Marketing', displayName: 'Marketing' },
      { name: 'Creative_Program', displayName: 'Creative & Program' },
    ];
    for (const d of divisionDefaults) {
      await prisma.division.upsert({ where: { name: d.name }, update: {}, create: d });
    }
    const roleDefaults = [
      { name: 'Admin', displayName: 'Admin' },
      { name: 'Manager', displayName: 'Manager' },
      { name: 'Karyawan', displayName: 'Karyawan' },
    ];
    for (const r of roleDefaults) {
      await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r });
    }

    const divisionMap = Object.fromEntries(
      (await prisma.division.findMany()).map(d => [d.name, d.id])
    );
    const roleMap = Object.fromEntries(
      (await prisma.role.findMany()).map(r => [r.name, r.id])
    );

    const empCount = await prisma.employee.count();
    const projCount = await prisma.project.count();

    let empSeeded = 0;
    let projSeeded = 0;

    for (const emp of EMPLOYEES_SEED) {
      await prisma.employee.upsert({
        where: { email: emp.email },
        update: {},
        create: {
          name: emp.name,
          email: emp.email,
          password: emp.password,
          phone: emp.phone,
          address: emp.address,
          birthDate: emp.birthDate,
          divisionId: divisionMap[emp.division],
          jobTitle: emp.jobTitle,
          roleId: roleMap[emp.role],
          status: emp.status as any,
        },
      });
      empSeeded++;
    }

    if (projCount === 0) {
      for (const proj of PROJECTS_SEED) {
        const po = await prisma.employee.findFirst({ where: { name: proj.projectOfficer } });
        await prisma.project.upsert({
          where: { name: proj.name },
          update: {},
          create: {
            name: proj.name,
            client: proj.client,
            startDate: proj.startDate,
            endDate: proj.endDate,
            venue: proj.venue,
            status: proj.status as any,
            projectOfficerId: po?.id ?? null,
          },
        });
        projSeeded++;
      }
    }

    return NextResponse.json({
      message: 'Seeding selesai.',
      employeesSeeded: empSeeded,
      projectsSeeded: projSeeded,
      skippedEmployees: empCount > 0,
      skippedProjects: projCount > 0,
    });
  } catch (err) {
    console.error('[POST /api/seed]', err);
    return NextResponse.json({ message: 'Seeding gagal.' }, { status: 500 });
  }
}
