import { OAS3Definition } from 'swagger-jsdoc';

const swaggerDefinition: OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'Scope Platform API',
    version: '1.0.0',
    description: 'API documentation for the Scope Platform - A multi-tenant school management system',
    contact: {
      name: 'Scope Platform Support',
      email: 'support@scopeplatform.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
    {
      url: 'https://api.scopeplatform.com/v1',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Tenants',
      description: 'Tenant management endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication and user management',
    },
    {
      name: 'Users',
      description: 'User management within tenants',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'UNAUTHORIZED',
              },
              message: {
                type: 'string',
                example: 'Authentication required',
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
      Tenant: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          name: {
            type: 'string',
            example: 'Example School',
          },
          type: {
            type: 'string',
            enum: ['SCHOOL', 'DISTRICT', 'TRUST', 'OTHER'],
            example: 'SCHOOL',
          },
          description: {
            type: 'string',
            nullable: true,
            example: 'A school in the example district',
          },
          website: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://example.school.edu',
          },
          logoUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://example.school.edu/logo.png',
          },
          contactEmail: {
            type: 'string',
            format: 'email',
            nullable: true,
            example: 'admin@example.school.edu',
          },
          contactPhone: {
            type: 'string',
            nullable: true,
            example: '+1234567890',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-01-01T00:00:00Z',
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/app/api/**/route.ts', // All API route files
    './src/lib/api/types.ts', // API types and schemas
  ],
};

export default options;
