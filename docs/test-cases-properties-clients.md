# Functional Test Cases — Properties & Clients Modules

**Prepared by:** Nour Khalil, Senior QA Engineer
**Version:** 1.0
**Date:** 2026-03-27
**Sprint:** Sprint 1 — QA Foundation
**Issue:** #26

---

## Table of Contents

1. [Properties — CRUD Operations](#1-properties--crud-operations)
2. [Properties — Image Upload](#2-properties--image-upload)
3. [Properties — Status Transitions](#3-properties--status-transitions)
4. [Properties — Search & Filtering](#4-properties--search--filtering)
5. [Properties — Role-Based Access](#5-properties--role-based-access)
6. [Clients — CRUD Operations](#6-clients--crud-operations)
7. [Clients — Duplicate Detection](#7-clients--duplicate-detection)
8. [Clients — Agent Assignment](#8-clients--agent-assignment)
9. [Clients — Search, Filtering & History](#9-clients--search-filtering--history)

---

## Test Data Reference

| Entity | Field | Test Value |
|--------|-------|------------|
| Admin JWT | role | `crm-admin` |
| Manager JWT | role | `crm-manager` |
| Agent JWT | role | `crm-agent` |
| Valid property | title | "Nile View Apartment — Zamalek" |
| Valid property | type | `APARTMENT` |
| Valid property | price | `2500000.00` |
| Valid property | area | `180.50` |
| Valid property | address | "12 Hassan Sabry St" |
| Valid property | city | "Cairo" |
| Valid property | region | "Zamalek" |
| Valid client | firstName | "Ahmed" |
| Valid client | lastName | "Hassan" |
| Valid client | phone | "+201012345678" |
| Valid client | email | "ahmed.hassan@example.com" |
| Valid client | type | `BUYER` |
| Valid image | file | 2 MB JPEG, 1920x1080 |
| Oversized image | file | 15 MB PNG, 4000x3000 |

---

## 1. Properties — CRUD Operations

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| PROP-C01 | Create property with all required fields (admin) | Admin JWT valid | 1. `POST /api/properties` with title, type, price, area, address, city, region | `201 Created`; response contains generated UUID, all submitted fields, status = `AVAILABLE`, `createdAt` timestamp | title: "Nile View Apartment — Zamalek", type: APARTMENT, price: 2500000.00, area: 180.50, city: "Cairo", region: "Zamalek" |
| PROP-C02 | Create property with all optional fields (admin) | Admin JWT valid | 1. `POST /api/properties` with all required + description, bedrooms, bathrooms, floor, latitude, longitude, features | `201 Created`; all optional fields stored and returned correctly | bedrooms: 3, bathrooms: 2, floor: 5, latitude: 30.0561816, longitude: 31.2243296, features: ["pool","gym","parking"] |
| PROP-C03 | Create property (manager) | Manager JWT valid | 1. `POST /api/properties` with valid payload | `201 Created`; property created successfully | Same as PROP-C01 |
| PROP-C04 | Create property — missing title | Admin JWT valid | 1. `POST /api/properties` with payload omitting `title` | `400 Bad Request`; validation error mentions `title` is required | Omit title from valid payload |
| PROP-C05 | Create property — missing multiple required fields | Admin JWT valid | 1. `POST /api/properties` with only `title` | `400 Bad Request`; validation errors list all missing required fields (type, price, area, address, city, region) | Only title: "Test" |
| PROP-C06 | Create property — invalid type enum | Admin JWT valid | 1. `POST /api/properties` with `type: "CASTLE"` | `400 Bad Request`; invalid enum value error | type: "CASTLE" |
| PROP-C07 | Create property — negative price | Admin JWT valid | 1. `POST /api/properties` with `price: -100` | `400 Bad Request`; validation error on price | price: -100 |
| PROP-C08 | Get single property by ID | Admin JWT; property exists | 1. `GET /api/properties/:id` with valid UUID | `200 OK`; full property data with images array | Use UUID from PROP-C01 |
| PROP-C09 | Get property — non-existent ID | Admin JWT | 1. `GET /api/properties/00000000-0000-0000-0000-000000000000` | `404 Not Found` | Non-existent UUID |
| PROP-C10 | Get property — invalid UUID format | Admin JWT | 1. `GET /api/properties/not-a-uuid` | `400 Bad Request`; invalid UUID format error | "not-a-uuid" |
| PROP-C11 | Update property price (admin) | Admin JWT; property exists | 1. `PUT /api/properties/:id` with updated `price` | `200 OK`; price updated; other fields unchanged | price: 2750000.00 |
| PROP-C12 | Update property — partial update | Admin JWT; property exists | 1. `PUT /api/properties/:id` with only `description` | `200 OK`; description updated; all other fields preserved | description: "Renovated 2026" |
| PROP-C13 | Delete property (admin, no contracts) | Admin JWT; property exists with no contracts | 1. `DELETE /api/properties/:id` | `200 OK`; property status set to `OFF_MARKET` (soft delete) | Existing property UUID |
| PROP-C14 | Delete property — has linked contracts | Admin JWT; property has contracts | 1. `DELETE /api/properties/:id` | Error response; deletion blocked due to existing contracts | Property with active contract |
| PROP-C15 | Delete property — non-admin role | Agent JWT; property exists | 1. `DELETE /api/properties/:id` | `403 Forbidden` | Agent token + valid property UUID |

---

## 2. Properties — Image Upload

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| PROP-I01 | Upload single valid JPEG image | Admin JWT; property exists with no images | 1. `POST /api/properties/:id/images` with multipart form, 1 JPEG file (2 MB) | `201 Created`; image record returned with URL, thumbnail URL; image marked as `isPrimary: true` (first image) | 2 MB JPEG, 1920x1080 |
| PROP-I02 | Upload valid PNG image | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with 1 PNG file | `201 Created`; image processed and stored | 3 MB PNG, 1200x800 |
| PROP-I03 | Upload valid WebP image | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with 1 WebP file | `201 Created`; image processed and stored | 1 MB WebP, 800x600 |
| PROP-I04 | Upload multiple images (batch) | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with 5 image files | `201 Created`; all 5 images stored; first becomes primary if no prior images | 5 JPEG files, 1-3 MB each |
| PROP-I05 | Upload oversized image (>10 MB) | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with 15 MB file | `400 Bad Request` or `413 Payload Too Large`; file rejected | 15 MB PNG |
| PROP-I06 | Upload too many images (>10 files in one request) | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with 11 files | Error response; max 10 files per request exceeded | 11 small JPEG files |
| PROP-I07 | Upload invalid file type (PDF) | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with a PDF file | `400 Bad Request`; invalid MIME type error | 1 MB PDF file |
| PROP-I08 | Upload invalid file type (GIF) | Admin JWT; property exists | 1. `POST /api/properties/:id/images` with a GIF file | `400 Bad Request`; only image/jpeg, image/png, image/webp allowed | 500 KB GIF file |
| PROP-I09 | Set primary image | Admin JWT; property has multiple images | 1. `PATCH /api/properties/:id/images/:imageId/primary` | `200 OK`; selected image `isPrimary: true`; previous primary set to `false` | Second image UUID |
| PROP-I10 | Delete image — primary auto-reassignment | Admin JWT; property has 3 images, image 1 is primary | 1. `DELETE /api/properties/:id/images/:primaryImageId` | `200 OK`; primary image deleted; next image auto-promoted to primary | Primary image UUID |
| PROP-I11 | Delete last remaining image | Admin JWT; property has 1 image | 1. `DELETE /api/properties/:id/images/:imageId` | `200 OK`; image deleted; property has no images | Only image UUID |
| PROP-I12 | Agent uploads image to assigned property | Agent JWT; agent assigned to property | 1. `POST /api/properties/:id/images` with valid JPEG | `201 Created`; image uploaded successfully | Agent's assigned property |

---

## 3. Properties — Status Transitions

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| PROP-S01 | Transition AVAILABLE to RESERVED (admin) | Admin JWT; property status = AVAILABLE | 1. `PATCH /api/properties/:id/status` with `{ "status": "RESERVED" }` | `200 OK`; status updated to `RESERVED` | Property in AVAILABLE status |
| PROP-S02 | Transition AVAILABLE to SOLD (admin) | Admin JWT; property status = AVAILABLE | 1. `PATCH /api/properties/:id/status` with `{ "status": "SOLD" }` | `200 OK`; status = `SOLD` | Property in AVAILABLE status |
| PROP-S03 | Transition AVAILABLE to RENTED (manager) | Manager JWT; property status = AVAILABLE | 1. `PATCH /api/properties/:id/status` with `{ "status": "RENTED" }` | `200 OK`; status = `RENTED` | Property in AVAILABLE status |
| PROP-S04 | Transition AVAILABLE to OFF_MARKET | Admin JWT; property status = AVAILABLE | 1. `PATCH /api/properties/:id/status` with `{ "status": "OFF_MARKET" }` | `200 OK`; status = `OFF_MARKET` | Property in AVAILABLE status |
| PROP-S05 | Transition RESERVED back to AVAILABLE | Admin JWT; property status = RESERVED | 1. `PATCH /api/properties/:id/status` with `{ "status": "AVAILABLE" }` | `200 OK`; status = `AVAILABLE` | Property in RESERVED status |
| PROP-S06 | Transition OFF_MARKET back to AVAILABLE | Admin JWT; property status = OFF_MARKET | 1. `PATCH /api/properties/:id/status` with `{ "status": "AVAILABLE" }` | `200 OK`; status = `AVAILABLE` | Property in OFF_MARKET status |
| PROP-S07 | Status change with invalid enum value | Admin JWT; property exists | 1. `PATCH /api/properties/:id/status` with `{ "status": "DEMOLISHED" }` | `400 Bad Request`; invalid status value | status: "DEMOLISHED" |
| PROP-S08 | Agent cannot change property status | Agent JWT; property assigned to agent | 1. `PATCH /api/properties/:id/status` with `{ "status": "RESERVED" }` | `403 Forbidden` | Agent token + valid property |
| PROP-S09 | Auto-transition to SOLD on sale contract creation | Admin JWT; property AVAILABLE; client exists | 1. `POST /api/contracts` with type=SALE, propertyId, clientId | `201 Created`; property status auto-updated to `SOLD` | Contract type: SALE |
| PROP-S10 | Auto-transition to RENTED on rent contract creation | Admin JWT; property AVAILABLE; client exists | 1. `POST /api/contracts` with type=RENT, propertyId, clientId | `201 Created`; property status auto-updated to `RENTED` | Contract type: RENT |
| PROP-S11 | Contract cancellation restores AVAILABLE status | Admin JWT; property SOLD via contract | 1. Cancel the associated contract | Property status reverts to `AVAILABLE` | Existing contract UUID |
| PROP-S12 | Cannot create contract for non-AVAILABLE property | Admin JWT; property status = SOLD | 1. `POST /api/contracts` referencing this property | Error response; property must be AVAILABLE to create contract | SOLD property UUID |

---

## 4. Properties — Search & Filtering

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| PROP-F01 | Filter by property type | Admin JWT; properties of various types exist | 1. `GET /api/properties?type=VILLA` | `200 OK`; all returned properties have `type = VILLA`; pagination meta correct | type=VILLA |
| PROP-F02 | Filter by status | Admin JWT; properties in various statuses | 1. `GET /api/properties?status=AVAILABLE` | All returned properties have `status = AVAILABLE` | status=AVAILABLE |
| PROP-F03 | Filter by city (case-insensitive) | Admin JWT; properties in Cairo and Alexandria | 1. `GET /api/properties?city=cairo` | Returns properties with city "Cairo" (case-insensitive match) | city=cairo |
| PROP-F04 | Filter by price range | Admin JWT; properties with varied prices | 1. `GET /api/properties?minPrice=1000000&maxPrice=3000000` | All returned properties have price between 1M and 3M EGP | minPrice=1000000, maxPrice=3000000 |
| PROP-F05 | Filter by area range | Admin JWT; properties with varied areas | 1. `GET /api/properties?minArea=100&maxArea=200` | All returned properties have area between 100 and 200 sqm | minArea=100, maxArea=200 |
| PROP-F06 | Filter by minimum bedrooms | Admin JWT | 1. `GET /api/properties?bedrooms=3` | All returned properties have bedrooms >= 3 | bedrooms=3 |
| PROP-F07 | Full-text search across title | Admin JWT; property with "Nile View" in title | 1. `GET /api/properties?search=Nile` | Results include property with "Nile View" in title | search=Nile |
| PROP-F08 | Full-text search via /search endpoint | Admin JWT | 1. `GET /api/properties/search?q=Zamalek` | Results ranked by relevance; cursor pagination metadata present | q=Zamalek |
| PROP-F09 | Combined filters | Admin JWT | 1. `GET /api/properties?type=APARTMENT&city=Cairo&minPrice=1000000&status=AVAILABLE` | Returns only AVAILABLE APARTMENTs in Cairo with price >= 1M | Multiple filters |
| PROP-F10 | Pagination — page and limit | Admin JWT; >= 25 properties | 1. `GET /api/properties?page=2&limit=10` | `200 OK`; exactly 10 items (or fewer on last page); `page=2`, `totalPages` correct | page=2, limit=10 |
| PROP-F11 | Pagination — limit exceeds max (>100) | Admin JWT | 1. `GET /api/properties?limit=200` | Limit capped at 100 or `400 Bad Request` | limit=200 |
| PROP-F12 | Sort by price ascending | Admin JWT | 1. `GET /api/properties?sortBy=price&sortOrder=asc` | Properties returned in ascending price order | sortBy=price, sortOrder=asc |
| PROP-F13 | Sort by creation date descending (default) | Admin JWT | 1. `GET /api/properties` (no sort params) | Properties ordered by `createdAt` descending (newest first) | Default sort |
| PROP-F14 | Search with no results | Admin JWT | 1. `GET /api/properties?search=xyznonexistent999` | `200 OK`; empty `data` array; `total = 0` | search=xyznonexistent999 |
| PROP-F15 | Property stats endpoint | Admin JWT | 1. `GET /api/properties/stats` | `200 OK`; response contains `total`, `byType`, `byStatus`, `byCity` aggregations | N/A |

---

## 5. Properties — Role-Based Access

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| PROP-R01 | Admin sees all properties | Admin JWT; 10+ properties, some assigned to various agents | 1. `GET /api/properties` | All properties returned regardless of assignment | Admin token |
| PROP-R02 | Manager sees all properties | Manager JWT; 10+ properties exist | 1. `GET /api/properties` | All properties returned | Manager token |
| PROP-R03 | Agent sees only assigned properties | Agent JWT; 3 assigned + 7 unassigned properties | 1. `GET /api/properties` | Only 3 assigned properties returned | Agent token |
| PROP-R04 | Assign property to agent (admin) | Admin JWT; property and agent user exist | 1. `PATCH /api/properties/:id/assign` with `{ "agentId": "<agent-uuid>" }` | `200 OK`; `assignedAgentId` updated | Valid agent UUID |
| PROP-R05 | Assign property to agent (manager) | Manager JWT; property and agent user exist | 1. `PATCH /api/properties/:id/assign` with `{ "agentId": "<agent-uuid>" }` | `200 OK`; assignment successful | Valid agent UUID |
| PROP-R06 | Agent cannot assign property | Agent JWT | 1. `PATCH /api/properties/:id/assign` with agentId | `403 Forbidden` | Agent token |
| PROP-R07 | Agent stats — scoped to own properties | Agent JWT; agent has 3 assigned properties | 1. `GET /api/properties/stats` | Stats reflect only the 3 assigned properties | Agent token |

---

## 6. Clients — CRUD Operations

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| CLI-C01 | Create client with required fields | Admin JWT | 1. `POST /api/clients` with firstName, lastName, phone, type | `201 Created`; client returned with UUID, submitted fields, source = `OTHER` (default) | firstName: "Ahmed", lastName: "Hassan", phone: "+201012345678", type: BUYER |
| CLI-C02 | Create client with all fields | Admin JWT | 1. `POST /api/clients` with all required + email, nationalId, source, notes | `201 Created`; all fields stored correctly | email: "ahmed@example.com", nationalId: "29001011234567", source: REFERRAL, notes: "VIP client" |
| CLI-C03 | Create client — missing firstName | Admin JWT | 1. `POST /api/clients` omitting `firstName` | `400 Bad Request`; validation error on firstName | Omit firstName |
| CLI-C04 | Create client — invalid phone format | Admin JWT | 1. `POST /api/clients` with `phone: "abc123"` | `400 Bad Request`; phone validation error (must match `/^\+?[0-9]{10,15}$/`) | phone: "abc123" |
| CLI-C05 | Create client — phone too short | Admin JWT | 1. `POST /api/clients` with `phone: "12345"` | `400 Bad Request`; phone must be 10-15 digits | phone: "12345" |
| CLI-C06 | Create client — invalid email format | Admin JWT | 1. `POST /api/clients` with `email: "not-an-email"` | `400 Bad Request`; invalid email format | email: "not-an-email" |
| CLI-C07 | Create client — invalid type enum | Admin JWT | 1. `POST /api/clients` with `type: "BROKER"` | `400 Bad Request`; invalid enum value | type: "BROKER" |
| CLI-C08 | Create client with each valid type | Admin JWT | 1. Create 5 clients with types: BUYER, SELLER, TENANT, LANDLORD, INVESTOR | All `201 Created`; correct type stored for each | All 5 ClientType values |
| CLI-C09 | Get single client by ID | Admin JWT; client exists | 1. `GET /api/clients/:id` | `200 OK`; client data with latest leads/contracts counts | Valid client UUID |
| CLI-C10 | Get client — not found | Admin JWT | 1. `GET /api/clients/00000000-0000-0000-0000-000000000000` | `404 Not Found` | Non-existent UUID |
| CLI-C11 | Update client notes | Admin JWT; client exists | 1. `PUT /api/clients/:id` with `{ "notes": "Updated VIP notes" }` | `200 OK`; notes updated; other fields unchanged | notes: "Updated VIP notes" |
| CLI-C12 | Update client email | Admin JWT; client exists | 1. `PUT /api/clients/:id` with new unique email | `200 OK`; email updated | email: "newemail@example.com" |
| CLI-C13 | Delete client (admin, no contracts) | Admin JWT; client has no contracts | 1. `DELETE /api/clients/:id` | `200 OK`; client hard-deleted; subsequent GET returns 404 | Client UUID with no contracts |
| CLI-C14 | Delete client with linked contracts | Admin JWT; client has contracts | 1. `DELETE /api/clients/:id` | `400 Bad Request`; "Cannot delete client: N contract(s) are linked to this client" | Client UUID with contracts |
| CLI-C15 | Non-admin cannot delete client | Manager JWT; client exists | 1. `DELETE /api/clients/:id` | `403 Forbidden` | Manager token |

---

## 7. Clients — Duplicate Detection

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| CLI-D01 | Duplicate email on create | Admin JWT; client with email "ahmed@example.com" exists | 1. `POST /api/clients` with same email `ahmed@example.com` | `409 Conflict`; "A client with email 'ahmed@example.com' already exists" | email: "ahmed@example.com" |
| CLI-D02 | Duplicate phone on create | Admin JWT; client with phone "+201012345678" exists | 1. `POST /api/clients` with same phone | `409 Conflict`; "A client with phone '+201012345678' already exists" | phone: "+201012345678" |
| CLI-D03 | Duplicate email on update | Admin JWT; client A has email A, client B has email B | 1. `PUT /api/clients/:clientA` with email = client B's email | `409 Conflict`; duplicate email error | Client A UUID + Client B's email |
| CLI-D04 | Duplicate phone on update | Admin JWT; client A has phone A, client B has phone B | 1. `PUT /api/clients/:clientA` with phone = client B's phone | `409 Conflict`; duplicate phone error | Client A UUID + Client B's phone |
| CLI-D05 | Update own email to same value (no false positive) | Admin JWT; client exists with email X | 1. `PUT /api/clients/:id` with same email X | `200 OK`; no conflict (excludes own ID from duplicate check) | Same client UUID + same email |
| CLI-D06 | Create client without email (no duplicate check) | Admin JWT | 1. `POST /api/clients` with phone only, no email | `201 Created`; no duplicate email check triggered | Omit email field |

---

## 8. Clients — Agent Assignment

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| CLI-A01 | Assign client to agent (admin) | Admin JWT; client and agent user exist | 1. `PATCH /api/clients/:id/assign` with `{ "agentId": "<agent-uuid>" }` | `200 OK`; `assignedAgentId` updated to agent UUID | Valid agent UUID (role=agent) |
| CLI-A02 | Assign client to agent (manager) | Manager JWT; client and agent user exist | 1. `PATCH /api/clients/:id/assign` with agentId | `200 OK`; assignment successful | Manager token + agent UUID |
| CLI-A03 | Cannot assign admin user as agent | Admin JWT; target user has admin role | 1. `PATCH /api/clients/:id/assign` with admin user's UUID | Error; "Cannot assign an ADMIN user as an agent" | Admin user UUID as agentId |
| CLI-A04 | Agent cannot assign client | Agent JWT | 1. `PATCH /api/clients/:id/assign` with any agentId | `403 Forbidden` | Agent token |
| CLI-A05 | Remove agent assignment (set null) | Admin JWT; client currently assigned | 1. `PATCH /api/clients/:id/assign` with `{ "agentId": null }` | `200 OK`; `assignedAgentId` set to null; client unassigned | agentId: null |
| CLI-A06 | Agent sees only assigned clients | Agent JWT; 2 assigned + 5 unassigned clients | 1. `GET /api/clients` with agent token | Only 2 assigned clients returned; total = 2 | Agent token |
| CLI-A07 | Admin sees all clients regardless of assignment | Admin JWT; mix of assigned/unassigned clients | 1. `GET /api/clients` | All clients returned | Admin token |

---

## 9. Clients — Search, Filtering & History

| ID | Title | Preconditions | Steps | Expected Result | Test Data |
|----|-------|---------------|-------|-----------------|-----------|
| CLI-F01 | Filter by client type | Admin JWT; clients of various types | 1. `GET /api/clients?type=BUYER` | All returned clients have `type = BUYER` | type=BUYER |
| CLI-F02 | Filter by source | Admin JWT; clients from various sources | 1. `GET /api/clients?source=REFERRAL` | All returned clients have `source = REFERRAL` | source=REFERRAL |
| CLI-F03 | Filter by assigned agent | Admin JWT; agent with assigned clients | 1. `GET /api/clients?assignedAgentId=<agent-uuid>` | Only clients assigned to that agent returned | Valid agent UUID |
| CLI-F04 | Search by first name (case-insensitive) | Admin JWT; client "Ahmed" exists | 1. `GET /api/clients?search=ahmed` | Results include client with firstName "Ahmed" | search=ahmed |
| CLI-F05 | Search by phone number | Admin JWT; client with phone "+201012345678" | 1. `GET /api/clients?search=%2B201012345678` | Results include matching client | search=+201012345678 |
| CLI-F06 | Search by email | Admin JWT; client with email exists | 1. `GET /api/clients?search=ahmed@example` | Results include matching client | search=ahmed@example |
| CLI-F07 | Sort by firstName ascending | Admin JWT | 1. `GET /api/clients?sortBy=firstName&sortOrder=asc` | Clients sorted alphabetically by first name A-Z | sortBy=firstName, sortOrder=asc |
| CLI-F08 | Pagination | Admin JWT; >= 25 clients | 1. `GET /api/clients?page=1&limit=10` then `?page=2&limit=10` | Page 1: 10 items; Page 2: next 10 items; no overlap; correct `totalPages` | page=1/2, limit=10 |
| CLI-F09 | Client history — leads and contracts | Admin JWT; client has leads and contracts | 1. `GET /api/clients/:id/history` | Response contains `leads` array (ordered desc) and `contracts` array (ordered desc, includes invoices) | Client UUID with history |
| CLI-F10 | Client stats endpoint | Admin JWT | 1. `GET /api/clients/stats` | `200 OK`; response contains `total`, `byType`, `bySource` aggregations | N/A |
| CLI-F11 | Search with no results | Admin JWT | 1. `GET /api/clients?search=zzzznonexistent` | `200 OK`; empty `data` array; `total = 0` | search=zzzznonexistent |

---

## Summary

| Section | Count |
|---------|-------|
| Properties — CRUD | 15 |
| Properties — Image Upload | 12 |
| Properties — Status Transitions | 12 |
| Properties — Search & Filtering | 15 |
| Properties — Role-Based Access | 7 |
| Clients — CRUD | 15 |
| Clients — Duplicate Detection | 6 |
| Clients — Agent Assignment | 7 |
| Clients — Search, Filtering & History | 11 |
| **Total** | **100** |

---

*Prepared by Nour Khalil — QA Functional Lead | Real Estate CRM Sprint 1*
