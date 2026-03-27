# QA Test Plan — Real Estate CRM
**Issue #12 — QA Test Plan**
**Author:** Layla Ibrahim (Frontend / QA)
**Version:** 1.0
**Status:** Draft
**Date:** 2026-03-27

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Testing Strategy](#2-testing-strategy)
3. [Test Environments](#3-test-environments)
4. [Scope & Coverage Areas](#4-scope--coverage-areas)
5. [Test Case Template](#5-test-case-template)
6. [Sample Test Cases](#6-sample-test-cases)
7. [Test Data Management](#7-test-data-management)
8. [Entry & Exit Criteria](#8-entry--exit-criteria)
9. [Defect Management](#9-defect-management)
10. [Roles & Responsibilities](#10-roles--responsibilities)

---

## 1. Introduction

This document defines the Quality Assurance strategy for the **Real Estate CRM** platform. The system comprises:

- **admin-ui** — React/Vite web application for agents and managers
- **backend** — NestJS REST/GraphQL API
- **mobile** — Flutter application for agents on the go
- **AuthMe** — Keycloak-backed OIDC identity provider

The goal is to ensure all features meet functional, performance, security, and accessibility requirements before release to production.

---

## 2. Testing Strategy

### 2.1 Testing Pyramid

```
         ┌───────────────────────┐
         │   E2E / UI Tests (10%)│  Playwright · Detox
         ├───────────────────────┤
         │  Integration Tests    │
         │  (30%) API + DB       │  Supertest · Prisma seed
         ├───────────────────────┤
         │                       │
         │  Unit Tests (60%)     │  Jest · Vitest · Flutter test
         │                       │
         └───────────────────────┘
```

### 2.2 Testing Types

| Type           | Tool(s)                        | Responsibility    |
|----------------|--------------------------------|-------------------|
| Unit           | Vitest (frontend), Jest (BE), Flutter test | Developer |
| Integration    | Supertest + Prisma test DB     | Developer / QA    |
| API            | Supertest, Postman/Newman      | QA                |
| UI / Component | Playwright component tests     | QA                |
| E2E            | Playwright (web), Detox (mobile)| QA               |
| Accessibility  | axe-core via Playwright        | QA                |
| Performance    | k6, Lighthouse CI              | DevOps / QA       |
| Security       | OWASP ZAP, dependency audit    | DevOps / QA       |

### 2.3 Shift-Left Principles

- Developers write unit tests alongside features (TDD encouraged)
- PR gate: minimum 80% unit test coverage on changed files
- QA reviews test cases during story refinement, not after development
- Static analysis (ESLint, Dart Analyzer) runs on every push

### 2.4 Automation-First

- New regression bugs must have an automated test before marking fixed
- Nightly regression suite runs against the `qa` environment
- Manual testing reserved for exploratory, UX review, and ad-hoc edge cases

---

## 3. Test Environments

| Environment | URL Pattern                     | Branch  | Purpose                              | Data             |
|-------------|----------------------------------|---------|--------------------------------------|------------------|
| **dev**     | `http://localhost:3000`          | `dev`   | Active development, fast feedback    | Seeded mock data |
| **qa**      | `https://qa.crm.example.com`     | `qa`    | Automated regression suite, QA sign-off | Anonymized production snapshot |
| **uat**     | `https://uat.crm.example.com`    | `uat`   | Stakeholder / client acceptance testing | Sanitized prod copy |
| **prod**    | `https://crm.example.com`        | `prod`  | Live system                          | Real data        |

### 3.1 Environment Configuration

Each environment uses its own:
- `.env.<environment>` file (never committed)
- Separate Keycloak realm
- Separate PostgreSQL database
- Separate S3 bucket / object storage

### 3.2 Promotion Flow

```
dev  ──PR──▶  qa  ──manual QA sign-off──▶  uat  ──stakeholder OK──▶  prod
```

---

## 4. Scope & Coverage Areas

### 4.1 API Testing

**Goal:** Every REST endpoint returns correct status codes, payloads, and error messages.

**Coverage:**

| Module        | Endpoints                                              | Priority |
|---------------|--------------------------------------------------------|----------|
| Auth          | POST /auth/login, /auth/refresh, /auth/logout          | P0       |
| Properties    | CRUD + search + filter + bulk actions                  | P0       |
| Clients       | CRUD + search + link to agent                          | P0       |
| Deals         | CRUD + pipeline transitions + stage validation         | P0       |
| Users / Agents| CRUD + role assignment                                 | P1       |
| Reports       | Revenue, deal pipeline, agent performance              | P1       |
| Files/Media   | Upload, download, delete                               | P1       |
| Notifications | List, mark read, preferences                           | P2       |

**Test categories per endpoint:**
- Happy path (201/200)
- Validation errors (400) — required fields, formats, ranges
- Auth errors (401 unauth, 403 forbidden)
- Not found (404)
- Conflict (409) — duplicate records
- Rate limiting (429)

### 4.2 UI Testing (Admin Web)

**Goal:** All user flows work across supported browsers without visual regressions.

**Coverage areas:**

| Area               | Key Flows                                               |
|--------------------|---------------------------------------------------------|
| Authentication     | Login, logout, session expiry, password reset           |
| Dashboard          | Loads KPIs, charts render, date-range picker works      |
| Property List      | Search, filter, sort, paginate, bulk actions            |
| Property Detail    | View, inline edit, gallery, document upload             |
| Property Create    | Form validation, image upload, save draft               |
| Clients            | CRUD, link to deal/agent                                |
| Deals              | Pipeline board, drag-to-stage, deal detail              |
| Reports            | Chart rendering, export PDF/CSV                         |
| Settings           | User profile, notification preferences, theme toggle    |

**Browser matrix:**

| Browser         | Version      |
|-----------------|--------------|
| Chrome          | Latest       |
| Firefox         | Latest       |
| Edge            | Latest       |
| Safari (macOS)  | Latest       |

### 4.3 Mobile Testing (Flutter)

**Goal:** Core agent workflows function on iOS and Android.

**Coverage areas:**

| Area               | Flows                                                   |
|--------------------|---------------------------------------------------------|
| Authentication     | OIDC login via AuthMe, biometric re-auth                |
| Dashboard          | KPI cards load, pull-to-refresh                         |
| Property List      | Scroll, search, filter, offline cache display           |
| Property Detail    | View all fields, photo gallery swipe                    |
| Deal Management    | View pipeline, update stage                             |
| Client Profile     | View, quick call / email action                         |
| Offline Mode       | Cached data shown when offline; graceful error on write |

**Device matrix:**

| Platform | Devices                                     |
|----------|---------------------------------------------|
| Android  | Pixel 7 (API 33), Samsung Galaxy S23 (API 34)|
| iOS      | iPhone 15 (iOS 17), iPad Air (iOS 17)       |

### 4.4 End-to-End (E2E) Testing

**Goal:** Critical business flows work from login to completion.

**Critical E2E scenarios:**

| ID    | Scenario                                         | Tool       |
|-------|--------------------------------------------------|------------|
| E2E-01| Agent logs in → searches property → views detail | Playwright |
| E2E-02| Manager creates new property listing             | Playwright |
| E2E-03| Agent edits property price → activity log updated| Playwright |
| E2E-04| Manager assigns deal to agent                    | Playwright |
| E2E-05| Admin generates revenue report → exports CSV     | Playwright |
| E2E-06| Mobile agent logs in → views client → calls      | Detox      |
| E2E-07| Session expires → user redirected to login       | Playwright |
| E2E-08| Bulk archive properties → confirmed in list      | Playwright |

---

## 5. Test Case Template

```markdown
### TC-[MODULE]-[NNN]: [Short descriptive title]

| Field           | Value                          |
|-----------------|--------------------------------|
| **Test Case ID**| TC-PROP-001                    |
| **Feature**     | Property List                  |
| **Priority**    | P0 / P1 / P2                   |
| **Type**        | Unit / Integration / API / UI / E2E |
| **Author**      | [Name]                         |
| **Created**     | YYYY-MM-DD                     |
| **Last Updated**| YYYY-MM-DD                     |

**Pre-conditions:**
- User is logged in as Agent role
- At least 1 active property exists in the system

**Test Steps:**

| Step | Action                                     | Expected Result                            |
|------|--------------------------------------------|--------------------------------------------|
| 1    | Navigate to Properties page                | Page loads; table shows listing rows       |
| 2    | Type "Oak" in the search bar               | Table filters in real time (≤ 300 ms debounce) |
| 3    | Clear the search field                     | All listings reappear                      |

**Expected Result:**
Search filters properties by title and address. Results update within 300 ms. Clearing the field restores the full list.

**Actual Result:** _(filled during test execution)_

**Status:** Pass / Fail / Blocked / Skipped

**Notes / Defects:** _(links to Jira/GitHub issue if failed)_
```

---

## 6. Sample Test Cases

### TC-AUTH-001: Successful Login with Valid Credentials

| Field        | Value                                  |
|--------------|----------------------------------------|
| Priority     | P0                                     |
| Type         | E2E / UI                               |

**Pre-conditions:** AuthMe Keycloak realm is running; test user `agent@test.com` exists.

| Step | Action                                       | Expected Result                     |
|------|----------------------------------------------|-------------------------------------|
| 1    | Open admin-ui login page                     | Login form renders                  |
| 2    | Enter `agent@test.com` / `Test@1234`         | Fields accept input                 |
| 3    | Click "Sign In"                              | Redirect to AuthMe OIDC             |
| 4    | Complete OIDC flow                           | Redirected to dashboard             |
| 5    | Verify JWT in localStorage / cookie          | Valid, not expired                  |

---

### TC-PROP-001: Search Filters Property List

| Field        | Value                                  |
|--------------|----------------------------------------|
| Priority     | P0                                     |
| Type         | UI / E2E                               |

| Step | Action                                         | Expected Result                         |
|------|------------------------------------------------|-----------------------------------------|
| 1    | Navigate to Properties page                    | Table shows all properties              |
| 2    | Type "Oak" in search bar                       | Rows filter to show only "Oak" matches  |
| 3    | Clear search                                   | Full list restored                      |
| 4    | Type a string with no matches e.g. "zzzxxx"    | Empty state message shown               |

---

### TC-API-001: Create Property Returns 201

| Field        | Value           |
|--------------|-----------------|
| Priority     | P0              |
| Type         | API             |

```
POST /api/properties
Authorization: Bearer <admin_token>
Body: { "title": "Test Villa", "type": "villa", "price": 500000, ... }
```

Expected: `201 Created` with property object including `id`.

---

### TC-MOB-001: Property List Renders Offline (Cached Data)

| Field        | Value             |
|--------------|-------------------|
| Priority     | P1                |
| Type         | Mobile            |

| Step | Action                                      | Expected Result                          |
|------|---------------------------------------------|------------------------------------------|
| 1    | Launch app; allow data to load              | Properties visible                       |
| 2    | Disable device network                      | Offline banner appears                   |
| 3    | Scroll property list                        | Cached properties remain visible         |
| 4    | Tap "Add Property"                          | Toast: "No connection. Try again later." |

---

## 7. Test Data Management

- **Seed script:** `pnpm db:seed` populates `dev` and `qa` DBs with realistic mock data
- **Factories:** Prisma + `@faker-js/faker` factories in `prisma/factories/`
- **Anonymization:** Production snapshots for `uat` are run through `pnpm db:anonymize` (PII scrubbed)
- **Isolation:** Each E2E test suite creates its own data and cleans up via `afterAll` hooks
- **Secrets:** Test credentials stored in GitHub Secrets / `.env.test` (gitignored)

---

## 8. Entry & Exit Criteria

### Entry Criteria (start testing)

- Feature branch merged to `qa` environment
- Unit test coverage ≥ 80% on changed files
- No P0 open bugs from previous cycle
- Test data seed script runs without error

### Exit Criteria (release to next environment)

- All P0 and P1 test cases pass
- P2 test cases pass or have documented accepted risks
- Zero open P0 defects
- Accessibility audit score ≥ 90 (axe-core)
- Lighthouse performance score ≥ 80 on `qa`

---

## 9. Defect Management

| Severity | Description                                      | SLA to Fix |
|----------|--------------------------------------------------|------------|
| P0       | System crash, data loss, security breach         | 4 hours    |
| P1       | Major feature broken, no workaround              | 24 hours   |
| P2       | Feature degraded, workaround exists              | 3 days     |
| P3       | Minor UI issue, cosmetic defect                  | Sprint backlog |

**Workflow:** Found → Open → In Progress → In Review → Verified Closed

Defects are tracked in **GitHub Issues** with the label `bug` and severity label `P0`–`P3`.

---

## 10. Roles & Responsibilities

| Role              | Responsibility                                                  |
|-------------------|-----------------------------------------------------------------|
| QA Lead           | Test plan ownership, sign-off, metrics reporting                |
| Frontend Dev (Layla) | Unit & component tests; assist with UI E2E scripting         |
| Backend Dev       | API integration tests, unit tests                               |
| Mobile Dev        | Flutter widget tests, Detox E2E                                 |
| DevOps            | CI pipeline, environment provisioning, performance testing      |
| Product Owner     | UAT acceptance sign-off                                         |
