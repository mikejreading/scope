import { PrismaClient } from '@prisma/client';
import { setupRowLevelSecurity } from '@/lib/prisma/rls';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

async function main() {
  console.log('Applying row-level security policies...');
  
  // Create a direct Prisma client (without our RLS extension)
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to database');

    // Set the JWT secret for RLS
    await prisma.$executeRaw`
      ALTER DATABASE ${process.env.DATABASE_NAME || 'scope_platform_dev'} 
      SET "app.jwt_secret" TO ${process.env.NEXTAUTH_SECRET || 'your-super-secret-jwt-secret'};
    `;

    // Apply RLS policies
    await setupRowLevelSecurity(prisma);
    
    console.log('✅ Row-level security policies applied successfully');
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
