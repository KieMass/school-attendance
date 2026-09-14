# Step-by-Step Implementation Plan

This tracks what's built in this scaffold versus what a team would do next to
take it to a real production rollout at President's College.

## Phase 0 — Delivered in this scaffold

- [x] Monorepo structure (`apps/api`, `apps/web`, `apps/mobile`)
- [x] Full Prisma schema: Users, Students, Parents, Guardians (join table),
      SecurityOfficers, Staff, Admins, LeaveRequests, LeaveApprovals,
      QrTokens, ExitLogs, ReturnLogs, Notifications, AuditLogs, LeavePolicy
- [x] JWT auth (access + rotating hashed refresh tokens), RBAC guards
- [x] Leave request lifecycle: create → parent approve/reject → QR issue →
      gate scan/sign-out → sign-in, with notifications at every step
- [x] Encrypted, single-use, time-limited QR gate passes (AES-256-GCM)
- [x] Notification fan-out service (push/email/SMS providers, dev-mode
      logging fallback when credentials aren't configured)
- [x] Audit log covering logins, approvals, QR events, sign-out/in, user &
      policy changes
- [x] Overdue-return detection (scheduled job, 5-minute cadence)
- [x] Admin reports: daily/weekly exits, student leave history, parent
      approval history, late returns
- [x] Next.js web app: all five portals (Student, Parent, Security, Staff,
      Admin) with real API integration
- [x] Expo mobile app: Student, Parent, Security screens (camera QR
      scanning, push notification registration, print/share gate pass)
- [x] Docker Compose for local dev; multi-stage Dockerfiles for API & Web
- [x] GitHub Actions CI (lint, typecheck, test, build, Docker build) and a
      deploy workflow template for Azure/AWS
- [x] Verified: API compiles (`tsc`) and builds (`nest build`); Web
      typechecks and builds (`next build`, Next.js 16); Mobile typechecks
      (`tsc`); Prisma schema validates

## Phase 1 — Before pilot (2–3 weeks)

1. **Secrets & environments**: provision real JWT/QR secrets, SMTP/Twilio/
   Firebase credentials; stand up staging Postgres + Redis.
2. **Health endpoint + uptime monitoring** (`/health`, wired into the
   chosen cloud's probes; add Sentry or similar for error tracking).
3. **Data import**: bulk-load current student roster + guardian contacts
   (a one-off script using `UsersService.createUserWithProfile` in a loop,
   or a CSV import endpoint under `/admin`).
4. **Native date/time pickers** in the mobile leave-request form (swap the
   current text-input placeholders for `@react-native-community/datetimepicker`).
5. **Automated tests**: unit tests for `QrService` (encryption round-trip,
   single-use race condition) and `LeaveRequestsService` (approval state
   machine); e2e tests for the auth + leave-request + QR + sign-out flow.
6. **Push notification credentials**: register FCM project (Android) and
   APNs key (iOS) in EAS; verify delivery end-to-end.

## Phase 2 — Pilot rollout (1 dormitory / 1 grade)

1. Deploy to staging cloud environment (Azure or AWS — see
   `docs/DEPLOYMENT.md`).
2. Onboard a subset of security officers, one dormitory's students and
   their guardians.
3. Run the paper process in parallel for 1–2 weeks; compare outcomes.
4. Collect feedback from security officers on the gate scan flow
   specifically (network reliability at the gate matters most here) —
   consider an offline-queue fallback (cache scans locally, sync on
   reconnect) if connectivity is a problem at the physical gate location.

## Phase 3 — Full rollout

1. Data migration for the full student body.
2. Guardian onboarding campaign (SMS/email with app download links +
   temporary credentials, forced password change on first login —
   `mustChangePassword` is already modeled).
3. Staff training for the admin console (policy configuration, reports).
4. Cutover: disable the paper leave-slip process, keep it as a manual
   fallback procedure for outages.

## Phase 4 — Hardening & scale

1. **Dual-guardian approval** is already modeled (`requireDualApproval`
   policy flag) — pilot it with a small group before enabling school-wide.
2. **Rate-limit tuning** based on real traffic patterns.
3. **Retention policy** for `audit_logs`/`notifications` (see
   `docs/DEPLOYMENT.md` §6).
4. **Multi-campus support**, if ever needed: the schema would need a
   `Campus`/`Gate` entity and `gateLocation` (currently free text on
   `ExitLog`/`ReturnLog`) would become a foreign key.
5. **Offline-first mobile scanning**: queue scans locally on the security
   device and reconcile against the server when connectivity returns,
   rejecting anything that would violate single-use after the fact.

## Explicit non-goals of this scaffold

- No payment processing (not part of the spec).
- No SIS integration (student information system) — data entry is manual
  via the admin console for now; a SIS sync job would be a natural Phase 4
  addition.
- No offline mode yet (see Phase 4) — the current design assumes the gate
  has network connectivity, which should be validated during the pilot.
