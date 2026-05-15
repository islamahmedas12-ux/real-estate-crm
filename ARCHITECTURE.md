# Architecture

## System Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Admin Portal│    │ Agent Portal │    │  Mobile App  │
│   (React)    │    │   (React)    │    │  (Flutter)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │    OAuth 2.0 + PKCE (Authorization Code)
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│                    Authme (IAM)                       │
│         Realm: real-estate                            │
│         Roles: admin, manager, agent                  │
│         Clients: admin-portal, agent-portal, mobile   │
└──────────────────────┬───────────────────────────────┘
                       │ JWT (access token)
                       ▼
┌──────────────────────────────────────────────────────┐
│              NestJS Backend (API)                     │
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │  Auth   │ │Properties│ │ Clients │ │   Leads   │ │
│  │ Guard   │ │ Module  │ │ Module  │ │  Module   │ │
│  └─────────┘ └─────────┘ └─────────┘ └───────────┘ │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │Contracts│ │Invoices │ │Dashboard│ │  Reports  │ │
│  │ Module  │ │ Module  │ │ Module  │ │  Module   │ │
│  └─────────┘ └─────────┘ └─────────┘ └───────────┘ │
│  ┌─────────┐ ┌─────────┐                            │
│  │Activities│ │ Uploads │                            │
│  │ Module  │ │ Module  │                            │
│  └─────────┘ └─────────┘                            │
└──────────────────────┬───────────────────────────────┘
                       │ Prisma ORM
                       ▼
              ┌────────────────┐
              │  PostgreSQL 16 │
              └────────────────┘
```

## Backend Architecture

### Module Pattern (Following Authme)

Each domain module follows this structure:

```
src/module-name/
├── module-name.module.ts      # NestJS module definition
├── module-name.controller.ts  # HTTP endpoints
├── module-name.service.ts     # Business logic
├── module-name.controller.spec.ts  # Controller tests
├── module-name.service.spec.ts     # Service tests
└── dto/
    ├── create-module-name.dto.ts   # Create DTO
    ├── update-module-name.dto.ts   # Update DTO
    └── filter-module-name.dto.ts   # Filter/query DTO
```

### Authentication Flow

```
Client App                    Authme                     CRM Backend
    │                           │                            │
    │──── Login redirect ──────▶│                            │
    │                           │                            │
    │◀── Auth code ────────────│                            │
    │                           │                            │
    │──── Exchange code ───────▶│                            │
    │                           │                            │
    │◀── Access + Refresh ─────│                            │
    │     tokens                │                            │
    │                           │                            │
    │──── API request + JWT ───────────────────────────────▶│
    │                           │                            │
    │                           │◀── Validate JWT (JWKS) ───│
    │                           │                            │
    │                           │──── Valid + claims ───────▶│
    │                           │                            │
    │◀── API response ────────────────────────────────────│
```

### Authorization (RBAC)

| Resource | Admin | Manager | Agent |
|----------|-------|---------|-------|
| Properties — CRUD | ✅ All | ✅ All | 📋 Own assigned only |
| Properties — Create/Delete | ✅ | ✅ | ❌ |
| Clients — CRUD | ✅ All | ✅ All | 📋 Own assigned only |
| Leads — CRUD | ✅ All | ✅ All | 📋 Own assigned only |
| Leads — Assign | ✅ | ✅ | ❌ |
| Contracts — Create/Edit | ✅ | ✅ | ❌ (view only) |
| Invoices — Manage | ✅ | ✅ | ❌ (view only) |
| Dashboard — Admin | ✅ | ✅ | ❌ |
| Dashboard — Agent | ✅ | ✅ | ✅ (own data) |
| Reports | ✅ | ✅ | ❌ |
| Agent Management | ✅ | 📋 View only | ❌ |
| Settings | ✅ | ❌ | ❌ |

### API Endpoint Structure

```
/api
├── /auth                    # Auth endpoints (if needed beyond Authme)
├── /properties              # Property CRUD + filters
│   ├── /:id/images          # Property images
│   ├── /:id/status          # Status change
│   ├── /:id/assign          # Agent assignment
│   └── /stats               # Statistics
├── /clients                 # Client CRUD + filters
│   ├── /:id/history         # Interaction history
│   ├── /:id/assign          # Agent assignment
│   └── /stats               # Statistics
├── /leads                   # Lead CRUD + pipeline
│   ├── /:id/status          # Pipeline status change
│   ├── /:id/assign          # Agent assignment
│   ├── /:id/activities      # Lead activities
│   ├── /pipeline            # Kanban view data
│   └── /stats               # Statistics
├── /contracts               # Contract CRUD
│   ├── /:id/status          # Status change
│   ├── /:id/invoices        # Contract invoices
│   ├── /:id/generate-invoices
│   ├── /:id/pdf             # PDF export
│   ├── /expiring            # Expiring contracts
│   └── /stats               # Statistics
├── /invoices                # Invoice CRUD + payments
│   ├── /:id/pay             # Record payment
│   ├── /:id/pdf             # PDF export
│   ├── /overdue             # Overdue invoices
│   ├── /upcoming            # Upcoming due dates
│   └── /stats               # Statistics
├── /dashboard
│   ├── /admin/*             # Admin dashboard data
│   └── /agent/*             # Agent dashboard data
├── /activities              # Audit trail
├── /reports                 # Report generation
│   └── /generate-pdf        # PDF reports
└── /uploads/:filename       # File serving
```

## Database Schema (ERD)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Property   │     │    Client    │     │   Setting    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ title        │     │ firstName    │     │ key (unique) │
│ description  │     │ lastName     │     │ value (JSON) │
│ type (enum)  │     │ email        │     │ description  │
│ status (enum)│     │ phone        │     └──────────────┘
│ price        │     │ nationalId   │
│ area         │     │ type (enum)  │
│ bedrooms     │     │ source (enum)│
│ bathrooms    │     │ notes        │
│ floor        │     │ assignedAgent│
│ address      │     │ createdAt    │
│ city         │     │ updatedAt    │
│ region       │     └──────┬───────┘
│ lat/lng      │            │
│ features JSON│            │
│ assignedAgent│            │
│ createdAt    │            │
│ updatedAt    │            │
└──────┬───────┘            │
       │                    │
       │ 1:N                │ 1:N
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│PropertyImage │     │     Lead     │
├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │
│ propertyId FK│     │ clientId FK  │◄──── Client
│ url          │     │ propertyId FK│◄──── Property (nullable)
│ caption      │     │ status (enum)│
│ isPrimary    │     │ priority     │
│ order        │     │ source       │
│ createdAt    │     │ budget       │
└──────────────┘     │ notes        │
                     │ assignedAgent│
                     │ nextFollowUp │
                     │ createdAt    │
                     │ updatedAt    │
                     └──────┬───────┘
                            │
                            │ 1:N
                            ▼
                     ┌──────────────┐
                     │ LeadActivity │
                     ├──────────────┤
                     │ id (PK)      │
                     │ leadId FK    │
                     │ type (enum)  │
                     │ description  │
                     │ performedBy  │
                     │ createdAt    │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Contract   │     │   Invoice    │     │   Activity   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ type (enum)  │     │ contractId FK│◄─── │ type (enum)  │
│ propertyId FK│◄─── │ invoiceNumber│     │ description  │
│ clientId FK  │◄─── │ amount       │     │ entityType   │
│ agentId      │     │ dueDate      │     │ entityId     │
│ startDate    │     │ paidDate     │     │ performedBy  │
│ endDate      │     │ status (enum)│     │ metadata JSON│
│ totalAmount  │     │ paymentMethod│     │ createdAt    │
│ monthlyAmount│     │ notes        │     └──────────────┘
│ paymentTerms │     │ createdAt    │
│ status (enum)│     │ updatedAt    │
│ documentUrl  │     └──────────────┘
│ notes        │
│ createdAt    │
│ updatedAt    │
└──────────────┘
       │
       │ 1:N
       ▼
    Invoice
```

## Frontend Architecture

### Shared Patterns (Admin + Agent Portals)

- **Auth:** Authme SDK with React Context Provider
- **Routing:** React Router v7 with protected routes
- **State:** React Context + React Query (server state)
- **API Client:** Axios with auth interceptor
- **UI:** Tailwind CSS 4 + custom component library
- **Charts:** Recharts or Chart.js
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table

### Admin Portal Pages
```
/dashboard          — Admin dashboard
/properties         — Property list + CRUD
/properties/:id     — Property detail
/clients            — Client list + CRUD
/clients/:id        — Client detail
/leads              — Lead list + kanban
/leads/:id          — Lead detail
/contracts          — Contract list + CRUD
/contracts/:id      — Contract detail
/invoices           — Invoice list
/invoices/:id       — Invoice detail
/reports            — Reports page
/agents             — Agent management
/settings           — App settings
```

### Agent Portal Pages
```
/dashboard          — Agent dashboard
/leads              — My leads + kanban
/leads/:id          — Lead detail
/clients            — My clients
/clients/:id        — Client detail
/properties         — Browse properties
/properties/:id     — Property detail
/contracts          — My contracts (read-only)
```

## Mobile Architecture (Flutter)

```
lib/
├── main.dart
├── app/
│   ├── routes.dart         # go_router configuration
│   └── theme.dart          # App theme
├── core/
│   ├── auth/               # Authme OIDC integration
│   ├── network/            # Dio HTTP client
│   ├── storage/            # Local storage
│   └── notifications/      # FCM setup
├── features/
│   ├── dashboard/          # Agent dashboard
│   ├── properties/         # Property screens
│   ├── leads/              # Lead screens
│   ├── clients/            # Client screens
│   └── profile/            # User profile
├── models/                 # Data models
├── providers/              # Riverpod providers
└── widgets/                # Shared widgets
```

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│                   Nginx                      │
│  /admin  → Admin Portal (static)            │
│  /agent  → Agent Portal (static)            │
│  /api    → NestJS Backend                   │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  NestJS  │ │  Authme  │ │PostgreSQL│
   │  Backend │ │   IAM    │ │    16    │
   └──────────┘ └──────────┘ └──────────┘
```

## Monitoring

### Metrics (`/metrics`)

The NestJS backend exposes a Prometheus-compatible `/metrics` endpoint (public, no auth required).

Metrics collected:

| Metric | Type | Description |
|--------|------|-------------|
| `crm_logins_total` | Counter | User login events |
| `crm_contracts_created_total` | Counter | Contracts created |
| `crm_payments_recorded_total` | Counter | Payments recorded |
| `crm_queue_email_pending` | Gauge | Pending email queue jobs |
| `crm_queue_email_active` | Gauge | Active email queue jobs |
| `crm_queue_email_failed` | Gauge | Failed email queue jobs |
| `process_cpu_*`, `process_memory_*`, `nodejs_*` | Gauge | Default Node.js process metrics |
| `http_server_requests_seconds_*` | Histogram | HTTP request latency (if enabled via `prom-client`) |

### Alert Rules (Prometheus)

- **HighErrorRate**: 5xx error rate > 1% for 2 minutes
- **QueueBacklogHigh**: Email queue pending > 100 for 5 minutes
- **QueueFailedJobs**: Failed email jobs > 10
- **HighLatency**: API p99 latency > 2 seconds

### Grafana Dashboards

Located in `monitoring/provisioning/dashboards/api.json`:

- API Latency (p50 / p95 / p99)
- Error Rate (5xx / total)
- Email Queue Depth (pending / active / failed)
- Business Metrics Rate (logins, contracts, payments per minute)

Access Grafana at `http://localhost:3001` (default credentials: `admin` / `admin`).

### Stack

```yaml
prometheus: :9090   # Scrape engine + TSDB
grafana:    :3001    # Dashboards (provisioned via monitoring/provisioning/)
```

To start the monitoring stack:

```bash
docker compose -f docker-compose-monitoring.yml up -d
```

### Error Tracking

[Sentry](https://sentry.io) is integrated for backend error tracking. Configure `SENTRY_DSN` environment variable to enable. Errors are sanitized before sending (Authorization headers and PII fields are stripped via `beforeSend`).

### Structured Logging

All backend logs are structured JSON via Pino. Configure `LOG_LEVEL` (default: `info`). Logs include a `correlationId` for request tracing across services.
