import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple health check endpoint that verifies database connectivity
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new NextResponse(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Set the revalidation time for this route (in seconds)
export const revalidate = 60; // Revalidate every 60 seconds
