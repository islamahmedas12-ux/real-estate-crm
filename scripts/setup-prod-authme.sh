#!/bin/bash
# ==============================================================================
# Setup Production Authme — Create realm, clients, roles, and admin user
# Run this after a fresh Authme production deployment
# ==============================================================================

set -e

PROD_IP=$(docker inspect crm-prod-authme --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | head -1)
ADMIN_KEY="prod-authme-admin-key-d0i6e2f7h9i1j3k5l7m9n0o2p4q6r8s0"
H="x-admin-api-key: $ADMIN_KEY"
URL="http://$PROD_IP:3001"

echo "Authme Production IP: $PROD_IP"

echo "=== Creating realm: real-estate ==="
curl -s -X POST "$URL/admin/realms" -H "Content-Type: application/json" -H "$H" \
  -d '{"name":"real-estate","displayName":"Real Estate CRM"}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  {d.get(\"name\",\"FAILED\")}')" 2>&1

echo "=== Creating clients ==="
for c in admin-portal agent-portal crm-backend; do
  curl -s -X POST "$URL/admin/realms/real-estate/clients" -H "Content-Type: application/json" -H "$H" -d "{\"clientId\":\"$c\",\"name\":\"$c\"}" > /dev/null
  echo "  $c"
done

ADMIN_CID=$(curl -s "$URL/admin/realms/real-estate/clients" -H "$H" | python3 -c "import json,sys; [print(c['id']) for c in json.load(sys.stdin) if c['clientId']=='admin-portal']")
AGENT_CID=$(curl -s "$URL/admin/realms/real-estate/clients" -H "$H" | python3 -c "import json,sys; [print(c['id']) for c in json.load(sys.stdin) if c['clientId']=='agent-portal']")
CRM_CID=$(curl -s "$URL/admin/realms/real-estate/clients" -H "$H" | python3 -c "import json,sys; [print(c['id']) for c in json.load(sys.stdin) if c['clientId']=='crm-backend']")

curl -s -X PATCH "$URL/admin/realms/real-estate/clients/$ADMIN_CID" -H "Content-Type: application/json" -H "$H" \
  -d '{"redirectUris":["https://admin.realstate-crm.homes/callback"],"webOrigins":["https://admin.realstate-crm.homes"]}' > /dev/null
curl -s -X PATCH "$URL/admin/realms/real-estate/clients/$AGENT_CID" -H "Content-Type: application/json" -H "$H" \
  -d '{"redirectUris":["https://agent.realstate-crm.homes/callback"],"webOrigins":["https://agent.realstate-crm.homes"]}' > /dev/null
curl -s -X PATCH "$URL/admin/realms/real-estate/clients/$CRM_CID" -H "Content-Type: application/json" -H "$H" \
  -d '{"grantTypes":["authorization_code","password","client_credentials","refresh_token"]}' > /dev/null
echo "  Updated redirect URIs and grant types"

echo "=== Creating roles ==="
for r in admin manager agent; do
  curl -s -X POST "$URL/admin/realms/real-estate/roles" -H "Content-Type: application/json" -H "$H" -d "{\"name\":\"$r\"}" > /dev/null
  echo "  $r"
done

echo "=== Creating admin user ==="
ADMIN_UID=$(curl -s -X POST "$URL/admin/realms/real-estate/users" -H "Content-Type: application/json" -H "$H" \
  -d '{"username":"admin","email":"admin@realstate-crm.homes","password":"ChangeMe123!","firstName":"Admin","lastName":"User"}' | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','FAILED'))")
curl -s -X POST "$URL/admin/realms/real-estate/users/$ADMIN_UID/role-mappings/realm" -H "Content-Type: application/json" -H "$H" -d '{"roleNames":["admin"]}' > /dev/null
echo "  admin@realstate-crm.homes → admin role (CHANGE PASSWORD!)"

echo ""
echo "=== Getting crm-backend secret ==="
curl -s -X DELETE "$URL/admin/realms/real-estate/clients/$CRM_CID" -H "$H" > /dev/null
RES=$(curl -s -X POST "$URL/admin/realms/real-estate/clients" -H "Content-Type: application/json" -H "$H" -d '{"clientId":"crm-backend","name":"CRM Backend"}')
SECRET=$(echo "$RES" | python3 -c "import json,sys; print(json.load(sys.stdin).get('clientSecret',''))")
NEW_CID=$(echo "$RES" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))")
curl -s -X PATCH "$URL/admin/realms/real-estate/clients/$NEW_CID" -H "Content-Type: application/json" -H "$H" \
  -d '{"grantTypes":["authorization_code","password","client_credentials","refresh_token"]}' > /dev/null
echo "  Secret: $SECRET"
echo ""
echo "⚠️  Update docker-compose.prod-server.yml:"
echo "  AUTHME_CLIENT_SECRET: $SECRET"

echo ""
echo "=== Verification ==="
curl -s "https://auth.realstate-crm.homes/realms/real-estate/.well-known/openid-configuration" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'issuer: {d[\"issuer\"]}')" 2>&1
echo ""
echo "=== Done! ==="
