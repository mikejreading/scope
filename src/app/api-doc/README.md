# API Documentation

This directory contains the API documentation for the Scope Platform. The documentation is automatically generated from JSDoc comments in the API route handlers and type definitions.

## Viewing the Documentation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the API documentation in your browser:
   ```
   http://localhost:3000/api-doc
   ```

## Adding Documentation

### Documenting API Endpoints

Each API endpoint should be documented using JSDoc comments with OpenAPI (Swagger) annotations. Here's an example:

```typescript
/**
 * @swagger
 * /api/v1/example:
 *   get:
 *     summary: Get example data
 *     description: Returns example data based on query parameters
 *     tags: [Examples]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExampleResponse'
 */
```

### Documenting Schemas

Common schemas should be defined in the `swagger.config.ts` file under the `components.schemas` section. You can then reference these schemas in your endpoint documentation using `$ref`.

### Tags

Use tags to group related endpoints. Tags should be defined in the `swagger.config.ts` file and referenced in the endpoint documentation.

## Testing Documentation

1. Start the development server if it's not already running:
   ```bash
   npm run dev
   ```

2. Open the API documentation in your browser and verify that all endpoints are correctly documented.

3. Test the "Try it out" functionality in the Swagger UI to ensure that the documentation is accurate and the API behaves as expected.

## Best Practices

1. **Be Consistent**: Follow the same documentation style throughout the codebase.

2. **Be Descriptive**: Provide clear and concise descriptions for endpoints, parameters, and responses.

3. **Use Enums**: Use enums for parameters with a fixed set of values.

4. **Document All Responses**: Document all possible response codes and their meanings.

5. **Keep It Updated**: Update the documentation whenever you modify an API endpoint.

## Troubleshooting

If the documentation is not updating as expected:

1. Check the browser console for any errors.
2. Ensure that your JSDoc comments follow the correct OpenAPI (Swagger) syntax.
3. Verify that the API route files are included in the `apis` array in `swagger.config.ts`.
4. Restart the development server if you've made changes to the Swagger configuration.
