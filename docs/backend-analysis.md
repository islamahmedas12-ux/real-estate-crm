# Backend Analysis — Sprint 1 Readiness Review

**Author:** Karim Nabil (Senior Backend Developer)  
**Date:** 2026-03-27  
**Scope:** Full backend audit — modules, DTOs, schema, auth, and code quality

---

## Summary

The backend is structurally well-designed with a clean modular NestJS architecture. Swagger is already configured. The Prisma schema is solid with good indexing. However, **three critical bugs** were found and fixed during this audit, plus several major and minor issues documented below.

---

## Module-by-Module Status

| Module | Status | Notes |
|--------|--------|-------|
| `auth` | ✅ Complete | JWT/JWKS, user sync, guards, decorators |
| `prisma` | ✅ Complete | PrismaPg adapter, lifecycle hooks, pool config |
| `properties` | ✅ Complete | CRUD, filters, agent scoping, full-text search, cursor pagination |
| `clients` | ✅ Complete | CRUD, dedup, agent scoping, history |
| `leads` | ✅ Complete | CRUD, status machine, pipeline, activities |
| `contracts` | ✅ Complete | CRUD, status transitions, invoice generation, property status sync |
| `invoices` | ✅ Complete | CRUD, payment recording, overdue/upcoming, stats |
| `activities` | ✅ Complete | Log, filter, entity/user query, retention purge |
| `dashboard` | ✅ Complete | Admin + agent views, caching, revenue timeline |
| `uploads` | ✅ Complete | Property images (sharp), contract docs, path traversal guard |
| `email` | ✅ Complete | Bull queue, Handlebars templates, scheduler, preferences |
| `pdf` | ✅ Complete | Contract, invoice, property, monthly/agent reports |
| `health` | ✅ Complete | /health, /health/live, /health/ready |
| `common` | ✅ Complete | Pagination, cursor pagination, exception filter |

---

## Issues Found

### 🔴 CRITICAL (Fixed)

#### 1. `RolesGuard` never enforced globally
- **File:** `src/app.module.ts`
- **Problem:** `@Roles()` decorator was applied in controllers but `RolesGuard` was not registered as a global `APP_GUARD`. This meant **all role restrictions were silently bypassed** — any authenticated user could call admin-only endpoints.
- **Fix:** Added `RolesGuard` as a second `APP_GUARD` provider in `AppModule`, after `JwtAuthGuard`.

#### 2. `user.sub` (authmeId) used instead of `user.id` (DB UUID) for FK comparisons
- **Files:** `contracts.service.ts`, `invoices.service.ts`, `leads/leads.controller.ts`, `clients/clients.controller.ts`, `dashboard/dashboard.controller.ts`, `email/email.controller.ts`, `properties/properties.controller.ts`, `activities/activity.interceptor.ts`
- **Problem:** `user.sub` contains the Authme external identity (JWT `sub` claim). Database FK fields (`agentId`, `assignedAgentId`, `userId`) store the internal DB UUID (`user.id`). Using `user.sub` for these comparisons meant:
  - Ownership checks always failed → agents could access all contracts/invoices
  - Scoped queries (agent seeing only own data) returned wrong results
  - New records were created with the Authme ID instead of DB ID as FK
- **Fix:** Replaced all `user.sub` → `user.id` in FK contexts across affected files.

#### 3. Prisma datasource missing `url` field
- **File:** `prisma/schema.prisma`
- **Problem:** The `datasource db` block had no `url` field. While `PrismaPg` in `PrismaService` reads `DATABASE_URL` directly, `prisma migrate` and `prisma generate` CLI commands require the URL in the schema to function.
- **Fix:** Added `url = env("DATABASE_URL")` to the datasource block.

---

### 🟡 MAJOR

#### 4. `InvoiceStatus.OVERDUE` referenced but doesn't exist in schema
- **Files:** `src/pdf/pdf.service.ts`, `src/email/email.scheduler.ts`
- **Problem:** The `InvoiceStatus` enum has `PENDING`, `PAID`, `CANCELLED`, `REFUNDED` — no `OVERDUE` value. Code filtering `status === 'OVERDUE'` silently returned empty results.
- **Fix:** 
  - PDF service: replaced with `status === 'PENDING' && dueDate < now`
  - Email scheduler: removed `'OVERDUE'` from status filter (overdue is computed by date comparison, not status field)

#### 5. `agentName` placeholder in PDF agent performance report
- **File:** `src/pdf/pdf.service.ts`
- **Problem:** `agentName: agentId` — the agent UUID was used as display name in PDF reports.
- **Fix:** Added user DB lookup for `firstName`/`lastName` and compose the full name.

#### 6. Missing env vars in `.env.example`
- **File:** `.env.example`
- **Problem:** Redis (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`), SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`), rate limiting, and DB pool config were missing. New developers would have the app crash on startup (Bull can't connect to Redis).
- **Fix:** Added all missing env vars with sensible defaults.

---

### 🟢 MINOR

#### 7. Redundant `@UseGuards(AuthGuard)` in controllers
- **Files:** `leads.controller.ts`, `clients.controller.ts`, `invoices.controller.ts`, `uploads.controller.ts`, `dashboard.controller.ts`, `properties.controller.ts`
- **Problem:** Most controllers apply `@UseGuards(AuthGuard)` at class level, but `JwtAuthGuard` is already registered globally via `APP_GUARD`. This is redundant (not harmful, but noisy).
- **Recommendation:** Remove per-controller `@UseGuards` — rely on the global guard. Only keep it on controllers that need `RolesGuard` independently (none currently).

#### 8. `ContractsController` missing `@UseGuards`
- **File:** `src/contracts/contracts.controller.ts`
- **Problem:** Unlike other controllers, `ContractsController` does not have `@UseGuards(AuthGuard)`. Protection still works via the global guard, but the Swagger UI won't show the lock icon.
- **Recommendation:** Add `@UseGuards(AuthGuard)` for consistency in Swagger UI rendering.

#### 9. `PaginationDto.skip` getter returns NaN for non-integer inputs
- **File:** `src/common/dto/pagination.dto.ts`
- **Problem:** If `page` or `limit` are somehow not numbers (despite `@IsInt()`), `skip` could return NaN and Prisma would throw an error.
- **Recommendation:** Add `?? 0` guard: `return ((this.page ?? 1) - 1) * (this.limit ?? 20)` (already has it — OK).

#### 10. Email weekly summary `revenueCollected` hardcoded to `'0'`
- **File:** `src/email/email.scheduler.ts`
- **Problem:** `revenueCollected: '0'` — the weekly summary email always shows 0 revenue collected.
- **Recommendation:** Add an aggregation query for paid invoices in the week period.

#### 11. No `@nestjs/serve-static` route for uploaded files — using `res.sendFile`
- **File:** `src/uploads/uploads.controller.ts`
- **Problem:** `res.sendFile(filePath)` with an absolute path should work but bypasses NestJS interceptors. For large-scale deployments, a CDN/object storage should replace local FS uploads.
- **Recommendation:** Document in deployment guide that `UPLOAD_DIR` should be replaced with S3/CloudStorage in production.

#### 12. `LeadActivity.performedBy` stores user ID string (not FK to users table)
- **File:** `prisma/schema.prisma`
- **Problem:** `LeadActivity.performedBy` is a plain `String` — not a relation to the `User` model. Same for `Activity.performedBy`. This prevents JOIN queries and data integrity enforcement.
- **Recommendation:** Consider adding `@@index([performedBy])` (already done for `Activity`) and document that `performedBy` stores the internal DB user UUID for consistency. Future migration could add an optional FK.

---

## DTO Validation Coverage

All DTOs reviewed have proper `class-validator` decorators:

| DTO | `@IsNotEmpty` | `@IsEnum` | `@IsUUID` | `@IsString` | `@IsOptional` | Swagger |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|
| `CreateClientDto` | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `CreateLeadDto` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `CreatePropertyDto` | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `CreateContractDto` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `CreateInvoiceDto` | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| `RecordPaymentDto` | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| `ChangeLeadStatusDto` | ✅ | ✅ | — | — | ✅ | ✅ |
| `CreateLeadActivityDto` | ✅ | ✅ | — | ✅ | — | ✅ |

All DTOs: ✅ Validation present, ✅ Swagger decorators present.

---

## Prisma Schema Review

### Indexes
All key indexes are present and appropriate:
- `User`: authmeId (unique), role
- `Property`: status+agentId, type+status, city+region, price, area, createdAt
- `Client`: email (unique), phone (unique), type+agentId, source, createdAt
- `Lead`: status+agentId, priority, nextFollowUp, createdAt
- `LeadActivity`: leadId, createdAt
- `Contract`: status, propertyId, clientId, agentId, createdAt
- `Invoice`: status, status+paidDate, dueDate, contractId, createdAt
- `Activity`: entityType+entityId, performedBy, createdAt
- `EmailLog`: status, createdAt

### Missing Indexes (Recommendations)
- `Lead` — consider adding composite `(clientId, status)` for client timeline queries
- `Contract` — consider `(propertyId, status)` for property availability checks

### Relations
All relations are correctly defined with appropriate cascade/restrict behaviors:
- `PropertyImage` → `Property`: Cascade delete (correct)
- `Lead` → `Client`: Cascade delete (correct — leads die with client)
- `Contract` → `Property/Client`: Restrict (correct — prevents orphaned contracts)
- `Invoice` → `Contract`: Restrict (correct)
- `EmailPreference` → `User`: Cascade delete (correct)

---

## Swagger/OpenAPI Status

✅ **Already configured** in `main.ts` with:
- Bearer auth scheme
- All module tags defined
- CSP relaxed for Swagger UI
- Available at `/api/docs`

---

## Architecture Assessment

### Strengths
- Clean modular separation (one module per domain)
- Global JWT guard + roles guard (after fix)
- Consistent pagination via `PaginationDto`
- Cursor pagination for large datasets (properties)
- Status machines for leads and contracts
- Bull queue for async email delivery with retry
- Scheduled email reminders (follow-ups, invoices, weekly summaries)
- Activity interceptor for automatic audit logging
- Transaction usage for atomic operations (contract creation, status changes)
- Path traversal protection in file serving

### Gaps for Future Sprints
1. **No unit/integration tests** — all `.spec.ts` files exist but are empty scaffolds
2. **No caching layer for property/lead queries** — only dashboard is cached
3. **Local file storage** — should move to object storage (S3/GCS) before prod
4. **No soft-delete pattern for most entities** — only properties (OFF_MARKET) and leads (LOST) have soft deletes; others use hard delete
5. **No API versioning** — all endpoints are at `/api/` without version prefix
6. **No rate limiting per user** — ThrottlerGuard is IP-based; consider user-based limits for auth endpoints

---

## Recommendations for Next Sprint

1. **Write unit tests** — at minimum for services (business logic), especially status machines
2. **Add `@nestjs/serve-static` + document migration to object storage**
3. **Move to soft-deletes** for clients, contracts, invoices
4. **Fix weekly summary revenue** in EmailScheduler
5. **Remove redundant `@UseGuards`** from controllers
6. **Add `@UseGuards(AuthGuard)`** to ContractsController for Swagger UI consistency
