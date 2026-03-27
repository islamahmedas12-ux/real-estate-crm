# Authme IAM Setup Guide

This document describes the steps required to configure the Authme (Keycloak-compatible)
IAM server so that the Real Estate CRM backend can authenticate users via JWT.

---

## 1. Realm Setup

1. Log in to the Authme admin console.
2. Create a new realm (or use an existing one) — the realm name must match the
   `AUTHME_REALM` environment variable (e.g. `real-estate-crm`).
3. Set **Access Token Lifespan** to a suitable value (e.g. `15 minutes`).
4. Enable **Standard Flow** and **Direct Access Grants** as required.

---

## 2. Client Configuration

Create a **backend/confidential** client for the CRM API:

| Field | Value |
|---|---|
| Client ID | Value of `AUTHME_CLIENT_ID` env var (e.g. `crm-api`) |
| Client Protocol | `openid-connect` |
| Access Type | `confidential` |
| Service Account | Enabled (for token introspection if needed) |
| Valid Redirect URIs | `*` (restrict in production) |

Copy the **client secret** to the `AUTHME_CLIENT_SECRET` environment variable.

### Portal clients (public)

Create two additional public clients — one for each frontend portal:

| Client ID | Valid Redirect URIs | Web Origins |
|---|---|---|
| `crm-admin-portal` | Value of `ADMIN_PORTAL_URL` + `/*` | Value of `ADMIN_PORTAL_URL` |
| `crm-agent-portal` | Value of `AGENT_PORTAL_URL` + `/*` | Value of `AGENT_PORTAL_URL` |

---

## 3. Realm Roles

Create the following **realm-level** roles:

| Role Name | Description |
|---|---|
| `crm-admin` | Full system access — maps to `UserRole.ADMIN` |
| `crm-manager` | Branch/team manager access — maps to `UserRole.MANAGER` |
| `crm-agent` | Field agent access — maps to `UserRole.AGENT` |

The JWT strategy in `src/auth/strategies/jwt.strategy.ts` reads `realm_access.roles`
from the token and maps them to the application `UserRole` enum using the following
priority order: `crm-admin` > `crm-manager` > `crm-agent` > default `AGENT`.

---

## 4. Assigning Roles to Users

1. Navigate to **Users** in the realm.
2. Select a user → **Role Mappings** tab.
3. Under **Realm Roles**, assign exactly one of `crm-admin`, `crm-manager`, or `crm-agent`.

---

## 5. Token Mapper — expose roles in `realm_access`

Authme/Keycloak includes `realm_access.roles` in the token by default.  If roles are
absent, add a protocol mapper:

1. Go to the client → **Mappers** tab → **Add Mapper** → **User Realm Role**.
2. Set **Token Claim Name** to `realm_access.roles`.
3. Set **Claim JSON Type** to `String`.
4. Enable **Add to access token**.

---

## 6. Environment Variables

Set the following variables in `.env` (or your deployment secrets manager):

```dotenv
# Authme IAM
AUTHME_URL=https://authme.example.com          # base URL, no trailing slash
AUTHME_REALM=real-estate-crm                   # realm name
AUTHME_CLIENT_ID=crm-api                       # API client ID
AUTHME_CLIENT_SECRET=<secret>                  # API client secret

# Portal URLs (used for CORS)
ADMIN_PORTAL_URL=https://admin.crm.example.com
AGENT_PORTAL_URL=https://agent.crm.example.com
```

The JWKS endpoint is automatically derived as:
```
{AUTHME_URL}/realms/{AUTHME_REALM}/protocol/openid-connect/certs
```

---

## 7. How Authentication Works

1. The user logs in via the admin/agent portal using the Authme OIDC flow.
2. The portal receives an **access token** (JWT) from Authme.
3. The portal includes the token in every API request as `Authorization: Bearer <token>`.
4. The NestJS backend validates the token against the JWKS endpoint.
5. On validation success, `AuthService.syncUser()` upserts the user record in the
   local PostgreSQL database (creating it on first login, updating name/role/lastLoginAt
   on subsequent requests).
6. The `request.user` object is populated with the `AuthenticatedUser` shape and is
   available in all controllers via the `@CurrentUser()` decorator.

---

## 8. Role-Based Access Control

Routes can be restricted to specific roles using the `@Roles()` decorator:

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Delete(':id')
remove(@Param('id') id: string) { ... }
```

The `RolesGuard` is registered globally but does not restrict routes unless
`@Roles()` metadata is present.

---

## 9. Public Routes

Routes that should be accessible without authentication must be decorated with `@Public()`:

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Get('health')
health() { return { status: 'ok' }; }
```

The Swagger UI at `/api/docs` is served without authentication by default (the Swagger
setup endpoint is not part of the NestJS routing layer and bypasses the guard).
