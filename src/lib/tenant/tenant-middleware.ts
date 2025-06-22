import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function tenantMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for auth-related paths
  if (path.startsWith('/api/auth/') || path === '/') {
    return NextResponse.next();
  }

  try {
    // Get the tenant ID from the subdomain or header
    const hostname = request.headers.get('host') || '';
    const subdomain = getSubdomain(hostname);
    
    // For API routes, we can also check for tenant in headers
    const tenantId = request.headers.get('x-tenant-id') || subdomain;
    
    if (!tenantId) {
      return new NextResponse('Tenant not specified', { status: 400 });
    }

    // Find the tenant in the database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        parent: true,
      },
    });

    if (!tenant) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    // Add tenant to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenant.id);

    // For API routes, pass the tenant in the response headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add tenant info to response headers for client-side use
    response.headers.set('x-tenant-id', tenant.id);
    response.headers.set('x-tenant-name', tenant.name);
    response.headers.set('x-tenant-type', tenant.type);

    return response;
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  
  // If we have at least 3 parts (e.g., tenant.example.com)
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

// Helper to get tenant ID from request headers
export function getTenantIdFromRequest(request: NextRequest): string | null {
  // First check the host for subdomain
  const hostname = request.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);
  
  // Then check headers
  return request.headers.get('x-tenant-id') || subdomain;
}
