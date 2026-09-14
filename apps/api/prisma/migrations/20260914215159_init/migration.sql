-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'PARENT', 'SECURITY', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('DAY_PASS', 'WEEKEND', 'MEDICAL', 'FAMILY_EMERGENCY', 'OFFICIAL_SCHOOL_ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QrTokenStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ExitStatus" AS ENUM ('EXITED', 'RETURNED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAVE_REQUEST_CREATED', 'LEAVE_REQUEST_APPROVED', 'LEAVE_REQUEST_REJECTED', 'STUDENT_EXITED', 'STUDENT_RETURNED', 'RETURN_OVERDUE', 'ACCOUNT_CREATED', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'TOKEN_REFRESHED', 'LEAVE_REQUEST_CREATED', 'LEAVE_REQUEST_UPDATED', 'LEAVE_REQUEST_CANCELLED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'QR_GENERATED', 'QR_SCANNED', 'QR_REVOKED', 'STUDENT_SIGNED_OUT', 'STUDENT_SIGNED_IN', 'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'GUARDIAN_ASSIGNED', 'GUARDIAN_REMOVED', 'POLICY_UPDATED', 'DATA_EXPORTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentIdCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dormitory" TEXT,
    "gradeLevel" TEXT,
    "photoUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isBoarder" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_officers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "badgeNumber" TEXT NOT NULL,
    "postLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_officers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "reason" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "leaveDate" TIMESTAMP(3) NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "expectedReturnTime" TIMESTAMP(3) NOT NULL,
    "additionalNotes" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_approvals" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "securityToken" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "QrTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exit_logs" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "qrTokenId" TEXT NOT NULL,
    "securityOfficerId" TEXT NOT NULL,
    "exitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gateLocation" TEXT,
    "status" "ExitStatus" NOT NULL DEFAULT 'EXITED',

    CONSTRAINT "exit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_logs" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "exitLogId" TEXT NOT NULL,
    "securityOfficerId" TEXT NOT NULL,
    "returnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gateLocation" TEXT,
    "wasLate" BOOLEAN NOT NULL DEFAULT false,
    "minutesLate" INTEGER,
    "notes" TEXT,

    CONSTRAINT "return_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "qrTokenValidityMinutes" INTEGER NOT NULL DEFAULT 120,
    "lateReturnGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    "requireDualApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowWeekendLeaveOnly" BOOLEAN NOT NULL DEFAULT false,
    "maxAdvanceRequestDays" INTEGER NOT NULL DEFAULT 14,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentIdCode_key" ON "students"("studentIdCode");

-- CreateIndex
CREATE INDEX "students_studentIdCode_idx" ON "students"("studentIdCode");

-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");

-- CreateIndex
CREATE INDEX "student_guardians_parentId_idx" ON "student_guardians"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_studentId_parentId_key" ON "student_guardians"("studentId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "security_officers_userId_key" ON "security_officers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "security_officers_badgeNumber_key" ON "security_officers"("badgeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_userId_key" ON "admins"("userId");

-- CreateIndex
CREATE INDEX "leave_requests_studentId_idx" ON "leave_requests"("studentId");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_requests_leaveDate_idx" ON "leave_requests"("leaveDate");

-- CreateIndex
CREATE INDEX "leave_approvals_leaveRequestId_idx" ON "leave_approvals"("leaveRequestId");

-- CreateIndex
CREATE INDEX "leave_approvals_parentId_idx" ON "leave_approvals"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_publicId_key" ON "qr_tokens"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_securityToken_key" ON "qr_tokens"("securityToken");

-- CreateIndex
CREATE INDEX "qr_tokens_leaveRequestId_idx" ON "qr_tokens"("leaveRequestId");

-- CreateIndex
CREATE INDEX "qr_tokens_status_idx" ON "qr_tokens"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exit_logs_leaveRequestId_key" ON "exit_logs"("leaveRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "exit_logs_qrTokenId_key" ON "exit_logs"("qrTokenId");

-- CreateIndex
CREATE INDEX "exit_logs_studentId_idx" ON "exit_logs"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "return_logs_leaveRequestId_key" ON "return_logs"("leaveRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "return_logs_exitLogId_key" ON "return_logs"("exitLogId");

-- CreateIndex
CREATE INDEX "return_logs_studentId_idx" ON "return_logs"("studentId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leave_policies_key_key" ON "leave_policies"("key");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_officers" ADD CONSTRAINT "security_officers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_approvals" ADD CONSTRAINT "leave_approvals_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_approvals" ADD CONSTRAINT "leave_approvals_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exit_logs" ADD CONSTRAINT "exit_logs_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exit_logs" ADD CONSTRAINT "exit_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exit_logs" ADD CONSTRAINT "exit_logs_qrTokenId_fkey" FOREIGN KEY ("qrTokenId") REFERENCES "qr_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exit_logs" ADD CONSTRAINT "exit_logs_securityOfficerId_fkey" FOREIGN KEY ("securityOfficerId") REFERENCES "security_officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_logs" ADD CONSTRAINT "return_logs_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_logs" ADD CONSTRAINT "return_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_logs" ADD CONSTRAINT "return_logs_exitLogId_fkey" FOREIGN KEY ("exitLogId") REFERENCES "exit_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_logs" ADD CONSTRAINT "return_logs_securityOfficerId_fkey" FOREIGN KEY ("securityOfficerId") REFERENCES "security_officers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
