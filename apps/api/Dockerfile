# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifest + api package manifest
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

# Install ALL workspace deps (hoisted to root node_modules)
RUN npm install --legacy-peer-deps

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

# Copy root manifest + api manifest
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

# Copy Prisma schema (needed for prisma generate + migrate)
COPY apps/api/prisma ./apps/api/prisma

# Install production deps only
RUN npm install --omit=dev --legacy-peer-deps

# Generate Prisma client in production layer
RUN cd apps/api && npx prisma generate

# Copy compiled NestJS output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy entrypoint
COPY apps/api/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
