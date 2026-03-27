# Wireframe: Property Detail Page
**Issue #8 — UX Wireframes / Docs**
**Author:** Layla Ibrahim (Frontend)
**Status:** Draft

---

## 1. Overview

The Property Detail page gives agents and managers a complete, single-screen view of a listing: media gallery, key facts, description, pricing history, assigned agent, and related activity. It also exposes all editing actions.

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER / SIDEBAR (see admin-dashboard.md)                          │
├─────────────────────────────────────────────────────────────────────┤
│  BREADCRUMBS: Properties > 12 Oak Avenue                            │
│  PAGE HEADER                                                        │
│  "12 Oak Avenue, Cairo"   [Status Badge: Active]                    │
│  MLS #: RE-20240312-001   Listed: 12 Mar 2024   Agent: Sara Mostafa │
│  [Edit Listing]  [Change Status ▾]  [Delete]  [Share ⬡]            │
├──────────────────────────────┬──────────────────────────────────────┤
│  LEFT COLUMN (60%)           │  RIGHT COLUMN (40%)                  │
│                              │                                      │
│  MEDIA GALLERY               │  QUICK FACTS CARD                   │
│  ┌────────────────────────┐  │  Price:       $320,000               │
│  │                        │  │  Type:        House                  │
│  │   Main Photo (16:9)    │  │  Bedrooms:    4                      │
│  │                        │  │  Bathrooms:   3                      │
│  └────────────────────────┘  │  Area:        2,400 sqft             │
│  [◀] thumbnail thumbnails [▶]│  Year Built:  2018                   │
│  Photo 1 of 12  [+ Add Media]│  Parking:     2 covered              │
│                              │  Furnished:   No                     │
│  DESCRIPTION                 │  ────────────────────────────────    │
│  ┌────────────────────────┐  │  LOCATION CARD                      │
│  │ Free-text property     │  │  [Map embed — 200px tall]            │
│  │ description (markdown  │  │  12 Oak Avenue, Maadi, Cairo         │
│  │ rendered)              │  │  [View on Google Maps ↗]             │
│  └────────────────────────┘  │  ────────────────────────────────    │
│  [Expand / Collapse]         │  ASSIGNED AGENT CARD                 │
│                              │  [Avatar] Sara Mostafa               │
│  FEATURES & AMENITIES        │  📞 +20-10-xxxx-xxxx                 │
│  ┌────────────────────────┐  │  ✉ sara@agency.com                  │
│  │ • Swimming pool        │  │  [Reassign Agent]                    │
│  │ • Central A/C          │  │  ────────────────────────────────    │
│  │ • Security 24/7        │  │  PRICING HISTORY                    │
│  └────────────────────────┘  │  ┌────────────────────────────────┐  │
│                              │  │ Sparkline / table              │  │
│  PRICE HISTORY CHART         │  │ Mar 24  Listed  $340k          │  │
│  (Line chart)                │  │ Apr 24  Reduced $320k          │  │
│                              │  └────────────────────────────────┘  │
│  DOCUMENTS                   │                                      │
│  [⬇ Floor plan.pdf]          │  OPEN HOUSE SCHEDULE                │
│  [⬇ Title deed.pdf]          │  Sat 15 Apr, 10:00–12:00            │
│  [+ Upload Document]         │  [+ Add Open House]                 │
│                              │                                      │
├──────────────────────────────┴──────────────────────────────────────┤
│  ACTIVITY TIMELINE (full width)                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  [🟢] 2h ago   — Sara updated price from $340k to $320k             │
│  [🔵] 1d ago   — Ahmed viewed the listing                           │
│  [🟡] 3d ago   — Status changed: Pending → Active                  │
│  [+ Add Note]                          [Load more activity]         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 Media Gallery

- Main display: 16:9 aspect-ratio photo with navigation arrows
- Thumbnail strip below (scrollable, max 12 shown)
- Lightbox on thumbnail click
- Drag-to-reorder thumbnails for ordering
- Accepts: JPEG, PNG, WebP, MP4 (video tour)
- Upload: drag-and-drop or file picker, max 20 MB per file

### 3.2 Quick Facts Card

| Field        | Type         | Editable |
|--------------|--------------|----------|
| Price        | Currency     | Yes      |
| Property type| Select       | Yes      |
| Bedrooms     | Integer      | Yes      |
| Bathrooms    | Decimal      | Yes      |
| Area (sqft)  | Number       | Yes      |
| Year Built   | Year picker  | Yes      |
| Parking      | Number       | Yes      |
| Furnished    | Toggle       | Yes      |

Clicking any field opens an **inline edit** control (save/cancel on blur or `Enter`/`Esc`).

### 3.3 Location Card

- Embedded map (Leaflet / Google Maps)
- Pin shows property location
- Address text below the map
- "View on Google Maps" external link

### 3.4 Assigned Agent Card

- Agent avatar, full name, phone, email
- "Reassign Agent" opens a modal with a searchable agent list

### 3.5 Pricing History

- Compact table: Date | Event | Price | Change %
- Sparkline chart summary above the table
- Populated from the `price_history` API endpoint

### 3.6 Documents

- List of uploaded files (icon by type, file name, upload date, size)
- Download and Delete actions per row
- Upload button → file picker (PDF, DOCX, XLSX accepted)

### 3.7 Activity Timeline

- Chronological list, newest first
- Each entry: Colored dot | Timestamp | Actor | Action text
- Add Note button opens inline textarea → POST to activity API
- Paginated "Load more" (10 per batch)

---

## 4. Edit Mode

Clicking **[Edit Listing]** switches the description and feature fields to rich-text/form edit mode. The right column Quick Facts fields become a structured form. A sticky save/cancel bar appears at the bottom.

---

## 5. Responsive Behavior

| Breakpoint   | Layout changes                                            |
|--------------|-----------------------------------------------------------|
| `< 640px`    | Single column; gallery full width; quick facts accordion  |
| `640–1024px` | Two columns collapse to 50/50; map height 150px           |
| `≥ 1024px`   | Full 60/40 split as above                                 |

---

## 6. States

- **Loading:** Skeleton for gallery (placeholder box), facts card, and description area
- **Not found:** Full-page 404 with "Back to Properties" link
- **Read-only (archived):** Edit and status buttons are hidden; banner shows "This listing is archived"

---

## 7. Accessibility Notes

- Gallery: `aria-live` region announces "Photo 3 of 12" on navigation
- Map: `aria-label` on the iframe; text address always visible
- Timeline entries use `<time datetime>` for machine-readable timestamps
- Edit mode: focus traps in modals; `Escape` cancels
