# Deployment Guide

## 1. Local development (Docker Compose)

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate real secrets instead of the placeholders in apps/api/.env:
openssl rand -base64 48   # -> JWT_ACCESS_SECRET
openssl rand -base64 48   # -> JWT_REFRESH_SECRET
openssl rand -base64 32   # -> QR_ENCRYPTION_KEY (must decode to 32 bytes)

docker compose up --build
```

This starts PostgreSQL, Redis, the API (port 4000) and the web app
(port 3000). Run migrations and seed demo data once the API container is up:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

Swagger/OpenAPI docs are served at `http://localhost:4000/api/v1/../docs`
(i.e. `http://localhost:4000/docs`) outside production.

## 2. Cloud deployment

The API and web Dockerfiles are plain multi-stage Node builds with no
provider-specific assumptions, so they run on any container platform. Two
concrete paths:

### Option A — Azure

1. **Database**: Azure Database for PostgreSQL – Flexible Server.
2. **Containers**: Azure Container Apps (recommended) or App Service for
   Containers — one app for `apps/api/Dockerfile`, one for
   `apps/web/Dockerfile`.
3. **Secrets**: Azure Key Vault, referenced as app settings /
   Container Apps secrets (`JWT_ACCESS_SECRET`, `QR_ENCRYPTION_KEY`, SMTP,
   Twilio, Firebase credentials).
4. **Redis**: Azure Cache for Redis.
5. **CI/CD**: `.github/workflows/deploy.yml` includes a disabled
   `deploy-azure` job using `azure/login` + `azure/webapps-deploy` — set
   `AZURE_CREDENTIALS` as a repo secret and flip `if: false` to `if: true`.
6. **Custom domain + TLS**: Azure Front Door or the platform's managed
   certificates.

### Option B — AWS

1. **Database**: Amazon RDS for PostgreSQL.
2. **Containers**: ECS Fargate (one service per app) behind an Application
   Load Balancer, or App Runner for a simpler single-service setup.
3. **Secrets**: AWS Secrets Manager, injected as ECS task-definition secrets.
4. **Redis**: Amazon ElastiCache for Redis.
5. **CI/CD**: the disabled `deploy-aws` job in `deploy.yml` uses OIDC
   (`aws-actions/configure-aws-credentials`) to assume a deploy role and
   force a new ECS deployment after pushing images to a registry.
6. **Images**: pushed to GitHub Container Registry (`ghcr.io`) by default in
   the workflow — swap for ECR if you'd rather keep images in AWS.

### Database migrations in production

Never run `prisma migrate dev` against production. Use:

```bash
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

as a one-off release step (a CI job, an ECS task run once, or an Azure
Container Apps job) before the new API revision receives traffic.

## 3. Mobile app builds (EAS)

Before your first EAS build, add real branding assets referenced from
`app.json` (an `assets/icon.png` at 1024×1024 and any splash/adaptive-icon
images you want) — they're deliberately omitted from this scaffold since
they need actual artwork, not generated code.

```bash
cd apps/mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

Set `EXPO_PUBLIC_API_URL` (or `expo.extra.apiUrl` in `app.json`) to the
deployed API's public URL before building. Push notifications require:

- **Android**: an FCM server key configured in the Expo/EAS push credentials.
- **iOS**: an APNs key uploaded via `eas credentials`.

## 4. Environment variables reference

| App | File | Notes |
|---|---|---|
| API | `apps/api/.env.example` | JWT secrets, QR encryption key, DB URL, SMTP/Twilio/Firebase creds |
| Web | `apps/web/.env.example` | `NEXT_PUBLIC_API_URL` only — it's a pure API client |
| Mobile | `apps/mobile/.env.example` | `EXPO_PUBLIC_API_URL`, or set `expo.extra.apiUrl` in `app.json` |

## 5. Health checks

Add a lightweight `GET /api/v1/health` (not included by default — trivial to
add as a `@Public()` controller) for your load balancer / container
platform's health probe. In the meantime, `GET /api/v1/docs` responding 200
is a reasonable liveness signal outside production.

## 6. Backups & retention

- Enable automated daily backups on whichever managed Postgres you choose
  (both Azure Flexible Server and RDS support this out of the box).
- `audit_logs` and `notifications` grow indefinitely — consider a retention
  job (e.g. archive/delete rows older than N months) once volume warrants it.
