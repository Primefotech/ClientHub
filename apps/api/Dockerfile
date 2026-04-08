# Base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root manifest and api manifest
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies for the api workspace
RUN npm ci --workspace=apps/api

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Generate Prisma client
RUN npm run db:generate --workspace=apps/api

# Build the app
RUN npm run build --workspace=apps/api

# Production image, copy all the files and run nest
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy essential files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure we have the Prisma generator outputs
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

USER nestjs

EXPOSE 3001

# Command to run the application
CMD ["npm", "run", "start", "--workspace=apps/api"]
