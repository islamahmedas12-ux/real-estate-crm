# Design System — Real Estate CRM

> **Author:** Dina Salah, Senior UI/UX Designer  
> **Created:** 2026-03-27  
> **Version:** 1.0 (Sprint 1 — Design Foundation)

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity first** | Every screen communicates its purpose instantly. No ambiguity, no guessing games. |
| **Data density done right** | CRM users live in data. We present it densely but never chaotically — hierarchy guides the eye. |
| **Progressive disclosure** | Show the essentials. Reveal details on demand (side panels, modals, expandable rows). |
| **Consistent affordances** | Buttons always look like buttons. Links always look like links. No surprises. |
| **Speed over beauty** | Performance and responsiveness beat decorative flourishes. Skeleton loaders and optimistic UI everywhere. |
| **Accessible by default** | WCAG AA as a baseline — contrast ratios ≥ 4.5:1, 44px min touch targets on mobile, keyboard navigable. |

---

## 2. Color Palette

### 2.1 Brand Colors

| Role | Name | Hex | Tailwind | Usage |
|------|------|-----|----------|-------|
| **Primary** | Indigo 600 | `#4F46E5` | `indigo-600` | CTAs, active states, links, focus rings |
| **Primary Dark** | Indigo 700 | `#4338CA` | `indigo-700` | Primary button hover |
| **Primary Light** | Indigo 50 | `#EEF2FF` | `indigo-50` | Icon backgrounds, subtle highlights |
| **Secondary** | Teal 600 | `#0D9488` | `teal-600` | FAB on mobile, secondary accents |
| **Secondary Light** | Teal 50 | `#F0FDFA` | `teal-50` | Secondary backgrounds |

> **Mobile note:** Flutter theme uses `Color(0xFF1565C0)` (Material Blue 800) as primary seed and `Color(0xFF26A69A)` (Teal 400) as secondary. The web uses Indigo. When aligning, prefer Indigo as the canonical brand primary for web and Indigo-adjacent for mobile.

### 2.2 Neutral / Surface

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Page background (light) | `#F9FAFB` | `gray-50` | App shell background |
| Surface / Card (light) | `#FFFFFF` | `white` | Cards, panels, modals |
| Border (light) | `#E5E7EB` | `gray-200` | Card borders, dividers |
| Body text | `#111827` | `gray-900` | Primary text |
| Secondary text | `#6B7280` | `gray-500` | Labels, meta, descriptions |
| Muted text | `#9CA3AF` | `gray-400` | Placeholders, disabled |
| Page background (dark) | `#030712` | `gray-950` | Dark mode app shell |
| Surface (dark) | `#111827` | `gray-900` | Dark mode cards |
| Border (dark) | `#374151` | `gray-700` | Dark mode borders |

### 2.3 Semantic Colors

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Success** | `#16A34A` | `green-600` | Positive trends, completed, active status |
| **Success light** | `#F0FDF4` | `green-50` | Success badge backgrounds |
| **Warning** | `#D97706` | `amber-600` | Pending states, follow-up alerts |
| **Warning light** | `#FFFBEB` | `amber-50` | Warning badge backgrounds |
| **Error / Danger** | `#DC2626` | `red-600` | Destructive actions, error states, lost leads |
| **Error light** | `#FEF2F2` | `red-50` | Error badge backgrounds |
| **Info** | `#0284C7` | `sky-600` | Informational highlights, pipeline stats |
| **Info light** | `#F0F9FF` | `sky-50` | Info badge backgrounds |

### 2.4 Lead Status Color Mapping

| Status | Color | Tailwind |
|--------|-------|----------|
| New | Indigo | `indigo-600` |
| Contacted | Sky | `sky-600` |
| Qualified | Amber | `amber-600` |
| Proposal | Purple | `purple-600` |
| Negotiation | Orange | `orange-600` |
| Won | Green | `green-600` |
| Lost | Red | `red-600` |

---

## 3. Typography

**Font family:** `Inter` (web + mobile)  
**Mobile:** `google_fonts: Inter` via Flutter  
**Web:** System font stack with Inter as primary (loaded via CSS or Vite config)

### 3.1 Scale

| Level | Size | Weight | Line Height | Tailwind | Usage |
|-------|------|--------|-------------|----------|-------|
| **Display** | 30px | 700 | 1.2 | `text-3xl font-bold` | — (landing/splash only) |
| **H1** | 24px | 700 | 1.3 | `text-2xl font-bold` | Page titles |
| **H2** | 20px | 600 | 1.35 | `text-xl font-semibold` | Section headers, card titles |
| **H3** | 16px | 600 | 1.4 | `text-base font-semibold` | Sub-sections, table group headers |
| **Body Large** | 16px | 400 | 1.5 | `text-base` | Long-form text, descriptions |
| **Body** | 14px | 400 | 1.5 | `text-sm` | Default body, table cells, form labels |
| **Body Small** | 13px | 400 | 1.5 | `text-[13px]` | Dense tables, sidebars |
| **Caption** | 12px | 400 | 1.4 | `text-xs` | Timestamps, helper text, footnotes |
| **Badge / Label** | 12px | 500 | 1 | `text-xs font-medium` | Status badges, tags |

### 3.2 Color Pairings (text)

| Context | Class |
|---------|-------|
| Primary heading | `text-gray-900 dark:text-gray-100` |
| Secondary / meta | `text-gray-500 dark:text-gray-400` |
| Muted / disabled | `text-gray-400 dark:text-gray-500` |
| Link / CTA text | `text-indigo-600 dark:text-indigo-400` |
| Error message | `text-red-600 dark:text-red-400` |

---

## 4. Spacing System

**Base unit:** 4px (Tailwind `spacing-1 = 4px`)

| Token | px | Tailwind | Use |
|-------|----|----------|-----|
| `space-1` | 4 | `p-1` / `gap-1` | Icon gaps, tight inline spacing |
| `space-2` | 8 | `p-2` / `gap-2` | Button icon gap, chip padding |
| `space-3` | 12 | `p-3` / `gap-3` | Compact card padding |
| `space-4` | 16 | `p-4` / `gap-4` | Standard card padding, list item gap |
| `space-5` | 20 | `p-5` / `gap-5` | Generous card padding (StatsCard) |
| `space-6` | 24 | `p-6` / `gap-6` | Page section gap, modal padding |
| `space-8` | 32 | `p-8` / `gap-8` | Page-level container, login card |
| `space-12` | 48 | `p-12` | Large hero sections |

**Page layout grid:**
- Desktop sidebar: `256px` fixed
- Content area: `calc(100vw - 256px)`, max `1280px`
- Page padding: `24px` (horizontal + vertical)
- Section gap: `24px` (`gap-6`)
- Card grid: 4-column, collapses to 2 → 1 on smaller screens

---

## 5. Border Radius

| Level | px | Tailwind | Usage |
|-------|----|----------|-------|
| Small | 6px | `rounded-md` | Badges, chips, small inputs |
| Medium | 8px | `rounded-lg` | Buttons, inputs, table rows |
| Large | 12px | `rounded-xl` | Cards, panels, stat cards |
| XL | 16px | `rounded-2xl` | Login card, large modal |
| Full | 9999px | `rounded-full` | Avatars, pills, circular buttons |

---

## 6. Shadows & Elevation

| Level | Class | Usage |
|-------|-------|-------|
| None | `shadow-none` | Flat sections in sidebars |
| Subtle | `shadow-sm` | Cards, stat cards (default) |
| Medium | `shadow-md` | Dropdowns, floating panels |
| High | `shadow-xl` | Modals, login card, drawers |

---

## 7. Component Inventory

### 7.1 Existing Components (Admin UI)

#### UI Primitives
| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Button | `ui/Button.tsx` | ✅ Good | 4 variants (primary/secondary/danger/ghost), 3 sizes, loading state |
| Input | `ui/Input.tsx` | ✅ Good | Label, error, leftAddon support |
| Select | `ui/Select.tsx` | ✅ Good | Basic select wrapper |
| Textarea | `ui/Textarea.tsx` | ✅ Good | Basic textarea |
| SearchBar | `ui/SearchBar.tsx` | ✅ Good | Debounce-ready search |
| StatsCard | `ui/StatsCard.tsx` | ✅ Good | Icon, trend, 6 color variants |
| DataTable | `ui/DataTable.tsx` | ✅ Good | Sortable, paginated |
| Skeleton | `ui/Skeleton.tsx` | ✅ Good | Loading placeholder |
| LoadingSpinner | `ui/LoadingSpinner.tsx` | ✅ Good | Full-page and inline |
| ConfirmDialog | `ui/ConfirmDialog.tsx` | ✅ Good | Destructive confirm pattern |
| ErrorBoundary | `ui/ErrorBoundary.tsx` | ✅ Good | React error catching |

#### Layout
| Component | File | Status |
|-----------|------|--------|
| Layout (shell) | `layout/Layout.tsx` | ✅ Good |
| Sidebar | `layout/Sidebar.tsx` | ✅ Good |
| TopBar | `layout/TopBar.tsx` | ✅ Good |
| Breadcrumbs | `layout/Breadcrumbs.tsx` | ✅ Good |

#### Dashboard
| Component | File | Status |
|-----------|------|--------|
| RevenueChart | `dashboard/RevenueChart.tsx` | ✅ Good |
| LeadsPipelineChart | `dashboard/LeadsPipelineChart.tsx` | ✅ Good |
| PropertiesCharts | `dashboard/PropertiesCharts.tsx` | ✅ Good |
| AgentPerformanceTable | `dashboard/AgentPerformanceTable.tsx` | ✅ Good |
| ActivityFeed | `dashboard/ActivityFeed.tsx` | ✅ Good |
| DateRangeFilter | `dashboard/DateRangeFilter.tsx` | ✅ Good |
| ChartCard | `dashboard/ChartCard.tsx` | ✅ Good |

#### Domain Components
| Component | File | Status |
|-----------|------|--------|
| PropertyCard | `properties/PropertyCard.tsx` | ✅ Good |
| PropertyFilters | `properties/PropertyFilters.tsx` | ✅ Good |
| RecordPaymentDialog | `invoices/RecordPaymentDialog.tsx` | ✅ Good |

### 7.2 Existing Components (Agent UI)

Agent UI extends admin UI with additional components:

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Badge | `ui/Badge.tsx` | ✅ Good | Missing in admin UI — needed there too |
| EmptyState | `ui/EmptyState.tsx` | ✅ Good | Missing in admin UI — needed there too |
| Modal | `ui/Modal.tsx` | ✅ Good | Missing in admin UI — needed there too |
| Pagination | `ui/Pagination.tsx` | ✅ Good | Missing in admin UI — needed there too |
| ActivityLog | `ActivityLog.tsx` | ✅ Good | Timeline display |
| QuickLogActivity | `QuickLogActivity.tsx` | ✅ Good | Quick entry form |
| LeadActivityForm | `leads/LeadActivityForm.tsx` | ✅ Good | Log calls, notes, meetings |
| LeadDetailPanel | `leads/LeadDetailPanel.tsx` | ✅ Good | Side panel for lead details |
| LeadKanban | `leads/LeadKanban.tsx` | ✅ Good | Kanban board view |
| LeadStatusBadge | `leads/LeadStatusBadge.tsx` | ✅ Good | Status pill |
| LeadTable | `leads/LeadTable.tsx` | ✅ Good | Tabular leads view |
| LeadForm | `leads/LeadForm.tsx` | ✅ Good | Create/edit lead |
| LeadFilters | `leads/LeadFilters.tsx` | ✅ Good | Search + filters bar |
| ClientDetailPanel | `clients/ClientDetailPanel.tsx` | ✅ Good | |
| ClientForm | `clients/ClientForm.tsx` | ✅ Good | |
| ClientTable | `clients/ClientTable.tsx` | ✅ Good | |
| ClientFilters | `clients/ClientFilters.tsx` | ✅ Good | |
| PropertyStatusBadge | `properties/PropertyStatusBadge.tsx` | ✅ Good | |
| PropertyFilters | `properties/PropertyFilters.tsx` | ✅ Good | |
| TodayFollowUps | `dashboard/TodayFollowUps.tsx` | ✅ Good | |
| UpcomingTasks | `dashboard/UpcomingTasks.tsx` | ✅ Good | |
| NotificationsPanel | `dashboard/NotificationsPanel.tsx` | ✅ Good | |
| PerformanceComparison | `dashboard/PerformanceComparison.tsx` | ✅ Good | |
| QuickActions | `dashboard/QuickActions.tsx` | ✅ Good | |
| RecentActivities | `dashboard/RecentActivities.tsx` | ✅ Good | |
| LeadPipeline | `dashboard/LeadPipeline.tsx` | ✅ Good | |

### 7.3 Mobile Components (Flutter)

| Widget | File | Status |
|--------|------|--------|
| AppShell (bottom nav) | `widgets/app_shell.dart` | ✅ Good |
| ActivityTimeline | `widgets/activity_timeline.dart` | ✅ Good |
| LeadStatusBadge | `widgets/lead_status_badge.dart` | ✅ Good |
| OfflineIndicator | `widgets/offline_indicator.dart` | ✅ Good |

### 7.4 Missing / Needs Creation

| Component | Priority | Needed In | Description |
|-----------|----------|-----------|-------------|
| `Toast / Notification` | 🔴 High | Both web portals | Currently using `react-hot-toast` — needs design spec |
| `Badge` | 🔴 High | Admin UI | Exists in agent-ui, missing in admin-ui |
| `EmptyState` | 🔴 High | Admin UI | Empty list with illustration + CTA |
| `Modal` | 🔴 High | Admin UI | Sheet/dialog — exists in agent-ui, missing in admin-ui |
| `Pagination` | 🔴 High | Admin UI | Exists in agent-ui, missing in admin-ui |
| `Avatar / AvatarGroup` | 🟡 Medium | Both | User photos with fallback initials |
| `Dropdown Menu` | 🟡 Medium | Both | Context menus, action menus per row |
| `Tabs` | 🟡 Medium | Both | Detail pages (e.g. Lead Detail tabs) |
| `DatePicker` | 🟡 Medium | Both | Follow-up scheduling, contract dates |
| `FileUpload` | 🟡 Medium | Both | Contract documents, property photos |
| `RichTextEditor` | 🟡 Medium | Both | Notes / activity descriptions |
| `KanbanColumn` | 🟡 Medium | Admin UI | Drag-and-drop kanban (exists in agent-ui) |
| `ChartCard (wrapper)` | 🟡 Medium | Agent UI | Exists in admin-ui |
| `Property Map View` | 🟡 Medium | Both web + Mobile | Pin property locations on map |
| `Calendar / Schedule` | 🔴 High | Both | Follow-up calendar view |
| `Mobile: PropertyForm` | 🔴 High | Mobile | Create/edit property on mobile |
| `Mobile: ContractScreen` | 🔴 High | Mobile | View contracts on mobile |
| `Mobile: SearchOverlay` | 🟡 Medium | Mobile | Global search |
| `Mobile: FilterSheet` | ✅ Partial | Mobile | Exists for properties; needed for leads/clients |

---

## 8. Icon System

**Library:** Lucide React (web) / Material Icons (Flutter, via Material 3)  
**Size scale:**
- 12px — inline with caption text
- 16px — button icons (sm/md buttons)
- 18px — action bar buttons, table actions  
- 20px — stats card icons
- 24px — hero/feature icons, AppBar icons

---

## 9. Dark Mode

All web components support dark mode via Tailwind's `.dark` class strategy.  
Toggle is available in the TopBar via `ThemeContext`.

**Dark mode pairing examples:**
- Cards: `bg-white dark:bg-gray-800`  
- Borders: `border-gray-200 dark:border-gray-700`
- Body text: `text-gray-900 dark:text-gray-100`

Mobile (Flutter) supports both `ThemeData.light` and `ThemeData.dark` — toggle via system preference or settings.

---

## 10. Motion & Animation

- **Duration:** 150ms (micro), 300ms (transitions), 500ms (page enters)
- **Easing:** `ease` for color transitions, `ease-out` for enters, `ease-in` for exits
- **Loading:** Skeleton screens preferred over spinners for data-heavy pages
- **Kanban drag:** smooth 200ms card shadow elevation on drag start

---

*This document should be updated with every Sprint as new components are added. Design tokens will be extracted to a shared `tokens.ts` file in future sprints.*
