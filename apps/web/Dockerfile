# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests
COPY package.json ./
COPY apps/web/package.json ./apps/web/

# Install ALL deps from workspace root (correct hoisting for monorepo)
RUN npm install --legacy-peer-deps

# Copy web source
COPY apps/web/ ./apps/web/

# Bake relative URL so image works on any domain via Nginx reverse proxy
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_WS_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build Next.js (standalone output)
RUN cd apps/web && npx next build

# ─── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone server (self-contained, includes traced node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./

# Static assets (_next/static) — not included in standalone
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Public dir — create it even if empty so COPY doesn't fail
RUN mkdir -p ./apps/web/public
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
