// Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Scope Platform API',
    version: '1.0.0',
    description: 'API documentation for the Scope Platform',
    contact: {
      name: 'Scope Platform Support',
      url: 'https://scopeplatform.com/support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.scopeplatform.com/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
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
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Validation failed',
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                },
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
          userCount: {
            type: 'integer',
            example: 5,
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
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Tenants',
      description: 'Tenant management endpoints',
    },
    {
      name: 'Authentication',
      description: 'Authentication endpoints',
    },
  ],
};

// Options for the swagger-jsdoc
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/app/api/v1/tenants/route.ts',
    './src/app/api/v1/tenants/[id]/route.ts',
    // Add more API route files here
  ],
};

module.exports = options;
