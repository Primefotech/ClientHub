# BrandBook Client OS — Setup Guide

## Architecture

```
brandbook-client-os/
├── apps/
│   ├── api/          NestJS backend (port 3001)
│   └── web/          Next.js 14 frontend (port 3000)
├── docker-compose.yml
└── .env.example
```

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker Desktop
- npm 9+

### 2. Clone & Install
```bash
cd brandbook-client-os
npm install
```

### 3. Environment Setup
```bash
cp .env.example apps/api/.env
# Edit apps/api/.env with your credentials
```

Also create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 4. Start Infrastructure
```bash
docker-compose up -d
```
This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO (S3-compatible storage) on ports 9000/9001

### 5. Database Setup
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### 6. Start Development
```bash
# From root
npm run dev
```

Or separately:
```bash
npm run dev:api   # API on http://localhost:3001
npm run dev:web   # Web on http://localhost:3000
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@brandbook.com | Admin@brandbook123 |
| Project Head | ph@brandbook.com | PH@brandbook123 |
| BrandBook Staff | staff@brandbook.com | Staff@brandbook123 |
| Client Owner | owner@democlient.com | Client@brandbook123 |
| Client Staff | staff@democlient.com | Staff@client123 |

## API Documentation
Swagger UI: http://localhost:3001/api/docs

## Role Permissions Summary

### Super Admin
- Full system control
- Manage tenants, users, global content types
- Access all projects and data

### Project Head (PH)
- Full control over assigned projects
- Manage approval rules (and lock them)
- Control CRM permissions for staff
- View all threads and communications
- Create project-specific content types

### BrandBook Staff
- Access only assigned projects
- Upload creatives, submit for approval
- Reply in their own threads only
- Update CRM if permitted by PH

### Client Owner
- View all project data
- Approve/reject content
- Comment on creatives
- View reports, calendar, onboarding
- Respond to upsell recommendations

### Client Staff
- CRM lead view only (assigned leads)
- Update lead status and notes
- Cannot add leads or access approvals/reports

## Key Modules

| Module | Description |
|--------|-------------|
| Creatives | Content upload with versioning |
| Approvals | Multi-stage with audit trail |
| CRM | Lead management with webhooks |
| Communications | Thread-based with role visibility |
| Reports | Ad metrics with charts |
| Onboarding | Dynamic forms with edit history |
| Calendar | Content schedule view |
| Upsell | Client recommendations |
| Rule Engine | PH-controlled automation rules |
| Notifications | Email + WhatsApp Cloud API |
| Webhooks | Meta Ads, Google, WhatsApp |
| Activity Logs | Full audit trail |

## Webhook Configuration

### Meta Lead Ads
```
POST /api/v1/webhooks/meta/{webhookId}
GET  /api/v1/webhooks/meta/{webhookId}  (verification)
```

### WhatsApp Cloud API
```
POST /api/v1/webhooks/whatsapp
```

## WebSocket Events
- `new-comment` — New comment in thread
- `approval-update` — Approval status change
- `lead-update` — CRM lead updated
- `notification` — New notification

## Future Enhancements
- [ ] File uploads via MinIO/S3 (presigned URLs)
- [ ] n8n/Make workflow automation
- [ ] AI-powered content insights
- [ ] Google Ads API integration
- [ ] Advanced reporting with custom date ranges
- [ ] White-label client portal
- [ ] Mobile PWA
