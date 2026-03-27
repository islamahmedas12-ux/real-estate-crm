# Wireframe: Admin Dashboard
**Issue #8 — UX Wireframes / Docs**
**Author:** Layla Ibrahim (Frontend)
**Status:** Draft

---

## 1. Overview

The Admin Dashboard is the default landing page after login. It surfaces high-level KPIs, recent activity, and key charts so that real estate managers and agents can assess the health of the business at a glance.

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Nav links | User avatar + Logout                    │
├──────────────┬──────────────────────────────────────────────────────┤
│              │  PAGE HEADER                                         │
│   SIDEBAR    │  "Dashboard"  [Date range picker]  [Export ▾]       │
│              ├──────────────────────────────────────────────────────┤
│  • Dashboard │  STATS CARDS ROW (4 cards)                           │
│  • Listings  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  • Clients   │  │ Total    │ │ Active   │ │ Deals    │ │Revenue │  │
│  • Deals     │  │ Listings │ │ Clients  │ │ Closed   │ │ (MTD)  │  │
│  • Reports   │  │  1,240   │ │   318    │ │   47     │ │$2.4M   │  │
│  • Settings  │  │ ▲ 12%    │ │ ▲  8%    │ │ ▲ 23%    │ ▲ 18%   │  │
│              │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│              ├──────────────────────────────────────────────────────┤
│              │  CHARTS ROW                                          │
│              │  ┌──────────────────────────┐ ┌───────────────────┐  │
│              │  │ Revenue Over Time        │ │ Deal Pipeline     │  │
│              │  │ (Line chart — 12 months) │ │ (Funnel / Donut)  │  │
│              │  │                          │ │                   │  │
│              │  └──────────────────────────┘ └───────────────────┘  │
│              ├──────────────────────────────────────────────────────┤
│              │  BOTTOM ROW                                          │
│              │  ┌──────────────────────────┐ ┌───────────────────┐  │
│              │  │ Recent Activity Feed     │ │ Top Agents        │  │
│              │  │ (Timeline list)          │ │ (Leaderboard)     │  │
│              │  └──────────────────────────┘ └───────────────────┘  │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 Stats Cards (×4)

| Field         | Details                                             |
|---------------|-----------------------------------------------------|
| Title         | "Total Listings", "Active Clients", "Deals Closed", "Revenue (MTD)" |
| Primary value | Large number / currency                             |
| Trend badge   | % change vs previous period, color-coded (green/red)|
| Icon          | 24px icon matching the metric topic                 |
| CTA           | Clicking navigates to the relevant list page        |

### 3.2 Revenue Over Time Chart

- **Type:** Area line chart
- **X-axis:** Month labels (last 12 months)
- **Y-axis:** Revenue in USD
- **Series:** Current year (solid) vs previous year (dashed, secondary color)
- **Tooltip:** Date, value, delta on hover
- **Library:** Recharts

### 3.3 Deal Pipeline Chart

- **Type:** Donut / Funnel (toggle)
- **Segments:** Lead → Qualified → Proposal → Negotiation → Closed Won / Lost
- **Legend:** Color-coded pills on the right
- **Click:** Filters the Recent Activity feed

### 3.4 Recent Activity Feed

- Scrollable list, max 10 items visible, "See all" link
- Each item:
  - Icon (colored by type: listing, client, deal)
  - Actor name + action text
  - Relative timestamp ("2 hours ago")
  - Link to the relevant record

### 3.5 Top Agents Leaderboard

- Ranked table: Avatar | Name | Deals | Revenue | Badge
- Top 5 agents only
- "View full report" link → Reports section

---

## 4. Responsive Behavior

| Breakpoint | Layout changes                                          |
|------------|---------------------------------------------------------|
| `< 640px`  | Sidebar collapses to bottom nav; cards stack 1 column  |
| `640–1024px` | Cards 2×2 grid; charts stack vertically              |
| `≥ 1024px` | Full layout as above                                   |

---

## 5. States

- **Loading:** Skeleton placeholders for each card and chart
- **Empty:** Illustrated empty state with CTA to add first listing
- **Error:** Inline error message with retry button

---

## 6. Accessibility Notes

- All charts must have `aria-label` and a text-based data table alternative
- Keyboard navigation through stat cards and charts
- Color is never the sole indicator (trend icons + text)
