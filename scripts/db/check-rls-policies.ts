import { PrismaClient } from '@prisma/client';

async function checkRLSPolicies() {
  const prisma = new PrismaClient();
  
  try {
    // Check if RLS is enabled on the FeatureFlag table
    const rlsStatus = await prisma.$queryRaw`
      SELECT 
        relname as table_name,
        relrowsecurity as rls_enabled
      FROM 
        pg_class c
      JOIN 
        pg_namespace n ON n.oid = c.relnamespace
      WHERE 
        n.nspname = 'public' 
        AND c.relname = 'FeatureFlag';
    `;
    
    console.log('RLS Status for FeatureFlag table:', JSON.stringify(rlsStatus, null, 2));
    
    // Check the policies on the FeatureFlag table
    const policies = await prisma.$queryRaw`
      SELECT 
        pol.polname as policy_name,
        pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
        pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression,
        array_agg(a.rolname) as roles
      FROM 
        pg_policy pol
      JOIN 
        pg_class c ON c.oid = pol.polrelid
      LEFT JOIN 
        pg_roles a ON a.oid = ANY(pol.polroles)
      WHERE 
        c.relname = 'FeatureFlag'
      GROUP BY 
        pol.polname, pol.polqual, pol.polwithcheck, pol.polrelid;
    `;
    
    console.log('\nRLS Policies on FeatureFlag table:', JSON.stringify(policies, null, 2));
    
    // Check the current session settings
    const sessionSettings = await prisma.$queryRaw`
      SELECT 
        current_setting('app.current_tenant_id', true) as current_tenant_id,
        current_setting('app.bypass_rls', true) as bypass_rls;
    `;
    
    console.log('\nCurrent Session Settings:', JSON.stringify(sessionSettings, null, 2));
    
  } catch (error) {
    console.error('Error checking RLS policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRLSPolicies().catch(console.error);
