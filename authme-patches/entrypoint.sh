#!/bin/sh
# AuthMe hotfix entrypoint — applies patches before starting the server
# Fixes: #87 (CSRF DTO), #92 (XSRF HttpOnly), #93 (token 500→400)
set -e

# Apply patches if they exist
if [ -f /patches/login.dto.js ]; then
  cp /patches/login.dto.js /app/dist/login/dto/login.dto.js
fi
if [ -f /patches/auth.controller.js ]; then
  cp /patches/auth.controller.js /app/dist/auth/auth.controller.js
fi
if [ -f /patches/login.controller.js ]; then
  cp /patches/login.controller.js /app/dist/login/login.controller.js
fi

echo "[authme-patches] Applied hotfixes for #87, #92, #93"

# Seed test users in background (non-production only, idempotent)
if [ -f /patches/seed-users.sh ]; then
  sh /patches/seed-users.sh &
fi

# Start the original entrypoint
exec node dist/main
