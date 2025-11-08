# CalorieCam

AI-assisted nutrition tracker with a NestJS + Prisma backend and an Expo/React Native client.

## Monorepo Structure

- `apps/api` – NestJS API (PostgreSQL, Prisma, Redis, BullMQ, SendGrid, MinIO/S3)
- `src/` / `App.js` – Expo-managed mobile client
- `docs/` – Deployment runbooks and smoke-checklists

The project is managed with **pnpm** workspaces (`pnpm-workspace.yaml`). Always use `pnpm` commands from the repo root unless a guide explicitly says otherwise.

## Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 20.19+ |
| pnpm | 9.x |
| PostgreSQL | 15+ |
| Redis | 7+ |
| MinIO (optional locally) | latest |
| Expo CLI / EAS CLI | latest |

> **Why Node 20?** Expo SDK 51+ and modern Nest builds expect Node 20. Using older versions results in `EBADENGINE` warnings and build failures on EAS.

## Quick Start (Local)

1. **Install dependencies**
   ```bash
   pnpm install
   pnpm --filter caloriecam-api install
   ```

2. **Bootstrap backend environment files**
   ```bash
   cd apps/api
   pnpm run setup:env   # creates .env and .env.example if missing
   ```

3. **Configure root `.env`**

   Create a root `.env` (only Expo public vars are read by the app):
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
   EXPO_PUBLIC_ENV=development
   EXPO_PUBLIC_DEV_TOKEN=
   EXPO_PUBLIC_DEV_REFRESH_TOKEN=
   ```

4. **Run database & cache** (local docker example)
   ```bash
   docker compose -f docker-compose.prod.yml up -d postgres redis minio
   ```

5. **Start the API**
   ```bash
   cd apps/api
   pnpm run start:dev
   ```

6. **Start the Expo client**
   ```bash
   pnpm start
   ```

## Linting & Tests

```bash
pnpm lint             # mobile lint rules
pnpm test             # mobile unit tests (jest)
pnpm --filter caloriecam-api lint
pnpm --filter caloriecam-api test
```

## Deployment Runbooks

The full deployment checklist lives in `docs/deployment/README.md` and is split into:

- Railway web-service deployment (`docs/deployment/railway.md`)
- Expo EAS build & TestFlight submission (`docs/deployment/eas.md`)
- Post-deploy smoke tests (`docs/deployment/smoke-checklist.md`)

Refer to those documents for environment variable matrices, command sequences, and infrastructure notes.

## Environment Variable Overview

### Backend (`apps/api/.env` or Railway variables)

| Key | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | ✅ | Use `production` on Railway |
| `PORT` | ✅ | Railway expects `8080` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Railway Redis variable reference |
| `API_BASE_URL` | ✅ | Public API (e.g. `https://api.caloriecam.app`) |
| `APP_BASE_URL` | ✅ | Expo web deep-link host |
| `CORS_ORIGINS` | ✅ | Comma-separated whitelist of origins |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | ✅ | Auth token secrets |
| `OPENAI_API_KEY`, `FDC_API_KEY` | ✅ | External API keys |
| `SENDGRID_API_KEY`, `MAIL_FROM` | ✅ | Transactional email sender |
| `FREE_DAILY_ANALYSES`, `PRO_DAILY_ANALYSES` | ✅ | Rate limits |
| `S3_*` | ✅ | MinIO/S3 connection (endpoint, bucket, credentials) |
| `CACHE_*`, `ASSISTANT_SESSION_TTL_SEC` | ✅ | Cache tuning |

See `apps/api/env.template` for defaults and descriptions.

### Mobile (`.env` at project root)

| Key | Required | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | Same host as Railway deployment |
| `EXPO_PUBLIC_ENV` | optional | `production` when building TestFlight |
| `EXPO_PUBLIC_DEV_TOKEN`, `EXPO_PUBLIC_DEV_REFRESH_TOKEN` | optional | QA helper tokens |

## Common Scripts

```bash
pnpm -r build                    # runs API build (+ placeholder for mobile)
pnpm --filter caloriecam-api prisma migrate dev
node apps/api/test-api.js usda:search "greek yogurt"
node apps/api/test-api.js analyze-text "oatmeal 60g with milk"
```

> `pnpm -r build` now works due to workspace setup and scripts. For mobile releases use the EAS profiles described in the deployment docs.

## Support & Contact

- Technical questions: support@caloriecam.app
- Incidents / outages: ops@caloriecam.app
- Feature requests: open a GitHub issue