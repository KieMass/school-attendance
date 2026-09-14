import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AuditAction,
  ExitStatus,
  NotificationChannel,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  /** Read-only preview for the officer's scanner screen — shows student
   * photo, destination, expected return, and approval status without
   * consuming the single-use token. */
  async scan(content: string, officerUserId: string) {
    const { qrToken } = await this.qrService.validate(content);

    await this.auditLog.record({
      userId: officerUserId,
      action: AuditAction.QR_SCANNED,
      entityType: 'QrToken',
      entityId: qrToken.id,
    });

    return {
      qrTokenId: qrToken.id,
      leaveRequest: qrToken.leaveRequest,
      student: qrToken.leaveRequest.student,
      expiresAt: qrToken.expiresAt,
    };
  }

  async signOut(
    content: string,
    officerId: string,
    officerUserId: string,
    gateLocation?: string,
  ) {
    const { qrToken } = await this.qrService.validate(content);
    const leaveRequest = qrToken.leaveRequest;

    const consumed = await this.qrService.markUsed(qrToken.id);
    if (!consumed) {
      throw new ConflictException(
        'This QR code was just used by another scan',
      );
    }

    const exitLog = await this.prisma.exitLog.create({
      data: {
        leaveRequestId: leaveRequest.id,
        studentId: leaveRequest.studentId,
        qrTokenId: qrToken.id,
        securityOfficerId: officerId,
        gateLocation,
        status: ExitStatus.EXITED,
      },
      include: { student: true, securityOfficer: true },
    });

    await this.auditLog.record({
      userId: officerUserId,
      action: AuditAction.STUDENT_SIGNED_OUT,
      entityType: 'ExitLog',
      entityId: exitLog.id,
      metadata: { gateLocation },
    });

    const guardians = await this.prisma.studentGuardian.findMany({
      where: { studentId: leaveRequest.studentId },
      include: { parent: true },
    });
    await Promise.all(
      guardians.map((g) =>
        this.notifications.dispatch({
          userId: g.parent.userId,
          type: NotificationType.STUDENT_EXITED,
          title: 'Student has exited campus',
          body: `${leaveRequest.student.firstName} ${leaveRequest.student.lastName} has exited the campus at ${new Date().toLocaleTimeString()}.`,
          data: { leaveRequestId: leaveRequest.id, exitLogId: exitLog.id },
        }),
      ),
    );

    return exitLog;
  }

  async findActiveExitForStudent(studentIdCode: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentIdCode },
    });
    if (!student) throw new NotFoundException('Student not found');

    const exitLog = await this.prisma.exitLog.findFirst({
      where: {
        studentId: student.id,
        status: { in: [ExitStatus.EXITED, ExitStatus.OVERDUE] },
      },
      include: { leaveRequest: true, student: true },
      orderBy: { exitAt: 'desc' },
    });
    if (!exitLog) {
      throw new NotFoundException(
        'No active off-campus record found for this student',
      );
    }
    return exitLog;
  }

  async signIn(
    exitLogId: string,
    officerId: string,
    officerUserId: string,
    gateLocation?: string,
    notes?: string,
  ) {
    const exitLog = await this.prisma.exitLog.findUnique({
      where: { id: exitLogId },
      include: { leaveRequest: true, student: true },
    });
    if (!exitLog) throw new NotFoundException('Exit record not found');
    if (exitLog.status === ExitStatus.RETURNED) {
      throw new BadRequestException('Student has already been signed in');
    }

    const now = new Date();
    const expectedReturn = exitLog.leaveRequest.expectedReturnTime;
    const wasLate = now > expectedReturn;
    const minutesLate = wasLate
      ? Math.round((now.getTime() - expectedReturn.getTime()) / 60_000)
      : 0;

    const returnLog = await this.prisma.$transaction(async (tx) => {
      const created = await tx.returnLog.create({
        data: {
          leaveRequestId: exitLog.leaveRequestId,
          studentId: exitLog.studentId,
          exitLogId: exitLog.id,
          securityOfficerId: officerId,
          gateLocation,
          wasLate,
          minutesLate: wasLate ? minutesLate : undefined,
          notes,
        },
      });
      await tx.exitLog.update({
        where: { id: exitLog.id },
        data: { status: ExitStatus.RETURNED },
      });
      return created;
    });

    await this.auditLog.record({
      userId: officerUserId,
      action: AuditAction.STUDENT_SIGNED_IN,
      entityType: 'ReturnLog',
      entityId: returnLog.id,
      metadata: { wasLate, minutesLate },
    });

    const guardians = await this.prisma.studentGuardian.findMany({
      where: { studentId: exitLog.studentId },
      include: { parent: true },
    });
    await Promise.all(
      guardians.map((g) =>
        this.notifications.dispatch({
          userId: g.parent.userId,
          type: NotificationType.STUDENT_RETURNED,
          title: 'Student has returned to campus',
          body: wasLate
            ? `${exitLog.student.firstName} returned ${minutesLate} minute(s) after the expected time.`
            : `${exitLog.student.firstName} has safely returned to campus.`,
          data: { leaveRequestId: exitLog.leaveRequestId },
        }),
      ),
    );

    return returnLog;
  }

  async findOffCampus() {
    return this.prisma.exitLog.findMany({
      where: { status: { in: [ExitStatus.EXITED, ExitStatus.OVERDUE] } },
      include: { student: true, leaveRequest: true, securityOfficer: true },
      orderBy: { exitAt: 'desc' },
    });
  }

  /** Runs every 5 minutes: flips any exited student past
   * expectedReturnTime + grace period into OVERDUE and fires a late-return
   * warning to guardians (escalated to SMS since it's time-critical). */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async flagOverdueReturns() {
    const policy = await this.prisma.leavePolicy.findUnique({
      where: { key: 'default' },
    });
    const graceMinutes = policy?.lateReturnGraceMinutes ?? 15;

    const candidates = await this.prisma.exitLog.findMany({
      where: { status: ExitStatus.EXITED },
      include: { leaveRequest: true, student: true },
    });

    const now = Date.now();
    const overdue = candidates.filter(
      (log) =>
        now >
        log.leaveRequest.expectedReturnTime.getTime() + graceMinutes * 60_000,
    );
    if (overdue.length === 0) return;

    for (const log of overdue) {
      await this.prisma.exitLog.update({
        where: { id: log.id },
        data: { status: ExitStatus.OVERDUE },
      });

      const guardians = await this.prisma.studentGuardian.findMany({
        where: { studentId: log.studentId },
        include: { parent: true },
      });
      await Promise.all(
        guardians.map((g) =>
          this.notifications.dispatch({
            userId: g.parent.userId,
            type: NotificationType.RETURN_OVERDUE,
            title: 'Late return warning',
            body: `${log.student.firstName} ${log.student.lastName} has not returned to campus by the expected time.`,
            data: { leaveRequestId: log.leaveRequestId },
            channels: [
              NotificationChannel.PUSH,
              NotificationChannel.EMAIL,
              NotificationChannel.SMS,
            ],
          }),
        ),
      );
    }
    this.logger.warn(`Flagged ${overdue.length} overdue return(s)`);
  }
}
