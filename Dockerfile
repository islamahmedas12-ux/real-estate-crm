# ==============================================================================
# Real Estate CRM — Multi-stage Dockerfile (npm workspaces monorepo)
# ==============================================================================

# Stage 1: Install all workspaces. The root package-lock.json governs
# everything; admin-ui / agent-ui / packages/* are npm workspaces and the
# @crm/* packages are linked locally during `npm ci`.
FROM node:22-alpine AS deps
WORKDIR /app
# Every workspace manifest must be present before `npm ci`
COPY package.json package-lock.json ./
COPY packages/shared-api/package.json ./packages/shared-api/
COPY packages/shared-components/package.json ./packages/shared-components/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY admin-ui/package.json ./admin-ui/
COPY agent-ui/package.json ./agent-ui/
# Root postinstall runs `prisma generate`, so the schema must exist first
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# Stage 2: Build backend + both UIs
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace admin-ui
RUN npm run build --workspace agent-ui
RUN npm run build
# Co-locate UI bundles + email templates with the compiled backend
RUN cp -r admin-ui/dist dist/admin-ui \
 && cp -r agent-ui/dist dist/agent-ui \
 && cp -r src/email/templates dist/src/email/templates 2>/dev/null || true

# Stage 3: Production runtime
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
RUN npm prune --omit=dev --ignore-scripts

ENV NODE_ENV=production
EXPOSE 3000

RUN mkdir -p /app/uploads/images /app/uploads/docs /app/uploads/temp && \
    chown -R node:node /app
USER node

CMD ["node", "dist/src/main"]
