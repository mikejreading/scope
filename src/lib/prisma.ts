import { PrismaClient } from '@prisma/client';
import { withRowLevelSecurity } from './prisma/extensions/row-level-security';
import { setupRowLevelSecurity, setTenantContext } from './prisma/rls';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

type PrismaClientWithRLS = ReturnType<typeof withRowLevelSecurity>;

const globalForPrisma = global as unknown as { 
  prisma: PrismaClientWithRLS | undefined;
  rlsInitialized: boolean;
};

// Create base Prisma client
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Add RLS extension to the Prisma client
const prisma = withRowLevelSecurity(prismaClient);

// Store the Prisma client in the global object in development
// This prevents creating new instances during hot-reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize RLS on the database
async function initializeRLS() {
  if (process.env.NODE_ENV === 'production' || !globalForPrisma.rlsInitialized) {
    try {
      await setupRowLevelSecurity(prisma);
      globalForPrisma.rlsInitialized = true;
      console.log('Row-level security initialized');
    } catch (error) {
      console.error('Failed to initialize row-level security:', error);
    }
  }
}

// Run RLS initialization in development
if (process.env.NODE_ENV !== 'production') {
  initializeRLS().catch(console.error);
}

// Export the Prisma client with RLS
export { prisma };

// Function to create a scoped Prisma client with tenant context
export function createScopedPrisma(tenantId: string) {
  // Set the tenant context for the current request
  setTenantContext(tenantId);
  
  // Return the Prisma client with the tenant context
  return prisma;
}

// Export all Prisma types for easy importing
export * from '@prisma/client';

// Export Prisma client instance as default
export default prisma;
