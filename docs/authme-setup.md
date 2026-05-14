# Authme IAM Setup Guide

This document describes how to deploy and configure the Authme (Keycloak-compatible)
IAM server for the Real Estate CRM across all environments.

---

## 1. Deploy AuthMe with Docker

AuthMe is included in the dev compose file (`docker-compose.dev-full.yml`).
To run it standalone:

```bash
docker run -d \
  --name authme \
  -p 3001:3001 \
  -e DB_HOST=localhost \
  -e DB_PORT=5432 \
  -e DB_USER=authme \
  -e DB_PASSWORD=authme \
  -e DB_NAME=authme \
  islamawad/authme
```

AuthMe admin console: `http://localhost:3001/admin`

For production, use a managed PostgreSQL instance and set strong credentials.

---

## 2. Realm Setup

Create a realm per environment. The realm name must match `AUTHME_REALM` in `.env`.

| Environment | Realm Name        | Access Token Lifespan |
|-------------|-------------------|-----------------------|
| dev         | `real-estate-dev` | 30 minutes            |
| qa          | `real-estate-qa`  | 15 minutes            |
| uat         | `real-estate-uat` | 15 minutes            |
| prod        | `real-estate`     | 15 minutes            |

Steps:
1. Log in to the Authme admin console.
2. Click **Create Realm**.
3. Set the realm name from the table above.
4. Under **Tokens**, set **Access Token Lifespan** accordingly.
5. Enable **Standard Flow** and **Direct Access Grants**.

---

## 3. Realm Roles

Create the following **realm-level** roles:

| Role Name     | Description                                        | Maps to           |
|---------------|----------------------------------------------------|--------------------|
| `crm-admin`   | Full system access                                 | `UserRole.ADMIN`   |
| `crm-manager` | Branch/team manager — manage agents, view reports  | `UserRole.MANAGER` |
| `crm-agent`   | Field agent — own leads, clients, properties only  | `UserRole.AGENT`   |

The JWT strategy in `src/auth/strategies/jwt.strategy.ts` reads `realm_access.roles`
from the token and maps using priority: `crm-admin` > `crm-manager` > `crm-agent` > default `AGENT`.

---

## 4. Client Configuration

Create four OAuth2/OIDC clients in each realm:

### 4.1 admin-portal (Public)

| Field              | Value                                 |
|--------------------|---------------------------------------|
| Client ID          | `admin-portal`                        |
| Client Protocol    | `openid-connect`                      |
| Access Type        | Public                                |
| Standard Flow      | Enabled                               |
| Valid Redirect URIs| See [Redirect URIs table](#5-redirect-uris-per-environment) |
| Web Origins (CORS) | See [CORS table](#6-cors-configuration-per-environment)     |

### 4.2 agent-portal (Public)

| Field              | Value                                 |
|--------------------|---------------------------------------|
| Client ID          | `agent-portal`                        |
| Client Protocol    | `openid-connect`                      |
| Access Type        | Public                                |
| Standard Flow      | Enabled                               |
| Valid Redirect URIs| See [Redirect URIs table](#5-redirect-uris-per-environment) |
| Web Origins (CORS) | See [CORS table](#6-cors-configuration-per-environment)     |

### 4.3 mobile (Public)

| Field              | Value                                 |
|--------------------|---------------------------------------|
| Client ID          | `mobile`                              |
| Client Protocol    | `openid-connect`                      |
| Access Type        | Public                                |
| Standard Flow      | Enabled                               |
| Valid Redirect URIs| `com.realestatecrm.app://callback`    |

### 4.4 crm-backend (Confidential)

| Field              | Value                                 |
|--------------------|---------------------------------------|
| Client ID          | `crm-backend`                         |
| Client Protocol    | `openid-connect`                      |
| Access Type        | Confidential                          |
| Service Account    | Enabled                               |
| Direct Access      | Enabled (for testing/dev)             |

After creation, go to **Credentials** tab to copy the client secret → set as `AUTHME_CLIENT_SECRET`.

---

## 5. Redirect URIs per Environment

### admin-portal

| Environment | Valid Redirect URIs                          |
|-------------|----------------------------------------------|
| dev         | `http://localhost:5173/*`                    |
| qa          | `https://qa.realstate-crm.homes/admin/*`     |
| uat         | `https://uat.realstate-crm.homes/admin/*`    |
| prod        | `https://realstate-crm.homes/admin/*`        |

### agent-portal

| Environment | Valid Redirect URIs                          |
|-------------|----------------------------------------------|
| dev         | `http://localhost:5174/*`                    |
| qa          | `https://qa.realstate-crm.homes/agent/*`     |
| uat         | `https://uat.realstate-crm.homes/agent/*`    |
| prod        | `https://realstate-crm.homes/agent/*`        |

### mobile

All environments: `com.realestatecrm.app://callback`

---

## 6. CORS Configuration per Environment

| Environment | Web Origins                                            |
|-------------|--------------------------------------------------------|
| dev         | `http://localhost:5173`, `http://localhost:5174`        |
| qa          | `https://qa.realstate-crm.homes`                       |
| uat         | `https://uat.realstate-crm.homes`                      |
| prod        | `https://realstate-crm.homes`                          |

---

## 7. How to Get Client Secrets from AuthMe Admin Console

1. Log in to the AuthMe admin console (`http://localhost:3001/admin`)
2. Select the target realm (e.g., `real-estate-dev`)
3. Navigate to **Clients** → click `crm-backend`
4. Click the **Credentials** tab
5. Copy the **Client Secret** value
6. Set it in `.env`:
   ```
   AUTHME_CLIENT_SECRET=<paste-secret-here>
   ```

---

## 8. Assigning Roles to Users

1. Navigate to **Users** in the realm.
2. Select a user → **Role Mappings** tab.
3. Under **Realm Roles**, assign exactly one of `crm-admin`, `crm-manager`, or `crm-agent`.

---

## 9. Token Mapper — expose roles in `realm_access`

Authme/Keycloak includes `realm_access.roles` in the token by default. If roles are
absent from tokens, add a protocol mapper:

1. Go to the client → **Mappers** tab → **Add Mapper** → **User Realm Role**.
2. Set **Token Claim Name** to `realm_access.roles`.
3. Set **Claim JSON Type** to `String`.
4. Enable **Add to access token**.

---

## 10. Environment Variables

Set these in `.env` (or your deployment secrets manager):

| Variable               | Description                      | Dev Value                       |
|------------------------|----------------------------------|---------------------------------|
| `AUTHME_URL`           | AuthMe server base URL           | `http://authme:3001`            |
| `AUTHME_REALM`         | Realm name                       | `real-estate-dev`               |
| `AUTHME_CLIENT_ID`     | Backend client ID                | `crm-backend`                   |
| `AUTHME_CLIENT_SECRET` | Backend client secret            | (from AuthMe admin console)     |
| `ADMIN_PORTAL_URL`     | Admin UI URL (for CORS)          | `http://localhost:5173`         |
| `AGENT_PORTAL_URL`     | Agent UI URL (for CORS)          | `http://localhost:5174`         |

The JWKS endpoint is automatically derived:
```
{AUTHME_URL}/realms/{AUTHME_REALM}/protocol/openid-connect/certs
```

---

## 11. How Authentication Works

1. The user logs in via the admin/agent portal using the Authme OIDC flow.
2. The portal receives an **access token** (JWT) from Authme.
3. The portal includes the token in every API request as `Authorization: Bearer <token>`.
4. The NestJS backend validates the token against the JWKS endpoint (RS256, no static secret).
5. On validation success, `AuthService.syncUser()` upserts the user record in the
   local PostgreSQL database (creating on first login, updating name/role/lastLoginAt).
6. `request.user` is populated with `AuthenticatedUser` — available via `@CurrentUser()`.

---

## 12. Role-Based Access Control

Routes can be restricted to specific roles using the `@Roles()` decorator:

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Roles(UserRole.ADMIN, UserRole.MANAGER)
@Delete(':id')
remove(@Param('id') id: string) { ... }
```

The `RolesGuard` is registered globally but only restricts routes with `@Roles()` metadata.

---

## 13. Public Routes

Routes accessible without authentication use `@Public()`:

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Get('health')
health() { return { status: 'ok' }; }
```

---

## 14. Testing Auth Locally

Get a test token using Resource Owner Password flow (dev only):

```bash
curl -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=testuser@example.com" \
  -d "password=testpassword"
```

Use the returned `access_token`:

```bash
curl -H "Authorization: Bearer <access_token>" http://localhost:3000/api/health
```
