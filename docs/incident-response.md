# Incident Response Procedures — Real Estate CRM

## Severity Levels

| Level | Definition | Response Time | Examples |
|-------|-----------|--------------|----------|
| P0 | Service down, all users affected | 15 min | API 502, DB down, Auth down |
| P1 | Major feature broken | 1 hour | Login fails, data not saving |
| P2 | Minor feature broken | 4 hours | PDF generation fails, email not sending |
| P3 | Cosmetic / low impact | Next sprint | UI glitch, slow page |

## Quick Diagnosis

### 1. Check All Services

```bash
ssh islam@34.24.250.172

# All containers
docker ps --filter "name=crm" --format "table {{.Names}}\t{{.Status}}"

# Health endpoints
curl -s https://api.realstate-crm.homes/api/health
curl -s https://dev-api.realstate-crm.homes/api/health
curl -s https://qa-api.realstate-crm.homes/api/health
```

### 2. Check Logs

```bash
# Backend logs
docker logs crm-prod-app --tail 100 --since 10m

# Authme logs
docker logs crm-prod-authme --tail 50

# Nginx logs
docker logs crm-nginx --tail 50
```

### 3. Check Database

```bash
docker exec postgres-prod psql -U crm_user -d real_estate_crm_prod -c "SELECT 1;"
```

## Common Issues & Fixes

### API returns 502
**Cause:** Backend container down or not on nginx network.
```bash
docker restart crm-prod-app
sleep 10
docker network connect crm-prod_crm-prod-network crm-nginx
docker exec crm-nginx nginx -s reload
```

### Authme returns 502
**Cause:** Authme container crashing (missing DB tables or env vars).
```bash
docker logs crm-prod-authme --tail 20
# If "table does not exist" — run migrations
docker run --rm --network crm-prod_crm-prod-network \
  -e DATABASE_URL="postgresql://authme:authme-prod-secure-change-me@crm-prod-authme-db:5432/authme_prod" \
  islamawad/authme sh -c "npx prisma migrate deploy"
docker restart crm-prod-authme
```

### Login fails (CORS / redirect error)
**Check:**
1. Authme client redirect URIs match the frontend URL
2. CSP `connect-src` allows the API URL
3. Nginx CORS headers are present

### Database connection refused
```bash
docker ps --filter "name=postgres-prod"
# If down:
cd /apps && docker compose -f postgres-compose.yml up -d postgres-prod
```

### Disk space full
```bash
df -h /
# Clean up:
docker system prune -f
# Remove old backups
find /apps/backups -name "*.sql.gz" -mtime +30 -delete
```

## Escalation

1. **On-call engineer** — check logs, restart containers
2. **Islam (Project Lead)** — infrastructure changes, DB operations
3. **Rollback** — if fix takes >30 min for P0, rollback to previous image
