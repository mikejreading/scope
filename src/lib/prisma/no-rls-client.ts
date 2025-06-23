import { PrismaClient } from '@prisma/client';

/**
 * A Prisma client that doesn't include the RLS extension.
 * This is used for API documentation and other non-tenant-specific operations.
 */
const prismaNoRls = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prismaNoRls };

// This prevents creating new instances during hot-reloading in development
const globalForPrisma = global as unknown as { prismaNoRls: typeof prismaNoRls };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaNoRls = prismaNoRls;
}

export default prismaNoRls;
