// ============================================================
// LOCO 21 PRO — Prisma Client Singleton
// Skill: prisma-database-setup (references/prisma-client-setup.md)
//        & references/mysql.md (PrismaMariaDb adapter)
// ============================================================

import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Build adapter from individual env vars (recommended for MySQL/MariaDB)
const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  connectionLimit: 5,
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'loco21_db',
});

// ─── Singleton pattern ────────────────────────────────────────
// Reuse a single instance per process to avoid exhausting
// the MySQL connection pool (skill rule: "Use a single instance").
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
