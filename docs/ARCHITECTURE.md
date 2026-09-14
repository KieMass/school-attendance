# System Architecture

President's College Leave Permission Management System (PCLS)

## Overview

PCLS is a monorepo with three deployable applications sharing one PostgreSQL
database through a single NestJS REST API:

| App | Path | Tech | Serves |
|---|---|---|---|
| API | `apps/api` | NestJS + Prisma + PostgreSQL | All clients below |
| Web | `apps/web` | Next.js (App Router) + Tailwind | Student, Parent, Security, Staff, Admin (browser) |
| Mobile | `apps/mobile` | React Native + Expo | Student, Parent, Security (phone) |

Staff and Admin are expected to work primarily from the web console (office
use); Student, Parent and Security are the three roles that act from the
field, so they get first-class native mobile screens as well as web access.

## High-level component diagram

```mermaid
flowchart TB
    subgraph Clients
        WebApp["Next.js Web App<br/>(Student/Parent/Security/Staff/Admin)"]
        MobileApp["Expo Mobile App<br/>(Student/Parent/Security)"]
    end

    subgraph API["NestJS REST API"]
        Auth[Auth Module<br/>JWT + Refresh + RBAC]
        Leave[Leave Requests Module]
        QR[QR Module<br/>AES-256-GCM]
        Security[Security Module]
        Notif[Notifications Module]
        Admin[Admin Module]
        Audit[Audit Log Module]
    end

    DB[(PostgreSQL<br/>via Prisma)]
    Redis[(Redis<br/>rate limiting)]

    subgraph External
        FCM[Firebase Cloud Messaging]
        SMTP[Email — SMTP/SendGrid]
        Twilio[SMS — Twilio]
    end

    WebApp -->|HTTPS/JSON| API
    MobileApp -->|HTTPS/JSON| API
    Auth --> DB
    Leave --> DB
    QR --> DB
    Security --> DB
    Admin --> DB
    Audit --> DB
    API --> Redis
    Notif --> FCM
    Notif --> SMTP
    Notif --> Twilio
    Leave --> Notif
    Security --> Notif
```

## Request flow: leave approval → gate pass → exit → return

```mermaid
sequenceDiagram
    actor Student
    actor Parent
    actor Officer as Security Officer
    participant API
    participant DB as PostgreSQL
    participant Push as Notification Service

    Student->>API: POST /students/leave-requests
    API->>DB: create LeaveRequest (PENDING)
    API->>Push: notify guardians (LEAVE_REQUEST_CREATED)
    Push-->>Parent: push/email "leave requested"

    Parent->>API: POST /parents/leave-requests/:id/approve
    API->>DB: create LeaveApproval, set status=APPROVED
    API->>DB: generate QrToken (AES-256-GCM, single-use, expiring)
    API->>Push: notify student (LEAVE_REQUEST_APPROVED)
    Push-->>Student: push "approved, QR ready"

    Student->>API: GET /students/leave-requests/:id/qr
    API-->>Student: QR image (data URL)

    Officer->>API: POST /security/scan {content}
    API->>DB: validate token (status, expiry, decrypt, hash check)
    API-->>Officer: student + request details

    Officer->>API: POST /security/sign-out {content}
    API->>DB: mark QrToken USED (conditional update), create ExitLog
    API->>Push: notify guardians (STUDENT_EXITED)

    Officer->>API: POST /security/sign-in {exitLogId}
    API->>DB: create ReturnLog, close ExitLog
    API->>Push: notify guardians (STUDENT_RETURNED)
```

## Security model

- **AuthN**: JWT access tokens (short-lived, 15 min default) + opaque,
  hashed, rotating refresh tokens (30 days default) stored per-session in
  `refresh_tokens`, so a single device/session can be revoked without
  logging everyone out. Reuse of an already-rotated refresh token revokes
  every session for that user (theft heuristic).
- **AuthZ**: Role-based access control via `@Roles()` + a global `RolesGuard`.
  Five roles: `STUDENT`, `PARENT`, `SECURITY`, `STAFF`, `ADMIN`.
- **QR gate passes**: each pass is AES-256-GCM encrypted (tamper-evident —
  GCM's auth tag fails decryption if the payload is edited), carries a
  single-use security token (SHA-256 hashed at rest), and expires on a
  policy-configurable timer. Single-use is enforced with a conditional
  DB update (`WHERE status = 'ACTIVE'`) so concurrent scans can't double-spend
  one pass.
- **Rate limiting**: `@nestjs/throttler`, tightened further on `/auth/login`.
- **Audit trail**: every security-relevant action (logins, approvals,
  QR generation/scans, sign-out/in, user/policy changes) is written to an
  append-only `audit_logs` table.
- **Transport**: HTTPS everywhere in production (terminated at the load
  balancer/ingress); `helmet` sets baseline security headers.

## Data model

See [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) for
the authoritative schema and [`ER_DIAGRAM.md`](./ER_DIAGRAM.md) for the
entity-relationship diagram.

## Why this stack

- **NestJS**: opinionated module/DI structure scales well to the number of
  domains here (auth, leave requests, QR, security, notifications, admin)
  without turning into a pile of loose Express routes.
- **Prisma**: type-safe queries generated from one schema, shared migration
  history, straightforward to seed for demos.
- **Next.js App Router**: role-scoped route groups map naturally onto the
  five portals; server/edge features aren't required here since the app is
  a thin client over the REST API, but the framework leaves room to add SSR
  data-fetching later without a rewrite.
- **Expo**: one React Native codebase for iOS + Android, with first-class
  camera (QR scanning) and push notification APIs, and OTA updates via EAS
  for fast iteration without app-store review on every fix.
