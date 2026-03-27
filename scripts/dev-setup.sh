#!/usr/bin/env bash
# ==============================================================================
# Real Estate CRM — Dev Environment Setup
# ==============================================================================
# One script to boot the full dev environment.
#
# Usage:
#   ./scripts/dev-setup.sh
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Prerequisites ─────────────────────────────────────────────────────────────

info "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || err "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
command -v node >/dev/null 2>&1   || err "Node.js is not installed. Install it from https://nodejs.org/"

DOCKER_VERSION=$(docker --version)
NODE_VERSION=$(node --version)
ok "Docker: $DOCKER_VERSION"
ok "Node:   $NODE_VERSION"

# Check Docker daemon is running
docker info >/dev/null 2>&1 || err "Docker daemon is not running. Start Docker and try again."
ok "Docker daemon is running"

# ── Environment file ─────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  info "Copying .env.dev to .env..."
  cp .env.dev .env
  ok ".env created from .env.dev"
else
  warn ".env already exists — skipping copy (delete it to reset)"
fi

# ── Start services ────────────────────────────────────────────────────────────

info "Starting all services with docker compose..."
docker compose -f docker-compose.dev-full.yml up -d --build

# ── Wait for databases ───────────────────────────────────────────────────────

info "Waiting for CRM database to be ready..."
RETRIES=30
until docker compose -f docker-compose.dev-full.yml exec -T db pg_isready -U postgres >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    err "CRM database did not become ready in time"
  fi
  sleep 2
done
ok "CRM database is ready"

info "Waiting for AuthMe database to be ready..."
RETRIES=30
until docker compose -f docker-compose.dev-full.yml exec -T authme-db pg_isready -U authme >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    err "AuthMe database did not become ready in time"
  fi
  sleep 2
done
ok "AuthMe database is ready"

# ── Run Prisma migrations ────────────────────────────────────────────────────

info "Running Prisma migrations..."
docker compose -f docker-compose.dev-full.yml exec -T app npx prisma migrate dev --skip-generate 2>&1 || {
  warn "Prisma migrate failed — this is expected on first run if the app container is still starting."
  warn "You can run manually: docker compose -f docker-compose.dev-full.yml exec app npx prisma migrate dev"
}

# ── Print service URLs ───────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Dev Environment is Ready!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${CYAN}NestJS Backend:${NC}    http://localhost:3000"
echo -e "  ${CYAN}Admin Portal:${NC}      http://localhost:5173"
echo -e "  ${CYAN}Agent Portal:${NC}      http://localhost:5174"
echo -e "  ${CYAN}AuthMe IAM:${NC}        http://localhost:3001"
echo -e "  ${CYAN}AuthMe Admin:${NC}      http://localhost:3001/admin"
echo -e "  ${CYAN}CRM PostgreSQL:${NC}    localhost:5432"
echo -e "  ${CYAN}AuthMe PostgreSQL:${NC} localhost:5433"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "    1. Configure AuthMe realm — see docs/authme-setup.md"
echo -e "    2. Run seed data: docker compose -f docker-compose.dev-full.yml exec app npm run prisma:seed"
echo ""
