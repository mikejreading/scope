import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/api/handler';
import { 
  tenantResponseSchema,
  errorResponseSchema,
  successResponseSchema,
  notFound,
  unauthorized,
  forbidden
} from '@/lib/api/types';
import { z } from 'zod';

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   get:
 *     summary: Get a single tenant by ID
 *     description: Returns a single tenant by ID if the authenticated user has access to it
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tenant ID
 *     responses:
 *       200:
 *         description: Tenant details
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
 *         description: Bad request - Invalid tenant ID format
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
 *         description: Forbidden - User doesn't have permission to access this tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tenant not found or user doesn't have access
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
// GET /api/v1/tenants/[id] - Get a single tenant by ID
export const GET = createApiHandler({
  method: 'GET',
  authenticate: true,
  requiredPermissions: ['TENANT_READ'],
  handler: async (req: NextRequest, context, { params }) => {
    try {
      const { id } = params;
      
      // Validate ID format
      if (!id || typeof id !== 'string') {
        return errorResponseSchema.parse({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID format',
          },
        });
      }

      // Build where clause based on user permissions
      const where: any = { id };
      
      // If user is not a super admin, check if they have access to this tenant
      if (!context.userRoles?.includes('SUPER_ADMIN')) {
        where.tenantUsers = {
          some: {
            userId: context.userId,
            isActive: true,
          },
        };
      }

      // Get the tenant with user counts
      const tenant = await prisma.tenant.findFirst({
        where,
        include: {
          _count: {
            select: { tenantUsers: true },
          },
        },
      });

      // Check if tenant exists and user has access
      if (!tenant) {
        return notFound('Tenant not found or you do not have access');
      }

      // Format response
      return successResponseSchema(tenantResponseSchema).parse({
        success: true,
        data: {
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
        },
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return errorResponseSchema.parse({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tenant',
        },
      });
    }
  },
});

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   patch:
 *     summary: Update a tenant
 *     description: Updates an existing tenant. Only tenant admins or owners can update the tenant.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tenant ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenantRequest'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
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
 *         description: Forbidden - User doesn't have permission to update this tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - A tenant with the updated name already exists
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
// PATCH /api/v1/tenants/[id] - Update a tenant
export const PATCH = createApiHandler({
  method: 'PATCH',
  authenticate: true,
  requiredPermissions: ['TENANT_UPDATE'],
  handler: async (req: NextRequest, context, { params }) => {
    try {
      const { id } = params;
      
      // Validate ID format
      if (!id || typeof id !== 'string') {
        return errorResponseSchema.parse({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID format',
          },
        });
      }

      // Parse and validate request body
      const body = await req.json();
      const { name, type, description, website, logoUrl, contactEmail, contactPhone } = 
        z.object({
          name: z.string().min(1, 'Name is required').optional(),
          type: z.enum(['SCHOOL', 'DISTRICT', 'TRUST', 'OTHER']).optional(),
          description: z.string().optional(),
          website: z.string().url('Invalid URL').or(z.literal('')).optional(),
          logoUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
          contactEmail: z.string().email('Invalid email').optional(),
          contactPhone: z.string().min(10, 'Invalid phone number').optional(),
        }).parse(body);

      // Check if user has access to this tenant
      const hasAccess = await prisma.tenantUser.findFirst({
        where: {
          tenantId: id,
          userId: context.userId!,
          isActive: true,
          role: {
            in: ['ADMIN', 'OWNER'],
          },
        },
      });

      if (!hasAccess && !context.userRoles?.includes('SUPER_ADMIN')) {
        return forbidden('You do not have permission to update this tenant');
      }

      // Update the tenant
      const updatedTenant = await prisma.tenant.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(description !== undefined ? { description } : {}),
          ...(website !== undefined ? { website: website || null } : {}),
          ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
          ...(contactEmail !== undefined ? { contactEmail: contactEmail || null } : {}),
          ...(contactPhone !== undefined ? { contactPhone: contactPhone || null } : {}),
          updatedBy: context.userId!,
        },
        include: {
          _count: {
            select: { tenantUsers: true },
          },
        },
      });

      // Format response
      return successResponseSchema(tenantResponseSchema).parse({
        success: true,
        data: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          type: updatedTenant.type,
          description: updatedTenant.description,
          website: updatedTenant.website,
          logoUrl: updatedTenant.logoUrl,
          contactEmail: updatedTenant.contactEmail,
          contactPhone: updatedTenant.contactPhone,
          userCount: updatedTenant._count.tenantUsers,
          createdAt: updatedTenant.createdAt.toISOString(),
          updatedAt: updatedTenant.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      
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

      // Handle not found error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return notFound('Tenant not found');
      }

      return errorResponseSchema.parse({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update tenant',
        },
      });
    }
  },
});

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   delete:
 *     summary: Delete a tenant
 *     description: Deletes a tenant. Only tenant owners can delete the tenant. The tenant must not have any active users.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The tenant ID to delete
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - Invalid tenant ID format
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
 *         description: Forbidden - User doesn't have permission to delete this tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Cannot delete tenant with active users
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
// DELETE /api/v1/tenants/[id] - Delete a tenant
export const DELETE = createApiHandler({
  method: 'DELETE',
  authenticate: true,
  requiredPermissions: ['TENANT_DELETE'],
  handler: async (req: NextRequest, context, { params }) => {
    try {
      const { id } = params;
      
      // Validate ID format
      if (!id || typeof id !== 'string') {
        return errorResponseSchema.parse({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tenant ID format',
          },
        });
      }

      // Check if user has permission to delete this tenant
      const hasPermission = await prisma.tenantUser.findFirst({
        where: {
          tenantId: id,
          userId: context.userId!,
          isActive: true,
          role: 'OWNER',
        },
      });

      if (!hasPermission && !context.userRoles?.includes('SUPER_ADMIN')) {
        return forbidden('You do not have permission to delete this tenant');
      }

      // Check if there are any users in this tenant
      const userCount = await prisma.tenantUser.count({
        where: { tenantId: id },
      });

      if (userCount > 1) { // More than just the owner
        return errorResponseSchema.parse({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Cannot delete tenant with active users. Please remove all users first.',
          },
        });
      }

      // Delete the tenant in a transaction
      await prisma.$transaction([
        // First delete the tenant user (owner)
        prisma.tenantUser.deleteMany({
          where: { tenantId: id },
        }),
        // Then delete the tenant
        prisma.tenant.delete({
          where: { id },
        }),
      ]);

      // Return success response
      return successResponseSchema(z.object({ success: z.boolean() })).parse({
        success: true,
        data: { success: true },
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      
      // Handle not found error
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        return notFound('Tenant not found');
      }

      return errorResponseSchema.parse({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete tenant',
        },
      });
    }
  },
});
