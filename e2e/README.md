# E2E Tests — Real Estate CRM

**Prepared by Sara Mostafa (QA Automation)**

## Overview

This directory contains Playwright E2E tests for the Real Estate CRM system.

## Directory Structure

```
e2e/
├── .auth/                  # Stored auth sessions (gitignored)
│   ├── admin.json
│   └── agent.json
├── fixtures/
│   └── index.ts            # Test users, URLs, sample data
├── auth.setup.ts           # Auth setup — runs before all tests
├── auth.spec.ts            # Authentication & RBAC tests
├── properties.spec.ts      # Properties module tests
└── README.md               # This file
```

## Running Tests

### Prerequisites

1. Backend running at `http://localhost:3000`
2. Admin Portal running at `http://localhost:5173`
3. Agent Portal running at `http://localhost:5174`
4. Authme IAM running and configured
5. Database seeded (`npm run prisma:seed`)

### Install Playwright

```bash
npx playwright install --with-deps chromium
```

### Run all E2E tests

```bash
npx playwright test
```

### Run specific file

```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/properties.spec.ts
```

### Run with UI mode

```bash
npx playwright test --ui
```

### Run with headed browser (see what's happening)

```bash
npx playwright test --headed
```

### Debug a specific test

```bash
npx playwright test --debug e2e/auth.spec.ts
```

## Environment Variables

Create a `.env.test` file (gitignored):

```env
E2E_ADMIN_URL=http://localhost:5173
E2E_AGENT_URL=http://localhost:5174
E2E_API_URL=http://localhost:3000/api
E2E_ADMIN_USERNAME=admin@crm.test
E2E_ADMIN_PASSWORD=Admin@123!
E2E_AGENT_USERNAME=agent@crm.test
E2E_AGENT_PASSWORD=Agent@123!
```

## CI/CD

In GitHub Actions, E2E tests run as a separate job after the backend job passes.
See `.github/workflows/ci.yml` for the full pipeline configuration.

Failed test artifacts (screenshots, traces, videos) are uploaded as GitHub Actions artifacts.

## Adding New Tests

1. Create a new `e2e/feature-name.spec.ts` file
2. Import fixtures from `./fixtures/index.ts`
3. Use `test.describe` blocks per feature area
4. Follow naming convention: `TEST-ID: Description`
5. Add test IDs matching `docs/test-plan.md`

## Notes

- Tests use stored auth sessions (`e2e/.auth/`) to avoid login on every test
- The `.auth/` directory is gitignored — CI populates it via `auth.setup.ts`
- API tests (no browser) test auth boundaries directly
- UI tests verify the browser-level behavior of the React portals
