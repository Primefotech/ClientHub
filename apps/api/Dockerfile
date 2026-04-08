# Base stage for dependencies and building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root lock files and package.json
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies (using workspaces to handle monorepo structure)
RUN npm install

# Copy source code
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install only production dependencies
RUN npm install --omit=dev

# Copy built assets and prisma from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose API port
EXPOSE 3001

WORKDIR /app/apps/api
CMD ["npm", "run", "start"]
