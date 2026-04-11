#!/bin/sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BrandBook API — Docker Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# The postgres healthcheck in compose already waits for pg_isready,
# but we add a small extra delay to let the database finish init on
# first-ever boot (e.g. postgres is ready but template DBs still loading).
sleep 2

# Run Prisma migrations (idempotent — safe on every restart)
echo "🔄 Running database migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "🚀 Starting BrandBook API on port ${PORT:-3001}..."
exec node /app/apps/api/dist/src/main
