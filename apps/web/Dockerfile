# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifest + web package manifest (cache busting layer)
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# Install ALL workspace deps from root — this hoists everything correctly.
# --legacy-peer-deps handles any peer dep conflicts between packages.
RUN npm install --legacy-peer-deps

# Copy full web source (after install to maximise cache hits)
COPY apps/web/ ./apps/web/

# NEXT_PUBLIC_* vars are baked at build time.
# Default to relative /api/v1 so image works on any domain via Nginx.
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_WS_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build Next.js (outputs to .next/standalone)
RUN cd apps/web && npx next build

# ─── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
# Bind on all interfaces inside Docker
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy the standalone output (self-contained server + traced node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./

# Static assets are not bundled into standalone — copy separately
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Public folder (may be empty but must exist)
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
