# AuthMe Realm Setup — Dev Environment

**Setup Date:** 2026-03-27  
**Setup By:** Adam Hassan (Security & AuthMe Specialist)  
**AuthMe Instance:** https://dev-auth.realstate-crm.homes  
**Console:** https://dev-auth.realstate-crm.homes/console  

---

## Realm: `real-estate-dev`

| Field        | Value                    |
|--------------|--------------------------|
| Realm Name   | `real-estate-dev`        |
| Display Name | Real Estate CRM - Dev    |
| Realm ID     | `64afc942-5dfe-4b09-b7c3-47850223b9a3` |
| Status       | Enabled                  |
| Created      | 2026-03-27               |

### OIDC Discovery Endpoint
```
https://dev-auth.realstate-crm.homes/realms/real-estate-dev/.well-known/openid-configuration
```

### Token Endpoint
```
https://dev-auth.realstate-crm.homes/realms/real-estate-dev/protocol/openid-connect/token
```

### Authorization Endpoint
```
https://dev-auth.realstate-crm.homes/realms/real-estate-dev/protocol/openid-connect/auth
```

---

## Clients

### 1. `admin-portal` — Admin UI
| Field         | Value |
|---------------|-------|
| Client ID     | `admin-portal` |
| Internal UUID | `b859bd94-d62a-479c-a818-8a9498330e54` |
| Type          | PUBLIC (no secret needed) |
| Grant Types   | authorization_code, refresh_token |
| Redirect URIs | `https://dev-admin.realstate-crm.homes/*` |
| Web Origins   | `https://dev-admin.realstate-crm.homes` |

**SDK Usage:**
```typescript
const authme = new AuthmeClient({
  url: 'https://dev-auth.realstate-crm.homes',
  realm: 'real-estate-dev',
  clientId: 'admin-portal',
  redirectUri: 'https://dev-admin.realstate-crm.homes/callback',
});
```

---

### 2. `agent-portal` — Agent UI
| Field         | Value |
|---------------|-------|
| Client ID     | `agent-portal` |
| Internal UUID | `31243fc2-ba38-4923-a550-8d58ba795282` |
| Type          | PUBLIC (no secret needed) |
| Grant Types   | authorization_code, refresh_token |
| Redirect URIs | `https://dev-agent.realstate-crm.homes/*` |
| Web Origins   | `https://dev-agent.realstate-crm.homes` |

**SDK Usage:**
```typescript
const authme = new AuthmeClient({
  url: 'https://dev-auth.realstate-crm.homes',
  realm: 'real-estate-dev',
  clientId: 'agent-portal',
  redirectUri: 'https://dev-agent.realstate-crm.homes/callback',
});
```

---

### 3. `mobile` — Mobile App
| Field         | Value |
|---------------|-------|
| Client ID     | `mobile` |
| Internal UUID | `4fa411a4-9bc2-472b-97b1-e202bcb23795` |
| Type          | PUBLIC (PKCE required) |
| Grant Types   | authorization_code, refresh_token |
| Redirect URIs | `realestatecrm://auth/callback`, `https://dev-auth.realstate-crm.homes/mobile/callback` |

**Note:** Always use PKCE (code_challenge_method=S256) for mobile. No client secret needed.

---

### 4. `crm-backend` — NestJS Backend API
| Field         | Value |
|---------------|-------|
| Client ID     | `crm-backend` |
| Internal UUID | `2a701465-51c5-4420-aa15-c4cbe94a79d1` |
| Type          | CONFIDENTIAL |
| Grant Types   | client_credentials, authorization_code, refresh_token |
| Secret        | Stored in GitHub Secret: `AUTHME_CLIENT_SECRET` |

**NestJS Environment Variables:**
```env
AUTHME_URL=https://dev-auth.realstate-crm.homes
AUTHME_REALM=real-estate-dev
AUTHME_CLIENT_ID=crm-backend
AUTHME_CLIENT_SECRET=<from GitHub secret AUTHME_CLIENT_SECRET>
```

**Token Verification (NestJS guard):**
```typescript
// JWKS URI for token verification:
// https://dev-auth.realstate-crm.homes/realms/real-estate-dev/protocol/openid-connect/certs
```

---

## Roles

| Role    | UUID | Description |
|---------|------|-------------|
| `admin`   | `876f5f85-d59d-4490-9007-8a799b35580c` | Full system access |
| `manager` | `1e4e2cd5-003e-4226-b88c-dfba717c465c` | Management access |
| `agent`   | `22ffe147-fddc-4994-91f8-9def6ead1f28` | Agent-level access |

---

## Test Users

| Username | Email | Password | Role | User ID |
|----------|-------|----------|------|---------|
| `admin` | admin@test.com | Admin123! | admin | `138bedbe-0634-40fd-8996-4fa6f88ddb67` |
| `manager` | manager@test.com | Manager123! | manager | `e4c11e2a-db9f-46db-8e0b-58a2b7d84b6b` |
| `agent` | agent@test.com | Agent123! | agent | `3d898b5e-2d92-4c7f-be53-95c5cb770062` |

> ⚠️ These are **test credentials for dev only**. Never use in staging/production.

---

## GitHub Secrets Set

| Secret Name           | Description |
|-----------------------|-------------|
| `AUTHME_URL`          | `https://dev-auth.realstate-crm.homes` |
| `AUTHME_REALM`        | `real-estate-dev` |
| `AUTHME_CLIENT_ID`    | `crm-backend` |
| `AUTHME_CLIENT_SECRET`| Client secret for crm-backend (confidential) |

---

## Setup Method

Used `authme-cli` v1.x with JWT authentication (admin/admin default credentials):

```bash
# Login
authme login --server https://dev-auth.realstate-crm.homes --username admin --password admin

# Create realm
authme realm create real-estate-dev --display-name "Real Estate CRM - Dev"

# Create clients
authme client create admin-portal --realm real-estate-dev --type PUBLIC ...
authme client create agent-portal --realm real-estate-dev --type PUBLIC ...
authme client create mobile --realm real-estate-dev --type PUBLIC ...
authme client create crm-backend --realm real-estate-dev --type CONFIDENTIAL ...

# Create roles
authme role create admin --realm real-estate-dev
authme role create manager --realm real-estate-dev
authme role create agent --realm real-estate-dev

# Create users
authme user create admin --realm real-estate-dev --email admin@test.com --password "Admin123!"
authme user create manager --realm real-estate-dev --email manager@test.com --password "Manager123!"
authme user create agent --realm real-estate-dev --email agent@test.com --password "Agent123!"

# Assign roles
authme role assign <userId> admin --realm real-estate-dev
authme role assign <userId> manager --realm real-estate-dev
authme role assign <userId> agent --realm real-estate-dev
```

---

## Next Steps

1. **Security hardening** — Set `ADMIN_API_KEY` in docker-compose for crm-dev-authme container
2. **Change default admin password** — Currently using default `admin/admin`
3. **Configure SMTP** — Set up email for verification flows (Realm > Email tab in console)
4. **Enable brute force protection** — Realm settings > Security
5. **Rotate crm-backend secret** before UAT/staging promotion

---

## Architecture Notes

- One realm per environment (`real-estate-dev`, `real-estate-uat`, `real-estate-prod`)
- PUBLIC clients (SPAs, mobile) use PKCE — no secret needed
- CONFIDENTIAL clients (backend) use client_credentials for M2M auth
- All clients share the same realm roles (admin, manager, agent)
- Roles are embedded in JWT tokens via `realm_access.roles` claim
