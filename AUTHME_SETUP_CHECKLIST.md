# AuthMe Dev Setup Checklist

**Target:** Configure AuthMe for real-estate-dev environment  
**Owner:** Adam Tarek (Setup), Hassan (Infrastructure)  
**Status:** 🔄 In Progress  

---

## Phase 1: Infrastructure ✅

- [ ] Hassan: Deploy AuthMe via `docker-compose.dev-full.yml`
  ```bash
  cd /home/islam/.openclaw/workspace/real-estate-crm
  docker-compose -f docker-compose.dev-full.yml up -d authme
  ```

- [ ] Verify AuthMe is accessible:
  ```bash
  curl http://localhost:3001/admin
  # Should return HTML or redirect, not connection error
  ```

---

## Phase 2: Realm & Roles Setup

### Option A: Automated Setup (Recommended) ⚡
```bash
chmod +x scripts/setup-authme-dev.sh
./scripts/setup-authme-dev.sh
```

**This script will automatically complete:** Items 2.1-2.5

### Option B: Manual Setup 📋
Follow **docs/authme-dev-setup-complete.md** step-by-step

---

### 2.1: Create Realm
- [ ] Login to AuthMe console: `http://localhost:3001/console`
- [ ] Click **Create Realm**
- [ ] Fill in:
  - **Realm name:** `real-estate-dev`
  - **Display name:** Real Estate Dev
  - **Enabled:** ON
- [ ] Click **Create**
- [ ] Go to **Tokens** tab, set **Access Token Lifespan:** 30 minutes

**Verification:** Can see realm in realm dropdown

---

### 2.2: Create Realm Roles
- [ ] Navigate to **Realm Roles**
- [ ] Create role: `crm-admin` (Full system access)
- [ ] Create role: `crm-manager` (Manage agents and reports)
- [ ] Create role: `crm-agent` (View own data only)

**Verification:** All 3 roles listed in Realm Roles

---

### 2.3: Create Clients
- [ ] Create `admin-portal` (Public)
  - Redirect URIs: `http://localhost:5173/*`
  - Web Origins: `http://localhost:5173`
  
- [ ] Create `agent-portal` (Public)
  - Redirect URIs: `http://localhost:5174/*`
  - Web Origins: `http://localhost:5174`
  
- [ ] Create `mobile` (Public)
  - Redirect URIs: `app://real-estate-crm/*`, `com.realestatecrm://*`
  
- [ ] Create `crm-backend` (Confidential) ⭐
  - **Service Accounts Enabled:** ON
  - **Direct Access Grants Enabled:** ON

**Verification:** All 4 clients show in Clients list

---

### 2.4: Add Role Mappers to Clients
For each client (admin-portal, agent-portal, mobile, crm-backend):
- [ ] Go to **Mappers** tab
- [ ] Verify **User Realm Role** mapper exists
- [ ] If not, click **Add Mapper**
  - Type: **User Realm Role**
  - Token Claim Name: `realm_access.roles`
  - Claim JSON Type: `String`
  - Add to access token: **ON**
  - Click **Save**

**Verification:** Each client has User Realm Role mapper

---

### 2.5: Get crm-backend Client Secret ⚠️ IMPORTANT
- [ ] Go to **Clients** → `crm-backend`
- [ ] Click **Credentials** tab
- [ ] Copy **Client Secret** value
- [ ] 🔴 **SAVE THIS!** You need it for .env

**Example secret format:**
```
eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJJdFhtdG5FbEsybklsM2FQS3VGWnZtVkk0ZjA0dUdlOEZzV...
```

---

## Phase 3: Test Users Setup

### 3.1: Create User: admin@test.com
- [ ] Navigate to **Users**
- [ ] Click **Add User**
- [ ] Fill in:
  - Username: `admin@test.com`
  - Email: `admin@test.com`
  - Email Verified: **ON**
  - First Name: `Admin`
  - Last Name: `User`
- [ ] Click **Create**
- [ ] Go to **Credentials** tab
  - Set password: `Admin123!`
  - Temporary: **OFF**
  - Click **Set Password**
- [ ] Go to **Role Mappings** tab
  - Select `crm-admin` and click **Add selected**
  - Click **Update**

**Verification:** User shows with crm-admin role

---

### 3.2: Create User: manager@test.com
- [ ] Repeat same steps as 3.1 but:
  - Username/Email: `manager@test.com`
  - Password: `Manager123!`
  - Assign role: `crm-manager`

**Verification:** User shows with crm-manager role

---

### 3.3: Create User: agent@test.com
- [ ] Repeat same steps as 3.1 but:
  - Username/Email: `agent@test.com`
  - Password: `Agent123!`
  - Assign role: `crm-agent`

**Verification:** User shows with crm-agent role

---

## Phase 4: Verification Tests

### 4.1: OIDC Discovery Endpoint
```bash
curl http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration
```
- [ ] Returns JSON with `token_endpoint`, `userinfo_endpoint`, etc.
- [ ] Status: 200 OK

---

### 4.2: JWT Keys Endpoint
```bash
curl http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs
```
- [ ] Returns JSON with RSA public keys
- [ ] Status: 200 OK

---

### 4.3: Test Token Generation
```bash
# Replace YOUR_CLIENT_SECRET with actual secret from 2.5
curl -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!"
```
- [ ] Returns JSON with `access_token`, `refresh_token`, `expires_in`
- [ ] Status: 200 OK
- [ ] Token is not empty

---

### 4.4: Verify Roles in Token
```bash
# Get token from 4.3, then extract and decode:
TOKEN="<access_token_from_4.3>"
echo $TOKEN | cut -d. -f2 | base64 -d | jq '.realm_access.roles'
```
- [ ] Returns: `["crm-admin"]` for admin@test.com
- [ ] Returns: `["crm-manager"]` for manager@test.com
- [ ] Returns: `["crm-agent"]` for agent@test.com

---

## Phase 5: Configuration Updates

### 5.1: Update .env.dev
- [ ] Open `.env.dev`
- [ ] Find line: `AUTHME_CLIENT_SECRET=change-me-to-actual-secret-from-authme`
- [ ] Replace with actual secret from Phase 2.5
- [ ] Save file

**Example:**
```bash
AUTHME_CLIENT_SECRET=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkI...
```

---

### 5.2: Verify Environment Setup
```bash
# Verify .env.dev is correct
grep AUTHME .env.dev
```
- [ ] AUTHME_URL=http://authme:3001
- [ ] AUTHME_REALM=real-estate-dev
- [ ] AUTHME_CLIENT_ID=crm-backend
- [ ] AUTHME_CLIENT_SECRET=<actual-secret> (not placeholder)

---

## Phase 6: Git & PR

### 6.1: Create Feature Branch
```bash
git checkout -b feature/#2-authme-dev-setup
```

### 6.2: Commit Configuration Files
```bash
git add docs/authme-dev-setup-complete.md
git add docs/AUTHME_CONFIG_SUMMARY.md
git add scripts/setup-authme-dev.sh
git add AUTHME_SETUP_CHECKLIST.md
git add .env.dev
git add .env.example
git commit -m "feat: AuthMe dev realm configuration (#2)

- Create real-estate-dev realm with 30-min token lifespan
- Configure 4 OAuth2/OIDC clients (admin-portal, agent-portal, mobile, crm-backend)
- Create 3 realm roles (crm-admin, crm-manager, crm-agent)
- Create test users for each role (admin@test.com, manager@test.com, agent@test.com)
- Add automated setup script (scripts/setup-authme-dev.sh)
- Add comprehensive setup documentation
- Update environment variables with AuthMe configuration
- All clients configured with proper CORS and redirect URIs"
```

### 6.3: Push to GitHub
```bash
git push origin feature/#2-authme-dev-setup
```

### 6.4: Create Pull Request
- [ ] Go to https://github.com/Islamawad132/real-estate-crm/pulls
- [ ] Click **New Pull Request**
- [ ] Base branch: `dev`
- [ ] Compare branch: `feature/#2-authme-dev-setup`
- [ ] Fill in title: `feat: AuthMe dev realm configuration (#2)`
- [ ] Fill in description:
  ```markdown
  ## Description
  Configures AuthMe (Keycloak-compatible IAM) for the Real Estate CRM dev environment.
  
  ## Changes
  - Create real-estate-dev realm in AuthMe
  - Configure 4 OAuth2/OIDC clients:
    - admin-portal (Admin UI, http://localhost:5173)
    - agent-portal (Agent UI, http://localhost:5174)
    - mobile (Flutter app)
    - crm-backend (NestJS API, Confidential client)
  - Create 3 realm roles with proper mapping
  - Create 3 test users for manual testing
  - Add automated setup script
  - Add comprehensive documentation
  
  ## Testing
  All endpoints verified:
  - ✅ OIDC discovery: http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration
  - ✅ JWT keys: http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs
  - ✅ Token generation works with test users
  - ✅ JWT tokens include realm_access.roles
  
  ## Related
  Closes #2
  ```
- [ ] Click **Create Pull Request**

---

## Phase 7: Final Verification

### 7.1: Backend Integration Test
```bash
# Build and start dev environment
docker-compose -f docker-compose.dev-full.yml up -d

# Wait for services to start
sleep 30

# Get test token
TOKEN=$(curl -s -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!" | jq -r '.access_token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/health
```
- [ ] Returns: `{"status":"ok"}`
- [ ] Status: 200 OK

---

### 7.2: Portal Login Test
- [ ] Open http://localhost:5173 (Admin Portal)
- [ ] Click **Login**
- [ ] Enter credentials: `admin@test.com` / `Admin123!`
- [ ] Should redirect to dashboard after successful login
- [ ] User profile shows: admin@test.com with Admin role

---

### 7.3: Agent Portal Test
- [ ] Open http://localhost:5174 (Agent Portal)
- [ ] Click **Login**
- [ ] Enter credentials: `agent@test.com` / `Agent123!`
- [ ] Should redirect to dashboard with agent-only features
- [ ] User profile shows: agent@test.com with Agent role

---

## Summary

### Completed Items
- [ ] Realm: `real-estate-dev` created
- [ ] Roles: crm-admin, crm-manager, crm-agent created
- [ ] Clients: admin-portal, agent-portal, mobile, crm-backend created
- [ ] Users: admin@test.com, manager@test.com, agent@test.com created
- [ ] Mappers: User Realm Role added to all clients
- [ ] Verification: All endpoints tested and working
- [ ] Configuration: .env.dev updated with client secret
- [ ] Documentation: Setup guides and scripts created
- [ ] Git: Feature branch pushed and PR created
- [ ] Integration: Backend accepts valid tokens

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused on :3001 | Start AuthMe: `docker-compose -f docker-compose.dev-full.yml up -d authme` |
| Invalid credentials | Verify username/password match exactly (case-sensitive) |
| Realm not found | Check realm name is exactly `real-estate-dev` (lowercase, hyphen) |
| Roles missing in JWT | Verify User Realm Role mapper is enabled in client → Mappers |
| CORS errors in browser | Verify Web Origins match exactly in client settings |
| Token validation fails | Verify AUTHME_CLIENT_SECRET is correct in .env |

---

## Resources

- **Docs:** `/home/islam/.openclaw/workspace/real-estate-crm/docs/`
  - authme-setup.md (original setup guide)
  - authme-dev-setup-complete.md (detailed manual steps)
  - AUTHME_CONFIG_SUMMARY.md (quick reference)

- **Scripts:** `/home/islam/.openclaw/workspace/real-estate-crm/scripts/`
  - setup-authme-dev.sh (automated setup)

- **Configuration:** `/home/islam/.openclaw/workspace/real-estate-crm/`
  - .env.dev (dev environment variables)
  - .env.example (template for all environments)

---

**Last Updated:** 2026-03-27  
**Status:** Ready for Phase 1 (Hassan to deploy AuthMe)  
**Next:** Adam to run Phase 2-3 (Realm & User Setup) once AuthMe is accessible
