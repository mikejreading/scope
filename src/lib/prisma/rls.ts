import { PrismaClient } from '@prisma/client';

// List of models that should have RLS enabled
const RLS_MODELS = [
  'FeatureFlag',
  // Add other models that should have RLS
];

// Helper to generate SQL for RLS policies
function generateRLSSQL() {
  const enableRLS = RLS_MODELS.map(
    (model) => `ALTER TABLE \"${model}\" ENABLE ROW LEVEL SECURITY;`
  ).join('\n');

  const createPolicies = RLS_MODELS.map((model) => `
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "${model}_tenant_isolation" ON \"${model}\";
    
    -- Create policy to restrict access to tenant's data
    CREATE POLICY "${model}_tenant_isolation" ON \"${model}\"
      USING (\"tenantId\" = current_setting('app.current_tenant_id')::text);
    
    -- Allow system users to bypass RLS (for migrations, etc.)
    DROP POLICY IF EXISTS "${model}_bypass_rls" ON \"${model}\";
    CREATE POLICY "${model}_bypass_rls" ON \"${model}\"
      USING (current_setting('app.bypass_rls', true) = 'true');
  `).join('\n');

  return `
    DO $$
    BEGIN
      -- Enable RLS on all specified tables
      ${enableRLS}

      -- Create RLS policies
      ${createPolicies}
      
      -- Log success
      RAISE NOTICE 'RLS policies applied successfully';
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the entire operation
      RAISE WARNING 'Error applying RLS policies: %', SQLERRM;
    END $$;
  `;
}

export async function setupRowLevelSecurity(prisma: PrismaClient) {
  // First, set the JWT secret if not already set
  await prisma.$executeRawUnsafe(
    `ALTER DATABASE ${process.env.DATABASE_NAME || 'scope_platform_dev'} 
    SET "app.jwt_secret" = '${process.env.NEXTAUTH_SECRET || 'your-super-secret-jwt-secret'}'`
  );

  // Generate and execute the RLS SQL
  const rlsSQL = generateRLSSQL();
  await prisma.$executeRawUnsafe(rlsSQL);
}

// Function to set the current tenant ID for a request
export function setTenantContext(tenantId: string) {
  global.tenantId = tenantId;
}

export function getTenantContext() {
  return global.tenantId;
}

// Extend the NodeJS global type to include our tenantId
declare global {
  // eslint-disable-next-line no-var
  var tenantId: string | undefined;
}
