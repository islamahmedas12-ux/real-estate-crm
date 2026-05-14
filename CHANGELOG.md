# Changelog

All notable changes to the Real Estate CRM project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-03-26

### Added

#### Backend (NestJS)
- **Authentication & Authorization** -- Authme IAM integration with JWT validation via JWKS, role-based access control (admin, manager, agent), automatic user sync on first login
- **Properties Module** -- Full CRUD for property listings (apartment, villa, office, shop, land, building, chalet, studio, duplex, penthouse), status management (available, reserved, sold, rented, off-market), agent assignment, full-text search using PostgreSQL tsvector, cursor pagination
- **Clients Module** -- Client management with duplicate detection (unique email/phone), type classification (buyer, seller, tenant, landlord, investor), source tracking (referral, website, social media, walk-in, phone, advertisement), interaction history, agent assignment
- **Leads Module** -- Sales pipeline with validated status transitions (New > Contacted > Qualified > Proposal > Negotiation > Won/Lost), priority levels (low, medium, high, urgent), activity logging (calls, emails, meetings, notes, viewings, follow-ups), follow-up scheduling
- **Contracts Module** -- Sale, rent, and lease agreements with status lifecycle (draft > active > completed/cancelled/expired), auto-generate invoices from payment terms, expiring contract alerts
- **Invoices Module** -- Payment tracking with multiple methods (cash, bank transfer, check, credit card, installment), overdue detection, upcoming due dates, cancel and refund support
- **Dashboard Module** -- Admin dashboard with overview KPIs, revenue over time, lead pipeline, property breakdown, agent performance, recent activity feed (with caching). Agent dashboard with personal overview, lead pipeline, follow-up tracking, month-over-month performance comparison
- **Activities Module** -- System-wide audit trail with entity-level filtering (property, client, lead, contract, invoice), user-level filtering, admin purge capability
- **Email Module** -- Templated email system using Nodemailer + Handlebars, email logs with retry support, per-user notification preferences (lead assignment, follow-up reminders, contract updates, invoice reminders, payment confirmations, weekly summary)
- **PDF Generation** -- Contract PDF, invoice PDF, property listing PDF, monthly revenue report, agent performance report (using PDFKit)
- **File Uploads** -- Property image uploads (multiple, with Sharp thumbnails), contract document uploads, public file serving endpoint
- **API Documentation** -- Swagger/OpenAPI at `/api/docs` with full endpoint documentation
- **Security** -- Helmet HTTP headers, CORS configuration, global validation pipe (whitelist + forbidNonWhitelisted), rate limiting via Throttler
- **Health Checks** -- Terminus health check endpoint

#### Admin Portal (React)
- Dashboard with KPI cards, revenue charts, lead pipeline, agent performance
- Property management with list view, detail view, image gallery, status management
- Client management with list, detail, interaction history
- Lead pipeline with list and kanban views, activity timeline
- Contract management with list, detail, invoice generation
- Invoice management with payment recording
- Agent management and performance tracking
- Application settings

#### Agent Portal (React)
- Personal dashboard with stats, follow-ups, performance
- Lead management scoped to assigned leads
- Client list scoped to assigned clients
- Property browsing with assigned property highlighting
- Contract and invoice viewing (read-only)

#### Mobile App (Flutter)
- Agent-focused mobile app scaffolding
- Authentication via Authme OIDC
- Lead, client, and property screens

#### Infrastructure
- Docker multi-stage build (Node.js 22 Alpine)
- Docker Compose development environment (PostgreSQL 16 + NestJS with hot-reload)
- GitHub Actions CI pipeline (backend lint/test/build, admin UI build, agent UI build, Flutter analyze/test, Docker build verification)
- Prisma 7 schema with comprehensive indexes
- Database seed script

#### Documentation
- README with complete setup instructions and feature overview
- Architecture document with system diagrams, ERD, and RBAC matrix
- Authme IAM setup guide (realm, clients, roles, token mappers)
- API reference with all endpoints grouped by module
- Development guide with environment variables and coding conventions
- Production deployment guide with Docker, Nginx, backups, and monitoring
- Changelog
