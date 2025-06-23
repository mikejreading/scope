---
trigger: always_on
---

# Coding Standards & Best Practices

## 1. General Principles

### 1.1. Code Quality

- **Readability**: Code should be self-documenting and easy to understand
- **Consistency**: Follow established patterns and conventions
- **Simplicity**: Prefer simple, clear solutions over clever ones
- **Maintainability**: Write code that is easy to modify and extend
- **Testability**: Write code that is easy to test in isolation

### 1.2. Development Workflow

- **Git Flow**: Follow Git Flow branching strategy
- **Pull Requests**: All changes must go through code review
- **CI/CD**: All code must pass automated tests and checks before deployment
- **Documentation**: Keep documentation up-to-date with code changes

## 2. Language-Specific Standards

### 2.1. TypeScript/JavaScript

#### 2.1.1. General

- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Use ES6+ features where supported
- Prefer `const` over `let`; avoid `var`
- Use semicolons consistently

#### 2.1.2. Naming Conventions

- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Interfaces**: `IPascalCase` or `PascalCase` (be consistent)
- **Type Aliases**: `PascalCase`
- **Enums**: `PascalCase` for type, `UPPER_SNAKE_CASE` for values
- **Private Members**: `_privateField` (with underscore prefix)

#### 2.1.3. Code Organization

- One class/interface per file
- File names should be `kebab-case`
- Group related functionality in directories
- Use barrel files (`index.ts`) for clean imports

### 2.2. React Components

#### 2.2.1. Component Structure

- Use functional components with hooks
- Keep components small and focused (Single Responsibility Principle)
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for props and state

#### 2.2.2. Styling

- Use Material-UI with styled-components
- Follow BEM naming convention for custom CSS
- Use theme variables for colors, spacing, etc.
- Mobile-first responsive design

### 2.3. Node.js/Backend

#### 2.3.1. API Design

- Follow RESTful principles
- Use HTTP methods correctly (GET, POST, PUT, DELETE, PATCH)
- Use proper HTTP status codes
- Version your APIs (e.g., `/api/v1/...`)
- Use JSON:API specification for complex responses

#### 2.3.2. Error Handling

- Use custom error classes
- Implement proper error boundaries in React
- Log errors appropriately
- Return user-friendly error messages
- Never expose stack traces in production

## 3. Testing Standards

### 3.1. Test Structure

- Follow the Arrange-Act-Assert pattern
- Write tests before or alongside implementation (TDD)
- Test behavior, not implementation
- Keep tests independent and isolated

### 3.2. Test Types

- **Unit Tests**: Test individual functions/components in isolation
- **Integration Tests**: Test interactions between components/services
- **E2E Tests**: Test complete user flows
- **Snapshot Tests**: For UI components

### 3.3. Test Coverage

- Aim for 80%+ test coverage
- Focus on business logic and edge cases
- Don't test third-party libraries
- Use code coverage tools (e.g., Istanbul)

## 4. Performance Guidelines

### 4.1. Frontend Performance

- Minimize bundle size (code splitting, lazy loading)
- Optimize images and assets
- Use memoization (React.memo, useMemo, useCallback)
- Avoid unnecessary re-renders
- Implement proper loading states

### 4.2. Backend Performance

- Use database indexes effectively
- Implement caching strategies
- Use pagination for large datasets
- Optimize database queries
- Implement rate limiting

## 5. Security Guidelines

### 5.1. Authentication & Authorization

- Use JWT with appropriate expiration
- Implement proper session management
- Use secure, HTTP-only cookies
- Implement CSRF protection
- Use role-based access control (RBAC)

### 5.2. Data Protection

- Validate all user input
- Use parameterized queries to prevent SQL injection
- Sanitize user-generated content
- Encrypt sensitive data at rest and in transit
- Follow OWASP Top 10 security practices

## 6. Documentation

### 6.1. Code Documentation

- Use JSDoc for functions and classes
- Document complex algorithms and business logic
- Keep comments up-to-date with code changes
- Use meaningful variable and function names

### 6.2. API Documentation

- Document all API endpoints with OpenAPI/Swagger
- Include request/response examples
- Document authentication requirements
- Include error responses

## 7. Git & Version Control

### 7.1. Branch Naming

- `feature/feature-name`: New features
- `bugfix/issue-description`: Bug fixes
- `hotfix/issue-description`: Critical production fixes
- `release/x.y.z`: Release preparation
- `chore/description`: Maintenance tasks

### 7.2. Commit Messages

- Use the conventional commits specification:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for formatting changes
  - `refactor:` for code changes that neither fix bugs nor add features
  - `perf:` for performance improvements
  - `test:` for adding or modifying tests
  - `chore:` for maintenance tasks

Example:
```
feat(auth): add password reset functionality

- Add forgot password endpoint
- Implement password reset email
- Add password reset form to frontend

Closes #123
```

## 8. Code Review Guidelines

### 8.1. Review Process

- All changes must be reviewed by at least one other developer
- Use pull requests for all changes
- Keep pull requests small and focused
- Include relevant tests
- Update documentation as needed

### 8.2. Code Review Checklist

- [ ] Code follows the style guide
- [ ] Tests are included and pass
- [ ] Documentation is updated
- [ ] No commented-out code
- [ ] No console.log statements in production code
- [ ] Error handling is appropriate
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed

## 9. Continuous Integration/Deployment

### 9.1. CI Pipeline

- Run linter and formatter
- Run unit and integration tests
- Build the application
- Run security scans
- Generate code coverage report

### 9.2. CD Pipeline

- Deploy to staging environment
- Run end-to-end tests
- Manual approval for production
- Zero-downtime deployments
- Automated rollback on failure

## 10. Performance Monitoring

### 10.1. Frontend Monitoring

- Track page load times
- Monitor JavaScript errors
- Track API response times
- Monitor Core Web Vitals

### 10.2. Backend Monitoring

- Monitor server health
- Track API performance
- Monitor database queries
- Set up alerts for errors and performance issues

## 11. Accessibility (a11y)

### 11.1. General Guidelines
- Follow WCAG 2.1 AA standards
- Ensure keyboard navigation works
- Provide text alternatives for non-text content
- Use semantic HTML elements
- Ensure sufficient color contrast

### 11.2. Testing for Accessibility
- Use automated tools (e.g., axe, Lighthouse)
- Conduct manual keyboard testing
- Test with screen readers
- Check color contrast ratios
- Ensure proper heading structure
