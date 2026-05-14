# API Reference

All endpoints are prefixed with `/api` and require a Bearer JWT token from Authme unless marked as **Public**.

Interactive documentation is available at `http://localhost:3000/api/docs` (Swagger UI).

## Authentication

All protected endpoints require the `Authorization: Bearer <token>` header. Tokens are issued by the Authme IAM server.

### Roles

| Role | Scope |
|------|-------|
| `admin` | Full system access |
| `manager` | Branch/team management, same as admin except settings |
| `agent` | Own assigned resources only |

---

## Properties

Base path: `/api/properties`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/properties` | admin, manager | Create a new property |
| `GET` | `/api/properties` | Any | List properties with filters and pagination. Agents see only assigned properties |
| `GET` | `/api/properties/search` | Any | Full-text search using PostgreSQL tsvector. Query params: `q`, `cursor`, `take` |
| `GET` | `/api/properties/stats` | Any | Get property statistics (counts by status/type) |
| `GET` | `/api/properties/:id` | Any | Get property by ID with images |
| `PUT` | `/api/properties/:id` | Any | Update a property |
| `DELETE` | `/api/properties/:id` | admin | Soft-delete (sets status to OFF_MARKET) |
| `PATCH` | `/api/properties/:id/status` | admin, manager | Change property status |
| `PATCH` | `/api/properties/:id/assign` | admin, manager | Assign property to an agent |

### Property Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/properties/:id/images` | admin, manager, agent | Upload images (multipart, max 10 files) |
| `DELETE` | `/api/properties/:id/images/:imageId` | admin, manager, agent | Delete a property image |
| `PATCH` | `/api/properties/:id/images/:imageId/primary` | admin, manager, agent | Set image as primary |

### Property PDF

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/properties/:id/pdf` | Any | Download property listing as PDF |

---

## Clients

Base path: `/api/clients`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/clients` | Any | Create a new client. Returns 409 on duplicate email/phone |
| `GET` | `/api/clients` | Any | List clients with filters and pagination. Agents see only assigned clients |
| `GET` | `/api/clients/stats` | Any | Get client statistics |
| `GET` | `/api/clients/:id` | Any | Get client by ID with leads and contracts |
| `PUT` | `/api/clients/:id` | Any | Update a client |
| `DELETE` | `/api/clients/:id` | admin | Delete a client |
| `PATCH` | `/api/clients/:id/assign` | admin, manager | Assign client to an agent |
| `GET` | `/api/clients/:id/history` | Any | Get client interaction history (leads + contracts) |

---

## Leads

Base path: `/api/leads`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/leads` | Any | Create a new lead |
| `GET` | `/api/leads` | Any | List leads with filters and pagination. Agents see only assigned leads |
| `GET` | `/api/leads/pipeline` | Any | Get leads grouped by status for kanban view |
| `GET` | `/api/leads/stats` | Any | Get lead statistics |
| `GET` | `/api/leads/:id` | Any | Get lead by ID with client, property, and recent activities |
| `PUT` | `/api/leads/:id` | Any | Update a lead |
| `DELETE` | `/api/leads/:id` | admin | Soft-delete (marks as LOST) |
| `PATCH` | `/api/leads/:id/status` | Any | Change lead status (validates allowed transitions) |
| `PATCH` | `/api/leads/:id/assign` | admin, manager | Assign lead to an agent |
| `POST` | `/api/leads/:id/activities` | Any | Add an activity to a lead (call, email, meeting, etc.) |
| `GET` | `/api/leads/:id/activities` | Any | Get paginated activities for a lead. Query params: `page`, `limit` |

### Lead Status Transitions

```
NEW --> CONTACTED --> QUALIFIED --> PROPOSAL --> NEGOTIATION --> WON
                                                            --> LOST
```

Any status can also transition to `LOST`.

---

## Contracts

Base path: `/api/contracts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/contracts` | admin, manager | Create a new contract |
| `GET` | `/api/contracts` | Any | List contracts with filters and pagination |
| `GET` | `/api/contracts/stats` | Any | Get contract statistics |
| `GET` | `/api/contracts/expiring` | Any | Get contracts expiring in next N days. Query: `days` (default 30) |
| `GET` | `/api/contracts/:id` | Any | Get contract by ID with property, client, and invoices |
| `PUT` | `/api/contracts/:id` | admin, manager | Update a contract |
| `PATCH` | `/api/contracts/:id/status` | admin, manager | Change contract status |
| `GET` | `/api/contracts/:id/invoices` | Any | List invoices for a contract |
| `POST` | `/api/contracts/:id/generate-invoices` | admin, manager | Auto-generate invoices from payment terms |

### Contract Documents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/contracts/:id/documents` | admin, manager | Upload contract document (single file) |

### Contract PDF

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/contracts/:id/pdf` | Any | Download contract as PDF |

---

## Invoices

Base path: `/api/invoices`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/invoices` | admin, manager | Create a new invoice for a contract |
| `GET` | `/api/invoices` | Any | List invoices with filters and pagination |
| `GET` | `/api/invoices/stats` | admin, manager | Get payment statistics (total due, collected, overdue) |
| `GET` | `/api/invoices/overdue` | Any | List all overdue invoices |
| `GET` | `/api/invoices/upcoming` | Any | List invoices due in next N days. Query: `days` (default 30) |
| `GET` | `/api/invoices/:id` | Any | Get invoice by ID with contract details |
| `PUT` | `/api/invoices/:id` | admin, manager | Update an invoice (amount, due date, notes) |
| `PATCH` | `/api/invoices/:id/pay` | admin, manager | Record a payment for an invoice |
| `PATCH` | `/api/invoices/:id/cancel` | admin, manager | Cancel an invoice |

### Invoice PDF

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/invoices/:id/pdf` | Any | Download invoice as PDF |

---

## Dashboard

Base path: `/api/dashboard`

### Admin Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/dashboard/admin/overview` | admin, manager | Totals and period statistics (cached 60s) |
| `GET` | `/api/dashboard/admin/revenue` | admin, manager | Revenue over time with period comparison (cached 120s) |
| `GET` | `/api/dashboard/admin/leads` | admin, manager | Lead pipeline summary (cached 60s) |
| `GET` | `/api/dashboard/admin/properties` | admin, manager | Properties breakdown by status and type (cached 120s) |
| `GET` | `/api/dashboard/admin/agents` | admin, manager | Agent performance -- leads won and revenue (cached 60s) |
| `GET` | `/api/dashboard/admin/recent` | admin, manager | Recent activities feed |

All admin dashboard endpoints accept optional `dateFrom` and `dateTo` query parameters.

### Agent Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/dashboard/agent/overview` | Any | My properties, clients, leads, tasks |
| `GET` | `/api/dashboard/agent/leads` | Any | My lead pipeline |
| `GET` | `/api/dashboard/agent/follow-ups` | Any | Upcoming and overdue follow-ups |
| `GET` | `/api/dashboard/agent/performance` | Any | This month vs last month comparison |

---

## Activities (Audit Trail)

Base path: `/api/activities`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/activities` | Any | List all activities with filters and pagination |
| `GET` | `/api/activities/recent` | Any | Get recent activities. Query: `limit` (default 20) |
| `GET` | `/api/activities/entity/:type/:id` | Any | Get activities for a specific entity. Types: `PROPERTY`, `CLIENT`, `LEAD`, `CONTRACT`, `INVOICE` |
| `GET` | `/api/activities/user/:userId` | Any | Get activities performed by a user |
| `GET` | `/api/activities/purge/:days` | admin | Purge activities older than N days |

---

## Email

Base path: `/api/email`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/email/logs` | admin, manager | List email logs with filters and pagination |
| `GET` | `/api/email/logs/:id` | admin, manager | Get a single email log by ID |
| `POST` | `/api/email/send` | admin | Send a custom email |
| `GET` | `/api/email/preferences` | Any | Get current user's email preferences |
| `PATCH` | `/api/email/preferences` | Any | Update current user's email preferences |
| `POST` | `/api/email/retry/:id` | admin | Retry sending a failed email |

---

## Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/reports/generate-pdf` | admin, manager | Generate a report PDF (monthly revenue or agent performance) |

---

## File Serving

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/uploads/:type/:filename` | **Public** | Serve an uploaded file. Types: `images`, `thumbnails`, `documents` |

---

## Common Query Parameters

### Pagination

Most list endpoints support:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

### Response Format

Paginated responses follow this structure:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Error Responses

```json
{
  "statusCode": 404,
  "message": "Property with ID \"...\" not found",
  "error": "Not Found"
}
```

Common HTTP status codes:
- `200` -- Success
- `201` -- Created
- `400` -- Validation error or invalid operation
- `401` -- Missing or invalid JWT token
- `403` -- Insufficient role permissions
- `404` -- Resource not found
- `409` -- Conflict (duplicate entry)
