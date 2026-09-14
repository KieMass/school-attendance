# President's College Leave Permission Management System

A production-ready student leave permission platform for President's
College, a boarding school in Guyana — students request permission to leave
campus, a parent/guardian approves or rejects from their phone, and an
encrypted single-use QR code authorizes the gate exit and return.

```
Student submits request → Parent notified instantly → Parent approves/rejects
→ (if approved) encrypted QR gate pass issued → Security scans at the gate
→ exit recorded, guardian notified → return scanned, guardian notified
```

## Monorepo layout

```
apps/
  api/      NestJS REST API — auth, leave workflow, QR, notifications, admin
  web/      Next.js web app — all five portals (Student/Parent/Security/Staff/Admin)
  mobile/   Expo (React Native) app — Student, Parent, Security screens
docs/
  ARCHITECTURE.md        System design, diagrams, security model
  ER_DIAGRAM.md          Entity-relationship diagram
  DEPLOYMENT.md          Azure / AWS / Docker deployment instructions
  IMPLEMENTATION_PLAN.md Phased rollout plan
.github/workflows/
  ci.yml                 Lint, typecheck, test, build, Docker build
  deploy.yml             Deployment template (Azure & AWS, disabled by default)
docker-compose.yml        Postgres + Redis + API + Web for local dev
```

## Tech stack

| Layer | Choice |
|---|---|
| Web frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, hand-rolled ShadCN-style components |
| Backend | NestJS, TypeScript, REST, JWT + RBAC |
| Database | PostgreSQL via Prisma ORM |
| Mobile | React Native + Expo (Student/Parent/Security) |
| Notifications | Firebase Cloud Messaging (push), SMTP (email), Twilio (SMS) |
| QR security | AES-256-GCM encrypted, single-use, time-limited tokens |
| Infra | Docker, Docker Compose, GitHub Actions CI/CD, Azure/AWS-ready |

## Quick start (local development)

**Prerequisites**: Node.js 20+, Docker, npm.

```bash
git clone <this-repo>
cd school-attendance
npm install   # installs all three workspaces

cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# generate real secrets for apps/api/.env — do not ship the example values:
openssl rand -base64 48   # JWT_ACCESS_SECRET
openssl rand -base64 48   # JWT_REFRESH_SECRET
openssl rand -base64 32   # QR_ENCRYPTION_KEY

# start Postgres + Redis
docker compose up -d postgres redis

# run migrations + seed demo accounts
npm run prisma:migrate --workspace=apps/api
npm run prisma:seed --workspace=apps/api

# run the API and web app
npm run dev:api    # http://localhost:4000/api/v1  (Swagger at /docs)
npm run dev:web    # http://localhost:3000

# run the mobile app (separate terminal)
npm run dev:mobile # opens Expo dev tools — press a/i or scan the QR
```

Or run everything except mobile via Docker:

```bash
docker compose up --build
```

### Demo accounts (seeded by `prisma:seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@presidentscollege.edu.gy | Admin@12345 |
| Staff | staff@presidentscollege.edu.gy | Staff@12345 |
| Security | security@presidentscollege.edu.gy | Security@12345 |
| Parent | parent@example.com | Parent@12345 |
| Student | student@presidentscollege.edu.gy | Student@12345 |

Change these before any non-local deployment.

## What's implemented

- **Five roles** with RBAC: Student, Parent, Security Officer, Staff, Admin.
- **Full leave workflow**: submit → guardian notification → approve/reject
  with comments → encrypted QR issuance → gate scan/validate → sign-out →
  sign-in → return notification, with an automated overdue-return sweep.
- **Security**: JWT access + rotating hashed refresh tokens, bcrypt password
  hashing, AES-256-GCM QR encryption with single-use enforcement via
  conditional DB updates, rate limiting, a full audit trail, and
  server-side validation on every input.
- **Admin console**: user/student/parent management, guardian assignment,
  leave policy configuration, daily/weekly/late-return reports, audit log
  viewer, dashboard with charts.
- **Notifications**: push (FCM/Expo), email, and SMS, each independently
  tracked per delivery attempt; falls back to console logging in
  development when provider credentials aren't configured, so the whole
  flow is testable without live third-party accounts.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for diagrams and the
security model in depth, and
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) for what a real
rollout still needs beyond this scaffold (data migration, native date
pickers on mobile, offline-gate handling, etc.).

## Verified

This isn't a stub — every workspace has been installed and compiled in this
environment:

- `apps/api`: `tsc --noEmit` and `nest build` both succeed; Prisma schema
  validates (`prisma validate`).
- `apps/web`: `tsc --noEmit` succeeds; `next build` succeeds (Next.js 16,
  all 24 routes compiled).
- `apps/mobile`: `tsc --noEmit` succeeds.

A live Postgres instance wasn't available in this environment, so
migrations/seed and full end-to-end runtime behavior should be your first
check after `docker compose up`.

## API documentation

Swagger/OpenAPI UI is served at `/docs` (e.g. `http://localhost:4000/docs`)
whenever `NODE_ENV !== 'production'`.

## License

Proprietary — built for President's College, Guyana.
