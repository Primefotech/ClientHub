# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first (cache layer)
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Install all deps (npm workspaces hoists to root node_modules)
RUN npm install --workspace=apps/api

# Copy full API source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build NestJS TypeScript → dist/
RUN cd apps/api && npm run build

# ─── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy manifests
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Copy Prisma schema so postinstall can generate client
COPY apps/api/prisma ./apps/api/prisma

# Install production deps only (postinstall auto-runs `prisma generate`)
RUN npm install --workspace=apps/api --omit=dev

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
