#!/bin/bash
# ==============================================================================
# Setup UAT Authme — Create realm, clients, roles, and test users
# Run this after a fresh Authme UAT deployment
# ==============================================================================

set -e

UAT_IP=$(docker inspect crm-uat-authme --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1)
ADMIN_KEY="uat-authme-admin-key-c9h5d1e6g8h0i2j4k6l8m1n3o5p7q9r1"
H="x-admin-api-key: $ADMIN_KEY"
URL="http://$UAT_IP:3001"

echo "Authme UAT IP: $UAT_IP"

# ── Create realm ────────────────────────────────────────────────────────
echo ""
echo "=== Creating realm: real-estate-uat ==="
curl -s -X POST "$URL/admin/realms" -H "Content-Type: application/json" -H "$H" \
  -d '{"name":"real-estate-uat","displayName":"Real Estate CRM (UAT)","registrationAllowed":false}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  Realm: {d.get(\"name\",\"FAILED\")} (id: {d.get(\"id\",\"?\")})')" 2>&1

# ── Create clients ──────────────────────────────────────────────────────
echo ""
echo "=== Creating clients ==="
for client in admin-portal agent-portal crm-backend; do
  RES=$(curl -s -X POST "$URL/admin/realms/real-estate-uat/clients" -H "Content-Type: application/json" -H "$H" \
    -d "{\"clientId\":\"$client\",\"name\":\"$client\"}")
  SECRET=$(echo "$RES" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('clientSecret',''))" 2>/dev/null)
  echo "  $client: secret=$SECRET"
done

# ── Enable password grant on crm-backend ────────────────────────────────
echo ""
echo "=== Enabling password grant on crm-backend ==="
CRM_ID=$(curl -s "$URL/admin/realms/real-estate-uat/clients" -H "$H" | python3 -c "
import json,sys
for c in json.load(sys.stdin):
    if c['clientId']=='crm-backend': print(c['id'])" 2>/dev/null)
curl -s -X PATCH "$URL/admin/realms/real-estate-uat/clients/$CRM_ID" \
  -H "Content-Type: application/json" -H "$H" \
  -d '{"grantTypes":["authorization_code","password","client_credentials","refresh_token"]}' > /dev/null
echo "  Done (client ID: $CRM_ID)"

# ── Update admin-portal redirect URIs ───────────────────────────────────
ADMIN_ID=$(curl -s "$URL/admin/realms/real-estate-uat/clients" -H "$H" | python3 -c "
import json,sys
for c in json.load(sys.stdin):
    if c['clientId']=='admin-portal': print(c['id'])" 2>/dev/null)
curl -s -X PATCH "$URL/admin/realms/real-estate-uat/clients/$ADMIN_ID" \
  -H "Content-Type: application/json" -H "$H" \
  -d '{"redirectUris":["https://uat-admin.realstate-crm.homes/callback"],"webOrigins":["https://uat-admin.realstate-crm.homes"]}' > /dev/null

AGENT_ID=$(curl -s "$URL/admin/realms/real-estate-uat/clients" -H "$H" | python3 -c "
import json,sys
for c in json.load(sys.stdin):
    if c['clientId']=='agent-portal': print(c['id'])" 2>/dev/null)
curl -s -X PATCH "$URL/admin/realms/real-estate-uat/clients/$AGENT_ID" \
  -H "Content-Type: application/json" -H "$H" \
  -d '{"redirectUris":["https://uat-agent.realstate-crm.homes/callback"],"webOrigins":["https://uat-agent.realstate-crm.homes"]}' > /dev/null
echo "  Updated redirect URIs for admin-portal and agent-portal"

# ── Create roles ────────────────────────────────────────────────────────
echo ""
echo "=== Creating roles ==="
for role in admin manager agent; do
  curl -s -X POST "$URL/admin/realms/real-estate-uat/roles" -H "Content-Type: application/json" -H "$H" \
    -d "{\"name\":\"$role\"}" > /dev/null
  echo "  Created: $role"
done

# ── Create test users ───────────────────────────────────────────────────
echo ""
echo "=== Creating test users ==="
for entry in "admin-test:admin@crm-test.com:Admin123!:Islam:Admin:admin" \
             "manager-test:manager@crm-test.com:Manager123!:Sara:Manager:manager" \
             "agent-test:agent@crm-test.com:Agent123!:Ahmed:Agent:agent"; do
  IFS=':' read -r username email password first last role <<< "$entry"
  USER_ID=$(curl -s -X POST "$URL/admin/realms/real-estate-uat/users" -H "Content-Type: application/json" -H "$H" \
    -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"firstName\":\"$first\",\"lastName\":\"$last\"}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','FAILED'))" 2>/dev/null)
  echo "  $email (id: $USER_ID)"
  # Assign role
  curl -s -X POST "$URL/admin/realms/real-estate-uat/users/$USER_ID/role-mappings/realm" \
    -H "Content-Type: application/json" -H "$H" \
    -d "{\"roleNames\":[\"$role\"]}" > /dev/null
  echo "    → assigned role: $role"
done

# ── Get crm-backend secret ─────────────────────────────────────────────
echo ""
echo "=== crm-backend client secret ==="
NEW_SECRET=$(curl -s "$URL/admin/realms/real-estate-uat/clients" -H "$H" | python3 -c "
import json,sys
for c in json.load(sys.stdin):
    if c['clientId']=='crm-backend':
        # Secret is only shown on create, regenerate it
        pass
" 2>/dev/null)

# Regenerate secret
echo "  Regenerating secret..."
REGEN=$(curl -s -X POST "$URL/admin/realms/real-estate-uat/clients/$CRM_ID/secret" -H "$H")
SECRET=$(echo "$REGEN" | python3 -c "import json,sys; print(json.load(sys.stdin).get('secret',''))" 2>/dev/null)
echo "  New secret: $SECRET"
echo ""
echo "=== IMPORTANT: Update docker-compose.uat-server.yml with this secret ==="
echo "  AUTHME_CLIENT_SECRET: $SECRET"

# ── Verify ──────────────────────────────────────────────────────────────
echo ""
echo "=== Verification ==="
echo "OIDC Discovery:"
curl -s "https://uat-auth.realstate-crm.homes/realms/real-estate-uat/.well-known/openid-configuration" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  issuer: {d[\"issuer\"]}')" 2>&1

echo ""
echo "Token test:"
curl -s -X POST "$URL/realms/real-estate-uat/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=crm-backend&client_secret=$SECRET&username=admin-test&password=Admin123!" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  TOKEN OK' if 'access_token' in d else f'  FAILED: {d}')" 2>&1

echo ""
echo "=== Done! ==="
