import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tenantMiddleware } from './middleware/tenant';

/**
 * Main middleware function that handles all incoming requests
 * Applies tenant context and authentication checks
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, _next paths, and API documentation routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api-doc') ||
    pathname === '/api-docs.json' ||
    pathname === '/api-docs'
  ) {
    return NextResponse.next();
  }

  try {
    // Handle tenant-specific middleware
    return await tenantMiddleware(request);
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          code: 'MIDDLEWARE_ERROR',
          message: 'An error occurred while processing your request',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api-doc (API documentation UI)
     * - api-docs (API documentation JSON)
     */
    '/((?!_next/static|_next/image|favicon\.ico|api/|api-doc|api-docs).*)',
  ],
  // Ensure the middleware runs on the correct paths
  runtime: 'edge',
};
