# ==============================================================================
# Real Estate CRM — Nginx Reverse Proxy
# Build context must be the repository root (context: . in docker-compose)
# ==============================================================================

# ── Build Admin UI ──────────────────────────────────────────────────────────
FROM node:22-alpine AS admin-build
WORKDIR /app
COPY admin-ui/package.json admin-ui/package-lock.json ./
RUN npm ci
COPY admin-ui/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ── Build Agent UI ──────────────────────────────────────────────────────────
FROM node:22-alpine AS agent-build
WORKDIR /app
COPY agent-ui/package.json agent-ui/package-lock.json ./
RUN npm ci
COPY agent-ui/ ./
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ── Nginx ───────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=admin-build /app/dist /usr/share/nginx/html/admin
COPY --from=agent-build /app/dist /usr/share/nginx/html/agent

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
