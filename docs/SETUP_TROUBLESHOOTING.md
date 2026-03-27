# Dev Environment Troubleshooting Guide

## Quick Diagnosis

Run this script to diagnose your setup:

```bash
#!/bin/bash
echo "=== Environment Diagnostics ==="
echo ""

echo "✓ Docker:"
docker --version || echo "  ❌ Docker not installed"
docker info >/dev/null 2>&1 && echo "  ✅ Docker daemon running" || echo "  ❌ Docker daemon not running"

echo ""
echo "✓ Docker Compose:"
docker compose --version || echo "  ❌ Docker Compose not installed"

echo ""
echo "✓ Node.js:"
node --version || echo "  ❌ Node.js not installed"
npm --version || echo "  ❌ npm not installed"

echo ""
echo "✓ Git:"
git --version || echo "  ❌ Git not installed"

echo ""
echo "✓ File Checks:"
[ -f .env.dev ] && echo "  ✅ .env.dev exists" || echo "  ❌ .env.dev missing"
[ -f docker-compose.dev-full.yml ] && echo "  ✅ docker-compose.dev-full.yml exists" || echo "  ❌ Missing"
[ -f scripts/dev-setup.sh ] && echo "  ✅ scripts/dev-setup.sh exists" || echo "  ❌ Missing"

echo ""
echo "=== Diagnostics Complete ==="
```

---

## Common Issues & Solutions

### 1. "Docker is not installed"

**Symptoms:**
```
[ERROR] Docker is not installed. Install it from https://docs.docker.com/get-docker/
```

**Solution for Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (avoids needing sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

**Solution for macOS:**
```bash
# Using Homebrew
brew install docker docker-compose

# OR download Docker Desktop from https://www.docker.com/products/docker-desktop
```

**Solution for Windows:**
- Download Docker Desktop: https://www.docker.com/products/docker-desktop
- Install and restart
- Enable WSL2 backend (recommended)

---

### 2. "Docker daemon is not running"

**Symptoms:**
```
[ERROR] Docker daemon is not running. Start Docker and try again.
```

**Solution:**

**On Linux:**
```bash
sudo systemctl start docker

# Or enable auto-start
sudo systemctl enable docker

# Verify
sudo systemctl status docker
```

**On macOS:**
```bash
# Docker Desktop is not running
open -a Docker

# Wait for Docker icon to appear in menu bar
# Then retry setup
```

**On Windows:**
```powershell
# Start Docker Desktop from Start Menu
# OR from PowerShell (Admin):
wsl --list --verbose  # Check WSL status
```

---

### 3. "Permission denied while trying to connect to Docker daemon"

**Symptoms:**
```
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

**Solution:**
```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes without logging out
newgrp docker

# Verify
docker ps

# If still issues, restart Docker daemon
sudo systemctl restart docker
```

---

### 4. "Port 5432 is already in use"

**Symptoms:**
```
docker: Error response from daemon: driver failed programming external connectivity on endpoint db: ...
Error starting userland proxy: listen tcp 127.0.0.1:5432: bind: address already in use.
```

**Solution:**

**Option A: Stop conflicting service**
```bash
# If PostgreSQL is running directly on system
sudo systemctl stop postgresql

# If another Docker container is using it
docker ps | grep 5432
docker stop <container-name>
```

**Option B: Use different port**
Edit `docker-compose.dev-full.yml`:
```yaml
db:
  ports:
    - "127.0.0.1:15432:5432"  # Changed from 5432

# Update .env accordingly
DATABASE_URL=postgresql://postgres:postgres@localhost:15432/real_estate_crm
```

---

### 5. "Database did not become ready in time"

**Symptoms:**
```
[ERROR] CRM database did not become ready in time
```

**Solution:**

**Check database logs:**
```bash
docker compose -f docker-compose.dev-full.yml logs db

# Look for error messages about:
# - Disk space issues
# - Memory constraints
# - Permission errors
```

**Increase wait timeout:**
Edit `scripts/dev-setup.sh`, change `RETRIES=30` to `RETRIES=60` (allows 2 minutes instead of 1)

**Check Docker resources:**
```bash
# Verify Docker has enough resources
docker system df

# Check if system is out of disk space
df -h

# Check memory
free -h
```

**Manually check database:**
```bash
docker compose -f docker-compose.dev-full.yml exec db pg_isready -U postgres
```

---

### 6. "Prisma migration failed"

**Symptoms:**
```
[WARN] Prisma migrate failed — this is expected on first run...
```

**Solution:**

This is usually **not a critical error** on first run. The app container might still be starting. Try manually:

```bash
# Wait a bit, then run manually
sleep 30
docker compose -f docker-compose.dev-full.yml exec app npx prisma migrate dev

# If this fails, check app logs
docker compose -f docker-compose.dev-full.yml logs app

# Look for:
# - Database connection errors
# - Node.js startup errors
# - Missing environment variables
```

**If migration still fails:**
```bash
# Ensure app container is running
docker compose -f docker-compose.dev-full.yml ps

# If app isn't running, debug
docker compose -f docker-compose.dev-full.yml logs app

# Common issues:
# 1. NODE_ENV not set
# 2. DATABASE_URL malformed
# 3. Dependencies not installed
```

---

### 7. "Cannot find module '@nestjs/...'"

**Symptoms:**
```
Error: Cannot find module '@nestjs/core' ...
```

**Solution:**

```bash
# Ensure node_modules is installed
docker compose -f docker-compose.dev-full.yml exec app npm install

# Or rebuild the app image
docker compose -f docker-compose.dev-full.yml down
docker compose -f docker-compose.dev-full.yml build --no-cache app
docker compose -f docker-compose.dev-full.yml up -d app
```

---

### 8. "Admin UI / Agent UI not starting"

**Symptoms:**
```
admin-ui_1  | ERR! code EACCES
admin-ui_1  | ERR! syscall mkdir
```

**Solution:**

The volumes might have permission issues. Clear and rebuild:

```bash
# Stop services
docker compose -f docker-compose.dev-full.yml down

# Remove node_modules volumes (if created with wrong permissions)
docker volume ls | grep crm
docker volume rm <volume-names>

# Rebuild
docker compose -f docker-compose.dev-full.yml build --no-cache
docker compose -f docker-compose.dev-full.yml up -d
```

---

### 9. "All services running but pages show 502 Bad Gateway"

**Symptoms:**
- Docker containers all say "Up"
- But http://localhost:5173 shows 502 Bad Gateway
- Or http://localhost:3000 shows connection refused

**Solution:**

**Check backend logs:**
```bash
docker compose -f docker-compose.dev-full.yml logs app -f

# Look for:
# - "[Nest] X  MM/DD/YYYY, X:XX:XX PM     LOG [NestFactory] Starting Nest app..."
# - "Listening on port 3000"
# - Any "ERROR" messages
```

**Check UI build logs:**
```bash
docker compose -f docker-compose.dev-full.yml logs admin-ui -f
docker compose -f docker-compose.dev-full.yml logs agent-ui -f

# Look for:
# - "VITE v... building for development..."
# - "ready in ..." 
# - Any error messages
```

**If backend isn't starting:**
- Check database connection: `docker compose exec app npx prisma db push`
- Check .env values are correct
- Ensure migrations completed

**If UI isn't building:**
- Check package.json exists in admin-ui/ and agent-ui/
- Ensure node_modules permissions are correct
- Try rebuilding: `docker compose build --no-cache admin-ui agent-ui`

---

### 10. "AuthMe connection refused"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solution:**

```bash
# Check if authme container is running
docker compose -f docker-compose.dev-full.yml ps authme

# Check logs
docker compose -f docker-compose.dev-full.yml logs authme

# If not running, check database
docker compose -f docker-compose.dev-full.yml logs authme-db

# Restart AuthMe
docker compose -f docker-compose.dev-full.yml restart authme

# Wait for it to start
sleep 10

# Verify
curl http://localhost:3001/health
```

---

## Verification Checklist

After running setup, verify each service:

### 1. All containers running
```bash
docker compose -f docker-compose.dev-full.yml ps
```
All 6 services should show status `Up`

### 2. Backend responding
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```
Should return 200 OK

### 3. Admin UI accessible
```bash
curl -I http://localhost:5173
```
Should return 200 OK or redirect

### 4. Agent UI accessible
```bash
curl -I http://localhost:5174
```
Should return 200 OK or redirect

### 5. AuthMe responding
```bash
curl http://localhost:3001/health
```
Should return 200 OK

### 6. Database connections working
```bash
# CRM Database
docker compose -f docker-compose.dev-full.yml exec db psql -U postgres -d real_estate_crm -c "\dt"

# AuthMe Database
docker compose -f docker-compose.dev-full.yml exec authme-db psql -U authme -d authme -c "\dt"
```
Should show tables in both

### 7. Logs show no critical errors
```bash
docker compose -f docker-compose.dev-full.yml logs | grep -i "error\|fatal\|critical"
```
Should return minimal or no results

---

## Performance Debugging

### Services running slowly?

**Check resource usage:**
```bash
docker stats
```

Look for:
- CPU over 80% sustained
- Memory over 90%
- I/O wait constantly high

**Solutions:**
- Increase Docker resources (Preferences > Resources)
- Reduce resource limits in compose file
- Check for database lock contention: `docker compose exec db pgstatstatements`

---

### Database queries slow?

**Enable slow query log:**
```bash
# Edit docker-compose.dev-full.yml, add to db service:
environment:
  POSTGRES_INITDB_ARGS: "-c log_min_duration_statement=1000"

# Then recreate database
docker compose down -v
docker compose up -d
```

**Check query plans:**
```bash
docker compose exec db psql -U postgres -d real_estate_crm -c "EXPLAIN ANALYZE SELECT ..."
```

---

## Getting Help

If you get stuck:

1. **Check logs:**
   ```bash
   docker compose -f docker-compose.dev-full.yml logs [service-name]
   ```

2. **Review this guide** for your specific error

3. **Check project issues:**
   GitHub: https://github.com/your-org/real-estate-crm/issues

4. **Ask the team:**
   - Slack: #dev-environment
   - Email: devops@company.com

---

## Next: Configure AuthMe

Once dev environment is running, configure AuthMe realm:
→ See `docs/authme-setup.md`
