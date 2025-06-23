import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/api/handler';
import { 
  paginationQuerySchema,
  paginatedResponseSchema,
  tenantResponseSchema,
  errorResponseSchema,
  successResponseSchema
} from '@/lib/api/types';
import { z } from 'zod';

/**
 * @swagger
 * tags:
 *   - name: Tenants
 *     description: Tenant management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TenantListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 *             total:
 *               type: integer
 *               example: 1
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             totalPages:
 *               type: integer
 *               example: 1
 *     CreateTenantRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: Example School
 *         type:
 *           type: string
 *           enum: [SCHOOL, DISTRICT, TRUST, OTHER]
 *           example: SCHOOL
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: A school in the example district
 *         website:
 *           type: string
 *           format: uri
 *           example: https://example.school.edu
 *         logoUrl:
 *           type: string
 *           format: uri
 *           example: https://example.school.edu/logo.png
 *         contactEmail:
 *           type: string
 *           format: email
 *           example: admin@example.school.edu
 *         contactPhone:
 *           type: string
 *           example: +1234567890
 */

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: List all tenants
 *     description: Returns a paginated list of tenants that the authenticated user has access to
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number to return
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: The number of items to return per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, type, createdAt, updatedAt]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (asc or desc)
 *     responses:
 *       200:
 *         description: A paginated list of tenants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantListResponse'
 *       401:
 *         description: Unauthorized - Authentication credentials were missing or incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User doesn't have permission to access this resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/v1/tenants - List tenants with pagination
export const GET = createApiHandler({
  method: 'GET',
  authenticate: true,
  requiredPermissions: ['TENANT_READ'],
  handler: async (req: NextRequest, context) => {
    try {
      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const query = Object.fromEntries(searchParams.entries());
      const { page, limit, sortBy, sortOrder } = paginationQuerySchema.parse(query);

      // Build where clause based on user permissions
      const where: any = {};
      
      // If user is not a super admin, only show tenants they have access to
      if (!context.userRoles?.includes('SUPER_ADMIN')) {
        where.tenantUsers = {
          some: {
            userId: context.userId,
            isActive: true,
          },
        };
      }

      // Execute queries in parallel
      const [total, tenants] = await Promise.all([
        prisma.tenant.count({ where }),
        prisma.tenant.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
          include: {
            _count: {
              select: { tenantUsers: true },
            },
          },
        }),
      ]);

      // Format response
      const response = {
        items: tenants.map(tenant => ({
          id: tenant.id,
          name: tenant.name,
          type: tenant.type,
          description: tenant.description,
          website: tenant.website,
          logoUrl: tenant.logoUrl,
          contactEmail: tenant.contactEmail,
          contactPhone: tenant.contactPhone,
          userCount: tenant._count.tenantUsers,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      return successResponseSchema(z.any()).parse({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Error listing tenants:', error);
      return errorResponseSchema.parse({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list tenants',
        },
      });
    }
  },
});

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Create a new tenant
 *     description: Creates a new tenant and assigns the current user as an admin
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenantRequest'
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication credentials were missing or incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User doesn't have permission to create tenants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - A tenant with the same name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/v1/tenants - Create a new tenant
export const POST = createApiHandler({
  method: 'POST',
  authenticate: true,
  requiredPermissions: ['TENANT_CREATE'],
  handler: async (req: NextRequest, context) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const { name, type, description, website, logoUrl, contactEmail, contactPhone } = 
        z.object({
          name: z.string().min(1, 'Name is required'),
          type: z.enum(['SCHOOL', 'DISTRICT', 'TRUST', 'OTHER']),
          description: z.string().optional(),
          website: z.string().url('Invalid URL').or(z.literal('')).optional(),
          logoUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
          contactEmail: z.string().email('Invalid email').optional(),
          contactPhone: z.string().min(10, 'Invalid phone number').optional(),
        }).parse(body);

      // Create tenant in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the tenant
        const tenant = await tx.tenant.create({
          data: {
            name,
            type,
            description: description || null,
            website: website || null,
            logoUrl: logoUrl || null,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            createdBy: context.userId!,
            updatedBy: context.userId!,
          },
        });

        // 2. Add the creator as an admin for this tenant
        await tx.tenantUser.create({
          data: {
            userId: context.userId!,
            tenantId: tenant.id,
            role: 'ADMIN',
            isActive: true,
            createdBy: context.userId!,
            updatedBy: context.userId!,
          },
        });

        return tenant;
      });

      // Format response
      return successResponseSchema(tenantResponseSchema).parse({
        success: true,
        data: {
          ...result,
          website: result.website || null,
          logoUrl: result.logoUrl || null,
          contactEmail: result.contactEmail || null,
          contactPhone: result.contactPhone || null,
          description: result.description || null,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return errorResponseSchema.parse({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
      }

      // Handle unique constraint violation
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return errorResponseSchema.parse({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A tenant with this name already exists',
          },
        });
      }

      return errorResponseSchema.parse({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create tenant',
        },
      });
    }
  },
});
