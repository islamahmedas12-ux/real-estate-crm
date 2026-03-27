# QA Automation Plan — Real Estate CRM
**Prepared by:** Sara Mostafa, Senior QA Engineer (Automation & Mobile Testing)  
**Version:** 1.0  
**Date:** 2026-03-27  
**Sprint:** Sprint 1 — QA Foundation

---

## 1. Current Test Coverage Analysis

### 1.1 Existing Unit/Integration Tests (`*.spec.ts`)

The following spec files exist in `src/`:

| Module | Controller Spec | Service Spec | Notes |
|--------|----------------|--------------|-------|
| `auth` | ✅ `auth.service.spec.ts` | ✅ `jwt.strategy.spec.ts`, `roles.guard.spec.ts`, `jwt-auth.guard.spec.ts` | Good coverage of syncUser, getUserByAuthmeId, guard logic |
| `properties` | ✅ `properties.controller.spec.ts` | ✅ `properties.service.spec.ts`, `properties-search.service.spec.ts` | CRUD + search covered |
| `clients` | ✅ `clients.controller.spec.ts` | ✅ `clients.service.spec.ts` | CRUD covered |
| `leads` | ✅ `leads.controller.spec.ts` | ✅ `leads.service.spec.ts` | Pipeline + activities present |
| `contracts` | ✅ `contracts.controller.spec.ts` | ✅ `contracts.service.spec.ts` | Lifecycle tests |
| `invoices` | ✅ `invoices.controller.spec.ts` | ✅ `invoices.service.spec.ts` | Payment flow tests |
| `dashboard` | ✅ `dashboard.controller.spec.ts` | ✅ `dashboard.service.spec.ts` | KPI aggregation |
| `activities` | ✅ `activities.controller.spec.ts` | ✅ `activities.service.spec.ts` | Audit trail |
| `email` | ✅ `email.controller.spec.ts` | ✅ `email.service.spec.ts` | Email delivery |
| `uploads` | ✅ `uploads.controller.spec.ts` | ✅ `uploads.service.spec.ts` | File handling |
| `pdf` | ✅ `pdf.controller.spec.ts` | — | PDF generation |
| `health` | ✅ `health.controller.spec.ts` | — | Health check |

### 1.2 Coverage Gaps Identified

**Missing test coverage:**
- ❌ **Integration tests** — No tests that wire modules together (e.g., creating a contract triggers invoice generation)
- ❌ **E2E tests** — No browser-level tests (`test/` directory is empty; `jest-e2e.json` referenced but no tests exist)
- ❌ **RBAC boundary tests** — Role-based access tests at HTTP layer are thin; admin/manager/agent distinctions not fully validated
- ❌ **Status transition validation** — Lead pipeline transitions (valid/invalid paths) need negative-path tests
- ❌ **Error edge cases** — Duplicate detection (client email/phone), foreign key violations
- ❌ **Flutter mobile** — `flutter test` runs but no feature test files found in `mobile/test/`
- ❌ **Frontend unit tests** — admin-ui and agent-ui have no `*.test.tsx` files yet
- ❌ **Performance/load tests** — No k6 or Artillery scripts

### 1.3 Current Coverage Estimate

| Layer | Estimated Coverage | Quality |
|-------|--------------------|---------|
| Backend unit (service) | ~60% | Good baseline |
| Backend unit (controller) | ~40% | Happy paths only |
| Backend integration | 0% | Not started |
| E2E (browser) | 0% | Not started |
| Mobile (Flutter) | 0% | Not started |
| Frontend (React) | 0% | Not started |

---

## 2. Automation Strategy

### 2.1 Testing Pyramid

```
         ┌──────────────────┐
         │   E2E Tests      │  ← Playwright (10-15%)
         │  (critical flows)│
         ├──────────────────┤
         │ Integration Tests │  ← Jest + Supertest (20-25%)
         │  (API contracts) │
         ├──────────────────┤
         │   Unit Tests     │  ← Jest (60-70%)
         │ (services/guards)│
         └──────────────────┘
```

### 2.2 Tools

| Layer | Tool | Rationale |
|-------|------|-----------|
| Unit + Integration | **Jest** (already configured) | NestJS native; ts-jest transform; mock patterns established |
| E2E Browser | **Playwright** | Multi-browser; TypeScript native; reliable; supports auth flows |
| API Integration | **Jest + Supertest** | Already a dep; tests actual HTTP layer without a browser |
| Mobile | **Flutter test framework** | Built-in; integration_test package for E2E |
| Load/Performance | **k6** | Sprint 2+ |
| CI/CD | **GitHub Actions** | Already configured in `.github/workflows/ci.yml` |

### 2.3 Test File Conventions

```
# Unit tests — co-located with source
src/module/module.service.spec.ts
src/module/module.controller.spec.ts

# Integration tests — separate directory
test/integration/
  properties.integration.spec.ts
  leads.integration.spec.ts
  auth.integration.spec.ts

# E2E tests — Playwright
e2e/
  auth.spec.ts
  properties.spec.ts
  leads-pipeline.spec.ts
  contracts.spec.ts
```

---

## 3. Priority Test Scenarios

### Priority 1 — Automate First (P1 Critical Paths)

| # | Scenario | Layer | Rationale |
|---|---------|-------|-----------|
| 1 | Admin + Agent OAuth login flow | E2E | Core entry point; everything depends on auth |
| 2 | JWT guard rejects unauthenticated requests | Integration | Security baseline |
| 3 | RBAC: agent cannot access admin endpoints | Integration | Authorization correctness |
| 4 | Property CRUD (create → read → update → delete) | Integration | Core entity |
| 5 | Lead status transition (valid and invalid paths) | Unit + Integration | Complex business logic |
| 6 | Create contract → auto-generate invoices | Integration | Business-critical workflow |
| 7 | Record invoice payment → status PAID | Integration | Revenue tracking |
| 8 | Admin dashboard KPIs return data | Integration | Homepage must load |

### Priority 2 — Next Sprint

| # | Scenario | Layer |
|---|---------|-------|
| 9 | Client duplicate detection | Integration |
| 10 | Property full-text search | Integration |
| 11 | Lead pipeline kanban view | E2E |
| 12 | PDF export for contract/invoice | Integration |
| 13 | Expiring contracts alert | Integration |
| 14 | Email notification on lead assignment | Integration (mocked) |
| 15 | Agent portal — my leads list | E2E |

### Priority 3 — Sprint 3+

| # | Scenario | Layer |
|---|---------|-------|
| 16 | Flutter: Login flow | Mobile (integration_test) |
| 17 | Flutter: View leads list | Mobile |
| 18 | Load test: API under 100 concurrent users | k6 |
| 19 | Cross-browser: Chrome/Firefox/Safari | Playwright |
| 20 | Accessibility audit | Playwright + axe-core |

---

## 4. CI/CD Integration Plan

### 4.1 Current Pipeline (`.github/workflows/ci.yml`)

The existing CI runs:
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type check
- `npm run test -- --ci --coverage` — Jest unit tests
- `npm run build` — Backend build
- Admin UI / Agent UI lint + build
- Flutter analyze + test
- Docker build

### 4.2 Planned Pipeline Extensions

#### Phase 1 (Sprint 1 — this PR)
Add Playwright E2E job to `ci.yml`:

```yaml
  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [backend]
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: real_estate_crm_e2e
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Start backend (test mode)
        run: npm run start:prod &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/real_estate_crm_e2e
          NODE_ENV: test
      - name: Wait for backend
        run: npx wait-on http://localhost:3000/health
      - name: Run E2E tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

#### Phase 2 (Sprint 2)
- Add integration test job with real PostgreSQL (Supertest)
- Add coverage threshold gate: fail if coverage drops below 70%
- Add k6 load test on schedule (nightly on QA env)

#### Phase 3 (Sprint 3+)
- Add Flutter integration tests on Android emulator
- Add visual regression with Playwright screenshots
- Slack/Telegram notification on test failure

### 4.3 Quality Gates

| Gate | Threshold | Action on Fail |
|------|-----------|----------------|
| Unit test pass rate | 100% | Block PR merge |
| Code coverage | ≥70% overall | Block PR merge |
| E2E pass rate | 100% critical paths | Block merge to main |
| Lint | 0 warnings | Block PR merge |
| Build | Must succeed | Block PR merge |

---

## 5. Test Data Strategy

### 5.1 Seeded Data
- Use `prisma/seed.ts` for consistent test data in E2E
- Reset database between E2E test runs (or use transactions that rollback)

### 5.2 Test Fixtures
- Store reusable fixtures in `e2e/fixtures/`
- Separate fixture files per domain: `auth.fixtures.ts`, `properties.fixtures.ts`

### 5.3 Sensitive Data
- Never commit real credentials; use `.env.test` (gitignored)
- Mock Authme in integration tests using JWT test keys
- E2E tests use dedicated test Authme realm or mock OIDC server

---

*Prepared by Sara Mostafa — QA Automation Lead | Real Estate CRM Sprint 1*
