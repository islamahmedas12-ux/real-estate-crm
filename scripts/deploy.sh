#!/usr/bin/env bash
# ==============================================================================
# Real Estate CRM — Deployment Script
# ==============================================================================
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
APP_NAME="real-estate-crm"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
ENV_FILE="$PROJECT_DIR/.env"
BACKUP_DIR="$PROJECT_DIR/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# ── Pre-flight checks ───────────────────────────────────────────────────────
preflight() {
    log "Running pre-flight checks..."

    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        # Fallback to docker-compose v1
        if ! command -v docker-compose &> /dev/null; then
            error "Docker Compose is not installed."
            exit 1
        fi
    fi

    if [ ! -f "$ENV_FILE" ]; then
        error ".env file not found. Copy .env.example and configure it:"
        error "  cp .env.example .env"
        exit 1
    fi

    log "Pre-flight checks passed."
}

# ── Database backup ──────────────────────────────────────────────────────────
backup_db() {
    log "Backing up database..."
    mkdir -p "$BACKUP_DIR"

    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_${timestamp}.sql.gz"

    if docker compose -f "$COMPOSE_FILE" ps db --status running -q 2>/dev/null | grep -q .; then
        docker compose -f "$COMPOSE_FILE" exec -T db \
            pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-real_estate_crm}" \
            | gzip > "$backup_file"
        log "Database backed up to: $backup_file"
    else
        warn "Database container not running. Skipping backup."
    fi
}

# ── Build & deploy ───────────────────────────────────────────────────────────
deploy() {
    log "Building production images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache

    log "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" run --rm app \
        npx prisma migrate deploy

    log "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d

    log "Waiting for health checks..."
    local retries=30
    local count=0
    while [ $count -lt $retries ]; do
        if docker compose -f "$COMPOSE_FILE" ps app --status running -q 2>/dev/null | grep -q .; then
            # Check the health endpoint
            if curl -sf http://localhost:${HTTP_PORT:-80}/api/health > /dev/null 2>&1; then
                log "Application is healthy!"
                return 0
            fi
        fi
        count=$((count + 1))
        echo -n "."
        sleep 2
    done

    error "Application failed health check after ${retries} attempts."
    error "Check logs: docker compose -f $COMPOSE_FILE logs app"
    return 1
}

# ── Rollback ─────────────────────────────────────────────────────────────────
rollback() {
    warn "Rolling back to previous images..."
    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d
    log "Rollback complete. Check application health manually."
}

# ── Status ───────────────────────────────────────────────────────────────────
status() {
    log "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log "Health check:"
    curl -s http://localhost:${HTTP_PORT:-80}/api/health 2>/dev/null || echo "Not reachable"
}

# ── Logs ─────────────────────────────────────────────────────────────────────
show_logs() {
    docker compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# ── Cleanup ──────────────────────────────────────────────────────────────────
cleanup() {
    log "Cleaning up old Docker images..."
    docker image prune -f --filter "label=maintainer=Real Estate CRM Team"
    log "Cleanup complete."
}

# ── Main ─────────────────────────────────────────────────────────────────────
usage() {
    echo "Usage: $0 {deploy|rollback|status|logs|backup|cleanup}"
    echo ""
    echo "Commands:"
    echo "  deploy    Build and deploy the application"
    echo "  rollback  Roll back to previous deployment"
    echo "  status    Show service status and health"
    echo "  logs      Tail service logs"
    echo "  backup    Backup the database"
    echo "  cleanup   Remove old Docker images"
}

cd "$PROJECT_DIR"

case "${1:-}" in
    deploy)
        preflight
        backup_db
        deploy
        log "Deployment complete!"
        ;;
    rollback)
        rollback
        ;;
    status)
        status
        ;;
    logs)
        show_logs
        ;;
    backup)
        backup_db
        ;;
    cleanup)
        cleanup
        ;;
    *)
        usage
        exit 1
        ;;
esac
