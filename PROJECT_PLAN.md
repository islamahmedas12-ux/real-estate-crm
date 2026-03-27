# Real Estate CRM — Project Plan

**Project Manager:** Omar Hassan
**Start Date:** 2026-03-30 (Sprint 1 begins)
**Target Launch:** 2026-07-06 (Production Go-Live)
**Sprint Duration:** 2 weeks
**Domain:** realstate-crm.homes
**Server:** 34.24.201.183 (dev / qa / uat / prod)

---

## Team

| Name | Role | Focus Areas |
|------|------|-------------|
| Omar Hassan | Project Manager | Planning, coordination, stakeholder comms |
| Dina | UX Designer | Wireframes, design system, user flows |
| Karim | Backend Developer | NestJS, Prisma, APIs, business logic |
| Layla | Frontend Developer | React, Admin Portal, Agent Portal |
| Youssef | Mobile Developer | Flutter, mobile agent app |
| Adam | Security / IAM | Authme setup, RBAC, security hardening |
| Hassan | DevOps Engineer | Docker, CI/CD, Nginx, environments |
| Nour | QA — Functional | Manual testing, test cases, UAT |
| Sara | QA — Automation | E2E tests, API tests, CI integration |

---

## Milestones

### Milestone 1: Infrastructure & Foundation (Sprints 1–2)
**Target:** 2026-04-24
**Goal:** Development environments running, CI/CD pipeline active, IAM configured, database ready, design system approved.

**Definition of Done:**
- [ ] Docker Compose dev environment boots with one command
- [ ] PostgreSQL + Prisma migrations run successfully
- [ ] Authme realm configured with roles (admin, manager, agent) and clients
- [ ] CI pipeline runs lint + tests on every PR
- [ ] Nginx reverse proxy configured for dev/qa environments
- [ ] UX design system and wireframes for core pages approved
- [ ] Backend auth guard validates Authme JWTs
- [ ] Admin UI and Agent UI scaffolds render with auth flow

### Milestone 2: Core Features (Sprints 3–5)
**Target:** 2026-06-05
**Goal:** All CRUD modules fully functional across backend, admin portal, and agent portal. Mobile app has core screens.

**Definition of Done:**
- [ ] Properties: full CRUD + images + search + status management
- [ ] Clients: CRUD + duplicate detection + agent assignment
- [ ] Leads: pipeline management + activities + follow-ups
- [ ] Contracts: lifecycle + auto-invoice generation + PDF
- [ ] Invoices: payment tracking + overdue detection + PDF
- [ ] Dashboard: admin KPIs + agent personal stats
- [ ] Email: templated emails working end-to-end
- [ ] Admin Portal: all pages functional with real API data
- [ ] Agent Portal: all pages functional with real API data
- [ ] Mobile: dashboard, leads, properties, clients screens
- [ ] RBAC enforced on all endpoints and UI routes

### Milestone 3: Testing & QA (Sprints 6–7)
**Target:** 2026-07-03
**Goal:** Comprehensive test coverage, all bugs triaged, UAT sign-off.

**Definition of Done:**
- [ ] Unit test coverage ≥ 80% on backend services
- [ ] E2E tests cover all critical user flows
- [ ] API integration tests for all endpoints
- [ ] Mobile app tested on iOS + Android devices
- [ ] Performance testing completed (API response times < 500ms p95)
- [ ] Security audit passed (OWASP top 10 checklist)
- [ ] UAT environment deployed and signed off by stakeholders
- [ ] All P1/P2 bugs resolved

### Milestone 4: Launch & Go-Live (Sprint 8)
**Target:** 2026-07-06
**Goal:** Production deployment, monitoring active, team trained.

**Definition of Done:**
- [ ] Production environment deployed and verified
- [ ] SSL certificates configured for realstate-crm.homes
- [ ] Monitoring (Prometheus + Grafana + Sentry) active
- [ ] Backup and recovery tested
- [ ] Mobile app submitted to App Store + Google Play
- [ ] User documentation delivered
- [ ] Team training completed
- [ ] Go-live checklist signed off

---

## Sprint Breakdown

### Sprint 1 (Mar 30 – Apr 11): Environment Setup & Design Kickoff

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 1 | Set up Docker Compose for dev environment (PostgreSQL + NestJS + Nginx) | Hassan | devops, infra | — |
| 2 | Configure CI/CD pipeline (GitHub Actions: lint, test, build) | Hassan | devops | — |
| 3 | Set up Authme realm, roles (admin/manager/agent), and OAuth clients | Adam | authme, infra | — |
| 4 | Implement backend auth guard (JWT validation via Authme JWKS) | Adam, Karim | backend, authme | #3 |
| 5 | Create Prisma schema and initial migration | Karim | backend | #1 |
| 6 | Create database seed script with sample data | Karim | backend | #5 |
| 7 | Create UX design system (colors, typography, components) | Dina | ux | — |
| 8 | Design wireframes for Admin Dashboard and Property pages | Dina | ux | #7 |
| 9 | Scaffold Admin UI with Vite + React + Tailwind + Auth flow | Layla | frontend | #3 |
| 10 | Scaffold Agent UI with Vite + React + Tailwind + Auth flow | Layla | frontend | #3 |
| 11 | Set up Flutter project structure and Authme OIDC integration | Youssef | mobile | #3 |
| 12 | Write QA test plan and define test case template | Nour | qa | — |
| 13 | Set up E2E testing framework (Playwright or Cypress) | Sara | qa | #9 |

### Sprint 2 (Apr 13 – Apr 25): Properties & Clients Modules

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 14 | Properties API: CRUD endpoints + full-text search + image upload | Karim | backend | S1:#5 |
| 15 | Properties API: status management + agent assignment | Karim | backend | #14 |
| 16 | Clients API: CRUD + duplicate detection + agent assignment | Karim | backend | S1:#5 |
| 17 | Configure Nginx reverse proxy for dev + qa subdomains | Hassan | devops, infra | S1:#1 |
| 18 | Set up qa environment on server (34.24.201.183) | Hassan | devops, infra | #17 |
| 19 | Design wireframes for Clients, Leads, and Contracts pages | Dina | ux | S1:#7 |
| 20 | Admin UI: Property list page (table, filters, search) | Layla | frontend | #14, S1:#9 |
| 21 | Admin UI: Property create/edit form with image upload | Layla | frontend | #14 |
| 22 | Admin UI: Client list and detail pages | Layla | frontend | #16 |
| 23 | Mobile: Dashboard screen layout and navigation shell | Youssef | mobile | S1:#11 |
| 24 | Mobile: Property list and detail screens | Youssef | mobile | #14, S1:#11 |
| 25 | Write API integration tests for Properties endpoints | Sara | qa, backend | #14 |
| 26 | Write functional test cases for Properties and Clients flows | Nour | qa | #20, #22 |

### Sprint 3 (Apr 27 – May 9): Leads Pipeline & Contracts

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 27 | Leads API: CRUD + pipeline status transitions + validation | Karim | backend | S2:#16 |
| 28 | Leads API: activities (calls, emails, meetings) + follow-up scheduling | Karim | backend | #27 |
| 29 | Contracts API: CRUD + status lifecycle + auto-invoice generation | Karim | backend | S2:#16 |
| 30 | Design wireframes for Invoices, Reports, and Agent Portal pages | Dina | ux | S2:#19 |
| 31 | Admin UI: Lead list with kanban view | Layla | frontend | #27 |
| 32 | Admin UI: Lead detail page with activity timeline | Layla | frontend | #28 |
| 33 | Admin UI: Contract list and create/edit pages | Layla | frontend | #29 |
| 34 | Agent UI: Lead pipeline (personal leads) | Layla | frontend | #27 |
| 35 | Mobile: Leads list and detail screens | Youssef | mobile | #27 |
| 36 | Mobile: Client list and detail screens | Youssef | mobile | S2:#16 |
| 37 | Write API tests for Leads and Contracts endpoints | Sara | qa, backend | #27, #29 |
| 38 | Functional test cases for Leads pipeline and Contracts | Nour | qa | #31, #33 |

### Sprint 4 (May 11 – May 23): Invoices, Dashboard & Email

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 39 | Invoices API: payment tracking + overdue + PDF generation | Karim | backend | S3:#29 |
| 40 | Dashboard API: admin KPIs + agent stats + charts data | Karim | backend | S3:#27 |
| 41 | Email service: Nodemailer + Handlebars templates + preferences | Karim | backend | — |
| 42 | Security audit: RBAC enforcement on all endpoints | Adam | authme, backend | S3:#27, S3:#29 |
| 43 | Admin UI: Invoice list, detail, payment recording | Layla | frontend | #39 |
| 44 | Admin UI: Dashboard with KPIs, charts, activity feed | Layla | frontend | #40 |
| 45 | Agent UI: Dashboard with personal stats | Layla | frontend | #40 |
| 46 | Agent UI: Clients and Properties pages (read-focused) | Layla | frontend | S2:#16 |
| 47 | Mobile: Lead activity logging and follow-up scheduling | Youssef | mobile | S3:#28 |
| 48 | Mobile: Push notification setup (FCM) | Youssef | mobile | — |
| 49 | Write API tests for Invoices and Dashboard | Sara | qa, backend | #39, #40 |
| 50 | Functional testing: Dashboard, Invoices, Email flows | Nour | qa | #43, #44 |

### Sprint 5 (May 25 – Jun 6): Reports, Settings & Polish

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 51 | Reports API: monthly revenue + agent performance + PDF generation | Karim | backend | S4:#39 |
| 52 | Activities API: audit trail + entity filtering + purge | Karim | backend | — |
| 53 | Settings API: key-value config store | Karim | backend | — |
| 54 | Admin UI: Reports page with PDF export | Layla | frontend | #51 |
| 55 | Admin UI: Activity log page | Layla | frontend | #52 |
| 56 | Admin UI: Settings page | Layla | frontend | #53 |
| 57 | Admin UI: Agent management page | Layla | frontend | — |
| 58 | Agent UI: Contracts view (read-only) | Layla | frontend | S3:#29 |
| 59 | Mobile: Offline support + data sync | Youssef | mobile | — |
| 60 | Mobile: Share properties (WhatsApp/email) + biometric login | Youssef | mobile | — |
| 61 | Security hardening: rate limiting, CORS, CSP headers | Adam | authme, backend | — |
| 62 | UX review: consistency pass across all portals | Dina | ux | — |
| 63 | Write E2E tests for critical user journeys | Sara | qa | — |

### Sprint 6 (Jun 8 – Jun 20): Integration Testing & Bug Fixes

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 64 | Full integration testing across all modules | Sara | qa | S5 complete |
| 65 | Functional testing: complete test case execution | Nour | qa | S5 complete |
| 66 | Bug fixing — backend (P1/P2 from QA) | Karim | backend | #64, #65 |
| 67 | Bug fixing — frontend (P1/P2 from QA) | Layla | frontend | #64, #65 |
| 68 | Bug fixing — mobile (P1/P2 from QA) | Youssef | mobile | #64, #65 |
| 69 | Performance testing: API response times + load testing | Sara | qa, devops | — |
| 70 | Mobile testing on physical devices (iOS + Android) | Nour | qa, mobile | — |
| 71 | Set up UAT environment | Hassan | devops, infra | — |
| 72 | Security penetration testing | Adam | authme | — |

### Sprint 7 (Jun 22 – Jul 3): UAT & Pre-Launch

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 73 | Deploy to UAT environment | Hassan | devops | S6:#71 |
| 74 | UAT: stakeholder testing sessions | Nour | qa | #73 |
| 75 | UAT bug fixes — backend | Karim | backend | #74 |
| 76 | UAT bug fixes — frontend | Layla | frontend | #74 |
| 77 | UAT bug fixes — mobile | Youssef | mobile | #74 |
| 78 | Set up production environment | Hassan | devops, infra | — |
| 79 | Configure SSL + domain (realstate-crm.homes) | Hassan | devops, infra | #78 |
| 80 | Set up monitoring (Prometheus + Grafana + Sentry) | Hassan | devops | #78 |
| 81 | Mobile app store preparation (screenshots, descriptions) | Youssef, Dina | mobile, ux | — |
| 82 | Create user documentation / help guides | Dina | ux | — |
| 83 | Final security review | Adam | authme | — |

### Sprint 8 (Jul 6 – Jul 10): Launch Week

| # | Task | Assignee | Labels | Dependencies |
|---|------|----------|--------|--------------|
| 84 | Production deployment | Hassan | devops | S7:#78, #79, #80 |
| 85 | Smoke testing on production | Nour, Sara | qa | #84 |
| 86 | Submit mobile app to App Store + Google Play | Youssef | mobile | S7:#81 |
| 87 | Database backup + recovery test | Hassan | devops | #84 |
| 88 | Team training session | Omar | — | #84 |
| 89 | Go-live sign-off | Omar | — | #85, #87, #88 |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Authme integration delays | High | Adam starts IAM setup in Sprint 1; fallback to mock auth for dev |
| Scope creep on admin features | Medium | Strict sprint scope; new features go to backlog |
| Mobile app store review delays | Medium | Submit 2 weeks before launch; have web fallback |
| Single-server deployment bottleneck | Medium | Docker isolation per environment; plan multi-server for v2 |
| Team availability during Ramadan/holidays | Low | Buffer built into Sprint 6–7 |

---

## Communication Plan

- **Daily standups:** 15 min (async on Slack if needed)
- **Sprint planning:** First day of each sprint
- **Sprint review + retro:** Last day of each sprint
- **Stakeholder demo:** End of Milestone 2 and Milestone 3
- **GitHub Projects:** Used for sprint boards and tracking
