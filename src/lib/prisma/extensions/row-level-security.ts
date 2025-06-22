import { PrismaClient, Prisma } from '@prisma/client';

export function withRowLevelSecurity(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Skip RLS for specific models or operations if needed
          if (['Tenant', 'TenantUser', 'User', 'Account', 'Session'].includes(model || '')) {
            return query(args);
          }

          // Get tenant ID from context (set by our middleware)
          const tenantId = global.tenantId;
          
          if (!tenantId) {
            throw new Error('Tenant context not found. Ensure tenant middleware is properly configured.');
          }

          // For create operations, ensure the tenantId is set
          if (operation === 'create') {
            args.data = {
              ...args.data,
              tenant: { connect: { id: tenantId } },
            };
          }

          // For findMany, update, delete, etc., add tenant filter
          if (['findMany', 'findFirst', 'findUnique', 'update', 'delete', 'count'].includes(operation)) {
            args.where = {
              ...args.where,
              tenantId,
            };
          }

          return query(args);
        },
      },
    },
  });
}
