# Frontend Analysis — Sprint 1 Readiness

**Author:** Layla Ibrahim (Senior Frontend Developer)  
**Date:** 2026-03-27  
**Portals:** admin-ui (React 19 + Vite + TypeScript + TailwindCSS), agent-ui (React 19 + Vite + TypeScript)

---

## Executive Summary

Both portals are in solid shape architecturally. The API layer, auth flow, routing, and component structure are all present and well-implemented. Three **critical runtime bugs** were found and fixed in this session. Several **partial/stub pages** need real implementations before the sprint closes.

---

## 1. Admin Portal (`admin-ui/`)

### 1.1 Pages Status

| Page | File | Status | Notes |
|------|------|--------|-------|
| Login | `pages/LoginPage.tsx` | ✅ Complete | Form validation, error handling, redirect if authed |
| Dashboard | `pages/DashboardPage.tsx` | ✅ Complete | Stats, charts, date range filter, all hooks wired |
| Properties List | `pages/properties/PropertiesListPage.tsx` | ✅ Complete | Filters, pagination, DataTable |
| Property Detail | `pages/properties/PropertyDetailPage.tsx` | ✅ Present | Needs review |
| Property Form (Create/Edit) | `pages/properties/PropertyFormPage.tsx` | ✅ Present | Needs review |
| Clients List | `pages/clients/ClientsListPage.tsx` | ✅ Complete | Filters, pagination, stats |
| Client Detail | `pages/clients/ClientDetailPage.tsx` | ✅ Present | Needs review |
| Client Form | `pages/clients/ClientFormPage.tsx` | ✅ Present | Needs review |
| Leads List | `pages/leads/LeadsListPage.tsx` | ✅ Complete | Filters, pagination, stats, delete confirm |
| Leads Kanban | `pages/leads/LeadsKanbanPage.tsx` | ✅ Present | Needs review |
| Lead Detail | `pages/leads/LeadDetailPage.tsx` | ✅ Present | Needs review |
| Lead Form | `pages/leads/LeadFormPage.tsx` | ✅ Present | Needs review |
| Contracts List | `pages/contracts/ContractsListPage.tsx` | ✅ Present | Needs review |
| Contract Detail | `pages/contracts/ContractDetailPage.tsx` | ✅ Present | Needs review |
| Contract Form | `pages/contracts/ContractFormPage.tsx` | ✅ Present | Needs review |
| Invoices List | `pages/invoices/InvoicesListPage.tsx` | ✅ Present | Needs review |
| Invoice Detail | `pages/invoices/InvoiceDetailPage.tsx` | ✅ Present | Needs review |
| Agents List | `pages/agents/AgentsListPage.tsx` | ✅ Present | Real implementation |
| Agent Detail | `pages/agents/AgentDetailPage.tsx` | ✅ Complete | Performance stats, assigned properties/clients/leads |
| Reports | `pages/reports/ReportsPage.tsx` | ✅ Present | Real implementation |
| Settings | `pages/settings/SettingsPage.tsx` | ✅ Complete | Company info + config lists, full CRUD |

#### ⚠️ Stub/Dead Pages (top-level, not routed)
These files in `pages/` are old stubs — the router points to the sub-directory versions instead. They're harmless but should be removed to avoid confusion:
- `pages/AgentsPage.tsx` — just "coming soon" placeholder
- `pages/ClientsPage.tsx` — just "coming soon" placeholder
- `pages/ContractsPage.tsx` — just "coming soon" placeholder
- `pages/InvoicesPage.tsx` — just "coming soon" placeholder
- `pages/LeadsPage.tsx` — just "coming soon" placeholder
- `pages/PropertiesPage.tsx` — just "coming soon" placeholder
- `pages/ReportsPage.tsx` — just "coming soon" placeholder

**Action needed:** Delete these stub files; they are dead code (not imported by router).

---

### 1.2 API Integration Status

All API modules are implemented and connected:

| Module | Endpoints Covered |
|--------|------------------|
| `api/client.ts` | Axios instance with JWT interceptor + 401 handler |
| `api/dashboard.ts` | overview, revenue, leads, properties, agents, recent |
| `api/properties.ts` | list, search, get, create, update, delete, changeStatus, assignAgent |
| `api/clients.ts` | list, getById, getStats, getHistory, create, update, remove, assignAgent |
| `api/leads.ts` | list, getById, getStats, getPipeline, create, update, remove, changeStatus, assignAgent, addActivity, getActivities |
| `api/contracts.ts` | list, getById, getStats, getExpiring, getInvoices, create, update, changeStatus, generateInvoices |
| `api/invoices.ts` | list, getById, getStats, getOverdue, getUpcoming, create, update, recordPayment, cancel |
| `api/reports.ts` | getRevenue, getLeadConversion, getProperties, exportRevenueCsv, exportLeadsCsv |
| `api/agents.ts` | list, getById, toggleActive |
| `api/settings.ts` | getCompany, updateCompany, getPropertyTypes, updatePropertyTypes, getLeadSources, updateLeadSources |

---

### 1.3 Critical Issues Fixed

#### 🔴 BUG 1: `@tanstack/react-query` missing from package.json
**Severity:** Fatal runtime crash  
**Root Cause:** All hooks (`useLeads`, `useClients`, `useContracts`, etc.) and `DashboardPage` use `useQuery`/`useMutation` from `@tanstack/react-query`, but the package was absent from `package.json`. The app would crash immediately on load.  
**Fix:** Ran `npm install @tanstack/react-query recharts --save`. Both are now in `package.json`.

#### 🔴 BUG 2: `QueryClientProvider` missing from App.tsx
**Severity:** Fatal runtime crash (even with the package installed)  
**Root Cause:** The React Query `QueryClientProvider` wrapper was absent from the component tree. Any component calling `useQuery` or `useMutation` would throw: *"No QueryClient set, use QueryClientProvider to set one"*.  
**Fix:** Added `QueryClientProvider` wrapping the entire app tree in `admin-ui/src/App.tsx`.

#### 🟡 BUG 3: `recharts` missing from package.json
**Severity:** Fatal build/runtime crash  
**Root Cause:** `DashboardPage.tsx` imports from `recharts` for charts (`BarChart`, `PieChart`, etc.), but the dependency wasn't declared.  
**Fix:** Included in the same `npm install` as fix #1.

---

### 1.4 Loading States

| Location | Loading State |
|----------|--------------|
| `ProtectedRoute.tsx` | ✅ Full-page spinner while checking auth |
| `DashboardPage.tsx` | ✅ Stats show `--` while loading; charts pass `isLoading` prop |
| `LeadsListPage.tsx` | ✅ DataTable `loading` prop |
| `AgentDetailPage.tsx` | ✅ Skeleton components |
| `SettingsPage.tsx` | ✅ Animated pulse skeleton |

---

### 1.5 Error Handling

| Location | Error Handling |
|----------|---------------|
| `App.tsx` | ✅ Root `ErrorBoundary` wrapping all routes |
| `ErrorBoundary.tsx` | ✅ Class component with retry button |
| `api/client.ts` | ✅ 401 interceptor clears auth and redirects to login |
| `LeadsListPage.tsx` | ✅ Toast on delete failure |
| `LoginPage.tsx` | ✅ API error message surfaced via toast |
| Most pages | ⚠️ React Query errors not explicitly shown (relies on ErrorBoundary) |

**Gap:** Individual page-level error states (e.g., "Failed to load contracts") are not displayed inline — only the ErrorBoundary catches unhandled throws. Consider adding `isError` handling in list pages similar to the agent-ui pattern.

---

### 1.6 Empty States

- `DataTable` component accepts `emptyMessage` prop — used throughout ✅
- Some detail pages may lack empty states for nested lists (needs per-page review)

---

### 1.7 Authentication Flow

- **NOT Authme/OIDC** — Both portals use a direct username/password login hitting `/auth/login`
- JWT stored in `localStorage` as `access_token`
- Token auto-injected on every request via `axios` request interceptor
- 401 response clears token and redirects to `/login`
- `ProtectedRoute` blocks all protected routes until auth state hydrates

**Note on Authme:** The `authme-setup.md` describes a planned OIDC integration, but **it is NOT implemented** in the frontend. The current flow is a simple JWT login. The backend validates Authme-issued JWTs (RS256), so once tokens are obtained the API integration works — the gap is the frontend login flow needs to be updated to use Authme's OIDC endpoint rather than `/auth/login` directly.

---

## 2. Agent Portal (`agent-ui/`)

### 2.1 Pages Status

| Page | File | Status | Notes |
|------|------|--------|-------|
| Login | `pages/LoginPage.tsx` | ✅ Complete | Same pattern as admin, branded "Agent Portal" |
| Dashboard | `pages/DashboardPage.tsx` | ✅ Complete | Overview, pipeline chart, follow-ups, performance, quick actions |
| Properties | `pages/PropertiesPage.tsx` | ✅ Complete | Card grid view, filters, detail panel, status change |
| Leads | `pages/LeadsPage.tsx` | ✅ Complete | Table + Kanban views, create modal, detail panel |
| Clients | `pages/ClientsPage.tsx` | ✅ Complete | Table, create modal, detail panel |
| Contracts | `pages/ContractsPage.tsx` | ✅ Complete | Table, stats, detail view with invoice schedule |
| Contract Detail | `pages/ContractDetailPage.tsx` | ✅ Complete | Full detail with invoices + activity log |
| Activities | `pages/ActivitiesPage.tsx` | ✅ Complete | Filter by entity/type/scope, pagination, quick log |

**Missing pages (not yet created):**
- Profile/Settings page (no route defined)
- Notifications page (panel component exists but no dedicated page)

---

### 2.2 API Integration Status

| Module | Endpoints Covered |
|--------|------------------|
| `api/client.ts` | Axios + JWT interceptor + 401 handler |
| `api/dashboard.ts` | agent overview, leads pipeline, follow-ups, performance |
| `api/leads.ts` | list, pipeline, stats, get, create, update, changeStatus, addActivity, getActivities |
| `api/clients.ts` | list, stats, get, history, create, update, assign |
| `api/contracts.ts` | list, getById, getStats, getExpiring, getInvoices |
| `api/activities.ts` | list, recent, byEntity, byUser |
| `api/properties.ts` | list, get, create, update, delete, changeStatus, assignAgent |

---

### 2.3 Critical Issue Fixed

#### 🔴 BUG: `RecentActivitiesSection` used hardcoded mock data
**Severity:** Data integrity / misleading UI  
**Root Cause:** The `RecentActivitiesSection` component on the dashboard was rendering a static array of fake Egyptian names and activities instead of fetching from the real API.  
**Fix:** Replaced with `useQuery` calling `activitiesApi.byUser(user.id)` (falls back to `activitiesApi.recent(5)` if user ID unavailable). Shows loading spinner, empty state, and real activity data.

---

### 2.4 Loading States

| Location | Loading State |
|----------|--------------|
| `DashboardPage.tsx` | ✅ Per-section `LoadingSpinner` + `ErrorBox` with retry |
| `LeadsPage.tsx` | ✅ `loading` prop to `LeadTable` |
| `ClientsPage.tsx` | ✅ `loading` prop to `ClientTable` |
| `PropertiesPage.tsx` | ✅ `LoadingSpinner` for grid |
| `ContractsPage.tsx` | ✅ DataTable `loading` prop |
| `ActivitiesPage.tsx` | ✅ `LoadingSpinner` |
| `ContractDetailPage.tsx` | ✅ `LoadingSpinner` |

---

### 2.5 Error Handling

| Location | Error Handling |
|----------|---------------|
| `App.tsx` | ✅ Root `ErrorBoundary` |
| `DashboardPage.tsx` | ✅ Per-section `ErrorBox` with retry button |
| `ContractDetailPage.tsx` | ✅ Inline error + back button |
| `LeadsPage.tsx` | ✅ Toast on API failures |
| `ClientsPage.tsx` | ✅ Toast on API failures |
| `PropertiesPage.tsx` | ✅ Toast on status change failure |
| `ActivitiesPage.tsx` | ⚠️ No error state (relies on ErrorBoundary) |

---

### 2.6 Empty States

| Location | Empty State |
|----------|------------|
| `ActivitiesPage.tsx` | ✅ `EmptyState` component |
| `ContractDetailPage.tsx` | ✅ "No invoices generated yet" |
| `PropertiesPage.tsx` | ✅ "No properties found" card |
| `LeadsPage.tsx` (kanban/table) | ✅ Via `LeadTable`/`LeadKanban` props |
| `DashboardPage.tsx` — Follow-ups | ✅ "No overdue/upcoming follow-ups" |

---

### 2.7 Authentication Flow

Same pattern as admin-ui (JWT localStorage, axios interceptors, ProtectedRoute). No OIDC integration.

---

## 3. Cross-Cutting Issues

### 3.1 State Management
- Admin UI: React Query for server state, no client-side state manager beyond hooks
- Agent UI: React Query + `@tanstack/react-query` with `QueryClientProvider` ✅
- Admin UI: React Query now properly configured after fix ✅

### 3.2 TypeScript Quality
- Both portals: `tsc --noEmit` passes with **zero errors** after fixes
- Minimal use of `any` — only in controlled cast scenarios
- Type definitions are thorough (separate type files per domain)

### 3.3 Code Quality
| Issue | Portal | Severity |
|-------|--------|----------|
| Stub pages not cleaned up | admin-ui | Low (dead code, no runtime impact) |
| `cn` utility imported from `../../utils` inconsistently | both | Low |
| `RecentActivitiesSection` hardcoded mock data | agent-ui | High → **Fixed** |
| Missing `QueryClientProvider` | admin-ui | Critical → **Fixed** |
| Missing `@tanstack/react-query` + `recharts` deps | admin-ui | Critical → **Fixed** |

### 3.4 AuthMe OIDC Integration Status
**Not implemented.** Both portals use a direct `/auth/login` POST flow. The backend already validates Authme JWTs via JWKS, but the frontend hasn't been updated to redirect to Authme's OIDC login endpoint. This is a **Sprint 2 task** at minimum.

To implement:
1. Add PKCE flow (use `oidc-client-ts` or `@auth0/auth0-react` with Authme OIDC config)
2. Replace `login()` in `AuthContext` with Authme redirect
3. Handle callback URL (`/auth/callback`) in both portals
4. Exchange code → token via Authme OIDC token endpoint
5. Update `LoginPage` to be a redirect trigger rather than a form

---

## 4. What Needs Work (Backlog)

### High Priority
1. **Authme OIDC frontend integration** — currently using direct JWT login
2. **Admin-UI stub page cleanup** — delete 7 old placeholder files
3. **Error states on list pages** — add `isError` inline display alongside toast notifications
4. **Agent Profile/Settings page** — not created yet

### Medium Priority
5. **Test IDs / data-testid attributes** — none present on any interactive elements (blocks QA automation)
6. **Role-based UI** — admin-ui doesn't hide/show UI elements based on `user.role` (admin vs manager)
7. **Token refresh** — no refresh token handling; when access_token expires, user gets 401 + redirect to login

### Low Priority
8. **Accessibility** — basic structure is good but no ARIA labels on custom components
9. **`cn` utility consistency** — some components use `clsx` directly, others use the `cn` wrapper
10. **Remove `zustand` from both packages** — it's listed as a dependency but nothing uses it

---

## 5. Files Changed This Session

| File | Change |
|------|--------|
| `admin-ui/src/App.tsx` | Added `QueryClientProvider` wrapper + moved `queryClient` initialization before component |
| `admin-ui/package.json` | Added `@tanstack/react-query` and `recharts` as dependencies |
| `agent-ui/src/pages/DashboardPage.tsx` | Replaced hardcoded mock data in `RecentActivitiesSection` with real API call |
