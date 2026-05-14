# Deployment Runbook — Real Estate CRM

## Environments

| Env | API | Admin | Agent | Auth | DB Port |
|-----|-----|-------|-------|------|---------|
| Dev | dev-api.realstate-crm.homes | dev-admin.realstate-crm.homes | dev-agent.realstate-crm.homes | dev-auth.realstate-crm.homes | 5432 |
| QA | qa-api.realstate-crm.homes | qa-admin.realstate-crm.homes | qa-agent.realstate-crm.homes | qa-auth.realstate-crm.homes | 5433 |
| UAT | uat-api.realstate-crm.homes | uat-admin.realstate-crm.homes | uat-agent.realstate-crm.homes | uat-auth.realstate-crm.homes | 5434 |
| Prod | api.realstate-crm.homes | admin.realstate-crm.homes | agent.realstate-crm.homes | auth.realstate-crm.homes | 5435 |

## Server Access

```bash
ssh islam@34.24.250.172
```

## Directory Structure

```
/apps/
├── real-estate-crm/          # Backend repo (cloned from GitHub)
│   ├── docker-compose.dev-server.yml
│   ├── docker-compose.qa-server.yml
│   ├── docker-compose.uat-server.yml
│   ├── docker-compose.prod-server.yml
│   └── scripts/
│       ├── setup-qa-authme.sh
│       ├── setup-uat-authme.sh
│       ├── setup-prod-authme.sh
│       └── backup-db.sh
├── web/                       # Frontend builds (served by Nginx)
│   ├── admin-ui/              # Dev Admin
│   ├── agent-ui/              # Dev Agent
│   ├── qa-admin-ui/
│   ├── qa-agent-ui/
│   ├── uat-admin-ui/
│   ├── uat-agent-ui/
│   ├── prod-admin-ui/
│   └── prod-agent-ui/
├── nginx/conf.d/              # Nginx config
├── postgres-compose.yml       # Standalone PostgreSQL containers
└── backups/                   # Database backups
```

## Automated Deployment (CI/CD)

Push to branch → GitHub Actions → Build + Deploy automatically.

| Branch | Workflow | What happens |
|--------|----------|-------------|
| `dev` | CD → Dev | Build Docker image, build frontends `--mode dev`, SSH deploy |
| `qa` | CD → QA | Build Docker image, build frontends `--mode qa`, SSH deploy |
| `uat` | CD → UAT | Build Docker image, build frontends `--mode uat`, SSH deploy |
| `prod` | CD → Production | Build Docker image, build frontends `--mode prod`, SSH deploy |

## Manual Deployment

### 1. Deploy Backend (any environment)

```bash
ssh islam@34.24.250.172
cd /apps/real-estate-crm

# Pull latest image
export APP_IMAGE="ghcr.io/islamahmedas12-ux/real-estate-crm:<env>"
docker pull $APP_IMAGE

# Restart
docker compose -f docker-compose.<env>-server.yml up -d app
```

### 2. Deploy Frontend

```bash
cd /apps/real-estate-crm

# Build with correct env
cd admin-ui && npx vite build --mode <env> && cd ..
cd agent-ui && npx vite build --mode <env> && cd ..

# Copy to web directory
rm -rf /apps/web/<env>-admin-ui/* && cp -r admin-ui/dist/* /apps/web/<env>-admin-ui/
rm -rf /apps/web/<env>-agent-ui/* && cp -r agent-ui/dist/* /apps/web/<env>-agent-ui/
```

### 3. Run Database Migrations

```bash
export DATABASE_URL="postgresql://crm_user:<password>@localhost:<port>/<db_name>"
npx prisma migrate deploy
```

### 4. Seed Database

```bash
export DATABASE_URL="postgresql://crm_user:<password>@localhost:<port>/<db_name>"
npx tsx prisma/seed.ts
```

## Rollback Procedure

### Backend Rollback

```bash
# Find previous image
docker images | grep real-estate-crm

# Use specific SHA tag
export APP_IMAGE="ghcr.io/islamahmedas12-ux/real-estate-crm:sha-<previous>"
docker compose -f docker-compose.<env>-server.yml up -d app
```

### Database Rollback

```bash
# Restore from backup
gunzip < /apps/backups/<env>/<backup_file>.sql.gz | \
  docker exec -i postgres-<env> psql -U crm_user -d <db_name>
```

## Health Checks

```bash
# API
curl https://<env>-api.realstate-crm.homes/api/health

# All containers
docker ps --filter "name=crm-<env>"

# Container logs
docker logs crm-<env>-app --tail 50
```

## Authme Setup (after fresh deploy)

```bash
cd /apps/real-estate-crm
bash scripts/setup-<env>-authme.sh
```

## Database Backup

```bash
# Manual backup
bash /apps/real-estate-crm/scripts/backup-db.sh <env>

# Cron (daily 2AM for prod)
0 2 * * * /apps/real-estate-crm/scripts/backup-db.sh prod >> /var/log/crm-backup.log 2>&1
```

## Troubleshooting

### Container won't start
```bash
docker logs crm-<env>-app --tail 100
```

### Nginx 502 Bad Gateway
```bash
# Check if app container is on the correct network
docker network connect crm-<env>_crm-<env>-network crm-nginx
docker exec crm-nginx nginx -s reload
```

### Authme crash loop
```bash
# Usually missing DB tables — run migrations
docker run --rm --network crm-<env>_crm-<env>-network \
  -e DATABASE_URL="postgresql://authme:<pw>@crm-<env>-authme-db:5432/authme_<env>" \
  islamawad/authme sh -c "npx prisma migrate deploy"
docker restart crm-<env>-authme
```

### Docker Compose conflicts between environments
Each compose file has `name: crm-<env>` to prevent cross-env interference. If containers conflict:
```bash
docker stop $(docker ps -q --filter "name=crm-<env>")
docker rm $(docker ps -aq --filter "name=crm-<env>")
docker compose -f docker-compose.<env>-server.yml up -d
```
