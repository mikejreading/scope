import { NextResponse } from 'next/server';

type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, any>;
};

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export function success<T = any>(
  data: T,
  meta?: Record<string, any>,
  status = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    { success: true as const, data, ...(meta && { meta }) },
    { status }
  );
}

export function created<T = any>(data: T, meta?: Record<string, any>) {
  return success(data, meta, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message = 'Bad Request', details?: any) {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'BAD_REQUEST',
        message,
        ...(details && { details }),
      },
    },
    { status: 400 }
  );
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status: 401 }
  );
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 }
  );
}

export function notFound(message = 'Resource not found') {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'NOT_FOUND',
        message,
      },
    },
    { status: 404 }
  );
}

export function conflict(message = 'Resource already exists') {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'CONFLICT',
        message,
      },
    },
    { status: 409 }
  );
}

export function validationError(errors: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
      },
    },
    { status: 422 }
  );
}

export function serverError(message = 'Internal Server Error', error?: Error) {
  if (error) {
    console.error('Server Error:', error);
  }
  
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && error?.stack && { stack: error.stack }),
      },
    },
    { status: 500 }
  );
}
