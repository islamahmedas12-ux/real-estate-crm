# Quick Start Guide - Real Estate CRM Dev Environment

## TL;DR

You need **Docker** to run this. Once you have it:

```bash
cd real-estate-crm
bash scripts/dev-setup.sh
```

That's it! Everything else is automated. ~2-3 minutes and you're done.

---

## Choose Your Path

### 🐧 Linux? Run This
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Then run setup
bash scripts/dev-setup.sh
```

### 🖥️ Mac/Windows? Use Docker Desktop
1. Download: https://www.docker.com/products/docker-desktop
2. Install & start it
3. Run: `bash scripts/dev-setup.sh`

### ☁️ Cloud VPS? Easy
```bash
# Create VM with Docker (any cloud provider)
git clone -b dev https://github.com/islamahmedas12-ux/real-estate-crm.git
bash scripts/dev-setup.sh
```

---

## What Happens When You Run Setup

```
[INFO] Checking prerequisites...
[OK]   Docker: Docker version X.XX.X
[OK]   Node:   vX.X.X
[OK]   Docker daemon is running
[INFO] Copying .env.dev to .env...
[OK]   .env created from .env.dev
[INFO] Starting all services...
[INFO] Waiting for CRM database...
[OK]   CRM database is ready
[INFO] Waiting for AuthMe database...
[OK]   AuthMe database is ready
[INFO] Running Prisma migrations...

============================================
  Dev Environment is Ready!
============================================

  NestJS Backend:    http://localhost:3000
  Admin Portal:      http://localhost:5173
  Agent Portal:      http://localhost:5174
  AuthMe IAM:        http://localhost:3001
  AuthMe Admin:      http://localhost:3001/admin
  CRM PostgreSQL:    localhost:5432
  AuthMe PostgreSQL: localhost:5433
```

---

## Test It

```bash
# Backend working?
curl http://localhost:3000/health

# Admin UI working?
open http://localhost:5173

# Agent UI working?
open http://localhost:5174

# AuthMe working?
curl http://localhost:3001/health
```

---

## Services Running

| Service | Port | What It Is |
|---------|------|-----------|
| Backend | 3000 | NestJS API |
| Admin UI | 5173 | React dashboard |
| Agent UI | 5174 | Agent portal |
| AuthMe | 3001 | Auth server |
| CRM DB | 5432 | Main database |
| AuthMe DB | 5433 | Auth database |

---

## Stuck?

See **`docs/SETUP_TROUBLESHOOTING.md`** for solutions to common issues.

Key commands:
```bash
# See what's running
docker compose -f docker-compose.dev-full.yml ps

# Check backend logs
docker compose -f docker-compose.dev-full.yml logs app

# Check database
docker compose -f docker-compose.dev-full.yml logs db

# Restart everything
docker compose -f docker-compose.dev-full.yml restart
```

---

## Next Steps

1. **Configure AuthMe** → See `docs/authme-setup.md`
2. **Seed test data** → `npm run prisma:seed`
3. **Run tests** → `npm run test:e2e`
4. **Start coding!** → Backend auto-reloads on file changes

---

## One More Thing

All 6 services are **already configured** to:
- ✅ Use shared Docker network
- ✅ Auto-start in correct order
- ✅ Auto-restart on crash
- ✅ Log to console
- ✅ Hot-reload on code changes

Just run the script and you're done! 🚀
