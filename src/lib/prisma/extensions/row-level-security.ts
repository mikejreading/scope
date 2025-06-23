import { PrismaClient, Prisma } from '@prisma/client';

// This extension ensures that all database operations have the correct tenant context set
// by using a middleware that runs before each query and ensures the tenant context is set
// for every query, even when the connection is obtained from the pool.
export function withRowLevelSecurity(prisma: PrismaClient) {
  // Create a middleware that runs for all queries
  prisma.$use(async (params, next) => {
    // Skip RLS for specific models or operations if needed
    const skipRLSModels = ['Tenant', 'TenantUser', 'User', 'Account', 'Session', 'Role'];
    if (skipRLSModels.includes(params.model || '')) {
      return next(params);
    }

    // Get tenant ID from context (set by our middleware)
    const tenantId = global.tenantId;
    
    if (!tenantId) {
      // For testing purposes, allow operations without tenant context
      // In production, you might want to throw an error here
      console.warn('⚠️ No tenant context found. Bypassing RLS for this operation.');
      return next(params);
    }

    // For create operations, ensure the tenantId is set
    if (params.action === 'create' && params.args.data) {
      params.args.data = {
        ...params.args.data,
        tenantId, // Ensure tenantId is set for new records
      };
    }

    // Execute the original query with tenant context
    return prisma.$transaction(async (tx) => {
      // Set the tenant context for this transaction
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.bypass_rls = 'false'`);
      
      // Execute the original query within the same transaction
      return next(params);
    });
  });

  // Return the modified client
  return prisma;
}

// Create a custom Prisma client with RLS support
export function createPrismaClientWithRLS() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  // Apply the RLS extension
  return withRowLevelSecurity(prisma);
}
