# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests (cache layer)
COPY package.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install --workspace=apps/web

# Copy full web source
COPY apps/web/ ./apps/web/

# NEXT_PUBLIC_* vars are baked into the bundle at build time.
# In production with Nginx same-domain routing, we use relative URLs
# so the built image works on ANY domain without rebuilding.
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_WS_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build Next.js (outputs to .next/standalone due to output: 'standalone')
RUN cd apps/web && npm run build

# ─── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
# Required for standalone Next.js to bind on all interfaces inside Docker
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy the standalone output (self-contained, includes traced node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static assets (not included in standalone output)
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy public folder (not included in standalone output)
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# standalone server entry point (relative to monorepo root = /app)
CMD ["node", "apps/web/server.js"]
