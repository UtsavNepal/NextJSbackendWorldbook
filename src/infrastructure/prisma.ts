import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'postgresql://build:build@127.0.0.1:5432/build';
  }
  return undefined;
}

function createPrismaClient() {
  const url = datasourceUrl();
  return new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
