import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  // Create a new Prisma client instance to avoid any potential caching issues
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test direct connection to the database
    await prisma.$connect();
    
    // Test database connection by making a simple query
    const dbVersionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const dbVersion = dbVersionResult[0]?.version || 'unknown';
    
    // Check if the database exists and is accessible
    await prisma.$queryRaw`SELECT 1`;
    
    // Count users as an additional check
    const userCount = await prisma.user.count();
    
    // Get database name from the connection URL for verification
    const dbUrl = new URL(process.env.DATABASE_URL || '');
    const dbName = dbUrl.pathname.replace(/^\//, '');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      database: {
        name: dbName,
        version: dbVersion,
      },
      connection: {
        host: dbUrl.hostname,
        port: dbUrl.port,
        user: dbUrl.username,
        database: dbName,
      },
      userCount
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Get database URL for debugging (without password)
    const dbUrl = process.env.DATABASE_URL ? 
      new URL(process.env.DATABASE_URL) : 
      { hostname: 'not-set', port: 'not-set', username: 'not-set', pathname: '/not-set' };
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to database',
        error: error instanceof Error ? error.message : 'Unknown error',
        connection: {
          host: dbUrl.hostname,
          port: dbUrl.port,
          user: dbUrl.username,
          database: dbUrl.pathname.replace(/^\//, '') || 'not-set',
        },
        env: {
          nodeEnv: process.env.NODE_ENV,
          databaseUrlDefined: !!process.env.DATABASE_URL,
          // Using dynamic import to avoid require()
          prismaVersion: (await import('@prisma/client/package.json', { assert: { type: 'json' } })).default.version,
        }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
