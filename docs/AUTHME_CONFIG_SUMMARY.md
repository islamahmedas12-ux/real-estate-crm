# AuthMe Dev Configuration Summary

**Status:** ✅ Ready for Implementation  
**Configured by:** Adam Tarek, Security & AuthMe Specialist  
**Date:** 2026-03-27  
**Target Environment:** Development  

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Realm Name** | `real-estate-dev` |
| **AuthMe URL** | `http://localhost:3001` |
| **Admin Console** | `http://localhost:3001/console` |
| **OIDC Discovery** | `http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration` |
| **Access Token Lifespan** | 30 minutes |

---

## Clients Configuration

### 1. admin-portal (Admin UI)
```json
{
  "clientId": "admin-portal",
  "accessType": "Public",
  "redirectUris": ["http://localhost:5173/*"],
  "webOrigins": ["http://localhost:5173"],
  "standardFlow": true,
  "implicitFlow": false,
  "mappers": ["User Realm Role (realm_access.roles)"]
}
```

### 2. agent-portal (Agent UI)
```json
{
  "clientId": "agent-portal",
  "accessType": "Public",
  "redirectUris": ["http://localhost:5174/*"],
  "webOrigins": ["http://localhost:5174"],
  "standardFlow": true,
  "implicitFlow": false,
  "mappers": ["User Realm Role (realm_access.roles)"]
}
```

### 3. mobile (Flutter App)
```json
{
  "clientId": "mobile",
  "accessType": "Public",
  "redirectUris": ["app://real-estate-crm/*", "com.realestatecrm://*"],
  "mappers": ["User Realm Role (realm_access.roles)"]
}
```

### 4. crm-backend (NestJS Server) ⭐
```json
{
  "clientId": "crm-backend",
  "accessType": "Confidential",
  "serviceAccountEnabled": true,
  "directAccessGrantsEnabled": true,
  "clientSecret": "INSERT_FROM_CONSOLE_CREDENTIALS_TAB",
  "mappers": ["User Realm Role (realm_access.roles)"]
}
```

---

## Roles Hierarchy

```
Realm: real-estate-dev
├── crm-admin (Full system access)
│   └── Maps to UserRole.ADMIN in backend
├── crm-manager (Manage agents and reports)
│   └── Maps to UserRole.MANAGER in backend
└── crm-agent (View own data only)
    └── Maps to UserRole.AGENT in backend
```

**JWT Role Claim:** `realm_access.roles` (automatically included in access tokens)

---

## Test Users

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@test.com | Admin123! | crm-admin | Full admin access testing |
| manager@test.com | Manager123! | crm-manager | Manager/supervisor testing |
| agent@test.com | Agent123! | crm-agent | Field agent testing |

---

## Environment Variables

### For `.env.dev` (Local Docker Development)
```bash
AUTHME_URL=http://authme:3001
AUTHME_REALM=real-estate-dev
AUTHME_CLIENT_ID=crm-backend
AUTHME_CLIENT_SECRET=<paste-from-console>
ADMIN_PORTAL_URL=http://localhost:5173
AGENT_PORTAL_URL=http://localhost:5174
```

### For `.env.example` (Reference Template)
```bash
# Marked as DEV ONLY with instructions for production usage
AUTHME_URL=http://localhost:3001
AUTHME_REALM=real-estate-dev
AUTHME_CLIENT_ID=crm-backend
AUTHME_CLIENT_SECRET=dev-secret-change-in-production
```

---

## Implementation Steps

### Prerequisites
- [ ] AuthMe running at `http://localhost:3001`
- [ ] Access to AuthMe admin console
- [ ] `curl` and `jq` installed (for automated setup)

### Automated Setup (Recommended)
```bash
chmod +x scripts/setup-authme-dev.sh
./scripts/setup-authme-dev.sh
```

This script will:
1. ✅ Create the `real-estate-dev` realm
2. ✅ Create 3 realm roles (crm-admin, crm-manager, crm-agent)
3. ✅ Create 4 OAuth2/OIDC clients with proper configuration
4. ✅ Retrieve and save the `crm-backend` client secret
5. ✅ Create 3 test users with assigned roles
6. ✅ Verify all endpoints are working

### Manual Setup
See **docs/authme-dev-setup-complete.md** for step-by-step manual instructions using the AuthMe console UI.

---

## Verification Checklist

### OIDC Discovery Endpoint
```bash
curl http://localhost:3001/realms/real-estate-dev/.well-known/openid-configuration
```
Expected: JSON with `token_endpoint`, `userinfo_endpoint`, etc.

### JWT Keys Endpoint
```bash
curl http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/certs
```
Expected: JSON with RSA public keys for token verification

### Token Generation (Test Login)
```bash
curl -X POST http://localhost:3001/realms/real-estate-dev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=crm-backend" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=admin@test.com" \
  -d "password=Admin123!"
```
Expected: JSON with `access_token`, `refresh_token`, expires_in, etc.

### Verify Roles in Token
```bash
TOKEN="<access_token_from_above>"
echo $TOKEN | cut -d. -f2 | base64 -d | jq '.realm_access.roles'
```
Expected: `["crm-admin"]` for admin@test.com, etc.

---

## Configuration Files Updated

1. **docs/authme-dev-setup-complete.md**
   - Complete step-by-step setup guide
   - Manual console-based instructions
   - Troubleshooting section

2. **docs/AUTHME_CONFIG_SUMMARY.md** (this file)
   - Quick reference for all configurations
   - Implementation checklist
   - Verification steps

3. **scripts/setup-authme-dev.sh**
   - Automated setup script
   - API-based realm/client/user/role creation
   - Configuration verification

4. **.env.dev**
   - Development environment variables
   - Updated with proper AuthMe configuration
   - Ready to use with docker-compose.dev-full.yml

5. **.env.example**
   - Template for all environments
   - Marked as DEV ONLY for sensitive values
   - Production deployment guidance

6. **docs/authme-setup.md** (existing)
   - Original setup documentation
   - Reference for realm and client configuration
   - CORS and redirect URI configuration

---

## Next Steps

### Phase 1: Setup (Current)
- [ ] Deploy AuthMe via docker-compose
- [ ] Run automated setup script OR follow manual steps
- [ ] Verify all endpoints respond correctly
- [ ] Save `crm-backend` client secret

### Phase 2: Integration
- [ ] Update `.env.dev` with client secret
- [ ] Start NestJS backend with new `.env`
- [ ] Start React admin portal at http://localhost:5173
- [ ] Test login flow with test users

### Phase 3: Verification
- [ ] Login as admin@test.com → Full access
- [ ] Login as manager@test.com → Manager features visible
- [ ] Login as agent@test.com → Agent features only
- [ ] Verify JWT tokens include role claims

### Phase 4: Git Workflow
1. Create feature branch: `feature/#2-authme-dev-setup`
2. Commit:
   - Updated docs/authme-setup.md
   - docs/authme-dev-setup-complete.md
   - docs/AUTHME_CONFIG_SUMMARY.md
   - scripts/setup-authme-dev.sh
   - Updated .env.dev
   - Updated .env.example
3. Push to GitHub
4. Create PR to `dev` branch with description of changes

---

## Security Notes

### Development
- ✅ Plaintext secrets in `.env.dev` (local use only)
- ✅ Test users with simple passwords (testing only)
- ✅ Direct access grants enabled (dev testing only)
- ✅ SSL/TLS not required (http://localhost)

### Production
- ⚠️ Never commit real secrets to git
- ⚠️ Use HashiCorp Vault or AWS Secrets Manager
- ⚠️ Disable direct access grants
- ⚠️ Require SSL/TLS (https only)
- ⚠️ Use strong, randomly generated passwords
- ⚠️ Implement secret rotation policies

---

## References

- **AuthMe GitHub:** https://github.com/Islamawad132/Authme
- **Keycloak Documentation:** https://www.keycloak.org/documentation
- **OIDC Specification:** https://openid.net/specs/openid-connect-core-1_0.html
- **Original Setup Guide:** docs/authme-setup.md

---

## Support

For issues or questions:
1. Check troubleshooting section in authme-dev-setup-complete.md
2. Review AuthMe logs: `docker logs authme`
3. Check backend logs for JWT validation errors
4. Verify all environment variables are correctly set

---

**Status:** ✅ Ready for Hassan to deploy and verify AuthMe is running  
**Next Owner:** Hassan (DevOps) to deploy AuthMe via docker-compose  
**Then:** Adam to run setup script or execute manual steps
