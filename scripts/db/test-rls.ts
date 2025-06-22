import { PrismaClient, Prisma } from '@prisma/client';
import { createScopedPrisma } from '@/lib/prisma';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

async function main() {
  console.log('Testing row-level security...');
  
  // Create a direct Prisma client (bypassing RLS for setup)
  const adminPrisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Connect to the database
    await adminPrisma.$connect();
    console.log('Connected to database');

    // Create test tenants
    console.log('Creating test tenants...');
    const [tenant1, tenant2] = await Promise.all([
      adminPrisma.tenant.upsert({
        where: { id: 'test-tenant-1' },
        update: {},
        create: {
          id: 'test-tenant-1',
          name: 'Test Tenant 1',
          type: 'SCHOOL',
          status: 'ACTIVE',
        },
      }),
      adminPrisma.tenant.upsert({
        where: { id: 'test-tenant-2' },
        update: {},
        create: {
          id: 'test-tenant-2',
          name: 'Test Tenant 2',
          type: 'SCHOOL',
          status: 'ACTIVE',
        },
      }),
    ]);

    console.log('Created test tenants:', { tenant1: tenant1.id, tenant2: tenant2.id });

    // Create test feature flags for each tenant
    console.log('Creating test feature flags...');
    const [feature1, feature2] = await Promise.all([
      adminPrisma.featureFlag.create({
        data: {
          name: 'FEATURE_A',
          isEnabled: true,
          tenant: { connect: { id: tenant1.id } },
        },
      }),
      adminPrisma.featureFlag.create({
        data: {
          name: 'FEATURE_B',
          isEnabled: false,
          tenant: { connect: { id: tenant2.id } },
        },
      }),
    ]);

    console.log('Created test feature flags:', { 
      feature1: { id: feature1.id, tenantId: feature1.tenantId },
      feature2: { id: feature2.id, tenantId: feature2.tenantId },
    });

    // Test RLS by querying with tenant context
    console.log('\n--- Testing RLS ---');
    
    // Create scoped Prisma clients for each tenant
    const tenant1Prisma = createScopedPrisma(tenant1.id);
    const tenant2Prisma = createScopedPrisma(tenant2.id);

    // Test that each tenant can only see their own feature flags
    const tenant1Features = await tenant1Prisma.featureFlag.findMany();
    const tenant2Features = await tenant2Prisma.featureFlag.findMany();

    console.log(`Tenant 1 (${tenant1.id}) features:`, tenant1Features.map(f => ({
      id: f.id,
      name: f.name,
      isEnabled: f.isEnabled,
      tenantId: f.tenantId,
    })));

    console.log(`Tenant 2 (${tenant2.id}) features:`, tenant2Features.map(f => ({
      id: f.id,
      name: f.name,
      isEnabled: f.isEnabled,
      tenantId: f.tenantId,
    })));

    // Verify that each tenant can only see their own data
    const tenant1SeesOnlyTheirData = tenant1Features.every(f => f.tenantId === tenant1.id);
    const tenant2SeesOnlyTheirData = tenant2Features.every(f => f.tenantId === tenant2.id);

    console.log('\n--- RLS Test Results ---');
    console.log(`Tenant 1 sees only their data: ${tenant1SeesOnlyTheirData ? '✅' : '❌'}`);
    console.log(`Tenant 2 sees only their data: ${tenant2SeesOnlyTheirData ? '✅' : '❌'}`);

    if (tenant1SeesOnlyTheirData && tenant2SeesOnlyTheirData) {
      console.log('\n✅ RLS is working correctly!');
    } else {
      console.error('\n❌ RLS is not working as expected');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error testing RLS:', error);
    process.exit(1);
  } finally {
    await adminPrisma.$disconnect();
  }
}

// Run the test
main();
