import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiHandlerOptions<T = any> {
  method: HttpMethod | HttpMethod[];
  authenticate?: boolean;
  requiredPermissions?: string[];
  handler: (req: NextRequest, context: HandlerContext) => Promise<NextResponse<T>>;
}

export interface HandlerContext {
  tenantId: string | null;
  userId?: string;
  userRoles?: string[];
}

export function createApiHandler<T = any>(options: ApiHandlerOptions<T>) {
  return async (req: NextRequest, { params }: { params: Record<string, string> }) => {
    // 1. Check HTTP method
    const method = req.method as HttpMethod;
    const allowedMethods = Array.isArray(options.method) ? options.method : [options.method];
    
    if (!allowedMethods.includes(method)) {
      return NextResponse.json(
        { error: `Method ${method} not allowed` },
        { status: 405, headers: { 'Allow': allowedMethods.join(', ') } }
      );
    }

    // 2. Initialize context
    const context: HandlerContext = {
      tenantId: req.headers.get('x-tenant-id') || null,
    };

    try {
      // 3. Authentication check
      if (options.authenticate) {
        const session = await getServerAuthSession();
        if (!session?.user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        context.userId = session.user.id;
        
        // Get user roles and permissions
        if (context.tenantId) {
          const userRoles = await prisma.tenantUser.findMany({
            where: {
              userId: context.userId,
              tenantId: context.tenantId,
              isActive: true,
            },
            include: {
              role: true,
            },
          });
          
          context.userRoles = userRoles.map(ur => ur.role.name);
        }

        // 4. Permission check
        if (options.requiredPermissions?.length) {
          const hasPermission = context.userRoles?.some(role => 
            options.requiredPermissions?.includes(role)
          );
          
          if (!hasPermission) {
            return NextResponse.json(
              { error: 'Forbidden' },
              { status: 403 }
            );
          }
        }
      }

      // 5. Execute the handler
      return await options.handler(req, context);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Validation error', details: JSON.parse(error.message) },
          { status: 400 }
        );
      }
      
      // Handle not found errors
      if (error instanceof Error && error.name === 'NotFoundError') {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }
      
      // Handle unauthorized errors
      if (error instanceof Error && error.name === 'UnauthorizedError') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Default error response
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper function to parse and validate request body
export async function parseRequestBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = new Error(JSON.stringify(error.errors));
      validationError.name = 'ZodError';
      throw validationError;
    }
    throw error;
  }
}

// Helper function to handle not found errors
export function notFound(message = 'Resource not found'): never {
  const error = new Error(message);
  error.name = 'NotFoundError';
  throw error;
}

// Helper function to handle unauthorized access
export function unauthorized(message = 'Unauthorized'): never {
  const error = new Error(message);
  error.name = 'UnauthorizedError';
  throw error;
}
