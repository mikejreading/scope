# SCOPE Platform

A modern web application built with Next.js, TypeScript, and PostgreSQL, featuring authentication, API routes, and a robust testing setup.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Email/Password + OAuth)
- **State Management**: React Query (via tRPC)
- **Testing**:
  - Unit/Integration: Jest + React Testing Library
  - E2E: Playwright
  - API: MSW (Mock Service Worker)
- **Linting/Formatting**: ESLint + Prettier

## 🛠️ Prerequisites

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for local development)
- PostgreSQL (or use Docker)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd scope-platform
```

### 2. Set up environment variables

Copy the example environment file and update the values:

```bash
cp env.example .env
```

### 3. Start the development environment

Run the setup script to start the database and install dependencies:

```bash
chmod +x setup.sh  # Only needed once
./setup.sh
```

This script will:
1. Create a `.env` file if it doesn't exist
2. Generate a secure `NEXTAUTH_SECRET`
3. Start the PostgreSQL database in Docker
4. Install Node.js dependencies
5. Run database migrations
6. Build the project

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

### Run unit tests

```bash
npm test
```

### Run E2E tests

First, make sure the development server is running, then:

```bash
npx playwright test
```

## 🛠 Development

### Database Management

- Run migrations: `npx prisma migrate dev --name migration_name`
- Open Prisma Studio: `npx prisma studio`
- Generate Prisma Client: `npx prisma generate`

### Code Quality

- Lint: `npm run lint`
- Format: `npm run format`
- Type checking: `npm run type-check`

## 🚀 Deployment

### Prerequisites

- Google Cloud Platform account
- Cloud SQL instance
- Cloud Run service

### Deployment Steps

1. Set up environment variables in GCP Secret Manager
2. Configure Cloud SQL connection
3. Deploy to Cloud Run:

```bash
gcloud run deploy
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
