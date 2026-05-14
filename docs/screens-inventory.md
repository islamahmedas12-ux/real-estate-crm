# Screens Inventory — Real Estate CRM

> **Author:** Dina Salah, Senior UI/UX Designer  
> **Created:** 2026-03-27  
> **Version:** 1.0 (Sprint 1 — Design Foundation)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Existing | Screen/page exists with functional UI |
| 🔧 Needs Improvement | Screen exists but has UX/design gaps |
| 🎨 Needs Design | Feature exists in backend/API but no UI yet |
| ❌ Not Started | Planned screen, nothing built |

---

## Admin Portal (Web — React + TailwindCSS)

### Auth

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-01 | Login | `/login` | ✅ Existing | Clean design, email + password, dark mode support |
| A-02 | Forgot Password | `/forgot-password` | ❌ Not Started | Needs design + implementation |
| A-03 | Reset Password | `/reset-password` | ❌ Not Started | Token-based reset flow |

### Dashboard

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-10 | Main Dashboard | `/` | ✅ Existing | Stats cards, charts, agent performance, activity feed, date range filter |
| A-11 | Dashboard — Dark Mode | `/` | ✅ Existing | ThemeContext toggles dark/light |

### Leads

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-20 | Leads List | `/leads` | ✅ Existing | Table + Kanban toggle, filters, search |
| A-21 | Leads Kanban | `/leads?view=kanban` | ✅ Existing | Pipeline view by status columns |
| A-22 | Lead Detail | `/leads/:id` (panel) | ✅ Existing | Side panel (not full page), activities, notes |
| A-23 | Create Lead | Modal in `/leads` | ✅ Existing | LeadForm modal |
| A-24 | Edit Lead | Modal in panel | ✅ Existing | Inline edit in detail panel |
| A-25 | Lead — Convert to Contract | Action in panel | 🎨 Needs Design | "Convert" button should navigate to contract form pre-filled |

### Clients

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-30 | Clients List | `/clients` | ✅ Existing | DataTable with search/filters |
| A-31 | Client Detail | `/clients/:id` | ✅ Existing | Full detail page |
| A-32 | Create Client | `/clients/new` | ✅ Existing | ClientFormPage |
| A-33 | Edit Client | `/clients/:id/edit` | ✅ Existing | ClientFormPage in edit mode |
| A-34 | Client — Leads tab | `/clients/:id` (tab) | 🎨 Needs Design | Tab on client detail showing related leads |
| A-35 | Client — Contracts tab | `/clients/:id` (tab) | 🎨 Needs Design | Tab showing contracts for this client |

### Properties

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-40 | Properties List | `/properties` | ✅ Existing | Card grid + list toggle, filters |
| A-41 | Property Detail | `/properties/:id` | ✅ Existing | Full detail with photos, specs, status |
| A-42 | Create Property | `/properties/new` | ✅ Existing | PropertyFormPage |
| A-43 | Edit Property | `/properties/:id/edit` | ✅ Existing | PropertyFormPage in edit mode |
| A-44 | Property — Map View | `/properties?view=map` | ❌ Not Started | Pin properties on map |
| A-45 | Property — Photo Gallery | Modal in A-41 | 🎨 Needs Design | Lightbox for property images |

### Contracts

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-50 | Contracts List | `/contracts` | ✅ Existing | DataTable with status filters |
| A-51 | Contract Detail | `/contracts/:id` | ✅ Existing | Full contract detail |
| A-52 | Create Contract | `/contracts/new` | ✅ Existing | ContractFormPage |
| A-53 | Edit Contract | `/contracts/:id/edit` | ✅ Existing | ContractFormPage in edit mode |
| A-54 | Contract — Sign | Action in A-51 | 🎨 Needs Design | "Mark as Signed" with confirmation + date |
| A-55 | Contract — Document Upload | Modal in A-51 | 🎨 Needs Design | Attach PDFs / images |

### Invoices

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-60 | Invoices List | `/invoices` | ✅ Existing | DataTable with status, amount |
| A-61 | Invoice Detail | `/invoices/:id` | ✅ Existing | Full invoice view |
| A-62 | Record Payment | Modal in A-61 | ✅ Existing | RecordPaymentDialog |
| A-63 | Create Invoice | `/invoices/new` | 🔧 Needs Improvement | Linked to contract; needs clearer flow |
| A-64 | Invoice — Print / Export PDF | Action in A-61 | ❌ Not Started | PDF generation |

### Agents

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-70 | Agents List | `/agents` | ✅ Existing | DataTable: status, lead count |
| A-71 | Agent Detail | `/agents/:id` | ✅ Existing | Profile, tabs (leads, clients, activities) |
| A-72 | Add Agent | Modal in A-70 | 🔧 Needs Improvement | Basic form exists; needs role assignment |
| A-73 | Edit Agent | Modal or page | 🎨 Needs Design | Update agent profile/role |
| A-74 | Deactivate Agent | Action in A-71 | 🎨 Needs Design | Deactivate with confirmation + reassign leads |

### Reports

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-80 | Reports Overview | `/reports` | ✅ Existing | Report type selection + date range |
| A-81 | Revenue Report | `/reports/revenue` | ✅ Existing | Charts + summary table |
| A-82 | Lead Conversion Report | `/reports/leads` | ✅ Existing | Funnel visualization |
| A-83 | Agent Performance Report | `/reports/agents` | ✅ Existing | Comparative agent metrics |
| A-84 | Property Report | `/reports/properties` | ✅ Existing | By status, type, price range |
| A-85 | Report Export | Modal in any report | 🎨 Needs Design | CSV / PDF export dialog |
| A-86 | Scheduled Reports | `/reports/scheduled` | ❌ Not Started | Auto-email reports |

### Settings

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| A-90 | Settings | `/settings` | ✅ Existing | General settings page |
| A-91 | Settings — Company Profile | `/settings/company` | 🔧 Needs Improvement | Logo, name, address |
| A-92 | Settings — User Management | `/settings/users` | 🎨 Needs Design | Invite, role management |
| A-93 | Settings — Notifications | `/settings/notifications` | ❌ Not Started | Email notification preferences |
| A-94 | Settings — Integrations | `/settings/integrations` | ❌ Not Started | Future: email sync, calendar |
| A-95 | My Profile | `/settings/profile` | 🎨 Needs Design | Admin's own profile + password change |

---

## Agent Portal (Web — React + TailwindCSS)

### Auth

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-01 | Login | `/login` | ✅ Existing | Separate portal login |
| B-02 | Forgot Password | `/forgot-password` | ❌ Not Started | |

### Dashboard

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-10 | Agent Dashboard | `/` | ✅ Existing | Today's follow-ups, quick actions, pipeline, upcoming tasks, recent activities |
| B-11 | Notifications Panel | Dashboard widget | ✅ Existing | Real-time notifications |

### Leads

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-20 | My Leads (Table) | `/leads` | ✅ Existing | Filtered to agent's leads |
| B-21 | My Leads (Kanban) | `/leads?view=kanban` | ✅ Existing | Drag-to-update status |
| B-22 | Lead Detail Panel | Slide-in panel | ✅ Existing | Activities, notes, status change |
| B-23 | Log Activity | Modal in panel | ✅ Existing | LeadActivityForm |
| B-24 | Create Lead | Modal in B-20 | ✅ Existing | LeadForm |
| B-25 | Schedule Follow-up | Action in B-22 | 🎨 Needs Design | Date/time picker + reminder |
| B-26 | Convert Lead to Contract | Action in B-22 | 🎨 Needs Design | Pre-fill contract form from lead |

### Clients

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-30 | My Clients (Table) | `/clients` | ✅ Existing | Agent-scoped client list |
| B-31 | Client Detail Panel | Slide-in panel | ✅ Existing | ClientDetailPanel |
| B-32 | Create Client | Modal | ✅ Existing | ClientForm |
| B-33 | Edit Client | Modal in panel | ✅ Existing | |

### Properties

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-40 | Properties | `/properties` | ✅ Existing | Browse available properties |
| B-41 | Property Filters | Filter bar | ✅ Existing | PropertyFilters component |
| B-42 | Property Detail | Linked from list | 🔧 Needs Improvement | Read-only for agents; needs "Present to Client" shortcut |

### Contracts

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-50 | My Contracts | `/contracts` | ✅ Existing | Agent's contracts list |
| B-51 | Contract Detail | `/contracts/:id` | ✅ Existing | ContractDetailPage |

### Activities

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-60 | Activity Log | `/activities` | ✅ Existing | ActivitiesPage — full activity history |
| B-61 | Quick Log Activity | Dashboard widget | ✅ Existing | QuickLogActivity component |

### Profile

| # | Screen | Route | Status | Notes |
|---|--------|-------|--------|-------|
| B-70 | My Profile | `/profile` | 🎨 Needs Design | Agent profile, password change, avatar |
| B-71 | Notification Preferences | `/profile/notifications` | 🎨 Needs Design | Push/email notification settings |

---

## Mobile App (Flutter — iOS + Android)

### Auth

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-01 | Splash Screen | (main.dart) | 🔧 Needs Improvement | No dedicated splash/logo screen |
| M-02 | Login | `auth/login_screen.dart` | ✅ Existing | Email + password + biometric shortcut |
| M-03 | Biometric Auth | Service-driven | ✅ Existing | `biometric_service.dart` handles FaceID/fingerprint |
| M-04 | Forgot Password | — | ❌ Not Started | Deep link from email reset |

### Navigation

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-10 | App Shell (Bottom Nav) | `widgets/app_shell.dart` | ✅ Existing | Dashboard, Leads, Clients, Properties, Profile |
| M-11 | Offline Banner | `widgets/offline_indicator.dart` | ✅ Existing | Shows when network is unavailable |

### Dashboard

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-20 | Dashboard | `screens/dashboard/dashboard_screen.dart` | ✅ Existing | Stats, activities, quick links |
| M-21 | Dashboard — Pull to Refresh | Built into M-20 | ✅ Existing | |

### Leads

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-30 | Leads List | `screens/leads/leads_list_screen.dart` | ✅ Existing | Filter chips, search, lead cards |
| M-31 | Lead Detail | `screens/leads/lead_detail_screen.dart` | ✅ Existing | Info + activity timeline + FAB |
| M-32 | Create / Edit Lead | `screens/leads/lead_form_screen.dart` | ✅ Existing | Form screen |
| M-33 | Log Activity (Lead) | Bottom sheet in M-31 | 🔧 Needs Improvement | No dedicated bottom sheet yet; needs design |
| M-34 | Schedule Follow-up | Bottom sheet in M-31 | ❌ Not Started | Date/time picker + reminder |
| M-35 | Lead Status Change | Action in M-31 | 🎨 Needs Design | Swipe or dropdown status update |

### Clients

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-40 | Clients List | `screens/clients/clients_list_screen.dart` | ✅ Existing | Search + cards |
| M-41 | Client Detail | `screens/clients/client_detail_screen.dart` | ✅ Existing | Full client view |
| M-42 | Create / Edit Client | `screens/clients/client_form_screen.dart` | ✅ Existing | Form screen |
| M-43 | Client — Related Leads | Tab in M-41 | 🎨 Needs Design | List of client's leads |

### Properties

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-50 | Properties List | `screens/properties/properties_screen.dart` | ✅ Existing | Filterable list |
| M-51 | Property Filters | `screens/properties/property_filter_sheet.dart` | ✅ Existing | Bottom sheet filter |
| M-52 | Property Detail | `screens/properties/property_detail_screen.dart` | ✅ Existing | Full property detail |
| M-53 | Create / Edit Property | — | ❌ Not Started | No form screen yet |
| M-54 | Property — Photo Gallery | Bottom sheet / full screen | ❌ Not Started | Swipeable image viewer |
| M-55 | Property — Map View | — | ❌ Not Started | Map with pin |

### Contracts

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-60 | Contracts List | — | ❌ Not Started | No contracts screen on mobile |
| M-61 | Contract Detail | — | ❌ Not Started | View contract + status |
| M-62 | Contract Sign | — | ❌ Not Started | Mark as signed, attach photo of signature |

### Notifications

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-70 | Notifications List | `screens/notifications/notifications_screen.dart` | ✅ Existing | Grouped by time |
| M-71 | Notification Preferences | `screens/notifications/notification_preferences_screen.dart` | ✅ Existing | Toggle by type |

### Profile

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-80 | Profile | `screens/profile/profile_screen.dart` | ✅ Existing | Agent profile + settings |
| M-81 | Edit Profile | — | 🎨 Needs Design | Update name, photo, phone |
| M-82 | Change Password | — | 🎨 Needs Design | Current + new password form |
| M-83 | Dark Mode Toggle | Settings in M-80 | 🔧 Needs Improvement | Toggle exists at system level; needs in-app toggle |

### Search

| # | Screen | File | Status | Notes |
|---|--------|------|--------|-------|
| M-90 | Global Search | — | ❌ Not Started | Cross-entity search (leads, clients, properties) |

---

## Summary Counts

| Platform | Total Screens | ✅ Existing | 🔧 Needs Improvement | 🎨 Needs Design | ❌ Not Started |
|----------|--------------|------------|---------------------|----------------|--------------|
| Admin Portal | 40 | 26 | 3 | 8 | 3 |
| Agent Portal | 27 | 19 | 2 | 5 | 1 |
| Mobile App | 31 | 18 | 4 | 5 | 4 |
| **Total** | **98** | **63** | **9** | **18** | **8** |

---

## Sprint Priority Queue

### Sprint 2 — Core Gaps (High Impact)

| ID | Screen | Platform |
|----|--------|---------|
| A-02 | Forgot / Reset Password | Admin |
| B-02 | Forgot / Reset Password | Agent |
| A-25 | Lead → Convert to Contract | Admin |
| B-25 | Schedule Follow-up | Agent |
| B-26 | Convert Lead to Contract | Agent |
| M-33 | Log Activity bottom sheet | Mobile |
| M-34 | Schedule Follow-up | Mobile |
| M-53 | Create/Edit Property | Mobile |

### Sprint 3 — Enhancement (Medium Impact)

| ID | Screen | Platform |
|----|--------|---------|
| A-44 | Property Map View | Admin |
| A-64 | Invoice PDF Export | Admin |
| M-60-62 | Contracts on Mobile | Mobile |
| M-90 | Global Search | Mobile |
| B-70 | My Profile | Agent |
| A-95 | Admin Profile | Admin |

---

*This inventory should be updated at the start of each sprint. Figma frames will reference these IDs.*
