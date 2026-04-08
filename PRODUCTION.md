# Production Deployment Guide — BrandBook Client OS

This document provides instructions for deploying the BrandBook Client OS to a production environment.

## Prerequisites

- **Node.js**: v18 or higher.
- **PostgreSQL**: Production instance.
- **Redis**: For caching and real-time features.
- **Storage**: S3-compatible service (AWS S3, Google Cloud Storage, or MinIO).

## Environment Variables

### Backend (apps/api/.env)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Strong secret for JWT signing | `openssl rand -base64 32` |
| `FRONTEND_URL` | URL of the frontend for CORS | `https://brandbook.com` |
| `NODE_ENV` | Set to `production` | `production` |
| `STORAGE_*` | S3 credentials and bucket | See `.env.example` |

### Frontend (apps/web/.env.production)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Absolute URL of the API | `https://api.brandbook.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | Absolute URL for WebSockets | `https://api.brandbook.com` |

## Deployment Steps

### Docker Deployment (Recommended)

The easiest way to deploy is using the provided `docker-compose.yml` which orchestrates the entire stack.

**1. Prepare Environment**
Create a `.env` file in the root based on `.env.example`.

**2. Build and Start**
Because Next.js inlines `NEXT_PUBLIC_` variables at build-time, you **must** use the following command when your IP or domain changes:
```bash
docker compose build --no-cache web
docker compose up -d
```

**Note on Storage**: The stack includes an `init-minio` container that automatically creates the `brandbook-files` bucket and sets it to public.

### Manual Monorepo Build
If you are not using Docker:
```bash
npm run build
npm run db:migrate
npm run start
```

## Security Best Practices

1. **HTTPS**: Always serve both frontend and backend over TLS.
2. **Secrets**: Never commit `.env` files. Use a secret manager.
3. **Database**: Use a non-root database user with restricted permissions.
4. **Monitoring**: Integrate with a logging service (Datadog, Sentry, etc.).

---
© 2026 BrandBook Team
