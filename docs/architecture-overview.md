# Architecture Overview — Real Estate CRM

## System Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Authme IAM Server            │
                    │   OIDC / OAuth 2.0, RS256 JWTs       │
                    └──────────────┬──────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
  ┌──────▼──────┐          ┌───────▼───────┐          ┌──────▼──────┐
  │  Admin UI   │          │   Agent UI    │          │  Mobile App │
  │  React 19   │          │   React 19    │          │   Flutter   │
  │  Tailwind 4 │          │  Tailwind 4   │          │  Riverpod   │
  └──────┬──────┘          └───────┬───────┘          └──────┬──────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │ HTTPS / Bearer JWT
                             ┌─────▼─────┐
                             │   Nginx    │
                             │  SSL/TLS   │
                             └─────┬─────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      NestJS Backend :3000        │
                    │                                  │
                    │  Guards: JWT → Roles → Throttle  │
                    │  Interceptors: Sanitize (XSS)    │
                    │                                  │
                    │  Modules:                        │
                    │  Properties │ Clients │ Leads    │
                    │  Contracts  │ Invoices│ Dashboard│
                    │  Email      │ PDF     │ Uploads  │
                    │  Activities │ Health             │
                    └──────┬────────────┬─────────────┘
                           │            │
                    ┌──────▼──┐   ┌─────▼────┐
                    │PostgreSQL│   │  Redis   │
                    │  Prisma  │   │  Bull Q  │
                    └─────────┘   └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, TypeScript 5.7, Node.js 22 |
| Database | PostgreSQL 16, Prisma 7 |
| Auth | Authme (OIDC/OAuth 2.0) |
| Admin UI | React 19, Vite, Tailwind CSS 4, Zustand, TanStack Query |
| Agent UI | React 19 (same stack, reduced features) |
| Mobile | Flutter 3, Riverpod, Dio |
| Queue | Bull (Redis-backed) |
| Proxy | Nginx with Let's Encrypt SSL |
| CI/CD | GitHub Actions → GHCR → SSH Deploy |

## Data Model

```
User (ADMIN/MANAGER/AGENT)
  ├── Property (AVAILABLE/SOLD/RENTED/OFF_MARKET)
  │     └── PropertyImage
  ├── Client (BUYER/SELLER/TENANT/INVESTOR/LANDLORD)
  ├── Lead (NEW→CONTACTED→QUALIFIED→PROPOSAL→NEGOTIATION→WON/LOST)
  │     └── LeadActivity (CALL/EMAIL/MEETING/NOTE/VIEWING)
  ├── Contract (DRAFT→PENDING→ACTIVE→COMPLETED/CANCELLED/EXPIRED)
  │     └── Invoice (PENDING/PAID/OVERDUE/CANCELLED)
  └── EmailPreference

Activity (audit trail)
Setting (key-value config)
EmailLog (email delivery tracking)
```

## RBAC Matrix

| Action | Admin | Manager | Agent |
|--------|:-----:|:-------:|:-----:|
| View all data | ✓ | ✓ | Own only |
| Create property/client/lead | ✓ | ✓ | ✓ |
| Create contract/invoice | ✓ | ✓ | ✗ |
| Delete anything | ✓ | ✗ | ✗ |
| Assign agents | ✓ | ✓ | ✗ |
| Admin dashboard | ✓ | ✓ | ✗ |
| Agent dashboard | ✓ | ✓ | ✓ |
| Generate invoices | ✓ | ✓ | ✗ |
| Purge activities | ✓ | ✗ | ✗ |

## API Endpoints Summary

| Module | Base Path | Key Endpoints |
|--------|-----------|--------------|
| Health | `/api/health` | GET /, /live, /ready |
| Properties | `/api/properties` | CRUD, /search, /stats, /:id/status |
| Clients | `/api/clients` | CRUD, /check-duplicates, /stats, /:id/assign |
| Leads | `/api/leads` | CRUD, /pipeline, /stats, /:id/status, /:id/convert |
| Contracts | `/api/contracts` | CRUD, /stats, /expiring, /:id/generate-invoices |
| Invoices | `/api/invoices` | CRUD, /overdue, /upcoming, /stats, /:id/pay |
| Dashboard | `/api/dashboard` | /admin/*, /agent/*, combined mobile |
| Activities | `/api/activities` | /recent, /entity/:type/:id, /purge |
| Uploads | `/api/uploads` | Property images, contract docs |
| PDF | `/api/contracts/:id/pdf` | Contract, invoice, property, report PDFs |
| Email | `/api/email` | /send, /logs, /preferences |
| Swagger | `/api/docs` | Interactive API documentation |
