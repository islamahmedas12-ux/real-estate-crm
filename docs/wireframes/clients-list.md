# Wireframe: Clients List Page

**Route:** `/clients`  
**Issue:** #19  
**Designer:** Layla Ibrahim

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  👥 Clients                    [247]     [+ New Client]         │
├─────────────────────────────────────────────────────────────────┤
│  SEARCH & FILTERS ROW                                           │
│  ┌──────────────────────────┐  [Status ▼]  [Source ▼]  [Clear] │
│  │ 🔍 Search by name, email  │                                  │
│  └──────────────────────────┘                                  │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️  DUPLICATE WARNING BANNER (conditional)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⚠️  2 duplicate clients detected — Review & merge         │ │
│  │     [View Duplicates]                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  DATA TABLE                                                     │
│  ┌──┬────────────────┬───────────────┬──────────┬────┬────────┐ │
│  │☐ │ Client         │ Contact       │ Status   │Leads│Actions│ │
│  ├──┼────────────────┼───────────────┼──────────┼────┼────────┤ │
│  │☐ │ 👤 Ahmed Samir │ ahmed@...     │ ● Active │  3 │ ⋮     │ │
│  │  │    Cairo       │ +20 1XX...    │          │    │        │ │
│  ├──┼────────────────┼───────────────┼──────────┼────┼────────┤ │
│  │☐ │ 👤 Sara Nabil  │ sara@...      │ ● Active │  1 │ ⋮     │ │
│  │  │  ⚠️ DUPLICATE  │ +20 1XX...    │          │    │        │ │
│  ├──┼────────────────┼───────────────┼──────────┼────┼────────┤ │
│  │☐ │ 👤 Khaled Omer │ khaled@...    │ ○ Inactive│ 0 │ ⋮     │ │
│  └──┴────────────────┴───────────────┴──────────┴────┴────────┘ │
│                                                                 │
│  Showing 1–10 of 247    [← Prev]  1  2  3 ... 25  [Next →]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Spec

### Header
- Page title with `Users` icon (indigo)
- Total count badge (gray pill)
- `+ New Client` button (primary)

### Search Bar
- Debounced (300ms)
- Searches: name, email, phone
- Placeholder: "Search by name, email or phone..."

### Filters
| Filter   | Type     | Options                                |
|----------|----------|----------------------------------------|
| Status   | Dropdown | All / Active / Inactive / Blacklisted  |
| Source   | Dropdown | All / Referral / Walk-in / Online / ... |
| Clear    | Button   | Resets all filters                     |

### Duplicate Warning Banner
- **Trigger:** API returns `duplicateCount > 0` in response meta
- **Appearance:** amber/yellow banner with warning icon
- **CTA:** "View Duplicates" → opens `/clients?filter=duplicates`
- **Dismissable:** Yes, with ✕ button (session-scoped)

### Duplicate Row Indicator
- Rows flagged as duplicates show:
  - `⚠️ DUPLICATE` amber badge below client name
  - Subtle amber left-border on the row
  - Tooltip on hover: "Possible duplicate — click to review"

### Table Columns
| Column  | Sortable | Notes                                               |
|---------|----------|-----------------------------------------------------|
| ☐       | —        | Bulk select checkbox                                |
| Client  | ✓        | Avatar initials + name + city, duplicate badge      |
| Contact | —        | Email + phone                                       |
| Status  | ✓        | Colored dot badge: Active (green), Inactive (gray), Blacklisted (red) |
| Leads   | ✓        | Count badge, click → filters leads by client        |
| Actions | —        | Kebab menu: View, Edit, Delete, Merge (if duplicate)|

### Actions Menu (Kebab)
```
┌──────────────┐
│ 👁 View       │
│ ✏️  Edit       │
│ 🔀 Merge      │  ← only shown if duplicate
│ 🗑  Delete     │
└──────────────┘
```

### Pagination
- Page size options: 10 / 25 / 50
- Shows "Showing X–Y of Z"

---

## States

| State        | Display                                                |
|--------------|--------------------------------------------------------|
| Loading      | Skeleton rows (3 visible)                              |
| Empty        | Illustration + "No clients yet" + `+ New Client` CTA  |
| Empty search | "No results for '...' — try different keywords"        |
| Error        | Error card with retry button                           |

---

## Accessibility
- Table has `role="grid"`, columns have `aria-sort`
- Duplicate badge has `role="alert"` + descriptive `aria-label`
- Kebab trigger has `aria-label="Actions for {name}"`
