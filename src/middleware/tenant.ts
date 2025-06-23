import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// List of paths that don't require tenant context
const PUBLIC_PATHS = ['/api/health', '/api/auth'];

// List of auth-related paths that might set the tenant context
const AUTH_PATHS = ['/api/auth/signin', '/api/auth/signup'];

export async function tenantMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For auth paths, we might want to handle them differently
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    return handleAuthPath(request);
  }

  // Get the tenant ID from the request
  const tenantId = getTenantIdFromRequest(request);
  
  // If no tenant ID is provided, try to get it from the user's session
  if (!tenantId) {
    return handleMissingTenant(request);
  }

  // Verify the tenant exists and the user has access to it
  const hasAccess = await verifyTenantAccess(request, tenantId);
  if (!hasAccess) {
    return handleUnauthorizedAccess(request);
  }

  // Set the tenant context in the request headers
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenantId);
  
  return response;
}

function getTenantIdFromRequest(request: NextRequest): string | null {
  // 1. Check the x-tenant-id header
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId) {
    return headerTenantId;
  }

  // 2. Check the URL query parameters
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get('tenantId');
  if (queryTenantId) {
    return queryTenantId;
  }

  // 3. Check cookies (for web clients)
  const cookieTenantId = request.cookies.get('tenantId')?.value;
  if (cookieTenantId) {
    return cookieTenantId;
  }

  return null;
}

async function handleAuthPath(request: NextRequest) {
  // For sign-in/sign-up, we might not have a tenant ID yet
  // So we'll just continue with the request
  return NextResponse.next();
}

async function handleMissingTenant(request: NextRequest) {
  // If this is an API request, return a 400 error
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'MISSING_TENANT',
          message: 'Tenant ID is required',
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // For non-API requests, we might want to redirect to a tenant selection page
  const url = request.nextUrl.clone();
  url.pathname = '/select-tenant';
  return NextResponse.redirect(url);
}

async function verifyTenantAccess(
  request: NextRequest,
  tenantId: string
): Promise<boolean> {
  // If this is a public endpoint, allow access
  if (PUBLIC_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return true;
  }

  // For API routes, we need to verify the user has access to the tenant
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get the session token from the request
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return false;
    }

    try {
      // Verify the user has access to the tenant
      const user = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              tenantUsers: {
                where: { tenantId },
                select: { id: true },
              },
            },
          },
        },
      });

      return !!user?.user.tenantUsers.length;
    } catch (error) {
      console.error('Error verifying tenant access:', error);
      return false;
    }
  }

  // For non-API requests, we'll check the session
  return true;
}

function handleUnauthorizedAccess(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have access to this tenant',
        },
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // For non-API requests, redirect to an unauthorized page
  const url = request.nextUrl.clone();
  url.pathname = '/unauthorized';
  return NextResponse.redirect(url);
}
