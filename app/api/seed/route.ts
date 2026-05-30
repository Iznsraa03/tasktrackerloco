// ============================================================
// LOCO 21 PRO — API: /api/seed
// POST → seeds initial employees & projects into MySQL
//        Only seeds if each table is currently EMPTY (safe to re-run).
// ============================================================

import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

const EMPLOYEES_SEED = [
  { name: 'Muhammad Ridwan Zain', email: 'm.ridwan@pt-anda.com', phone: '08110000001', address: 'Makassar', birthDate: '1990-01-01', division: 'Operation', jobTitle: 'Direktur Operasional', role: 'Admin', status: 'Aktif', password: 'password123' },
  { name: 'Nur Rahmi', email: 'nur.rahmi@pt-anda.com', phone: '08110000002', address: 'Makassar', birthDate: '1995-01-13', division: 'Operation', jobTitle: 'HR & Procurement', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Resky Yani Fadillah', email: 'resky@pt-anda.com', phone: '08110000003', address: 'Makassar', birthDate: '1992-02-02', division: 'Admin_Finance', jobTitle: 'Manager Admin & Finance', role: 'Manager', status: 'Aktif', password: 'password123' },
  { name: 'Nurfitrianti Setyowanda', email: 'nurfitrianti@pt-anda.com', phone: '08110000004', address: 'Makassar', birthDate: '1995-03-03', division: 'Admin_Finance', jobTitle: 'Staff Admin & Finance', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Ruski', email: 'ruski@pt-anda.com', phone: '08110000005', address: 'Makassar', birthDate: '1996-03-04', division: 'Admin_Finance', jobTitle: 'Staff Admin & Finance', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Isti Trisnawati', email: 'isti@pt-anda.com', phone: '08110000006', address: 'Makassar', birthDate: '1991-04-04', division: 'Marketing', jobTitle: 'Manager Marketing', role: 'Manager', status: 'Aktif', password: 'password123' },
  { name: 'Syafa Nuramadana Ananta', email: 'syafa@pt-anda.com', phone: '08110000007', address: 'Makassar', birthDate: '1996-05-05', division: 'Marketing', jobTitle: 'Manager Marketing', role: 'Manager', status: 'Aktif', password: 'password123' },
  { name: 'Wahyuningsih Astry', email: 'wahyuningsih@pt-anda.com', phone: '08110000008', address: 'Makassar', birthDate: '1997-06-06', division: 'Marketing', jobTitle: 'Staff Marketing', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Muh Fajar Dwi Putra', email: 'fajar@pt-anda.com', phone: '08110000009', address: 'Makassar', birthDate: '1998-07-07', division: 'Marketing', jobTitle: 'Staff Marketing', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Kiswah Anugrah Basis', email: 'kiswah@pt-anda.com', phone: '08110000010', address: 'Makassar', birthDate: '1999-08-08', division: 'Marketing', jobTitle: 'Staff Marketing', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Rideks', email: 'rideks@pt-anda.com', phone: '08110000011', address: 'Makassar', birthDate: '1990-09-09', division: 'Creative_Program', jobTitle: 'Manager Creative & Program', role: 'Manager', status: 'Aktif', password: 'password123' },
  { name: 'Ihram Naufal', email: 'ihram@pt-anda.com', phone: '08110000012', address: 'Makassar', birthDate: '1997-10-10', division: 'Creative_Program', jobTitle: 'Staff Creative', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Muh. Surya Syah Putra', email: 'surya@pt-anda.com', phone: '08110000013', address: 'Makassar', birthDate: '1998-11-11', division: 'Creative_Program', jobTitle: 'Staff Creative', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Laras Candena', email: 'laras@pt-anda.com', phone: '08110000014', address: 'Makassar', birthDate: '1999-01-14', division: 'Creative_Program', jobTitle: 'Staff Program', role: 'Karyawan', status: 'Aktif', password: 'password123' },
  { name: 'Aulira Harliza Rahwa', email: 'aulira@pt-anda.com', phone: '08110000015', address: 'Makassar', birthDate: '1999-12-12', division: 'Creative_Program', jobTitle: 'Staff Program', role: 'Karyawan', status: 'Aktif', password: 'password123' },
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

    if (empCount === 0) {
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
