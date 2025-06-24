# Architecture Decision Record (ADR)

## 1. Introduction

This document captures the architectural decisions made for the School Management Platform. It follows the [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records) format.

## 2. Decision Records

### 2.1. ADR 001: Monorepo Structure

**Date**: 2025-06-24

**Status**: Accepted

**Context**:
We needed to manage multiple related projects (API, web app, mobile app) with shared code while maintaining consistency and simplifying dependency management.

**Decision**:
Adopt a monorepo structure using Nx for TypeScript/Node.js projects. This provides:
- Shared code organization
- Consistent tooling
- Atomic commits across projects
- Simplified dependency management

**Consequences**:
- Single source of truth for all code
- Easier code sharing between frontend and backend
- Simplified CI/CD pipeline
- Requires developers to be mindful of cross-project dependencies

### 2.2. ADR 002: Multi-tenancy Approach

**Date**: 2025-06-24

**Status**: Accepted

**Context**:
The platform needs to serve multiple schools (tenants) with strict data isolation requirements.

**Decision**:
Implement schema-per-tenant approach using PostgreSQL's schema support:
- Each tenant gets a dedicated schema
- Shared authentication layer
- Tenant context maintained via JWT claims
- Shared infrastructure for cost efficiency

**Consequences**:
- Strong data isolation between tenants
- Simplified backup/restore per tenant
- Potential performance overhead from schema switching
- More complex migrations

### 2.3. ADR 003: Authentication & Authorization

**Date**: 2025-06-24

**Status**: Accepted

**Context**:
Need secure, flexible authentication supporting multiple user roles and SSO.

**Decision**:
- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Support for social login (Google, Microsoft)
- Session management with Redis

**Consequences**:
- Stateless authentication
- Need for token invalidation strategy
- Secure token storage required on client

### 2.4. ADR 004: API Design

**Date**: 2025-06-24

**Status**: Accepted

**Context**:
Need for consistent, well-documented APIs that can evolve over time.

**Decision**:
- RESTful API design principles
- OpenAPI/Swagger documentation
- Versioned API endpoints (/api/v1/...)
- JSON:API specification for complex responses

**Consequences**:
- Self-documenting APIs
- Easier client integration
- Backward compatibility challenges
- Need for API versioning strategy
