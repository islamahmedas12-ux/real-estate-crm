# Go-Live Checklist — Real Estate CRM

## Pre-Launch (Before Go-Live)

### Infrastructure
- [x] Production server provisioned (34.24.250.172)
- [x] DNS configured for all prod domains (api/admin/agent/auth.realstate-crm.homes)
- [x] SSL certificates issued (Let's Encrypt, auto-renewal)
- [x] Nginx reverse proxy configured with security headers
- [x] Docker Compose production stack (`crm-prod`)
- [x] PostgreSQL production database (port 5435)
- [x] Redis production instance
- [x] Authme IAM production realm (`real-estate`)
- [x] File upload volumes configured
- [ ] Firewall rules — only ports 80/443 exposed externally
- [ ] SSH key rotation / disable password auth

### Database
- [x] All migrations applied to production
- [x] Initial seed data loaded (properties, clients, leads)
- [x] Admin user created in Authme
- [x] Backup script tested (`scripts/backup-db.sh`)
- [ ] Automated daily backup cron configured
- [ ] Backup restore procedure tested

### CI/CD
- [x] CD → Dev pipeline (auto deploy on push to `dev`)
- [x] CD → QA pipeline (auto deploy on push to `qa`)
- [x] CD → UAT pipeline (auto deploy on push to `uat`)
- [x] CD → Prod pipeline (auto deploy on push to `prod`)
- [x] Frontend builds with per-environment env vars
- [x] Docker images pushed to GHCR
- [ ] Production deploy requires approval gate

### Security
- [x] JWT auth on all protected endpoints
- [x] RBAC enforced (admin/manager/agent)
- [x] XSS sanitization interceptor
- [x] SQL injection protected (Prisma ORM)
- [x] CORS properly configured per environment
- [x] Security headers (HSTS, CSP, X-Frame-Options)
- [x] Server version hidden (`server_tokens off`)
- [x] No secrets in git repository
- [x] Security audit passed (27/28)
- [ ] Change default Authme admin password
- [ ] Rotate all client secrets for production
- [ ] npm audit fix for dependency vulnerabilities

### Testing
- [x] 94 API integration tests passing
- [x] E2E tests (auth, properties, clients, leads, contracts)
- [x] Performance baseline documented
- [x] Security audit completed
- [x] QA environment fully tested
- [x] UAT environment deployed and verified

### Documentation
- [x] Architecture overview
- [x] Deployment runbook
- [x] Incident response procedures
- [x] API docs (Swagger at /api/docs)
- [ ] End-user documentation / help guide

## Launch Day

### Pre-Deploy
- [ ] Notify stakeholders of maintenance window
- [ ] Take full database backup
- [ ] Verify all health checks pass
- [ ] Merge latest code to `prod` branch

### Deploy
- [ ] Push to `prod` branch → triggers CD → Production
- [ ] Verify CD pipeline completes successfully
- [ ] Verify all containers healthy (`docker ps`)
- [ ] Verify API health endpoint
- [ ] Verify Admin UI loads
- [ ] Verify Agent UI loads
- [ ] Verify Auth/login flow works
- [ ] Test one full workflow (create property → create client → create lead)

### Post-Deploy
- [ ] Monitor error rates for 1 hour
- [ ] Check API response times
- [ ] Verify no 500 errors in logs
- [ ] Confirm email delivery working
- [ ] Send "Go-Live" confirmation to stakeholders

## Post-Launch (First Week)

- [ ] Monitor daily for errors
- [ ] Review database backup logs
- [ ] Check disk space usage
- [ ] Gather user feedback
- [ ] Address any critical bugs immediately
- [ ] Plan first maintenance window for improvements

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Lead | | | |
| QA Lead | | | |
| DevOps | | | |
| Stakeholder | | | |
