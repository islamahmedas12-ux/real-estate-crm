# Development Guide

This document explains how to set up the Real Estate CRM for local development, including all environment variables and coding conventions.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | Backend and frontend build tooling |
| npm | 10+ | Package management |
| PostgreSQL | 16 | Database |
| Git | 2.40+ | Version control |
| Docker (optional) | 24+ | Containerized development |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Islamawad132/real-estate-crm.git
cd real-estate-crm
```

### 2. Install dependencies

```bash
# Backend
npm install

# Admin Portal
cd admin-ui && npm install && cd ..

# Agent Portal
cd agent-ui && npm install && cd ..
```

### 3. Set up environment variables

Copy the example files and fill in the values:

```bash
cp .env.example .env
cp admin-ui/.env.example admin-ui/.env
```

### 4. Set up the database

Make sure PostgreSQL is running (either locally or via Docker):

```bash
# Start PostgreSQL via Docker (if not running locally)
docker compose -f docker-compose.dev.yml up db -d

# Run migrations
npx prisma migrate dev

# Seed with sample data
npx prisma db seed
```

### 5. Start the development servers

```bash
# Terminal 1 — Backend API (http://localhost:3000)
npm run start:dev

# Terminal 2 — Admin Portal (http://localhost:5173)
npm run admin:dev

# Terminal 3 — Agent Portal (http://localhost:5174)
npm run agent:dev
```

### Alternative: Docker Compose

To start the full stack (PostgreSQL + backend) in containers:

```bash
docker compose -f docker-compose.dev.yml up
```

This mounts the source code as a volume, so hot-reload works inside the container.

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string. Format: `postgresql://user:password@host:port/dbname` |
| `AUTHME_URL` | Yes | -- | Base URL of the Authme IAM server (no trailing slash). Example: `http://localhost:3001` |
| `AUTHME_REALM` | Yes | -- | Authme realm name. Example: `real-estate` |
| `AUTHME_CLIENT_ID` | Yes | -- | Backend client ID registered in Authme. Example: `crm-backend` |
| `AUTHME_CLIENT_SECRET` | No | -- | Backend client secret (for confidential client). Leave empty for public clients |
| `ADMIN_PORTAL_URL` | No | `http://localhost:5173` | Admin portal URL (used for CORS origin) |
| `AGENT_PORTAL_URL` | No | `http://localhost:5174` | Agent portal URL (used for CORS origin) |
| `PORT` | No | `3000` | Port the backend listens on |
| `NODE_ENV` | No | `development` | Environment: `development`, `production`, or `test` |
| `UPLOAD_DIR` | No | `./uploads` | Directory for uploaded files (images, documents) |

### Admin Portal (`admin-ui/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | -- | Backend API base URL. Example: `http://localhost:3000` |

### Agent Portal (`agent-ui/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | -- | Backend API base URL. Example: `http://localhost:3000` |

---

## Database

### Prisma Commands

```bash
# Generate the Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply pending migrations
npx prisma migrate dev

# Deploy migrations (production — does not create new ones)
npx prisma migrate deploy

# Reset the database (drops, re-creates, migrates, seeds)
npx prisma migrate reset

# Seed the database
npx prisma db seed

# Open Prisma Studio (visual database browser)
npx prisma studio
```

### Schema Location

The Prisma schema is at `prisma/schema.prisma`. After modifying it, always run:

```bash
npx prisma migrate dev --name describe-your-change
```

---

## Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:cov
```

### End-to-End Tests

```bash
# Requires a running database
npm run test:e2e
```

Test files follow the pattern `*.spec.ts` and are co-located with the source files they test.

---

## Coding Conventions

### Project Structure

Each backend module follows this pattern:

```
src/<module>/
+-- <module>.module.ts          # NestJS module definition
+-- <module>.controller.ts      # HTTP request handlers
+-- <module>.service.ts         # Business logic
+-- <module>.controller.spec.ts # Controller unit tests
+-- <module>.service.spec.ts    # Service unit tests
+-- dto/
    +-- create-<module>.dto.ts  # Create request validation
    +-- update-<module>.dto.ts  # Update request validation
    +-- filter-<module>.dto.ts  # Query/filter parameters
```

### TypeScript

- Strict mode enabled
- Use `import type` for type-only imports
- All DTOs use `class-validator` decorators for validation
- All DTOs use `@nestjs/swagger` decorators for API documentation
- Prefer `interface` for shapes, `type` for unions/intersections

### API Design

- All routes are prefixed with `/api/`
- Use UUID for all entity IDs
- Paginated endpoints return `{ data, meta: { total, page, limit, totalPages } }`
- Use `PUT` for full updates, `PATCH` for partial updates (status changes, assignments)
- Auth required on all endpoints except file serving (`@Public()` decorator)

### Code Style

- **Formatter:** Prettier (config in `.prettierrc`)
- **Linter:** ESLint with TypeScript and Prettier plugins
- Run before committing:
  ```bash
  npm run format
  npm run lint
  ```

### Git Conventions

- Branch naming: `feature/<issue>-<short-description>`, `fix/<issue>-<description>`
- Commit messages: Follow [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation
  - `refactor:` Code restructuring
  - `test:` Test additions/changes
  - `chore:` Build/tooling changes

### Security

- Helmet middleware for HTTP security headers
- CORS restricted to configured portal URLs
- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- JWT tokens validated against Authme JWKS endpoint
- Role-based access control via `@Roles()` decorator and `RolesGuard`
- File upload validation (type and size restrictions)

---

## Useful URLs (Development)

| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api/docs |
| Admin Portal | http://localhost:5173 |
| Agent Portal | http://localhost:5174 |
| Prisma Studio | http://localhost:5555 (run `npx prisma studio`) |
