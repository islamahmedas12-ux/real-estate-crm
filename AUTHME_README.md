# AuthMe Development Setup

**Quick Start for Development Environment**

---

## For DevOps / Infrastructure (Hassan)

### Step 1: Deploy AuthMe

```bash
cd /home/islam/.openclaw/workspace/real-estate-crm

# Start AuthMe with Docker Compose
docker-compose -f docker-compose.dev-full.yml up -d authme

# Wait for it to be ready (typically 15-30 seconds)
sleep 30

# Verify it's running
curl http://localhost:3001/admin
```

**Expected:** Should return HTML page or 200 OK response

### Step 2: Report Ready

Once running, notify the team that AuthMe is available at:
- **Admin Console:** http://localhost:3001/console
- **API Base:** http://localhost:3001

---

## For Security & Auth (Adam)

### Step 1: Check Prerequisites

```bash
# Verify AuthMe is running
curl -v http://localhost:3001/realms/master

# Check you have required tools
which curl  # Must be available
which jq    # Must be available (install: sudo apt-get install jq)
```

### Step 2: Automated Setup (Recommended)

Run the automated configuration script:

```bash
cd /home/islam/.openclaw/workspace/real-estate-crm

# Make script executable (should already be)
chmod +x scripts/setup-authme-dev.sh

# Run setup (you'll be prompted for admin credentials)
./scripts/setup-authme-dev.sh
```

**What this does:**
- ✅ Creates realm: `real-estate-dev`
- ✅ Creates 3 realm roles: crm-admin, crm-manager, crm-agent
- ✅ Creates 4 OAuth2/OIDC clients
- ✅ Creates 3 test users with proper roles
- ✅ Retrieves and displays the `crm-backend` client secret
- ✅ Verifies all endpoints are working

### Step 3: Manual Setup (Alternative)

If you prefer manual configuration via the UI:

1. Read: **docs/authme-dev-setup-complete.md** (step-by-step guide with screenshots)
2. Follow: **AUTHME_SETUP_CHECKLIST.md** (checkbox guide)
3. Admin Console: http://localhost:3001/console

### Step 4: Save Client Secret

After setup, you'll have a **Client Secret** for the backend service.

**This is critical!** Update `.env.dev`:

```bash
AUTHME_CLIENT_SECRET=<paste-secret-here>
```

### Step 5: Verify Configuration

Test all endpoints:

```bash
# OIDC Discovery
curl http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration

# JWT Keys
curl http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs

# Test Login (with client secret)
curl -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!"
```

### Step 6: Commit & Push

```bash
git checkout -b feature/#2-authme-dev-setup
git add .
git commit -m "feat: AuthMe dev realm configuration"
git push origin feature/#2-authme-dev-setup
```

Then create a PR to the `dev` branch.

---

## Configuration Reference

| Component | Value |
|-----------|-------|
| Realm | `real-estate-dev` |
| AuthMe URL | http://localhost:3001 |
| Admin Console | http://localhost:3001/console |
| Admin Username | admin (default) |
| Admin Password | admin (default) |

### Clients
| Client | Type | Redirect URI |
|--------|------|--------------|
| admin-portal | Public | http://localhost:5173/* |
| agent-portal | Public | http://localhost:5174/* |
| mobile | Public | app://real-estate-crm/*, com.realestatecrm://* |
| crm-backend | Confidential | (backend only) |

### Test Users
| Email | Password | Role |
|-------|----------|------|
| admin@test.com | Admin123! | crm-admin |
| manager@test.com | Manager123! | crm-manager |
| agent@test.com | Agent123! | crm-agent |

---

## Documentation

- **AUTHME_SETUP_CHECKLIST.md** - Detailed checkbox guide for all steps
- **docs/authme-dev-setup-complete.md** - Step-by-step manual setup with explanations
- **docs/AUTHME_CONFIG_SUMMARY.md** - Configuration reference and quick lookups
- **docs/authme-setup.md** - Original setup documentation

---

## Troubleshooting

### AuthMe Not Responding

```bash
# Check container status
docker ps | grep authme

# Check logs
docker logs authme

# Restart AuthMe
docker-compose -f docker-compose.dev-full.yml restart authme
```

### Script Fails

```bash
# Ensure jq is installed
sudo apt-get install jq

# Verify curl works
curl -I http://localhost:3001/admin

# Check admin credentials in script and update if needed
# Default: username=admin, password=admin
```

### Roles Not in JWT Token

1. Go to client → Mappers tab
2. Verify "User Realm Role" mapper exists
3. Verify "Add to access token" is enabled
4. Re-generate token

### CORS Errors in Portal

1. Verify Web Origins in client settings match exactly
2. Check browser console for exact error
3. Ensure both admin-portal and agent-portal are configured

---

## Next Steps

1. ✅ Hassan: Deploy AuthMe
2. ✅ Adam: Run setup script or manual configuration
3. ✅ Adam: Verify endpoints and save client secret
4. ✅ Adam: Update .env.dev with secret
5. ✅ Adam: Commit and push to feature branch
6. ✅ Team: Review and merge PR to dev

---

## Quick Commands

```bash
# Start AuthMe
docker-compose -f docker-compose.dev-full.yml up -d authme

# Run setup
./scripts/setup-authme-dev.sh

# Test endpoints
curl http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration

# View logs
docker logs authme

# Stop AuthMe
docker-compose -f docker-compose.dev-full.yml down authme
```

---

**Status:** Ready for deployment  
**Owner:** Hassan (Infrastructure) → Adam (Configuration)  
**Timeline:** < 1 hour total
