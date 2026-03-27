# Production Deployment Guide

## Prerequisites

- Docker Engine 24+ and Docker Compose v2
- A server with at least 2 GB RAM and 10 GB disk
- PostgreSQL 16 (included in Docker Compose, or use a managed service)
- Authme IAM server ([setup guide](authme-setup.md))
- Domain name pointed to your server (optional, for HTTPS)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Islamawad132/real-estate-crm.git
cd real-estate-crm

# 2. Configure environment
cp .env.example .env
# Edit .env with your production values (database password, Authme secrets, etc.)

# 3. Build the Docker image
docker build -t real-estate-crm:latest .

# 4. Run database migrations
docker run --rm --env-file .env real-estate-crm:latest npx prisma migrate deploy

# 5. Start the application
docker compose up -d
```

The application will be available at:

| URL | Service |
|-----|---------|
| `http://your-server:3000` | Backend API + Portals |
| `http://your-server:3000/api/docs` | Swagger API Docs |

## Architecture

```
                    +-------------------+
                    |  Reverse Proxy    |
                    |  (Nginx / LB)    |
                    +--------+----------+
                             |
             +---------------+---------------+
             |               |               |
      /admin/*        /agent/*         /api/*
             |               |               |
    +--------+------+ +------+-------+ +-----+------+
    |  Admin UI     | |  Agent UI    | |  NestJS    |
    |  (static)     | |  (static)    | |  :3000     |
    +---------------+ +--------------+ +-----+------+
                                             |
                                      +------+------+
                                      | PostgreSQL  |
                                      |   :5432     |
                                      +-------------+
```

The production Docker image bundles the NestJS backend with both portal static builds in a single container.

## Docker Image Build

The Dockerfile uses a multi-stage build for an optimized production image:

1. **deps** -- Install backend Node.js dependencies
2. **admin-deps** -- Install Admin Portal dependencies
3. **agent-deps** -- Install Agent Portal dependencies
4. **build** -- Build Admin UI, Agent UI, generate Prisma client, build NestJS, copy UI assets into `dist/`
5. **production** -- Minimal runtime with only production dependencies, runs as non-root `node` user

```bash
# Build the production image
docker build -t real-estate-crm:latest .

# With a version tag
docker build -t real-estate-crm:1.0.0 .
```

## Environment Variables

Copy `.env.example` and configure for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://crm_user:STRONG_PW@db:5432/real_estate_crm` |
| `AUTHME_URL` | Authme IAM server URL | `https://auth.example.com` |
| `AUTHME_REALM` | Authme realm | `real-estate` |
| `AUTHME_CLIENT_ID` | Authme client ID | `crm-backend` |
| `AUTHME_CLIENT_SECRET` | Authme client secret | `<secret>` |
| `ADMIN_PORTAL_URL` | Admin UI URL (for CORS) | `https://admin.yourdomain.com` |
| `AGENT_PORTAL_URL` | Agent UI URL (for CORS) | `https://agent.yourdomain.com` |
| `PORT` | Backend port | `3000` |
| `NODE_ENV` | Must be `production` | `production` |
| `UPLOAD_DIR` | File upload directory | `/app/uploads` |

For Docker Compose production deployments, also set:

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database user | `crm_user` |
| `POSTGRES_PASSWORD` | Database password | `STRONG_PASSWORD` |
| `POSTGRES_DB` | Database name | `real_estate_crm` |
| `HTTP_PORT` | Host HTTP port | `80` |
| `HTTPS_PORT` | Host HTTPS port | `443` |

## Database Migrations

Apply migrations before starting (or after deploying a new version):

```bash
# Inside a running container
docker compose exec app npx prisma migrate deploy

# Or with a standalone container
docker run --rm \
  -e DATABASE_URL="postgresql://crm_user:PW@db-host:5432/real_estate_crm" \
  real-estate-crm:latest \
  npx prisma migrate deploy
```

To seed the database (first deployment only):

```bash
docker compose exec app npx ts-node prisma/seed.ts
```

## HTTPS / TLS

For production HTTPS, you have two options:

### Option A: TLS-terminating reverse proxy (recommended)

Place Cloudflare, AWS ALB, or another TLS-terminating proxy in front of this stack. The application container listens on port 3000; your upstream proxy handles TLS.

### Option B: Nginx with Certbot

Sample Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name crm.yourdomain.com;

    ssl_certificate     /etc/ssl/certs/crm.crt;
    ssl_certificate_key /etc/ssl/private/crm.key;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## Backup Strategy

### Database Backups

```bash
# Manual backup
docker compose exec db pg_dump -U postgres real_estate_crm > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker compose exec -T db psql -U postgres real_estate_crm

# Automated daily backups (add to crontab)
# 0 2 * * * cd /path/to/real-estate-crm && docker compose exec -T db pg_dump -U postgres real_estate_crm > /backups/crm_$(date +\%Y\%m\%d).sql
```

### File Uploads

The uploads volume should be backed up regularly:

```bash
docker run --rm -v crm_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_backup_$(date +%Y%m%d).tar.gz /data
```

## Monitoring

### Recommended Stack

| Aspect | Tool |
|--------|------|
| Application metrics | Prometheus + Grafana |
| Error tracking | Sentry |
| Log aggregation | Structured JSON logs (Pino) via ELK or Loki |
| Uptime monitoring | UptimeRobot / Pingdom |
| Database monitoring | pgAdmin / pg_stat_statements |

### Docker Health Checks

The `db` service has a built-in health check. Monitor with:

```bash
docker compose ps
```

## CI/CD Pipeline

The project includes GitHub Actions (`.github/workflows/ci.yml`) that run on every push/PR to `main`:

1. **Backend** -- Lint, type-check, unit tests (with PostgreSQL service), build
2. **Admin UI** -- Lint, type-check, build
3. **Agent UI** -- Lint, type-check, build
4. **Mobile (Flutter)** -- Analyze, test
5. **Docker Build** -- Verify the production image builds successfully

To add automated deployment, extend the CI pipeline with a deploy job after the Docker build succeeds.

## Troubleshooting

**Container won't start:**
```bash
docker compose logs app
docker compose logs db
```

**Database connection issues:**
```bash
docker compose exec db pg_isready -U postgres
```

**CORS errors in the browser:**
Ensure `ADMIN_PORTAL_URL` and `AGENT_PORTAL_URL` match the exact origins the portals are served from (include protocol, host, and port if non-standard).

**JWT validation failures:**
1. Confirm the Authme JWKS endpoint is accessible: `{AUTHME_URL}/realms/{AUTHME_REALM}/protocol/openid-connect/certs`
2. Verify `AUTHME_REALM` and `AUTHME_CLIENT_ID` match the Authme configuration
3. Check that the token has not expired

**Rebuild from scratch:**
```bash
docker compose down -v   # WARNING: deletes database volume
docker compose up -d --build
```
