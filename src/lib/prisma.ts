import { PrismaClient } from '@prisma/client';

// Singleton para evitar esgotar conexões no dev (hot reload) e no serverless.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
