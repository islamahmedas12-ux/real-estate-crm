#!/bin/bash
# ==============================================================================
# Database Backup Script — Real Estate CRM
# Issue: #70 (M4-3)
#
# Usage: ./scripts/backup-db.sh [env]
#   env: dev, qa, uat, prod (default: prod)
#
# Cron (daily 2AM):
#   0 2 * * * /apps/real-estate-crm/scripts/backup-db.sh prod >> /var/log/crm-backup.log 2>&1
# ==============================================================================

set -e

ENV="${1:-prod}"
BACKUP_DIR="/apps/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Database config per environment
declare -A DB_HOST=([dev]="localhost" [qa]="localhost" [uat]="localhost" [prod]="localhost")
declare -A DB_PORT=([dev]="5432" [qa]="5433" [uat]="5434" [prod]="5435")
declare -A DB_NAME=([dev]="real_estate_crm_dev" [qa]="real_estate_crm_qa" [uat]="real_estate_crm_uat" [prod]="real_estate_crm_prod")
declare -A DB_USER=([dev]="crm_user" [qa]="crm_user" [uat]="crm_user" [prod]="crm_user")
declare -A CONTAINER=([dev]="postgres-dev" [qa]="postgres-qa" [uat]="postgres-uat" [prod]="postgres-prod")

HOST=${DB_HOST[$ENV]}
PORT=${DB_PORT[$ENV]}
NAME=${DB_NAME[$ENV]}
USER=${DB_USER[$ENV]}
CTR=${CONTAINER[$ENV]}

if [ -z "$NAME" ]; then
  echo "Unknown environment: $ENV"
  exit 1
fi

BACKUP_FILE="${BACKUP_DIR}/${ENV}/${NAME}_${DATE}.sql.gz"
mkdir -p "${BACKUP_DIR}/${ENV}"

echo "[$(date -Iseconds)] Starting backup: $ENV ($NAME)"

# Dump using docker exec to avoid needing pg tools on host
docker exec "$CTR" pg_dump -U "$USER" "$NAME" | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: $BACKUP_FILE ($SIZE)"

# Cleanup old backups
DELETED=$(find "${BACKUP_DIR}/${ENV}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date -Iseconds)] Cleaned up $DELETED old backup(s) (>${RETENTION_DAYS} days)"
fi

# Verify backup integrity
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "[$(date -Iseconds)] Backup verified: OK"
else
  echo "[$(date -Iseconds)] ERROR: Backup file is corrupt!"
  exit 1
fi

echo "[$(date -Iseconds)] Done."
