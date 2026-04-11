# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Install ALL deps (including devDeps needed for build)
RUN npm install --legacy-peer-deps

# Copy source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build NestJS → dist/
RUN cd apps/api && npm run build

# ─── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Copy manifests + prisma schema
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Install production deps
RUN npm install --omit=dev --legacy-peer-deps

# Prisma CLI is a devDep so it was excluded above.
# Re-install ONLY prisma (no --save so package.json stays clean).
# Matches the version declared in package.json (^5.x).
RUN npm install --no-save prisma@5

# Generate Prisma client in production node_modules
RUN cd apps/api && npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
