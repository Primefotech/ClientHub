#!/bin/sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BrandBook API — Docker Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Database: Supabase (external)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run Prisma migrations against Supabase
# migrate deploy is idempotent — safe on every restart
echo "🔄 Running database migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "🚀 Starting BrandBook API on port ${PORT:-3001}..."
exec node /app/apps/api/dist/src/main
