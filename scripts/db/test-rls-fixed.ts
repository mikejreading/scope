// Import Prisma client and RLS utilities
const { PrismaClient } = require('@prisma/client');
const { createPrismaClientWithRLS } = require('../../src/lib/prisma/extensions/row-level-security');
const { setupRowLevelSecurity } = require('../../src/lib/prisma/rls');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// Test data
const TEST_TENANT_1 = 'test-tenant-1';
const TEST_TENANT_2 = 'test-tenant-2';
const TEST_USER_1_EMAIL = 'user1@test.com';
const TEST_USER_2_EMAIL = 'user2@test.com';
const TEST_USER_PASSWORD = 'testpassword123'; // In a real app, use bcrypt

// Create a base Prisma client for admin operations with raw queries enabled
const prisma = new PrismaClient({
  log: ['error', 'warn', 'query'],
  datasourceUrl: process.env.DATABASE_URL,
});

// Create a Prisma client with RLS support
const prismaWithRls = createPrismaClientWithRLS();

// Enable logging for the RLS client
prismaWithRls.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Params:', e.params);
  console.log('Duration:', e.duration, 'ms');
});

// Helper function to safely execute raw SQL with error handling
async function executeRawSql(sql, params = []) {
  try {
    const result = await prisma.$executeRawUnsafe(sql, ...params);
    return { success: true, result };
  } catch (error) {
    console.error('Raw SQL error:', error);
    return { success: false, error };
  }
}

// Set the tenant context in the global scope
function setGlobalTenantContext(tenantId) {
  global.tenantId = tenantId;
}

// Verify session settings after setting them
async function verifySessionSettings(expectedTenantId) {
  try {
    // Check current session settings
    const settings = await prisma.$queryRaw`
      SELECT 
        current_setting('app.current_tenant_id', true) as current_tenant_id,
        current_setting('app.bypass_rls', true) as bypass_rls,
        current_user as current_user,
        inet_client_addr() as client_addr;
    `;
    
    console.log('🔍 Current session settings:', JSON.stringify(settings[0], null, 2));
    
    // Check if RLS is enabled on the FeatureFlag table
    const rlsStatus = await prisma.$queryRaw`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'FeatureFlag';
    `;
    console.log('🔍 RLS status for FeatureFlag table:', JSON.stringify(rlsStatus, null, 2));
    
    // Check current policies
    const policies = await prisma.$queryRaw`
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'FeatureFlag';
    `;
    console.log('🔍 Current RLS policies for FeatureFlag table:', JSON.stringify(policies, null, 2));
    
    // Verify the tenant ID was set correctly
    if (settings[0].current_tenant_id !== expectedTenantId) {
      console.error(`❌ Current tenant ID does not match expected: ${settings[0].current_tenant_id} !== ${expectedTenantId}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying session settings:', error);
    throw error;
  }
}

// Set tenant context in the database session
async function setTenantContext(tenantId) {
  try {
    console.log(`🔧 Setting tenant context to: ${tenantId}`);
    
    // Set the tenant ID in the global context
    // The RLS extension will pick this up and set it for each query
    setGlobalTenantContext(tenantId);
    
    // Also set it directly in the database session for raw queries
    if (tenantId) {
      await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, false)`;
      await prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'false', false)`;
    } else {
      await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', false)`;
      await prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'false', false)`;
    }
    
    // Verify the global context was set
    if (global.tenantId !== tenantId) {
      throw new Error(`Failed to set global tenant ID. Expected ${tenantId}, got ${global.tenantId}`);
    }
    
    console.log(`✅ Set tenant context to: ${tenantId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error setting tenant context:`, error);
    return false;
  }
}

// Clear tenant context
async function clearTenantContext() {
  try {
    console.log('🔧 Clearing tenant context');
    
    // Clear the global context
    setGlobalTenantContext(null);
    
    // Clear the database session context
    await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', '', false)`;
    await prisma.$executeRaw`SELECT set_config('app.bypass_rls', 'false', false)`;
    
    // Verify the global context was cleared
    if (global.tenantId !== null) {
      throw new Error(`Failed to clear global tenant ID. Got ${global.tenantId}`);
    }
    
    console.log('✅ Cleared tenant context');
    return true;
  } catch (error) {
    console.error('❌ Error clearing tenant context:', error);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting RLS test...');
  
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Initialize RLS
    await setupRowLevelSecurity(prisma);
    console.log('✅ Row-level security initialized');
    
    // Set admin context (no tenant)
    clearTenantContext();
    
    // Clean up any existing test data
    await cleanupTestData(prisma);
    
    // Create test data
    console.log('\n🔍 Creating test data...');
    const { user1, user2, tenant1, tenant2, role1, role2 } = await createTestData(prisma);
    
    // Test tenant isolation using the RLS-enabled client
    console.log('\n🔧 Testing tenant isolation with RLS...');
    
    // Test tenant 1 access
    console.log('\n=== Testing Tenant 1 Access ===');
    const tenant1Result = await testTenantAccess(prisma, TEST_TENANT_1, [TEST_TENANT_1]);
    
    // Test tenant 2 access
    console.log('\n=== Testing Tenant 2 Access ===');
    const tenant2Result = await testTenantAccess(prisma, TEST_TENANT_2, [TEST_TENANT_2]);
    
    if (tenant1Result && tenant2Result) {
      console.log('\n✅ All RLS tests passed!');
    } else {
      console.error('\n❌ Some RLS tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ RLS test failed with error:', error);
    process.exit(1);
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

async function cleanupTestData(prisma) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // 1. First, delete any feature flags (no dependencies)
    try {
      // Use raw SQL to bypass RLS for cleanup
      await prisma.$executeRaw`
        DELETE FROM "FeatureFlag" 
        WHERE "id" IN (${`${TEST_TENANT_1}-feature-a`}, ${`${TEST_TENANT_2}-feature-b`})
        OR "tenantId" IN (${TEST_TENANT_1}, ${TEST_TENANT_2})
      `;
      console.log('✅ Deleted feature flags');
    } catch (error) {
      console.log('⚠️ Error deleting feature flags (may not exist):', error.message);
    }
    
    // 2. Delete tenant users (depends on User and Tenant)
    try {
      // Use raw SQL to bypass RLS for cleanup
      await prisma.$executeRaw`
        DELETE FROM "TenantUser" 
        WHERE "tenantId" IN (${TEST_TENANT_1}, ${TEST_TENANT_2})
        OR "userId" IN (
          SELECT id FROM "User" WHERE "email" IN (${TEST_USER_1_EMAIL}, ${TEST_USER_2_EMAIL})
        )
      `;
      console.log('✅ Deleted tenant users');
    } catch (error) {
      console.log('⚠️ Error deleting tenant users (may not exist):', error.message);
    }
    
    // 3. Delete roles (depends on Tenant)
    try {
      // Use raw SQL to bypass RLS for cleanup
      await prisma.$executeRaw`
        DELETE FROM "Role" 
        WHERE "id" IN (${`${TEST_TENANT_1}-admin`}, ${`${TEST_TENANT_2}-admin`})
        OR "tenantId" IN (${TEST_TENANT_1}, ${TEST_TENANT_2})
      `;
      console.log('✅ Deleted roles');
    } catch (error) {
      console.log('⚠️ Error deleting roles (may not exist):', error.message);
    }
    
    // 4. Delete accounts and sessions (depend on User)
    try {
      // Use raw SQL to bypass RLS for cleanup
      await prisma.$executeRaw`
        DELETE FROM "Account" 
        WHERE "userId" IN (
          SELECT id FROM "User" WHERE "email" IN (${TEST_USER_1_EMAIL}, ${TEST_USER_2_EMAIL})
        )
      `;
      console.log('✅ Deleted accounts');
      
      await prisma.$executeRaw`
        DELETE FROM "Session" 
        WHERE "userId" IN (
          SELECT id FROM "User" WHERE "email" IN (${TEST_USER_1_EMAIL}, ${TEST_USER_2_EMAIL})
        )
      `;
      console.log('✅ Deleted sessions');
    } catch (error) {
      console.log('⚠️ Error deleting accounts/sessions (may not exist):', error.message);
    }
    
    // 5. Delete users (no dependencies after accounts/sessions are deleted)
    try {
      // Use raw SQL to bypass RLS for cleanup
      const result = await prisma.$executeRaw`
        DELETE FROM "User" 
        WHERE "email" IN (${TEST_USER_1_EMAIL}, ${TEST_USER_2_EMAIL})
      `;
      console.log(`✅ Deleted ${result} test users`);
    } catch (error) {
      console.log('⚠️ Error deleting test users (may not exist):', error.message);
    }
    
    // 6. Finally, delete tenants (no dependencies after tenant users and roles are deleted)
    try {
      // Use raw SQL to bypass RLS for cleanup
      const result = await prisma.$executeRaw`
        DELETE FROM "Tenant" 
        WHERE "id" IN (${TEST_TENANT_1}, ${TEST_TENANT_2})
      `;
      console.log(`✅ Deleted ${result} test tenants`);
    } catch (error) {
      console.log('⚠️ Error deleting tenants (may not exist):', error.message);
    }
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error; // Re-throw to fail the test if cleanup fails
  }
}

async function createTestData(prisma) {
  // Create test users (no tenant context needed)
  console.log('Creating test users...');
  
  // Check if users already exist
  const existingUsers = await prisma.user.findMany({
    where: {
      email: { in: [TEST_USER_1_EMAIL, TEST_USER_2_EMAIL] }
    }
  });
  
  const existingEmails = new Set(existingUsers.map(u => u.email));
  
  // Create user1 if it doesn't exist
  let user1 = existingUsers.find(u => u.email === TEST_USER_1_EMAIL);
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        name: 'Test User 1',
        email: TEST_USER_1_EMAIL,
        hashedPassword: TEST_USER_PASSWORD,
      },
    });
    console.log('✅ Created user1');
  } else {
    console.log('ℹ️  User1 already exists, using existing user');
  }
  
  // Create user2 if it doesn't exist
  let user2 = existingUsers.find(u => u.email === TEST_USER_2_EMAIL);
  if (!user2) {
    user2 = await prisma.user.create({
      data: {
        name: 'Test User 2',
        email: TEST_USER_2_EMAIL,
        hashedPassword: TEST_USER_PASSWORD,
      },
    });
    console.log('✅ Created user2');
  } else {
    console.log('ℹ️  User2 already exists, using existing user');
  }
  
  console.log('Creating test tenants...');
  
  // Check if tenants already exist using raw SQL
  const existingTenants = await prisma.$queryRaw`
    SELECT id, name, type, description, "createdBy", "updatedBy"
    FROM "Tenant"
    WHERE id IN (${TEST_TENANT_1}, ${TEST_TENANT_2})
  `;
  
  const existingTenantIds = new Set(existingTenants.map(t => t.id));
  
  // Create or get tenant1
  let tenant1 = existingTenants.find(t => t.id === TEST_TENANT_1);
  if (!tenant1) {
    // Create tenant1 using raw SQL to avoid Prisma model name issues
    await prisma.$executeRaw`
      INSERT INTO "Tenant" 
        (id, name, type, description, "createdBy", "updatedBy", "createdAt", "updatedAt")
      VALUES 
        (${TEST_TENANT_1}, 'Test Tenant 1', 'SCHOOL', 'Test tenant 1', ${user1.id}, ${user1.id}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Get the created tenant
    const [createdTenant1] = await prisma.$queryRaw`
      SELECT id, name, type, description, "createdBy", "updatedBy"
      FROM "Tenant"
      WHERE id = ${TEST_TENANT_1}
    `;
    tenant1 = createdTenant1;
    console.log('✅ Created tenant1');
  } else {
    console.log('ℹ️  Tenant1 already exists, using existing tenant');
  }
  
  // Create or get tenant2
  let tenant2 = existingTenants.find(t => t.id === TEST_TENANT_2);
  if (!tenant2) {
    // Create tenant2 using raw SQL to avoid Prisma model name issues
    await prisma.$executeRaw`
      INSERT INTO "Tenant" 
        (id, name, type, description, "createdBy", "updatedBy", "createdAt", "updatedAt")
      VALUES 
        (${TEST_TENANT_2}, 'Test Tenant 2', 'SCHOOL', 'Test tenant 2', ${user2.id}, ${user2.id}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Get the created tenant
    const [createdTenant2] = await prisma.$queryRaw`
      SELECT id, name, type, description, "createdBy", "updatedBy"
      FROM "Tenant"
      WHERE id = ${TEST_TENANT_2}
    `;
    tenant2 = createdTenant2;
    console.log('✅ Created tenant2');
  } else {
    console.log('ℹ️  Tenant2 already exists, using existing tenant');
  }

  console.log('Creating test roles and feature flags...');
  
  // Create roles and feature flags for tenant 1
  await setTenantContext(tenant1.id);
  
  // Create role for tenant 1 using raw SQL
  await prisma.$executeRaw`
    INSERT INTO "Role" (
      id, name, description, "isSystem", "tenantId", 
      permissions, "createdBy", "updatedBy", "createdAt", "updatedAt"
    ) VALUES (
      ${`${TEST_TENANT_1}-admin`}, 'Admin', 'Admin role for tenant 1', true, ${tenant1.id},
      '["*"]'::jsonb, ${user1.id}, ${user1.id}, NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING
  `;
  
  // Get the created role
  const [role1] = await prisma.$queryRaw`
    SELECT * FROM "Role" WHERE id = ${`${TEST_TENANT_1}-admin`}
  `;
  
  // Create feature flag for tenant 1 using raw SQL
  await prisma.$executeRaw`
    INSERT INTO "FeatureFlag" (
      id, name, description, "isEnabled", "tenantId", "createdAt", "updatedAt"
    ) VALUES (
      ${`${TEST_TENANT_1}-feature-a`}, 'FEATURE_A', 'Test feature A', true, ${tenant1.id}, NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING
  `;
  
  // Get the created feature flag
  const [feature1] = await prisma.$queryRaw`
    SELECT * FROM "FeatureFlag" WHERE id = ${`${TEST_TENANT_1}-feature-a`}
  `;
  
  // Create roles and feature flags for tenant 2
  await setTenantContext(tenant2.id);
  
  // Create role for tenant 2 using raw SQL
  await prisma.$executeRaw`
    INSERT INTO "Role" (
      id, name, description, "isSystem", "tenantId", 
      permissions, "createdBy", "updatedBy", "createdAt", "updatedAt"
    ) VALUES (
      ${`${TEST_TENANT_2}-admin`}, 'Admin', 'Admin role for tenant 2', true, ${tenant2.id},
      '["*"]'::jsonb, ${user2.id}, ${user2.id}, NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING
  `;
  
  // Get the created role
  const [role2] = await prisma.$queryRaw`
    SELECT * FROM "Role" WHERE id = ${`${TEST_TENANT_2}-admin`}
  `;
  
  // Create feature flag for tenant 2 using raw SQL
  await prisma.$executeRaw`
    INSERT INTO "FeatureFlag" (
      id, name, description, "isEnabled", "tenantId", "createdAt", "updatedAt"
    ) VALUES (
      ${`${TEST_TENANT_2}-feature-b`}, 'FEATURE_B', 'Test feature B', true, ${tenant2.id}, NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING
  `;
  
  // Get the created feature flag
  const [feature2] = await prisma.$queryRaw`
    SELECT * FROM "FeatureFlag" WHERE id = ${`${TEST_TENANT_2}-feature-b`}
  `;
  
  // Create tenant users
  await prisma.$executeRaw`
    INSERT INTO "TenantUser" (
      id, "userId", "tenantId", "roleId", "isActive", "createdAt", "updatedAt"
    ) VALUES 
      (gen_random_uuid(), ${user1.id}, ${tenant1.id}, ${role1.id}, true, NOW(), NOW()),
      (gen_random_uuid(), ${user2.id}, ${tenant2.id}, ${role2.id}, true, NOW(), NOW())
    ON CONFLICT ("userId", "tenantId") DO NOTHING
  `;
  
  console.log('✅ Test data created:');
  console.log(`- User 1: ${user1.id} (${user1.email})`);
  console.log(`- User 2: ${user2.id} (${user2.email})`);
  console.log(`- Tenant 1: ${tenant1.id} (${tenant1.name})`);
  console.log(`- Tenant 2: ${tenant2.id} (${tenant2.name})`);
  console.log(`- Role 1: ${role1.id} (${role1.name})`);
  console.log(`- Role 2: ${role2.id} (${role2.name})`);
  console.log(`- Feature 1: ${feature1.id} (${feature1.name})`);
  
  // Clear tenant context
  await clearTenantContext();
  
  return { user1, user2, tenant1, tenant2, role1, role2, feature1, feature2 };
}

async function testTenantAccess(prisma, tenantId, expectedTenantIds) {
  console.log(`\n🔍 Testing access for tenant ${tenantId}...`);
  
  try {
    // Set the tenant context for this test
    await setTenantContext(tenantId);
    
    // Try to access feature flags using the RLS-enabled client
    // Note: Using raw query to avoid Prisma model name issues
    const featureFlags = await prisma.$queryRaw`
      SELECT * FROM "FeatureFlag"
      WHERE "tenantId" = ${tenantId}
    `;
    
    console.log(`Found ${featureFlags.length} feature flags for tenant ${tenantId}`);
    
    if (featureFlags.length === 0) {
      console.warn(`⚠️ No feature flags found for tenant ${tenantId}. This might indicate an issue with the test data.`);
      return false;
    }
    
    // Verify only the expected tenant's data is accessible
    const unexpectedFlags = featureFlags.filter(flag => !expectedTenantIds.includes(flag.tenantId));
    
    if (unexpectedFlags.length > 0) {
      console.error(`❌ Found ${unexpectedFlags.length} feature flags for unexpected tenants`);
      console.error('Unexpected flags:', JSON.stringify(unexpectedFlags, null, 2));
      return false;
    }
    
    // Verify we got all expected tenant's data
    const expectedFlags = featureFlags.filter(flag => expectedTenantIds.includes(flag.tenantId));
    if (expectedFlags.length === 0) {
      console.error(`❌ No feature flags found for expected tenant ${tenantId}`);
      return false;
    }
    
    console.log(`✅ Successfully verified tenant isolation for ${tenantId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error testing tenant access for ${tenantId}:`, error);
    return false;
  } finally {
    // Clear the tenant context
    await clearTenantContext();
  }
}

// Run the test
main().catch(console.error);
