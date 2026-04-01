#!/bin/sh
# Seed test users for non-production AuthMe realms
# Runs in background after AuthMe starts — idempotent (skips if users exist)
set -e

ADMIN_PORT="${PORT:-3001}"
BASE="http://localhost:${ADMIN_PORT}"
REALM="${AUTHME_REALM:-real-estate-qa}"
API_KEY="${ADMIN_API_KEY}"

# Wait for AuthMe to be ready (up to 30s)
echo "[seed-users] Waiting for AuthMe to be ready..."
for i in $(seq 1 30); do
  if wget -qO- "${BASE}/realms/${REALM}/.well-known/openid-configuration" >/dev/null 2>&1; then
    echo "[seed-users] AuthMe is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[seed-users] AuthMe not ready after 30s — skipping seed"
    exit 0
  fi
  sleep 1
done

# Helper: create user if not exists
create_user() {
  username="$1"
  password="$2"
  first="$3"
  last="$4"
  role="$5"

  # Check if user exists
  existing=$(wget -qO- \
    --header="X-Admin-Api-Key: ${API_KEY}" \
    "${BASE}/admin/realms/${REALM}/users?search=${username}" 2>/dev/null || echo '{"users":[],"total":0}')

  if echo "$existing" | grep -q "\"username\":\"${username}\""; then
    echo "[seed-users] User ${username} already exists — skipping"
    return 0
  fi

  # Create user
  response=$(wget -qO- \
    --header="X-Admin-Api-Key: ${API_KEY}" \
    --header="Content-Type: application/json" \
    --post-data="{\"username\":\"${username}\",\"email\":\"${username}\",\"password\":\"${password}\",\"firstName\":\"${first}\",\"lastName\":\"${last}\",\"enabled\":true}" \
    "${BASE}/admin/realms/${REALM}/users" 2>/dev/null || echo "FAILED")

  if echo "$response" | grep -q "FAILED"; then
    echo "[seed-users] Failed to create ${username}"
    return 1
  fi

  echo "[seed-users] Created user: ${username}"
}

# Seed test users
create_user "admin@crm.test"   "Admin@123!" "QA" "Admin"   "admin"
create_user "agent@crm.test"   "Agent@123!" "QA" "Agent"   "agent"
create_user "manager@crm.test" "Manager@123!" "QA" "Manager" "manager"

echo "[seed-users] Seeding complete"
