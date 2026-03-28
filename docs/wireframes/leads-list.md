# Wireframe: Leads List / Pipeline Page

**Route:** `/leads` (list) · `/leads/kanban` (pipeline)  
**Issue:** #19  
**Designer:** Layla Ibrahim

---

## Layout Overview — Kanban View (Default)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  📊 Leads Pipeline           [42]     [+ New Lead]              │
├─────────────────────────────────────────────────────────────────┤
│  CONTROLS ROW                                                   │
│  ┌─────────────────────┐ [Priority ▼] [Agent ▼] [🔲 List] [📊]│
│  │ 🔍 Search leads...   │                                       │
│  └─────────────────────┘                                       │
├─────────────────────────────────────────────────────────────────┤
│  KANBAN BOARD (horizontal scroll)                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ NEW (12) │ │CONTACTED │ │ VIEWING  │ │NEGOTIATION│ │ WON  │ │
│  │ ───────  │ │  (8)     │ │  (6)     │ │   (4)    │ │ (12) │ │
│  │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌────────┐│ │┌────┐│ │
│  ││Villa   ││ ││3BR Apt ││ ││Office  ││ ││Penthse ││ ││Shop││ │
│  ││Interest││ ││Follow  ││ ││Tour    ││ ││Offer   ││ ││Deal││ │
│  ││🔴 High ││ ││🟡 Med  ││ ││🟡 Med  ││ ││🔴 High ││ ││🟢  ││ │
│  ││Ahmed S.││ ││Sara N. ││ ││Khaled ││ ││Nour A. ││ ││Ali ││ │
│  ││2d ago  ││ ││5d ago  ││ ││1d ago  ││ ││3h ago  ││ ││1w  ││ │
│  │└────────┘│ │└────────┘│ │└────────┘│ │└────────┘│ │└────┘│ │
│  │┌────────┐│ │┌────────┐│ │          │ │          │ │      │ │
│  ││Studio  ││ ││Land    ││ │          │ │          │ │      │ │
│  ││Inquiry ││ ││Inquiry ││ │          │ │          │ │      │ │
│  ││🟢 Low  ││ ││🟡 Med  ││ │          │ │          │ │      │ │
│  │└────────┘│ │└────────┘│ │          │ │          │ │      │ │
│  │  + Add   │ │          │ │          │ │          │ │      │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│                                            Also: LOST column   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layout Overview — List View

```
┌─────────────────────────────────────────────────────────────────┐
│  (Same header & controls, "List" toggle active)                 │
├─────────────────────────────────────────────────────────────────┤
│  DATA TABLE                                                     │
│  ┌──┬────────────────┬──────────┬─────────┬──────┬─────┬──────┐│
│  │☐ │ Lead Title     │ Client   │ Stage   │ Prio │Agent│ Date ││
│  ├──┼────────────────┼──────────┼─────────┼──────┼─────┼──────┤│
│  │☐ │ Villa interest │ Ahmed S. │ 🔵 New   │ 🔴   │Sara │ 2d  ││
│  │☐ │ 3BR Apartment  │ Sara N.  │ 🟡 Contd│ 🟡   │Omar │ 5d  ││
│  │☐ │ Office tour    │ Khaled O.│ 🟢 View │ 🟡   │Sara │ 1d  ││
│  └──┴────────────────┴──────────┴─────────┴──────┴─────┴──────┘│
│  Showing 1–10 of 42    [← Prev]  1  2  3 ... 5  [Next →]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Stages

| Stage       | Color       | Description                        |
|-------------|-------------|------------------------------------|
| NEW         | Blue        | Freshly created, not yet contacted |
| CONTACTED   | Cyan        | Initial outreach done              |
| VIEWING     | Amber       | Property viewing scheduled/done    |
| NEGOTIATION | Orange      | Price/terms negotiation in progress|
| WON         | Green       | Deal closed, convert to contract   |
| LOST        | Gray        | Lead dropped or chose competitor   |

---

## Component Spec

### Header
- Page title with chart icon (indigo)
- Total leads count badge
- `+ New Lead` button (primary)

### Controls Row
- Search bar (debounced 300ms, searches title + client name)
- Priority filter dropdown: All / High / Medium / Low
- Agent filter dropdown: All / [agent names from API]
- View toggle: List (table icon) / Kanban (board icon)

### Kanban Card
```
┌──────────────────────┐
│ Villa Interest        │  ← title (bold, truncate 2 lines)
│ 🔴 High  ·  🏠 Villa │  ← priority dot + property type
│ 👤 Ahmed Samir       │  ← client name
│ 🕐 2 days ago        │  ← relative timestamp
│ Agent: Sara           │  ← assigned agent (small text)
└──────────────────────┘
```

**Interactions:**
- Click card → navigate to `/leads/:id`
- Drag card between columns → PATCH `/api/leads/:id/stage`
- Hover → subtle shadow elevation

### Kanban Column
- Column header: stage name + count badge
- Scrollable vertically (max-height with overflow)
- `+ Add` button at bottom of NEW column
- Drop zone highlight (dashed indigo border) on drag-over

### List Table Columns
| Column     | Sortable | Notes                                        |
|------------|----------|----------------------------------------------|
| ☐          | —        | Bulk select checkbox                         |
| Lead Title | ✓        | Title, clickable → detail page               |
| Client     | ✓        | Client name, clickable → client detail       |
| Stage      | ✓        | Colored badge matching pipeline stage         |
| Priority   | ✓        | Dot indicator: 🔴 High, 🟡 Medium, 🟢 Low   |
| Agent      | ✓        | Assigned agent name                          |
| Created    | ✓        | Relative date                                |
| Actions    | —        | Kebab: View, Edit, Change Stage, Delete      |

### Bulk Actions (when rows selected)
- `Change Stage` → dropdown with stages
- `Assign Agent` → agent picker
- `Delete` → confirm dialog

---

## States

| State         | Display                                           |
|---------------|---------------------------------------------------|
| Loading       | Kanban: skeleton cards · List: skeleton rows       |
| Empty         | "No leads yet" illustration + `+ New Lead` CTA    |
| Empty column  | "No leads" ghost text in empty kanban column       |
| Empty search  | "No leads matching '...'"                          |
| Error         | Error card with retry button                       |
| Dragging      | Card with drop shadow, origin faded                |

---

## Accessibility
- Kanban columns use `role="list"`, cards use `role="listitem"`
- Drag-and-drop has keyboard alternative: select card → arrow keys to move between columns
- View toggle is a `role="radiogroup"` with `role="radio"` buttons
- Stage change via drag announces to screen reader: "Moved {lead} to {stage}"
- Priority indicators have `aria-label` (not just color)
