import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTenantIdFromRequest } from '@/lib/tenant/tenant-middleware';
import { createScopedPrisma } from '@/lib/prisma';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API auth routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next();
  }

  try {
    // Get tenant ID from the request
    const tenantId = getTenantIdFromRequest(request);
    
    if (!tenantId) {
      // Redirect to tenant selection or home page if tenant not found
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Create a scoped Prisma client with the tenant context
    const prisma = createScopedPrisma(tenantId);

    // Verify the tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    // Clone the request headers and add tenant info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenantId);

    // Create a response that will continue the request
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
    console.error('Middleware error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
