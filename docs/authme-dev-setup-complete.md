# AuthMe Dev Environment Setup - Complete Configuration Guide

**Configured by:** Adam Tarek, Security & AuthMe Specialist
**Date:** 2026-03-27
**Status:** Ready for Implementation

---

## Overview

This guide provides step-by-step instructions to configure AuthMe for the Real Estate CRM dev environment. It includes:
- Realm creation and configuration
- Client setup (4 clients: admin-portal, agent-portal, mobile, crm-backend)
- Role creation (3 roles: crm-admin, crm-manager, crm-agent)
- Test user creation
- Configuration verification

---

## Prerequisites

- ✅ AuthMe is running at `http://localhost:3001`
- ✅ Default admin credentials are available
- ✅ Admin console accessible at `http://localhost:3001/console`

---

## Step 1: Access AuthMe Admin Console

1. Open browser and navigate to: `http://localhost:3001/console`
2. Log in with default credentials (check AuthMe documentation for defaults)
3. You should see the AuthMe realm management dashboard

---

## Step 2: Create the Dev Realm

### Create New Realm

1. Click **Create Realm** button
2. Fill in the following:
   - **Realm name:** `real-estate-dev`
   - **Display name:** Real Estate Dev
   - **Enabled:** ON

3. Click **Create**

### Configure Realm Tokens

1. In the realm settings, go to **Tokens** tab
2. Set **Access Token Lifespan:** 30 minutes
3. Go to **Advanced** tab and ensure:
   - **Standard Flow:** Enabled
   - **Direct Access Grants:** Enabled (for testing)
4. Click **Save**

---

## Step 3: Create Realm Roles

Navigate to **Realm Roles** in the left sidebar. Create these 3 roles:

### Role 1: crm-admin
- **Role name:** `crm-admin`
- **Description:** Full system access
- Click **Create**

### Role 2: crm-manager
- **Role name:** `crm-manager`
- **Description:** Manage agents and reports
- Click **Create**

### Role 3: crm-agent
- **Role name:** `crm-agent`
- **Description:** View own data only
- Click **Create**

---

## Step 4: Create OAuth2/OIDC Clients

### Client 1: admin-portal (Admin UI)

1. Go to **Clients** in left sidebar
2. Click **Create Client**
3. Fill in:
   - **Client ID:** `admin-portal`
   - **Client Protocol:** `openid-connect`
   - **Access Type:** Public
   - Click **Save**

4. In the **Settings** tab, fill in:
   - **Valid Redirect URIs:** `http://localhost:5173/*`
   - **Web Origins:** `http://localhost:5173`
   - Click **Save**

5. In the **Mappers** tab, verify the **User Realm Role** mapper exists:
   - If not, click **Add Mapper** → **User Realm Role**
   - Set **Token Claim Name:** `realm_access.roles`
   - Set **Claim JSON Type:** `String`
   - Enable **Add to access token**
   - Click **Save**

---

### Client 2: agent-portal (Agent UI)

Repeat the same process as **admin-portal** but use:
- **Client ID:** `agent-portal`
- **Valid Redirect URIs:** `http://localhost:5174/*`
- **Web Origins:** `http://localhost:5174`

---

### Client 3: mobile (Flutter App)

1. Go to **Clients** → **Create Client**
2. Fill in:
   - **Client ID:** `mobile`
   - **Client Protocol:** `openid-connect`
   - **Access Type:** Public
   - Click **Save**

3. In **Settings** tab:
   - **Valid Redirect URIs:** `app://real-estate-crm/*` and `com.realestatecrm://*`
   - Click **Save**

4. Add mapper as above (User Realm Role)

---

### Client 4: crm-backend (NestJS Server) - ⭐ SAVE THE SECRET!

1. Go to **Clients** → **Create Client**
2. Fill in:
   - **Client ID:** `crm-backend`
   - **Client Protocol:** `openid-connect`
   - **Access Type:** **Confidential** (NOT Public!)
   - Click **Save**

3. In **Settings** tab:
   - **Service Account Enabled:** ON
   - **Direct Access Grants Enabled:** ON (for testing)
   - Click **Save**

4. Go to **Credentials** tab:
   - Copy the **Client Secret** value
   - **⚠️ SAVE THIS!** You need it for `.env`
   - Example format: `eyJhbGciOiJSUzI1NiIsInR5cC...` (long string)

5. Add mapper as above (User Realm Role)

---

## Step 5: Create Test Users

Go to **Users** in the left sidebar.

### User 1: Admin

1. Click **Add User**
2. Fill in:
   - **Username:** `admin@test.com`
   - **Email:** `admin@test.com`
   - **Email Verified:** ON
   - **First Name:** Admin
   - **Last Name:** User
   - Click **Create**

3. Go to **Credentials** tab:
   - Set password: `Admin123!`
   - **Temporary:** OFF
   - Click **Set Password**
   - Confirm "Set password?" dialog

4. Go to **Role Mappings** tab:
   - Under **Realm Roles**, select `crm-admin` and click **Add selected**
   - Click **Update**

### User 2: Manager

Repeat with:
- **Username/Email:** `manager@test.com`
- **Password:** `Manager123!`
- **Realm Role:** `crm-manager`

### User 3: Agent

Repeat with:
- **Username/Email:** `agent@test.com`
- **Password:** `Agent123!`
- **Realm Role:** `crm-agent`

---

## Step 6: Verify Configuration

### Test OIDC Discovery

```bash
curl http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration
```

Expected response: JSON with endpoints like `token_endpoint`, `userinfo_endpoint`, etc.

### Test JWT Key Endpoint

```bash
curl http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs
```

Expected response: JSON with RSA public keys

### Test Token Generation (dev only)

```bash
curl -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!"
```

Expected response: JSON with `access_token` (JWT), `refresh_token`, etc.

---

## Step 7: Update Environment Variables

Copy the **crm-backend** Client Secret from Step 4.4 and update `.env.dev`:

```bash
# ─── Authme IAM ───────────────────────────────────────────────────────
AUTHME_URL=http://authme:3001
AUTHME_REALM=real-estate-dev
AUTHME_CLIENT_ID=crm-backend
AUTHME_CLIENT_SECRET=<PASTE_CLIENT_SECRET_HERE>

# ─── CORS Origins ─────────────────────────────────────────────────────
ADMIN_PORTAL_URL=http://localhost:5173
AGENT_PORTAL_URL=http://localhost:5174
```

Update `.env.example` for production reference (marked as DEV ONLY):

```bash
# ─── Authme IAM ───────────────────────────────────────────────────────
# NOTE: DEV ONLY - Use proper secret management in production
AUTHME_URL=http://localhost:3001
AUTHME_REALM=real-estate-dev
AUTHME_CLIENT_ID=crm-backend
AUTHME_CLIENT_SECRET=dev-secret-change-in-prod
```

---

## Step 8: Verify Backend Integration

Once the NestJS server is running with the above `.env`, test authentication:

```bash
# 1. Get a token
TOKEN=$(curl -s -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!" | jq -r '.access_token')

# 2. Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/health
```

Expected response from `/api/health`: `{"status":"ok"}`

---

## Configuration Summary

| Component           | Value                                  |
|---------------------|----------------------------------------|
| **Realm**           | `real-estate-dev`                      |
| **AuthMe URL**      | `http://localhost:3001`                |
| **Admin Console**   | `http://localhost:3001/console`        |
| **OIDC Discovery**  | `http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration` |
| **JWT Keys Endpoint** | `http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs` |

### Clients

| Client ID      | Type          | Redirect URIs                    | Purpose      |
|----------------|---------------|----------------------------------|--------------|
| admin-portal   | Public        | `http://localhost:5173/*`        | Admin UI     |
| agent-portal   | Public        | `http://localhost:5174/*`        | Agent UI     |
| mobile         | Public        | `app://real-estate-crm/*`        | Flutter App  |
| crm-backend    | Confidential   | (none - backend server)          | NestJS API   |

### Roles

| Role Name    | Description                           | Maps To       |
|--------------|---------------------------------------|---------------|
| crm-admin    | Full system access                    | UserRole.ADMIN   |
| crm-manager  | Manage agents and reports             | UserRole.MANAGER |
| crm-agent    | View own data only                    | UserRole.AGENT   |

### Test Users

| Email              | Password     | Role         |
|--------------------|--------------|--------------|
| admin@test.com     | Admin123!    | crm-admin    |
| manager@test.com   | Manager123!  | crm-manager  |
| agent@test.com     | Agent123!    | crm-agent    |

---

## Troubleshooting

### Tokens Missing Roles

If JWT tokens don't include `realm_access.roles`:
1. Go to client → **Mappers** tab
2. Verify **User Realm Role** mapper exists
3. Verify **Add to access token** is enabled
4. Regenerate token

### CORS Errors in Browser

If admin/agent portal shows CORS errors:
1. Verify **Web Origins** match exactly (including scheme and port)
2. Ensure both `admin-portal` and `agent-portal` have proper CORS configured
3. Check browser console for exact error message

### Token Validation Fails

If backend rejects tokens:
1. Verify `AUTHME_CLIENT_SECRET` is correct (from **Credentials** tab)
2. Verify `AUTHME_REALM` matches (must be `real-estate-dev` for dev)
3. Test token manually: `curl http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs`

---

## Next Steps

1. ✅ Complete steps 1-8 above
2. ✅ Verify all configuration endpoints respond correctly
3. ✅ Test login flow with admin portal at `http://localhost:5173`
4. ✅ Push configuration to `feature/#2-authme-dev-setup` branch
5. ✅ Create PR to `dev` branch

---

## References

- AuthMe GitHub: https://github.com/Islamawad132/Authme
- Keycloak Documentation: https://www.keycloak.org/documentation
- OIDC Spec: https://openid.net/specs/openid-connect-core-1_0.html
