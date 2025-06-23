import { NextResponse } from 'next/server';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import fs from 'fs';

// Import the swagger configuration
import swaggerConfig from '@/app/api-doc/swagger.config';

// Import the Prisma client without RLS
import { prismaNoRls } from '@/lib/prisma/no-rls-client';

// This tells Next.js to use the Node.js runtime instead of the Edge runtime
export const runtime = 'nodejs';

// This tells Next.js to revalidate this route every hour
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    // In production, we might want to cache the generated spec
    const cacheFile = path.join(process.cwd(), '.next/cache/swagger-spec.json');
    
    // Try to read from cache first in production
    if (!isDev && fs.existsSync(cacheFile)) {
      try {
        const cachedSpec = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        return NextResponse.json(cachedSpec);
      } catch (cacheError) {
        console.error('Error reading from cache, regenerating...', cacheError);
        // Continue to regenerate the spec if there's an error reading the cache
      }
    }
    
    // Generate the OpenAPI specification
    const swaggerSpec = swaggerJSDoc({
      ...swaggerConfig,
      // Add any additional options here if needed
    });
    
    // In development, we can generate the spec on every request
    if (isDev) {
      return NextResponse.json(swaggerSpec);
    }
    
    // Cache the spec in production
    if (!isDev) {
      try {
        const cacheDir = path.dirname(cacheFile);
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        fs.writeFileSync(cacheFile, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
      } catch (cacheError) {
        console.error('Error writing to cache:', cacheError);
        // Don't fail the request if caching fails
      }
    }
    
    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Error generating Swagger spec:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'DOCS_GENERATION_FAILED',
          message: 'Failed to generate API documentation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
