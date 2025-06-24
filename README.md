# Scope Platform

An enterprise-grade school management platform built with Node.js, TypeScript, and modern web technologies.

## 🚀 Getting Started

### Prerequisites

- Node.js 20.17.0 or higher
- npm 11.4.2 or higher
- Git
- Docker and Docker Compose (for local development)
- PostgreSQL 14+ (or Docker to run it in a container)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mikejreading/scope.git
   cd scope
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🗄️ Database

### Schema

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migrations

This project uses TypeORM for database migrations. Migrations help track and version database schema changes.

#### Running Migrations

1. Start the database (if not already running):
   ```bash
   docker-compose up -d postgres
   ```

2. Run pending migrations:
   ```bash
   npm run migration:run
   ```

#### Creating New Migrations

1. Make changes to your entities
2. Generate a new migration:
   ```bash
   npm run migration:generate -- path/to/migration/Name
   ```
3. Review the generated migration file
4. Run the migration to apply changes

#### Reverting Migrations

To revert the last applied migration:

```bash
npm run migration:revert
```

## 🛠 Development

### Available Scripts

- `npm run build` - Build the project
- `npm run dev:api` - Start the API in development mode
- `npm run dev:web` - Start the web client in development mode
- `npm run lint` - Lint the codebase
- `npm run format` - Format the codebase
- `npm test` - Run tests (coming soon)
- `npm run migration:generate` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration

## 📁 Project Structure

```
scope-platform/
├── apps/               # Applications
│   ├── api/            # Backend API
│   └── web/            # Frontend application
├── libs/               # Shared libraries
│   ├── auth/           # Authentication
│   ├── database/       # Database models and migrations
│   └── shared/         # Shared utilities
├── tools/              # Build and deployment scripts
├── .eslintrc.js        # ESLint configuration
├── .prettierrc         # Prettier configuration
├── package.json        # Project configuration
└── tsconfig.json       # TypeScript configuration
```

## 📝 License

ISC © [Mike Reading](https://github.com/mikejreading)
