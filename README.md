# Real Estate CRM

A comprehensive CRM system for real estate companies to manage properties, clients, leads, contracts, invoices, and agent performance.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, TypeScript, Node.js 22 |
| Database | PostgreSQL 16 + Prisma 7 |
| Admin Portal | React 19, Vite, Tailwind CSS 4, Zustand |
| Agent Portal | React 19, Vite, Tailwind CSS 4, React Query, Recharts |
| Mobile (Agent) | Flutter |
| IAM | [Authme](https://github.com/Islamawad132/Authme) (OAuth 2.0 / OIDC) |
| API Docs | Swagger / OpenAPI |
| PDF Generation | PDFKit |
| Email | Nodemailer + Handlebars templates |
| Deployment | Docker Compose |
| CI/CD | GitHub Actions |

## Features

### Admin Portal
- **Dashboard** -- KPIs, revenue charts (with date-range filtering), lead pipeline summary, agent performance rankings, recent activity feed
- **Properties** -- Full CRUD, image uploads (with thumbnails), full-text search (PostgreSQL tsvector), status management, agent assignment, map-ready lat/lng, PDF export
- **Clients** -- CRUD with duplicate detection (unique email/phone), interaction history (leads + contracts), agent assignment, source tracking
- **Leads** -- Pipeline management (kanban view), status transitions with validation (New > Contacted > Qualified > Proposal > Negotiation > Won/Lost), activity logging (calls, emails, meetings, viewings), follow-up scheduling, priority levels
- **Contracts** -- Sale/rent/lease agreements, auto-generate invoices from payment terms, status lifecycle (Draft > Active > Completed/Cancelled/Expired), expiring contract alerts, PDF export
- **Invoices** -- Payment tracking with multiple methods (cash, bank transfer, check, credit card, installment), overdue detection, upcoming due dates, cancel/refund support, PDF export
- **Email** -- Templated email system with Handlebars, email logs with retry, per-user notification preferences
- **Reports** -- Monthly revenue and agent performance reports with PDF generation
- **Activities** -- System-wide audit trail with entity-level filtering and purge capability
- **Settings** -- Key-value application configuration store

### Agent Portal
- **Dashboard** -- Personal stats, today's follow-ups (overdue + upcoming), lead pipeline, month-over-month performance comparison
- **Leads** -- Personal pipeline, log activities, schedule follow-ups
- **Clients** -- Assigned clients with contact details
- **Properties** -- Browse available properties, view assigned listings
- **Contracts** -- View contracts and invoice schedules (read-only)

### Mobile App (Flutter)
- All agent portal features optimized for mobile
- Push notifications (new leads, follow-up reminders)
- Offline support with sync
- Share properties via WhatsApp/email
- Biometric login

## Project Structure

```
real-estate-crm/
+-- src/                    # NestJS Backend
|   +-- auth/               # Authme JWT validation & user sync
|   +-- properties/         # Property management + full-text search
|   +-- clients/            # Client management + duplicate detection
|   +-- leads/              # Lead pipeline + activities
|   +-- contracts/          # Contract lifecycle + invoice generation
|   +-- invoices/           # Invoice & payment management
|   +-- dashboard/          # Admin + agent dashboard analytics
|   +-- activities/         # System-wide audit trail
|   +-- email/              # Email service + templates + preferences
|   +-- pdf/                # PDF generation (contracts, invoices, reports)
|   +-- uploads/            # File uploads (images, thumbnails, documents)
|   +-- prisma/             # Prisma service provider
|   +-- common/             # Guards, decorators, filters, DTOs, utils
+-- admin-ui/               # Admin Portal (React + Vite)
+-- agent-ui/               # Agent Portal (React + Vite)
+-- mobile/                 # Flutter Mobile App
+-- prisma/                 # Schema & migrations
|   +-- schema.prisma
|   +-- seed.ts
+-- docs/                   # Documentation
+-- .github/workflows/      # CI/CD pipelines
+-- docker-compose.dev.yml  # Development environment
+-- Dockerfile              # Multi-stage production build
```

## Quick Start

### Prerequisites

- **Node.js 22+** and npm
- **PostgreSQL 16** (or use Docker)
- **Authme IAM server** ([setup guide](docs/authme-setup.md))

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/Islamawad132/real-estate-crm.git
cd real-estate-crm

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your Authme credentials

# Start PostgreSQL + backend in development mode
docker compose -f docker-compose.dev.yml up
```

### Option 2: Manual Setup

```bash
git clone https://github.com/Islamawad132/real-estate-crm.git
cd real-estate-crm

# Install backend dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — see docs/development.md for details

# Run database migrations and seed data
npx prisma migrate dev
npx prisma db seed

# Start the backend (http://localhost:3000)
npm run start:dev

# In a separate terminal — start Admin Portal (http://localhost:5173)
npm run admin:dev

# In a separate terminal — start Agent Portal (http://localhost:5174)
npm run agent:dev
```

### Verify Installation

- **Backend API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api/docs
- **Admin Portal**: http://localhost:5173
- **Agent Portal**: http://localhost:5174

## Local Development

### Full Dev Environment Setup (Recommended)

For a complete isolated development environment with all services (PostgreSQL, AuthMe, NestJS, Admin UI, Agent UI), use the automated setup script:

```bash
# Clone and navigate to the project
git clone https://github.com/Islamawad132/real-estate-crm.git
cd real-estate-crm

# Run the automated setup script (requires Docker and Docker Compose)
bash scripts/dev-setup.sh
```

**What the script does:**
1. ✅ Validates Docker and Node.js installation
2. ✅ Creates `.env` from `.env.dev` (if not already present)
3. ✅ Starts all services with Docker Compose: `docker compose -f docker-compose.dev-full.yml up -d --build`
4. ✅ Waits for PostgreSQL databases to be ready
5. ✅ Runs Prisma migrations automatically
6. ✅ Displays service URLs and next steps

**Service URLs after setup:**
- **NestJS Backend**: http://localhost:3000
- **Admin Portal**: http://localhost:5173
- **Agent Portal**: http://localhost:5174
- **AuthMe IAM**: http://localhost:3001
- **AuthMe Admin**: http://localhost:3001/admin
- **CRM PostgreSQL**: localhost:5432
- **AuthMe PostgreSQL**: localhost:5433

**Next steps after successful setup:**
1. Configure AuthMe realm (see [docs/authme-setup.md](docs/authme-setup.md))
2. Seed sample data: `docker compose -f docker-compose.dev-full.yml exec app npm run prisma:seed`
3. Access the admin portal at http://localhost:5173

### Troubleshooting Dev Setup

#### Docker Daemon Not Running
```bash
# On macOS or Windows, start Docker Desktop
# On Linux, ensure Docker service is running:
sudo systemctl start docker
```

#### Services Not Starting
```bash
# Check Docker Compose status
docker compose -f docker-compose.dev-full.yml ps

# View logs for a specific service
docker compose -f docker-compose.dev-full.yml logs -f app

# Rebuild and restart all services
docker compose -f docker-compose.dev-full.yml down -v
docker compose -f docker-compose.dev-full.yml up -d --build
```

#### Database Connection Errors
```bash
# Verify database is running and healthy
docker compose -f docker-compose.dev-full.yml exec db pg_isready -U postgres

# Check environment variables in .env match docker-compose.dev-full.yml
cat .env | grep DATABASE_URL
```

#### Prisma Migration Failures
```bash
# Manually run migrations after databases are ready
docker compose -f docker-compose.dev-full.yml exec app npx prisma migrate dev

# Reset database (careful — removes all data)
docker compose -f docker-compose.dev-full.yml exec app npx prisma migrate reset
```

#### AuthMe Not Connected
```bash
# Ensure AuthMe is running
docker compose -f docker-compose.dev-full.yml ps authme

# Check AuthMe logs
docker compose -f docker-compose.dev-full.yml logs -f authme

# Verify AUTHME_URL in .env is correct (http://authme:3001 inside Docker)
grep AUTHME_URL .env
```

### Manual Development (Without Docker)

If you prefer to run services locally without Docker:

1. **Install PostgreSQL 16** and start the service
2. **Create databases:**
   ```bash
   psql -U postgres -c "CREATE DATABASE real_estate_crm;"
   psql -U postgres -c "CREATE DATABASE authme;"
   ```
3. **Update `.env`:**
   ```bash
   cp .env.example .env
   # Edit .env to use local PostgreSQL connection
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/real_estate_crm
   ```
4. **Install dependencies and run migrations:**
   ```bash
   npm install
   npx prisma migrate dev
   ```
5. **Start services in separate terminals:**
   ```bash
   # Terminal 1: Backend
   npm run start:dev
   
   # Terminal 2: Admin UI
   npm run admin:dev
   
   # Terminal 3: Agent UI
   npm run agent:dev
   ```
6. **Start AuthMe separately** (see [docs/authme-setup.md](docs/authme-setup.md))

### Development Tips

- **Hot Reload**: Backend watches for changes automatically with `npm run start:dev`
- **UI Hot Reload**: Both portals (Admin & Agent) auto-refresh on file changes
- **Prisma Studio**: Inspect the database GUI: `npx prisma studio`
- **Database Reset**: `npx prisma migrate reset` (local only) or `docker compose exec app npx prisma migrate reset` (Docker)
- **Seed Data**: `npm run prisma:seed` or `docker compose -f docker-compose.dev-full.yml exec app npm run prisma:seed`
- **Email Testing**: AuthMe dev setup includes MailHog for viewing test emails at http://localhost:8025

## Authentication & Authorization

Uses **Authme** as the IAM server (Keycloak-compatible OAuth 2.0 / OIDC).

- **Realm:** `real-estate`
- **Roles:** `crm-admin`, `crm-manager`, `crm-agent`
- **Auth Flow:** OAuth 2.0 Authorization Code + PKCE
- **Token Validation:** JWT validated against Authme JWKS endpoint

See [docs/authme-setup.md](docs/authme-setup.md) for full IAM configuration instructions.

## Environment Variables

See [`.env.example`](.env.example) for all required variables. Full documentation in [docs/development.md](docs/development.md).

## API Documentation

Interactive Swagger UI is available at `http://localhost:3000/api/docs` when the backend is running.

For a static summary of all endpoints, see [docs/api-reference.md](docs/api-reference.md).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start backend in watch mode |
| `npm run start:prod` | Start backend in production mode |
| `npm run admin:dev` | Start Admin Portal dev server |
| `npm run agent:dev` | Start Agent Portal dev server |
| `npm run build` | Build the NestJS backend |
| `npm run lint` | Lint backend source code |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with sample data |
| `npm run db:setup` | Run migrations + seed in one step |

## Documentation

| Document | Description |
|----------|-------------|
| [Development Guide](docs/development.md) | Local setup, environment variables, coding conventions |
| [Authme Setup](docs/authme-setup.md) | IAM realm, client, and role configuration |
| [API Reference](docs/api-reference.md) | All API endpoints grouped by module |
| [Deployment Guide](docs/deployment.md) | Production deployment with Docker |
| [Architecture](ARCHITECTURE.md) | System architecture, ERD, RBAC matrix |
| [Changelog](CHANGELOG.md) | Version history and release notes |

## Database Models

| Model | Description |
|-------|-------------|
| **User** | Synced from Authme on first login (admin, manager, agent) |
| **Property** | Real estate listings (apartment, villa, office, shop, land, etc.) |
| **PropertyImage** | Property photos with primary flag and ordering |
| **Client** | Buyers, sellers, tenants, landlords, investors |
| **Lead** | Sales pipeline with status transitions and priority |
| **LeadActivity** | Lead interaction log (calls, emails, meetings, viewings) |
| **Contract** | Sale, rent, and lease agreements |
| **Invoice** | Payment tracking with multiple payment methods |
| **Activity** | System-wide audit trail |
| **Setting** | Application key-value configuration |
| **EmailLog** | Email delivery tracking with retry support |
| **EmailPreference** | Per-user email notification preferences |

## Screenshots

<!-- Add screenshots here -->
<!-- ![Admin Dashboard](docs/screenshots/admin-dashboard.png) -->
<!-- ![Property List](docs/screenshots/property-list.png) -->
<!-- ![Lead Pipeline](docs/screenshots/lead-pipeline.png) -->
<!-- ![Agent Dashboard](docs/screenshots/agent-dashboard.png) -->

## License

Private -- All rights reserved.
