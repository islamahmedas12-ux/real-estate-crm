# Test Plan — Real Estate CRM
**Prepared by:** Nour Khalil, Senior QA Engineer (Functional & API Testing)  
**Version:** 1.0  
**Date:** 2026-03-27  
**Sprint:** Sprint 1 — QA Foundation

---

## 1. Introduction

### 1.1 Purpose
This document defines the testing strategy, scope, test cases, and quality criteria for the Real Estate CRM system. It covers all major functional areas of the NestJS backend API, React Admin Portal, React Agent Portal, and Flutter Mobile App.

### 1.2 Project Overview
A multi-tenant CRM system for real estate companies featuring:
- **Backend:** NestJS 11 + PostgreSQL 16 + Prisma ORM
- **Admin Portal:** React 19 + Vite + Tailwind CSS
- **Agent Portal:** React 19 + Vite + Tailwind CSS
- **Mobile:** Flutter (Android + iOS)
- **IAM:** Authme (OAuth 2.0 / OIDC, Keycloak-compatible)

---

## 2. Test Scope & Approach

### 2.1 In Scope
| Module | API | Admin UI | Agent UI | Mobile |
|--------|-----|----------|----------|--------|
| Authentication & Authorization | ✅ | ✅ | ✅ | ✅ |
| Properties | ✅ | ✅ | ✅ (read) | ✅ (read) |
| Clients | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Leads & Activities | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Contracts | ✅ | ✅ | ✅ (view) | ✅ (view) |
| Invoices | ✅ | ✅ | ✅ (view) | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Email & Notifications | ✅ | ✅ | ❌ | ✅ |
| PDF Export | ✅ | ✅ | ❌ | ❌ |
| RBAC (admin/manager/agent) | ✅ | ✅ | ✅ | ✅ |

### 2.2 Out of Scope (Sprint 1)
- Load / performance testing (Sprint 2)
- Authme IAM server internals
- Infrastructure / DevOps configs
- Third-party payment gateways

### 2.3 Test Approach
- **Functional Testing:** Black-box testing against API contracts (Swagger) and UI requirements
- **API Testing:** REST API validation via Postman/Newman collections
- **Regression Testing:** Full regression suite before each release to QA/UAT
- **Boundary Testing:** Edge values on numeric fields (price, area, pagination)
- **Negative Testing:** Invalid inputs, unauthorized access, missing required fields
- **RBAC Testing:** Verify role-based access for admin / manager / agent roles
- **Integration Testing:** End-to-end user flows (login → create lead → convert to contract → invoice)

---

## 3. Test Environments Matrix

| Environment | Purpose | Branch | URL | Database | Notes |
|-------------|---------|--------|-----|----------|-------|
| **dev** | Active development | `feature/*`, `develop` | localhost:3000 | Seeded dev DB | Hot reload, debug logs |
| **qa** | QA validation | `develop` | qa.crm.internal | Seeded QA DB | Stable seed data, reset weekly |
| **uat** | Stakeholder acceptance | `release/*` | uat.crm.internal | Production-like data | Anonymized prod data |
| **prod** | Live production | `main` | crm.company.com | Live data | Monitored, read-only smoke tests |

### 3.1 Entry Criteria Per Environment

| Environment | Entry Criteria |
|-------------|---------------|
| **dev → qa** | All unit tests pass; no P1/P2 open bugs; build succeeds; PR merged to develop |
| **qa → uat** | All functional test cases pass; no P1 bugs open; no P2 bugs unresolved >3 days; regression complete |
| **uat → prod** | UAT sign-off by Product Owner; all P1/P2 bugs fixed; smoke test in uat passes; change request approved |

### 3.2 Exit Criteria Per Environment

| Environment | Exit Criteria |
|-------------|--------------|
| **dev** | Feature-level tests pass; PR approved by peer |
| **qa** | ≥95% test cases pass; 0 P1 bugs; ≤2 P2 bugs with accepted workarounds |
| **uat** | 100% critical test cases pass; PO signed acceptance email; performance baselines met |
| **prod** | Post-deploy smoke tests pass; error rate <0.1%; rollback plan confirmed |

---

## 4. Test Cases

### 4.1 Authentication & Authorization

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| AUTH-001 | Admin login via Authme OAuth flow | Authme server running; admin user exists in realm | 1. Navigate to Admin Portal `/login`<br>2. Click "Login"<br>3. Enter admin credentials in Authme<br>4. Authorize | Redirected to `/dashboard`; JWT token stored; user role = `crm-admin` | P1 |
| AUTH-002 | Agent login via Authme | Agent user exists in Authme realm | 1. Navigate to Agent Portal<br>2. Complete OAuth flow with agent credentials | Redirected to agent `/dashboard`; role = `crm-agent` | P1 |
| AUTH-003 | Access protected API without token | None | 1. Send `GET /api/properties` without Authorization header | `401 Unauthorized` response | P1 |
| AUTH-004 | Access protected API with expired token | Valid user session | 1. Obtain JWT<br>2. Wait for expiry (or manipulate exp claim)<br>3. Send API request | `401 Unauthorized`; token refresh attempted | P1 |
| AUTH-005 | Agent cannot access admin-only endpoint | Agent JWT | 1. `GET /api/dashboard/admin/kpis` with agent token | `403 Forbidden` | P1 |
| AUTH-006 | Manager cannot access settings | Manager JWT | 1. `GET /api/settings` with manager token | `403 Forbidden` | P1 |
| AUTH-007 | Admin can assign lead to agent | Admin JWT, lead and agent exist | 1. `PATCH /api/leads/:id/assign` with agentId | `200 OK`; lead `assignedAgentId` updated | P1 |
| AUTH-008 | Agent cannot assign lead to another agent | Agent JWT | 1. `PATCH /api/leads/:id/assign` with agent token | `403 Forbidden` | P1 |
| AUTH-009 | User sync on first login | New user in Authme, not in CRM DB | 1. Complete OAuth login<br>2. Check users table | User record created in DB with correct role, email, authmeId | P1 |
| AUTH-010 | Role change reflected on next login | Admin changes user role in Authme | 1. Login with updated role<br>2. Check access permissions | New role permissions enforced | P2 |
| AUTH-011 | Logout clears session | Active session | 1. Click logout in Admin Portal | Token cleared; redirected to login page; API requests return 401 | P2 |
| AUTH-012 | Inactive user cannot login | User `isActive = false` in DB | 1. Attempt login | `401 Unauthorized` or `403 Forbidden` | P1 |

---

### 4.2 Properties

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| PROP-001 | Create property (admin) | Admin JWT | 1. `POST /api/properties` with valid payload (title, type, price, area, city) | `201 Created`; property returned with generated ID | P1 |
| PROP-002 | Create property — missing required field | Admin JWT | 1. `POST /api/properties` omitting `title` | `400 Bad Request`; validation error message | P1 |
| PROP-003 | Agent cannot create property | Agent JWT | 1. `POST /api/properties` with agent token | `403 Forbidden` | P1 |
| PROP-004 | List properties with pagination | Admin JWT, ≥5 properties exist | 1. `GET /api/properties?page=1&limit=3` | `200 OK`; max 3 items; pagination meta correct | P2 |
| PROP-005 | Filter properties by type | Admin JWT | 1. `GET /api/properties?type=APARTMENT` | All returned properties have `type = APARTMENT` | P2 |
| PROP-006 | Full-text search | Admin JWT, property with "Nile View" in title | 1. `GET /api/properties?search=Nile` | Results include matching property | P2 |
| PROP-007 | Get single property by ID | Admin JWT | 1. `GET /api/properties/:id` with valid ID | `200 OK`; correct property data | P1 |
| PROP-008 | Get property — not found | Admin JWT | 1. `GET /api/properties/nonexistent-id` | `404 Not Found` | P2 |
| PROP-009 | Update property | Admin JWT | 1. `PATCH /api/properties/:id` with updated `price` | `200 OK`; price updated in response | P1 |
| PROP-010 | Change property status | Admin JWT | 1. `PATCH /api/properties/:id/status` with `{ status: "SOLD" }` | `200 OK`; status updated | P1 |
| PROP-011 | Assign property to agent | Admin JWT | 1. `PATCH /api/properties/:id/assign` with `{ agentId }` | `200 OK`; `assignedAgentId` updated | P2 |
| PROP-012 | Upload property image | Admin JWT | 1. `POST /api/properties/:id/images` multipart/form-data with image file | `201 Created`; image URL returned | P2 |
| PROP-013 | Agent sees only assigned properties | Agent JWT, properties assigned and unassigned | 1. `GET /api/properties` with agent token | Only properties assigned to this agent returned | P1 |
| PROP-014 | Export property to PDF | Admin JWT | 1. `GET /api/properties/:id/pdf` or via reports | PDF file returned with correct content-type | P3 |
| PROP-015 | Property stats endpoint | Admin JWT | 1. `GET /api/properties/stats` | `200 OK`; counts by type and status | P3 |

---

### 4.3 Clients

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| CLI-001 | Create client | Admin JWT | 1. `POST /api/clients` with firstName, lastName, email, phone, type | `201 Created`; client returned | P1 |
| CLI-002 | Duplicate email detection | Admin JWT; client with email exists | 1. `POST /api/clients` with same email | `409 Conflict`; duplicate error | P1 |
| CLI-003 | Duplicate phone detection | Admin JWT; client with phone exists | 1. `POST /api/clients` with same phone | `409 Conflict`; duplicate error | P1 |
| CLI-004 | List clients (admin sees all) | Admin JWT, multiple clients | 1. `GET /api/clients` | All clients returned | P1 |
| CLI-005 | Agent sees only assigned clients | Agent JWT | 1. `GET /api/clients` with agent token | Only agent's assigned clients | P1 |
| CLI-006 | Get client history | Admin JWT, client has leads/contracts | 1. `GET /api/clients/:id/history` | Interaction history with leads and contracts | P2 |
| CLI-007 | Update client info | Admin JWT | 1. `PATCH /api/clients/:id` with updated notes | `200 OK`; notes updated | P2 |
| CLI-008 | Delete client (if no active contracts) | Admin JWT | 1. `DELETE /api/clients/:id` | `200 OK` or `204 No Content` | P2 |
| CLI-009 | Delete client with active contract | Admin JWT | 1. `DELETE /api/clients/:id` (has active contract) | `409 Conflict` or `400 Bad Request` | P1 |
| CLI-010 | Client source tracking | Admin JWT | 1. Create client with `source: "REFERRAL"`<br>2. Retrieve client | Source field preserved | P3 |

---

### 4.4 Leads & Activities

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| LEAD-001 | Create lead | Admin JWT, client exists | 1. `POST /api/leads` with clientId, status, priority | `201 Created`; lead returned | P1 |
| LEAD-002 | Valid status transition: NEW → CONTACTED | Admin JWT | 1. `PATCH /api/leads/:id/status` with `{ status: "CONTACTED" }` | `200 OK`; status updated | P1 |
| LEAD-003 | Valid status transition: CONTACTED → QUALIFIED | Admin JWT | 1. `PATCH /api/leads/:id/status` with `{ status: "QUALIFIED" }` | `200 OK` | P1 |
| LEAD-004 | Invalid status transition: NEW → WON (skip stages) | Admin JWT | 1. `PATCH /api/leads/:id/status` with `{ status: "WON" }` from NEW | `400 Bad Request`; invalid transition error | P1 |
| LEAD-005 | Log lead activity | Admin JWT, lead exists | 1. `POST /api/leads/:id/activities` with type=CALL, description | `201 Created`; activity logged | P2 |
| LEAD-006 | Get lead pipeline (kanban data) | Admin JWT | 1. `GET /api/leads/pipeline` | Leads grouped by status | P2 |
| LEAD-007 | Schedule follow-up | Admin JWT | 1. `PATCH /api/leads/:id` with `nextFollowUp` date | `200 OK`; followUp date set | P2 |
| LEAD-008 | Agent sees only their leads | Agent JWT | 1. `GET /api/leads` | Only leads assigned to this agent | P1 |
| LEAD-009 | Filter leads by priority | Admin JWT | 1. `GET /api/leads?priority=HIGH` | Only HIGH priority leads | P2 |
| LEAD-010 | Lead marked WON | Admin JWT | 1. Transition lead to WON via valid path | `200 OK`; lead status = WON | P2 |
| LEAD-011 | Lead marked LOST | Admin JWT | 1. Transition lead to LOST | `200 OK`; lead status = LOST | P2 |
| LEAD-012 | Lead stats | Admin JWT | 1. `GET /api/leads/stats` | Count by status and priority | P3 |
| LEAD-013 | Activity types: CALL, EMAIL, MEETING, VIEWING | Admin JWT | 1. Log each activity type | Each accepted; correct type stored | P2 |

---

### 4.5 Contracts

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| CON-001 | Create sale contract | Admin JWT, client + property exist | 1. `POST /api/contracts` with type=SALE, propertyId, clientId, startDate, totalAmount | `201 Created`; contract in DRAFT status | P1 |
| CON-002 | Create rent contract | Admin JWT | 1. `POST /api/contracts` with type=RENT, monthlyAmount, endDate | `201 Created` | P1 |
| CON-003 | Agent cannot create contract | Agent JWT | 1. `POST /api/contracts` | `403 Forbidden` | P1 |
| CON-004 | Agent can view contract | Agent JWT, contract exists | 1. `GET /api/contracts/:id` | `200 OK`; contract data | P1 |
| CON-005 | Activate contract (DRAFT → ACTIVE) | Admin JWT | 1. `PATCH /api/contracts/:id/status` with `{ status: "ACTIVE" }` | `200 OK`; status = ACTIVE | P1 |
| CON-006 | Complete contract (ACTIVE → COMPLETED) | Admin JWT, all invoices paid | 1. `PATCH /api/contracts/:id/status` with `{ status: "COMPLETED" }` | `200 OK` | P2 |
| CON-007 | Cancel contract | Admin JWT | 1. `PATCH /api/contracts/:id/status` with `{ status: "CANCELLED" }` | `200 OK`; status = CANCELLED | P2 |
| CON-008 | Auto-generate invoices from payment terms | Admin JWT | 1. `POST /api/contracts/:id/generate-invoices` | Invoices created per payment schedule | P1 |
| CON-009 | Get contract PDF | Admin JWT | 1. `GET /api/contracts/:id/pdf` | PDF binary returned; correct Content-Type | P2 |
| CON-010 | Expiring contracts list | Admin JWT | 1. `GET /api/contracts/expiring` | Contracts expiring within threshold | P2 |
| CON-011 | Contract stats | Admin JWT | 1. `GET /api/contracts/stats` | Count by type and status | P3 |

---

### 4.6 Invoices

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| INV-001 | List invoices for contract | Admin JWT, contract with invoices | 1. `GET /api/contracts/:id/invoices` | All contract invoices returned | P1 |
| INV-002 | Record payment — cash | Admin JWT, unpaid invoice | 1. `POST /api/invoices/:id/pay` with `{ paymentMethod: "CASH", paidDate }` | `200 OK`; invoice status = PAID | P1 |
| INV-003 | Record payment — bank transfer | Admin JWT | 1. `POST /api/invoices/:id/pay` with `{ paymentMethod: "BANK_TRANSFER" }` | `200 OK`; status = PAID | P1 |
| INV-004 | Cannot pay already paid invoice | Admin JWT | 1. `POST /api/invoices/:id/pay` on PAID invoice | `400 Bad Request` | P1 |
| INV-005 | Overdue invoice detection | Admin JWT, invoice with past due date | 1. `GET /api/invoices/overdue` | Overdue invoices listed | P2 |
| INV-006 | Upcoming due dates | Admin JWT | 1. `GET /api/invoices/upcoming` | Invoices due within configured window | P2 |
| INV-007 | Cancel invoice | Admin JWT | 1. `PATCH /api/invoices/:id/cancel` | `200 OK`; status = CANCELLED | P2 |
| INV-008 | Invoice PDF export | Admin JWT | 1. `GET /api/invoices/:id/pdf` | PDF returned | P2 |
| INV-009 | Agent cannot manage invoices | Agent JWT | 1. `POST /api/invoices/:id/pay` | `403 Forbidden` | P1 |
| INV-010 | Invoice stats | Admin JWT | 1. `GET /api/invoices/stats` | Revenue totals and overdue count | P3 |
| INV-011 | Installment payment method | Admin JWT | 1. `POST /api/invoices/:id/pay` with `{ paymentMethod: "INSTALLMENT" }` | `200 OK`; payment method recorded | P2 |

---

### 4.7 Dashboard

| ID | Title | Preconditions | Steps | Expected Result | Severity |
|----|-------|---------------|-------|-----------------|----------|
| DASH-001 | Admin KPIs endpoint | Admin JWT, seeded data | 1. `GET /api/dashboard/admin/kpis` | Revenue, lead counts, property counts, agent count | P1 |
| DASH-002 | Revenue chart with date filter | Admin JWT | 1. `GET /api/dashboard/admin/revenue?from=2026-01-01&to=2026-03-31` | Monthly revenue data for date range | P2 |
| DASH-003 | Lead pipeline summary | Admin JWT | 1. `GET /api/dashboard/admin/pipeline` | Leads grouped by status with counts | P2 |
| DASH-004 | Agent performance rankings | Admin JWT | 1. `GET /api/dashboard/admin/agent-performance` | Agents sorted by deals/revenue | P2 |
| DASH-005 | Agent personal dashboard | Agent JWT | 1. `GET /api/dashboard/agent/stats` | Agent's own leads, clients, follow-ups | P1 |
| DASH-006 | Today's follow-ups (overdue) | Agent JWT, overdue follow-ups exist | 1. `GET /api/dashboard/agent/follow-ups` | Overdue and upcoming follow-ups | P2 |
| DASH-007 | Admin cannot see agent-specific dashboard of another agent | Manager JWT | 1. `GET /api/dashboard/agent/stats?agentId=other-agent` | Either 403 or own-data only | P2 |
| DASH-008 | Recent activity feed | Admin JWT | 1. `GET /api/dashboard/admin/activity` | Last N system activities | P3 |
| DASH-009 | Month-over-month performance comparison | Agent JWT | 1. `GET /api/dashboard/agent/performance` | Current vs previous month stats | P3 |

---

## 5. Cross-Cutting Test Cases

### 5.1 Input Validation
| ID | Scenario | Expected |
|----|----------|----------|
| VAL-001 | Negative price on property | 400 Bad Request |
| VAL-002 | Invalid email format on client | 400 Bad Request |
| VAL-003 | SQL injection in search param | Sanitized; no data leak |
| VAL-004 | XSS in property title | Input sanitized; no script execution |
| VAL-005 | Invalid UUID format as entity ID | 400 Bad Request |
| VAL-006 | Pagination `limit` > 100 | Capped at max or 400 |

### 5.2 Error Handling
| ID | Scenario | Expected |
|----|----------|----------|
| ERR-001 | Database connection down | 503 Service Unavailable |
| ERR-002 | Unknown route | 404 Not Found |
| ERR-003 | Method not allowed | 405 Method Not Allowed |
| ERR-004 | Payload too large | 413 Payload Too Large |

---

## 6. Bug Severity Definitions

| Severity | Definition | SLA to Fix |
|----------|-----------|-----------|
| **P1 — Critical** | System down; data loss; security breach; login broken | Same day |
| **P2 — High** | Core feature broken; significant user impact | 2 business days |
| **P3 — Medium** | Feature partially broken; workaround exists | 5 business days |
| **P4 — Low** | UI inconsistency; minor issue | Next sprint |

---

## 7. Test Deliverables

- [ ] Test Plan (this document)
- [ ] API Test Collection (Postman/Newman)
- [ ] E2E Test Scenarios (Playwright — see `docs/qa-automation-plan.md`)
- [ ] Bug Reports (GitHub Issues with `bug` label)
- [ ] Test Execution Report (per release)
- [ ] Regression Checklist (before each release)

---

*Prepared by Nour Khalil — QA Functional Lead | Real Estate CRM Sprint 1*
