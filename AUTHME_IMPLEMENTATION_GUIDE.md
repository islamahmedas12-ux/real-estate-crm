# AuthMe Implementation Guide

**Complete guide to AuthMe dev environment setup for real-estate-crm**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [File Guide](#file-guide)
3. [Phase Overview](#phase-overview)
4. [Detailed Instructions](#detailed-instructions)
5. [Testing & Verification](#testing--verification)
6. [Git Workflow](#git-workflow)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### For Hassan (DevOps)
```bash
cd /home/islam/.openclaw/workspace/real-estate-crm
docker-compose -f docker-compose.dev-full.yml up -d authme
echo "AuthMe is running at http://localhost:3001"
echo "Admin console: http://localhost:3001/console"
```

### For Adam (Security)
Once Hassan reports AuthMe is running:

**Automated Setup (Recommended):**
```bash
cd /home/islam/.openclaw/workspace/real-estate-crm
chmod +x scripts/setup-authme-dev.sh
./scripts/setup-authme-dev.sh
# Follow prompts and save the client secret!
```

**Manual Setup (Alternative):**
Read `docs/authme-dev-setup-complete.md` and follow step-by-step.

---

## 📚 File Guide

### Root Level Files
All entry points for the setup process.

| File | Purpose | Audience |
|------|---------|----------|
| **AUTHME_README.md** | Quick start guide | Hassan & Adam |
| **AUTHME_SETUP_CHECKLIST.md** | Detailed checkbox guide for all 7 phases | Adam (main reference) |
| **AUTHME_SETUP_STATUS.md** | Status report with timeline | Project manager |
| **AUTHME_IMPLEMENTATION_GUIDE.md** | This file - complete guide | Everyone |

### Documentation Files (`docs/` folder)
Detailed technical documentation.

| File | Purpose | Audience |
|------|---------|----------|
| **authme-setup.md** | Original setup documentation | Reference only |
| **authme-dev-setup-complete.md** | Step-by-step manual setup with explanations | Adam (manual setup) |
| **AUTHME_CONFIG_SUMMARY.md** | Quick reference for all configurations | Everyone |

### Scripts (`scripts/` folder)
Executable automation scripts.

| File | Purpose | Audience |
|------|---------|----------|
| **setup-authme-dev.sh** | Automated realm/client/user/role setup | Adam (primary) |

### Configuration Files (root level)
Environment variables for different environments.

| File | Purpose | Usage |
|------|---------|-------|
| **.env.dev** | Development environment variables | `docker-compose up` |
| **.env.example** | Template with instructions | Reference for production |

---

## 🔄 Phase Overview

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Infrastructure (Hassan)                            │
│ └─ Deploy AuthMe via docker-compose                         │
│    Expected: AuthMe at http://localhost:3001                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Configuration (Adam)                               │
│ ├─ Option A: Run setup script (recommended)                 │
│ └─ Option B: Manual setup via console                       │
│    Expected: Realm, clients, roles, users created           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Verification (Adam)                                │
│ ├─ Test OIDC endpoints                                      │
│ ├─ Verify JWT token generation                              │
│ └─ Confirm roles in JWT claims                              │
│    Expected: All endpoints working, secret saved            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Config Update (Adam)                               │
│ └─ Update .env.dev with client secret                       │
│    Expected: .env.dev ready for docker-compose              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: Git Workflow (Adam)                                │
│ ├─ Create feature branch                                    │
│ ├─ Commit all files                                         │
│ └─ Push to GitHub                                           │
│    Expected: Feature branch with all changes                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: Pull Request (Adam)                                │
│ └─ Create PR to dev branch                                  │
│    Expected: PR visible on GitHub for review                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 7: Review & Merge (Team Lead)                         │
│ ├─ Review PR                                                │
│ └─ Merge to dev branch                                      │
│    Expected: AuthMe setup merged and ready for dev env      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Detailed Instructions

### Phase 1: Infrastructure Deployment (Hassan - 15-30 min)

**Objective:** Get AuthMe running and accessible

```bash
# Step 1: Navigate to project directory
cd /home/islam/.openclaw/workspace/real-estate-crm

# Step 2: Start AuthMe container
docker-compose -f docker-compose.dev-full.yml up -d authme

# Step 3: Wait for startup
sleep 30

# Step 4: Verify it's running
curl http://localhost:3001/admin
# Should return HTML or 200 OK (not connection error)

# Step 5: Notify Adam
echo "AuthMe is ready at http://localhost:3001"
echo "Admin console: http://localhost:3001/console"
```

**Success Criteria:**
- ✅ AuthMe responds at http://localhost:3001
- ✅ Admin console accessible at http://localhost:3001/console
- ✅ No connection errors

**Next:** Notify Adam that AuthMe is running

---

### Phase 2: Configuration (Adam - 10-45 min)

**Objective:** Create realm, clients, roles, and users in AuthMe

#### Option A: Automated Setup (Recommended - 10 min)

```bash
# Step 1: Navigate to project
cd /home/islam/.openclaw/workspace/real-estate-crm

# Step 2: Make script executable
chmod +x scripts/setup-authme-dev.sh

# Step 3: Run the setup script
./scripts/setup-authme-dev.sh

# Step 4: Follow prompts
# - When asked for admin credentials, enter: admin / admin
# - Script will create realm, clients, roles, users
# - Script will display crm-backend client secret

# Step 5: Save the client secret!
# It will be displayed and saved to /tmp/authme-client-secret.txt
```

**What the script does:**
- ✅ Creates realm `real-estate-dev`
- ✅ Creates 3 realm roles (crm-admin, crm-manager, crm-agent)
- ✅ Creates 4 OAuth2/OIDC clients with proper configuration
- ✅ Creates 3 test users with assigned roles
- ✅ Retrieves and displays the crm-backend client secret
- ✅ Verifies all endpoints

**Success Criteria:**
- ✅ Script completes without errors
- ✅ All components created (realm, clients, roles, users)
- ✅ Client secret displayed and saved

#### Option B: Manual Setup (Alternative - 30-45 min)

If you prefer manual setup via the console:

```bash
# Step 1: Open browser and go to console
open http://localhost:3001/console
# Login with: admin / admin

# Step 2: Follow docs/authme-dev-setup-complete.md
# This document provides detailed step-by-step instructions for:
# - Creating the realm
# - Creating roles
# - Creating clients
# - Creating users
# - Getting the client secret

# Use AUTHME_SETUP_CHECKLIST.md as a checklist
```

**Success Criteria:**
- ✅ Realm `real-estate-dev` exists
- ✅ 3 roles created (crm-admin, crm-manager, crm-agent)
- ✅ 4 clients created with proper CORS configuration
- ✅ 3 test users created with assigned roles
- ✅ crm-backend client secret obtained

---

### Phase 3: Verification (Adam - 5-10 min)

**Objective:** Verify all endpoints are working and save credentials

```bash
# Step 1: Test OIDC Discovery Endpoint
curl http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration
# Expected: JSON with token_endpoint, userinfo_endpoint, etc.

# Step 2: Test JWT Keys Endpoint
curl http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs
# Expected: JSON with RSA public keys

# Step 3: Test Token Generation
# ⚠️ REPLACE YOUR_CLIENT_SECRET with actual secret from Phase 2!
curl -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!"
# Expected: JSON with access_token, refresh_token, expires_in

# Step 4: Verify Roles in Token
TOKEN="<access_token_from_step_3>"
echo $TOKEN | cut -d. -f2 | base64 -d | jq '.realm_access.roles'
# Expected: ["crm-admin"]

# Step 5: Save the client secret for next phase
# Store the secret in a secure location (you'll use it in Phase 4)
```

**Success Criteria:**
- ✅ All endpoints return 200 OK
- ✅ OIDC discovery returns JSON with endpoints
- ✅ JWT keys endpoint returns RSA public keys
- ✅ Token generation works with test users
- ✅ JWT tokens include `realm_access.roles`
- ✅ Roles correctly assigned (admin→crm-admin, etc.)

---

### Phase 4: Configuration Update (Adam - 5 min)

**Objective:** Update .env.dev with the client secret

```bash
# Step 1: Open .env.dev file
vim /home/islam/.openclaw/workspace/real-estate-crm/.env.dev

# Step 2: Find this line:
# AUTHME_CLIENT_SECRET=change-me-to-actual-secret-from-authme

# Step 3: Replace with actual secret from Phase 2/3
# Example:
# AUTHME_CLIENT_SECRET=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkI3M0Y4...

# Step 4: Save the file

# Step 5: Verify the file is correct
grep AUTHME .env.dev
# Should show:
# AUTHME_URL=http://authme:3001
# AUTHME_REALM=real-estate-dev
# AUTHME_CLIENT_ID=crm-backend
# AUTHME_CLIENT_SECRET=<actual-secret>
```

**Success Criteria:**
- ✅ .env.dev contains valid client secret
- ✅ All AUTHME_* variables are set correctly
- ✅ File has been saved

---

### Phase 5: Git Workflow (Adam - 10 min)

**Objective:** Commit all changes to a feature branch

```bash
# Step 1: Navigate to project directory
cd /home/islam/.openclaw/workspace/real-estate-crm

# Step 2: Create and switch to feature branch
git checkout -b feature/#2-authme-dev-setup

# Step 3: Add all changes
git add -A

# Step 4: Verify changes
git status
# Should show new files:
# - AUTHME_README.md
# - AUTHME_SETUP_CHECKLIST.md
# - AUTHME_SETUP_STATUS.md
# - AUTHME_IMPLEMENTATION_GUIDE.md
# - docs/authme-dev-setup-complete.md
# - docs/AUTHME_CONFIG_SUMMARY.md
# - scripts/setup-authme-dev.sh
# - .env.dev (modified)
# - .env.example (modified)

# Step 5: Commit with descriptive message
git commit -m "feat: AuthMe dev realm configuration (#2)

- Create real-estate-dev realm with 30-minute token lifespan
- Configure 4 OAuth2/OIDC clients (admin-portal, agent-portal, mobile, crm-backend)
- Create 3 realm roles (crm-admin, crm-manager, crm-agent)
- Create 3 test users for each role (admin/manager/agent@test.com)
- Add automated setup script (scripts/setup-authme-dev.sh)
- Add comprehensive setup documentation
- Update environment variables with AuthMe configuration
- All clients configured with proper CORS and redirect URIs

Tested:
- ✅ OIDC discovery endpoint
- ✅ JWT keys endpoint
- ✅ Token generation with test users
- ✅ Role claims in JWT tokens
"

# Step 6: Push to GitHub
git push origin feature/#2-authme-dev-setup

# Step 7: Verify on GitHub
echo "Check GitHub: https://github.com/Islamawad132/real-estate-crm/branches"
```

**Success Criteria:**
- ✅ Feature branch created
- ✅ All changes committed
- ✅ Branch pushed to GitHub
- ✅ Branch visible in GitHub web interface

---

### Phase 6: Pull Request (Adam - 5 min)

**Objective:** Create PR for code review

```bash
# Step 1: Go to GitHub
open https://github.com/Islamawad132/real-estate-crm

# Step 2: Click on "Pull requests" tab
# Step 3: Click "New Pull Request"

# Step 4: Select branches
# - Base: dev
# - Compare: feature/#2-authme-dev-setup

# Step 5: Fill in PR details
# Title: feat: AuthMe dev realm configuration (#2)
#
# Description:
# ## Description
# Configures AuthMe (Keycloak-compatible IAM) for the Real Estate CRM dev environment.
#
# ## Changes
# - Create real-estate-dev realm in AuthMe
# - Configure 4 OAuth2/OIDC clients with proper CORS:
#   - admin-portal (Admin UI, http://localhost:5173)
#   - agent-portal (Agent UI, http://localhost:5174)
#   - mobile (Flutter app, app://real-estate-crm/*)
#   - crm-backend (NestJS API, Confidential client with secret)
# - Create 3 realm roles with proper priority mapping:
#   - crm-admin → UserRole.ADMIN
#   - crm-manager → UserRole.MANAGER
#   - crm-agent → UserRole.AGENT
# - Create 3 test users for manual testing
# - Add automated setup script (setup-authme-dev.sh)
# - Add comprehensive documentation (5 new docs + checklist)
#
# ## Testing
# All endpoints verified:
# - ✅ OIDC discovery endpoint
# - ✅ JWT keys endpoint
# - ✅ Token generation with test users
# - ✅ JWT tokens include realm_access.roles claim
# - ✅ Roles correctly assigned to users
#
# Test credentials:
# - admin@test.com / Admin123! → crm-admin
# - manager@test.com / Manager123! → crm-manager
# - agent@test.com / Agent123! → crm-agent
#
# ## Related
# Closes #2

# Step 6: Click "Create Pull Request"
# Step 7: Share the PR link with the team
```

**Success Criteria:**
- ✅ PR created and visible on GitHub
- ✅ PR title and description are clear
- ✅ Base branch is `dev`
- ✅ Feature branch is `feature/#2-authme-dev-setup`

---

### Phase 7: Review & Merge (Team Lead - 5-10 min)

**Objective:** Review changes and merge to dev branch

```bash
# Step 1: Review the PR on GitHub
# Check that all files are present and changes make sense

# Step 2: Verify CI/CD passes (if configured)
# GitHub Actions should run automated tests

# Step 3: Request changes or approve
# Add review comments if needed

# Step 4: Merge to dev branch
# Click "Merge Pull Request" on GitHub

# Step 5: Confirm merge
# - PR should show "Merged" status
# - Feature branch can be deleted

# Step 6: Notify Adam
echo "PR #X merged to dev branch"
```

**Success Criteria:**
- ✅ PR reviewed by team
- ✅ All feedback addressed
- ✅ PR merged to dev branch
- ✅ Feature branch deleted

---

## ✅ Testing & Verification

### Full Integration Test

Once all phases are complete, test the full flow:

```bash
# Step 1: Start the full dev environment
docker-compose -f docker-compose.dev-full.yml up -d

# Step 2: Wait for services to start
sleep 60

# Step 3: Get test token
TOKEN=$(curl -s -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=<YOUR_SECRET>" \
  -d "username=admin@test.com" \
  -d "password=Admin123!" | jq -r '.access_token')

# Step 4: Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Step 5: Test admin portal login
open http://localhost:5173
# Login with: admin@test.com / Admin123!
# Should see admin dashboard

# Step 6: Test agent portal login
open http://localhost:5174
# Login with: agent@test.com / Agent123!
# Should see agent dashboard with limited features
```

---

## 🔀 Git Workflow

### Branch Strategy

```
main/master (production)
    ↑
dev (development)
    ↑
feature/#2-authme-dev-setup (this PR)
    ↓
Merge to dev after review
```

### Commit Message Format

```
feat: AuthMe dev realm configuration (#2)

- Point 1
- Point 2
- Point 3

Tested:
- ✅ Point 1
- ✅ Point 2
```

### PR Checklist

Before merging, verify:
- [ ] All files are present
- [ ] Configuration looks correct
- [ ] Tests pass (if CI is configured)
- [ ] Documentation is clear
- [ ] No secrets in plain text (except .env.dev with DEV ONLY comment)

---

## 🔧 Troubleshooting

### Phase 1: Infrastructure

**Problem:** "docker: command not found"
```bash
# Solution: Install Docker
# See: https://docs.docker.com/engine/install/
```

**Problem:** "AuthMe container won't start"
```bash
# Check logs
docker logs authme

# Restart container
docker-compose -f docker-compose.dev-full.yml restart authme
```

### Phase 2: Configuration

**Problem:** "Script fails with 'Cannot get admin token'"
```bash
# Verify AuthMe is running
curl http://localhost:3001/admin

# Check admin credentials in script (default: admin/admin)
# Edit scripts/setup-authme-dev.sh and update ADMIN_PASSWORD
```

**Problem:** "jq: command not found"
```bash
# Install jq
sudo apt-get install jq
```

### Phase 3: Verification

**Problem:** "Token doesn't include roles"
```bash
# Verify User Realm Role mapper is enabled in clients
# Go to: Client → Mappers → Verify User Realm Role mapper exists
# Enable "Add to access token"
```

**Problem:** "OIDC discovery endpoint fails"
```bash
# Verify realm exists
curl http://localhost:3001/realms/real-estate-dev

# Check realm name (must be exactly "real-estate-dev")
```

### Phase 4: Config Update

**Problem:** ".env.dev still has placeholder secret"
```bash
# Make sure you replaced the entire value
# Should NOT contain "change-me-to"
grep AUTHME_CLIENT_SECRET .env.dev
# Should show actual secret, not placeholder
```

---

## 📞 Support & Escalation

**Infrastructure Issues (Hassan):**
- AuthMe won't start
- Docker-compose failures
- Network connectivity problems

**Configuration Issues (Adam):**
- Script failures
- AuthMe console access problems
- Client/role creation issues

**Integration Issues (Backend Team):**
- JWT validation failures
- Token claims missing
- Backend connectivity

---

## 📊 Timeline Summary

| Phase | Owner | Duration | Status |
|-------|-------|----------|--------|
| 1. Infrastructure | Hassan | 15-30 min | ⏳ Waiting |
| 2. Configuration | Adam | 10-45 min | ⏳ Waiting |
| 3. Verification | Adam | 5-10 min | ⏳ Waiting |
| 4. Config Update | Adam | 5 min | ⏳ Waiting |
| 5. Git Workflow | Adam | 10 min | ⏳ Waiting |
| 6. Pull Request | Adam | 5 min | ⏳ Waiting |
| 7. Review & Merge | Team | 5-10 min | ⏳ Waiting |
| **TOTAL** | Mixed | **60-110 min** | **Ready** |

---

## 🎯 Success Criteria

All phases complete when:

1. ✅ Realm `real-estate-dev` exists in AuthMe
2. ✅ 3 roles created (crm-admin, crm-manager, crm-agent)
3. ✅ 4 clients configured with proper CORS/redirects
4. ✅ 3 test users created with assigned roles
5. ✅ JWT tokens include `realm_access.roles` claim
6. ✅ All endpoints verified and working
7. ✅ `.env.dev` updated with client secret
8. ✅ Feature branch pushed to GitHub
9. ✅ PR created and reviewed
10. ✅ PR merged to `dev` branch

---

## 📝 Next Steps

1. **Hassan:** Deploy AuthMe → Notify Adam when ready
2. **Adam:** Run setup (automated or manual) → Save client secret
3. **Adam:** Verify all endpoints → Update .env.dev
4. **Adam:** Commit and push → Create PR
5. **Team Lead:** Review and merge when ready
6. **Everyone:** AuthMe is now configured for dev environment!

---

**Status:** 🟢 Ready for Phase 1 execution  
**Created:** 2026-03-27  
**Version:** 1.0
