import { z } from 'zod';

// Common schemas
export const idSchema = z.string().uuid('Invalid ID format');
export const nameSchema = z.string().min(1, 'Name is required').max(100);
export const descriptionSchema = z.string().max(500).optional();

// Tenant types
export const tenantTypeSchema = z.enum(['SCHOOL', 'DISTRICT', 'TRUST', 'OTHER']);
export type TenantType = z.infer<typeof tenantTypeSchema>;

// Tenant schemas
export const createTenantSchema = z.object({
  name: nameSchema,
  type: tenantTypeSchema,
  description: descriptionSchema,
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  logoUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  contactEmail: z.string().email('Invalid email').optional(),
  contactPhone: z.string().min(10, 'Invalid phone number').optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

export const tenantResponseSchema = z.object({
  id: idSchema,
  name: nameSchema,
  type: tenantTypeSchema,
  description: descriptionSchema,
  website: z.string().url().nullable(),
  logoUrl: z.string().url().nullable(),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantResponse = z.infer<typeof tenantResponseSchema>;

// User schemas
export const userRoleSchema = z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Error responses
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

// Success response
export const successResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
  });

// Pagination
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(items: T) =>
  z.object({
    items: z.array(items),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });

// Search
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
