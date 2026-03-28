# Wireframe: Client Detail Page

**Route:** `/clients/:id`  
**Issue:** #19  
**Designer:** Layla Ibrahim

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  BREADCRUMB                                                     │
│  ← Back to Clients  /  Ahmed Samir                             │
├─────────────────────────────────────────────────────────────────┤
│  CLIENT HEADER CARD                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🅰️ Ahmed Samir              Status: ● Active              │ │
│  │  📧 ahmed@example.com         Source: Referral              │ │
│  │  📞 +20 100 123 4567          Created: 15 Jan 2026         │ │
│  │  📍 Cairo, Egypt                                           │ │
│  │                         [✏️ Edit]  [🗑 Delete]  [📧 Email]  │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  TABS                                                           │
│  [Overview]  [Assigned Properties]  [Leads]  [Contracts]  [Log]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── OVERVIEW TAB ──                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Stats Cards Row      │  │                      │            │
│  │ 🏠 3 Properties       │  │ 📊 2 Active Leads    │            │
│  │ 📝 1 Contract         │  │ 💰 EGP 2.5M Total    │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  NOTES / INTERNAL COMMENTS                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ VIP client — referred by board member. Prefers WhatsApp.   │ │
│  │                                         [Edit Notes]       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ── ASSIGNED PROPERTIES TAB ──                                  │
│  ┌──────┬───────────────────┬──────────┬──────────┬──────────┐ │
│  │Thumb │ Property          │ Type     │ Price    │ Status   │ │
│  ├──────┼───────────────────┼──────────┼──────────┼──────────┤ │
│  │ 🖼   │ Luxury 3BR Zamalek│ Apartment│ 2.5M EGP│ Available│ │
│  │ 🖼   │ Garden Villa Rehab│ Villa    │ 8.0M EGP│ Reserved │ │
│  └──────┴───────────────────┴──────────┴──────────┴──────────┘ │
│  [+ Assign Property]                                            │
│                                                                 │
│  ── LEADS TAB ──                                                │
│  ┌────────────────────┬──────────┬──────────┬────────────────┐ │
│  │ Lead Title         │ Stage    │ Priority │ Created        │ │
│  ├────────────────────┼──────────┼──────────┼────────────────┤ │
│  │ Interested in 3BR  │ Viewing  │ 🔴 High  │ 10 Jan 2026    │ │
│  │ Zamalek apartment  │ Contact  │ 🟡 Medium│ 8 Jan 2026     │ │
│  └────────────────────┴──────────┴──────────┴────────────────┘ │
│  [+ Create Lead]                                                │
│                                                                 │
│  ── CONTRACTS TAB ──                                            │
│  (Same table structure as contracts-list, filtered by client)   │
│                                                                 │
│  ── ACTIVITY LOG TAB ──                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🕐 15 Jan — Status changed to Active                       │ │
│  │ 🕐 14 Jan — Lead "Interested in 3BR" created               │ │
│  │ 🕐 10 Jan — Client created by Agent Sara                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Spec

### Header Card
- Avatar with initials (colored based on name hash)
- Client name (large, bold)
- Contact info: email, phone, location
- Status badge: Active (green), Inactive (gray), Blacklisted (red)
- Source badge (gray pill)
- Created date
- Action buttons: Edit, Delete (confirm dialog), Send Email

### Stats Cards
| Stat              | Icon | Color   |
|-------------------|------|---------|
| Assigned Properties | 🏠  | Indigo  |
| Active Leads      | 📊   | Amber   |
| Contracts         | 📝   | Blue    |
| Total Value       | 💰   | Green   |

### Tabs
| Tab                  | Content                                          |
|----------------------|--------------------------------------------------|
| Overview             | Stats + notes section                            |
| Assigned Properties  | Properties table with assign/unassign actions     |
| Leads                | Leads table filtered to this client              |
| Contracts            | Contracts table filtered to this client           |
| Activity Log         | Chronological activity feed                      |

### Assigned Properties Table
| Column   | Notes                                    |
|----------|------------------------------------------|
| Thumbnail| Small image or placeholder icon          |
| Property | Title + address                          |
| Type     | Property type badge                      |
| Price    | Formatted EGP                            |
| Status   | Status badge (Available/Reserved/Sold)   |
| Actions  | Unassign button                          |

### Leads Table
| Column   | Sortable | Notes                        |
|----------|----------|------------------------------|
| Title    | ✓        | Lead title, clickable        |
| Stage    | ✓        | Pipeline stage badge         |
| Priority | ✓        | Color-coded (High/Med/Low)   |
| Created  | ✓        | Relative or absolute date    |

---

## States

| State              | Display                                           |
|--------------------|---------------------------------------------------|
| Loading            | Skeleton: header card + content area               |
| Not found          | "Client not found" + back button                   |
| Empty properties   | "No properties assigned" + `+ Assign Property` CTA |
| Empty leads        | "No leads yet" + `+ Create Lead` CTA              |
| Empty contracts    | "No contracts yet" + `+ Create Contract` CTA      |

---

## Accessibility
- Tabs follow WAI-ARIA `tablist` / `tab` / `tabpanel` pattern
- Status badge uses `aria-label` for screen readers
- Action buttons have descriptive `aria-label` (e.g., "Edit client Ahmed Samir")
- Activity log items are an `<ol>` with `role="feed"`
