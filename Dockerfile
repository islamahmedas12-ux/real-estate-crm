# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 1b: Admin UI dependencies
FROM node:24-alpine AS admin-deps
WORKDIR /app/admin-ui
COPY admin-ui/package.json admin-ui/package-lock.json ./
RUN npm ci

# Stage 1c: Agent UI dependencies
FROM node:24-alpine AS agent-deps
WORKDIR /app/agent-ui
COPY agent-ui/package.json agent-ui/package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=admin-deps /app/admin-ui/node_modules ./admin-ui/node_modules
COPY --from=agent-deps /app/agent-ui/node_modules ./agent-ui/node_modules
COPY . .
# Build UIs
RUN cd admin-ui && npm run build
RUN cd agent-ui && npm run build
# Generate Prisma client and build NestJS
RUN npx prisma generate
RUN npm run build
# Copy UI build output into dist
RUN cp -r admin-ui/dist dist/admin-ui
RUN cp -r agent-ui/dist dist/agent-ui
# Ensure email templates are alongside compiled email service
RUN cp -r src/email/templates dist/src/email/templates 2>/dev/null || true

# Stage 3: Production
FROM node:24-alpine AS production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# Remove dev dependencies
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

RUN mkdir -p /app/uploads/images /app/uploads/docs /app/uploads/temp && \
    chown -R node:node /app
USER node

CMD ["node", "dist/src/main"]
