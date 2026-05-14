# UX Flows — Real Estate CRM

> **Author:** Dina Salah, Senior UI/UX Designer  
> **Created:** 2026-03-27  
> **Version:** 1.0 (Sprint 1 — Design Foundation)

---

## Flow Notation

```
[Screen] → action → [Screen]
     ↓ branch
[Screen (condition)]
```

- `[Screen]` — full page navigation
- `{Panel}` — side panel / drawer (no navigation)
- `(Modal)` — overlay dialog
- `→` — primary action
- `↓` — conditional branch or alternate path

---

## 1. Core Journey: Login → Dashboard → Create Lead → Convert to Contract

This is the critical end-to-end flow for both Admin and Agent roles.

```
[Login]
  → Enter email + password
  → Submit
  ↓ Auth error → show inline error, stay on [Login]
  → [Dashboard]
    → View stats cards (Properties, Clients, Leads, Revenue, Contracts, Conversion)
    → View Revenue Chart (filterable by date range)
    → View Lead Pipeline Chart
    → View Agent Performance Table (Admin only)
    → View Activity Feed
    → Click "New Lead" (header CTA or Quick Actions widget)
      → (New Lead Modal)
        → Fill: Name, Contact, Source, Status, Priority, Assigned Agent
        → Submit
          ↓ Validation error → show field errors inline
          → Lead created → modal closes → list/kanban refreshes
          → {Lead Detail Panel} opens
            → Review lead info
            → Log first activity (call / email / visit)
            → Set follow-up date
            → Change status (New → Contacted → Qualified → Proposal)
            → Click "Convert to Contract"
              → [Contract Form Page]
                → Fill: Client, Property, Price, Commission, Dates
                → Attach documents
                → Submit
                  ↓ Validation error → show errors inline
                  → [Contract Detail Page]
                    → Review contract terms
                    → Add invoice
                    → Mark as Signed
                    → Record payment
```

### Key Decision Points

| Point | Options | Design Response |
|-------|---------|-----------------|
| Lead source | Referral, Website, Direct, Social, Other | Dropdown with "Add custom" option |
| Lead status progression | Linear (New→Won) or skip to Lost | Kanban drag or status dropdown, allow jumping |
| Contract creation | From lead OR standalone | "Convert" button on lead + standalone "New Contract" |
| Payment recording | Partial or full | RecordPaymentDialog with amount input |

---

## 2. Agent Workflow: Login → My Leads → Log Activity → Schedule Follow-up

The daily workflow for a real estate agent.

```
[Login — Agent Portal]
  → [Dashboard — Agent]
    → Widget: "Today's Follow-ups" shows leads due today
    → Widget: "Upcoming Tasks" shows next 7 days
    → Widget: "My Lead Pipeline" mini-kanban
    → Widget: "Recent Activities" (last 5 actions)
    → Widget: "Quick Actions" → "Log Activity" / "Add Lead" / "View Clients"

  [Nav] → [My Leads Page]
    → Default view: Table (sortable, filterable)
    → Toggle → Kanban view (drag to change status)
    → Filter by: Status, Priority, Date range, Search
    → Click lead row
      → {Lead Detail Panel} (right side panel)
        → Tabs: Overview | Activities | Notes
        Overview tab:
          → See lead info, contact details, assigned property
          → Change status (dropdown)
          → Edit lead (inline or modal)
        Activities tab:
          → Timeline of logged activities
          → "Log Activity" button
            → (Log Activity Modal)
              → Type: Call | Email | Meeting | Site Visit | Note
              → Outcome: Positive | Neutral | Negative
              → Notes (rich text)
              → Duration (for calls/meetings)
              → Submit → activity added to timeline
        Notes tab:
          → Free-form notes per lead
          → "Add Note" inline

  Schedule Follow-up:
    → From {Lead Detail Panel} → "Schedule Follow-up" button
      → (Schedule Follow-up Modal)
        → Date picker
        → Time picker
        → Note / reason
        → Reminder: None | 30min | 1hr | 1day before
        → Save
          → Follow-up appears in "Today's Follow-ups" / "Upcoming Tasks" on dashboard
          → (Future: push notification on mobile)
```

### Agent Dashboard Widget Priority (Visual Hierarchy)

1. **Today's Follow-ups** — most urgent, top of page
2. **Quick Actions** — "Log Activity", "New Lead" (prominent CTAs)
3. **My Lead Pipeline** — visual status overview
4. **Upcoming Tasks** — next 7 days
5. **Recent Activities** — what was done recently

---

## 3. Admin Workflow: Dashboard → Reports → Agent Performance

The management oversight flow for admins/managers.

```
[Login — Admin Portal]
  → [Dashboard — Admin]
    → Stats Cards: Total Properties, Clients, Leads, Revenue, Contracts, Conversion Rate
    → Date Range Filter: Today | This Week | This Month | This Quarter | Custom
    → Revenue Chart (bar/line, monthly breakdown)
    → Lead Pipeline Chart (funnel or donut)
    → Properties Charts (by status, by type)
    → Agent Performance Table (top agents ranked by leads/revenue)
    → Activity Feed (all team activity, latest 20)

  [Nav] → [Reports Page]
    → Report types:
      ├── Revenue Report (by period, by agent, by property type)
      ├── Lead Conversion Report (funnel stages, conversion %)
      ├── Agent Performance Report (comparative)
      ├── Property Report (listings by status, price range)
      └── Client Report (acquisition sources, retention)
    → Each report:
      → Date range selector
      → Export to CSV / PDF
      → Visualizations (charts + summary table)
    → Saved / Scheduled Reports (future sprint)

  Agent Performance Deep-dive:
    → From Dashboard → click agent row in Agent Performance Table
      → [Agent Detail Page]
        → Agent profile header (name, photo, email, phone, join date)
        → Tabs: Overview | Leads | Clients | Properties | Activities
        Overview tab:
          → KPIs: Total Leads, Conversion Rate, Revenue Generated, Active Contracts
          → Lead status breakdown (mini chart)
          → Activity frequency chart
        Leads tab:
          → All leads assigned to this agent (filterable DataTable)
        Clients tab:
          → Clients managed by this agent
        Properties tab:
          → Properties assigned to this agent
        Activities tab:
          → Full activity log for this agent

  Admin → Agents Management:
    → [Nav] → [Agents Page]
      → DataTable: all agents with status, lead count, last activity
      → "Add Agent" button
        → (Add Agent Modal) → name, email, role, phone
      → Click agent row → [Agent Detail Page] (same as above)
      → Deactivate / reactivate agent
```

### Admin Report Export Flow

```
[Reports Page]
  → Select report type
  → Set date range
  → Apply filters (agent, property type, region)
  → View rendered data
  → Click "Export"
    → (Export Modal)
      → Format: CSV | PDF | Excel
      → Options: include charts (PDF only)
      → Export → download starts
```

---

## 4. Mobile Flow: Agent on the Go

Key mobile journeys for the Flutter app.

### 4.1 Login (with optional Biometrics)

```
[Splash Screen]
  → [Login Screen]
    → Email + Password → Sign In button
    → "Use Biometrics" (if previously authenticated)
      → Fingerprint / Face ID prompt
        ↓ Success → [Dashboard]
        ↓ Fail → back to password login
```

### 4.2 Mobile: Quick Lead Check + Activity Log

```
[Dashboard]
  → Offline banner if no connection (OfflineIndicator widget)
  → Stats: My Leads, Today's Follow-ups, Revenue
  → Pull to refresh
  → Tap "My Leads"
    → [Leads List Screen]
      → Filter chips: All | New | Contacted | Qualified | Won | Lost
      → Search bar
      → Lead cards (LeadStatusBadge, name, contact, last activity)
      → Tap lead card
        → [Lead Detail Screen]
          → Lead info + status badge
          → Activity timeline (ActivityTimeline widget)
          → FAB: "Log Activity"
            → Bottom sheet: type + notes + outcome
            → Submit → timeline updates
          → "Schedule Follow-up" button → date picker bottom sheet
```

### 4.3 Mobile: Property Browse

```
[Bottom Nav: Properties]
  → [Properties Screen]
    → List of properties (cards with photo, price, type, status)
    → Filter FAB → [Property Filter Sheet] (bottom sheet)
      → Filter by: Status, Type, Price range, Bedrooms
      → Apply → filtered list updates
    → Tap property → [Property Detail Screen]
      → Photos, address, specs, price, status
      → Assigned agent info
      → "Assign to Lead" shortcut (future)
```

### 4.4 Mobile: Notifications

```
[Bell icon in AppBar] → [Notifications Screen]
  → Grouped by: Today | This Week | Earlier
  → Types: New lead assigned, Follow-up due, Contract update, Payment received
  → Tap notification → deep-link to relevant screen
  → Swipe to dismiss
  → "Mark all as read"
  → [Notification Preferences Screen] (via Settings)
    → Toggle: Push notifications per type
```

---

## 5. Error & Edge Case Flows

### Empty States

| Screen | Empty State Message | CTA |
|--------|--------------------|----|
| Leads (no leads) | "No leads yet. Start building your pipeline." | "Add First Lead" |
| Clients | "No clients found. Add your first client." | "Add Client" |
| Properties | "No properties listed yet." | "Add Property" |
| Activities (lead) | "No activities logged for this lead." | "Log First Activity" |
| Reports | "No data for selected period." | Change date range |
| Notifications | "You're all caught up! 🎉" | — |

### Error States

| Scenario | Response |
|----------|----------|
| API timeout | Toast error + retry button in affected component |
| Auth session expired | Redirect to Login with "Session expired" toast |
| Offline (mobile) | OfflineIndicator banner, read-only mode, queue writes |
| Form validation fail | Inline field-level errors, no toast |
| Delete confirmation | ConfirmDialog with destructive styling |
| Bulk operation partial fail | Toast with count: "3 of 5 items deleted. 2 failed." |

---

*These flows will be translated into Figma wireframes and high-fidelity screens. Each flow node will reference the screen from `screens-inventory.md`.*
