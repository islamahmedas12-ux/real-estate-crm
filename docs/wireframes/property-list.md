# Wireframe: Property List Page
**Issue #8 — UX Wireframes / Docs**
**Author:** Layla Ibrahim (Frontend)
**Status:** Draft

---

## 1. Overview

The Property List page is the primary interface for browsing and managing real estate listings. It combines a powerful search bar, contextual filters, a sortable data table, and pagination into a cohesive, scannable view.

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER / SIDEBAR (see admin-dashboard.md)                          │
├─────────────────────────────────────────────────────────────────────┤
│  PAGE HEADER                                                        │
│  "Properties"  [+ Add Property]                   [⚙ Columns ▾]    │
├─────────────────────────────────────────────────────────────────────┤
│  SEARCH & FILTER BAR                                                │
│  [🔍 Search by title, address, MLS #...]         [Filters ▾] [Clear]│
│  Active filters: [Type: House ×] [Price: $200k–$500k ×]             │
├─────────────────────────────────────────────────────────────────────┤
│  FILTER PANEL (collapsible, opens below bar)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Type     │ │ Status   │ │ Price    │ │ Bedrooms │ │ City/Area│  │
│  │ Checkbox │ │ Checkbox │ │ Range    │ │ Stepper  │ │ Combobox │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  [Apply Filters]                               [Reset All]          │
├─────────────────────────────────────────────────────────────────────┤
│  TABLE                                                              │
│  ┌──┬──────────┬───────────────┬──────┬────────┬────────┬────────┐  │
│  │☐ │ Photo    │ Title/Address  │ Type │ Price  │ Status │Actions │  │
│  ├──┼──────────┼───────────────┼──────┼────────┼────────┼────────┤  │
│  │☐ │ [thumb]  │ 12 Oak Ave    │ House│$320,000│ Active │ ⋮      │  │
│  │☐ │ [thumb]  │ 5 Nile Plaza  │ Apt  │$180,000│ Pending│ ⋮      │  │
│  │  │  ...     │  ...          │  ... │   ...  │  ...   │        │  │
│  └──┴──────────┴───────────────┴──────┴────────┴────────┴────────┘  │
│  Selected: 3  [Bulk: Archive ▾] [Bulk: Delete ▾]                    │
├─────────────────────────────────────────────────────────────────────┤
│  PAGINATION                                                         │
│  Showing 1–25 of 1,240    [< Prev]  1 2 3 … 50  [Next >]   [25 ▾] │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 Search Bar

- Full-width text input with magnifier icon
- Debounced (300 ms) — triggers API call on type
- Clears on `Esc`; cursor auto-focuses on `/` shortcut

### 3.2 Filter Panel

| Filter          | Control Type       | Values                                      |
|-----------------|--------------------|---------------------------------------------|
| Property Type   | Multi-checkbox     | House, Apartment, Villa, Commercial, Land   |
| Listing Status  | Multi-checkbox     | Active, Pending, Sold, Off-market, Draft    |
| Price Range     | Dual-handle slider | Min / Max with text input override          |
| Bedrooms        | Stepper (0–10+)    | Minimum bedrooms                            |
| Bathrooms       | Stepper (0–6+)     | Minimum bathrooms                           |
| Area (sqft/sqm) | Range inputs       | Min / Max                                   |
| City / Area     | Combobox           | Searchable list from API                    |
| Agent           | Combobox           | Assigned agent filter                       |
| Date Listed     | Date range picker  | From – To                                   |

### 3.3 Data Table

**Columns (default visible):**

| # | Column       | Sortable | Default Sort |
|---|--------------|----------|--------------|
| 1 | Thumbnail    | No       | —            |
| 2 | Title / MLS  | Yes      | No           |
| 3 | Address      | Yes      | No           |
| 4 | Type         | Yes      | No           |
| 5 | Bedrooms     | Yes      | No           |
| 6 | Price        | Yes      | DESC         |
| 7 | Status       | Yes      | No           |
| 8 | Agent        | Yes      | No           |
| 9 | Date Listed  | Yes      | No           |
| 10 | Actions     | No       | —            |

**Row actions (⋮ menu):**
- View details
- Edit listing
- Change status
- Assign agent
- Archive / Delete (with confirmation)

**Bulk actions:**
- Change status (multi-select)
- Archive selected
- Delete selected (destructive — confirmation dialog)
- Export selected (CSV / PDF)

### 3.4 Pagination

- Page size options: 10, 25, 50, 100
- Page number buttons (max 7 visible, ellipsis on overflow)
- Previous / Next buttons; disabled at boundaries
- "Showing X–Y of Z" counter

---

## 4. Responsive Behavior

| Breakpoint | Layout changes                                              |
|------------|-------------------------------------------------------------|
| `< 640px`  | Table → card list; search full width; filters in modal sheet|
| `640–1024px`| Horizontal scroll on table; filter panel in sidebar drawer |
| `≥ 1024px` | Full layout as above                                        |

---

## 5. States

- **Loading:** Table rows replaced with skeleton rows (5 × shimmer)
- **Empty (no data):** Illustrated empty state + "Add first property" CTA
- **Empty (filters):** "No properties match your filters" + "Clear filters" link
- **Error:** Inline alert with retry button

---

## 6. Accessibility Notes

- Table has proper `<th scope>`, `aria-sort` on sortable columns
- Checkbox column announces selection count to screen readers
- Filter panel toggle is `aria-expanded`
- Keyboard: `Tab` through rows, `Enter` opens detail, `Space` toggles checkbox
