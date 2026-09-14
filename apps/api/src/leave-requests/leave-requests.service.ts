import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalDecision,
  AuditAction,
  ExitStatus,
  LeaveRequestStatus,
  NotificationChannel,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QrService } from '../qr/qr.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { DecideLeaveRequestDto } from './dto/decide-leave-request.dto';

const LEAVE_REQUEST_INCLUDE = {
  student: { include: { user: true } },
  approvals: { include: { parent: { include: { user: true } } } },
  qrTokens: { orderBy: { issuedAt: 'desc' as const }, take: 1 },
  exitLog: { include: { securityOfficer: true } },
  returnLog: { include: { securityOfficer: true } },
};

@Injectable()
export class LeaveRequestsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
    private qrService: QrService,
  ) {}

  private async getPolicy() {
    const policy = await this.prisma.leavePolicy.findUnique({
      where: { key: 'default' },
    });
    return (
      policy ??
      this.prisma.leavePolicy.create({
        data: { key: 'default' },
      })
    );
  }

  async create(studentId: string, dto: CreateLeaveRequestDto) {
    const policy = await this.getPolicy();

    const leaveDate = new Date(dto.leaveDate);
    const maxDate = new Date(
      Date.now() + policy.maxAdvanceRequestDays * 86_400_000,
    );
    if (leaveDate > maxDate) {
      throw new BadRequestException(
        `Leave requests can only be made up to ${policy.maxAdvanceRequestDays} days in advance`,
      );
    }

    const departureTime = new Date(dto.departureTime);
    const expectedReturnTime = new Date(dto.expectedReturnTime);
    if (expectedReturnTime <= departureTime) {
      throw new BadRequestException(
        'Expected return time must be after departure time',
      );
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        guardianLinks: { where: { canApprove: true }, include: { parent: { include: { user: true } } } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.guardianLinks.length === 0) {
      throw new BadRequestException(
        'No authorized guardian is on file for this student. Contact the school administrator.',
      );
    }

    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        studentId,
        leaveType: dto.leaveType,
        reason: dto.reason,
        destination: dto.destination,
        leaveDate,
        departureTime,
        expectedReturnTime,
        additionalNotes: dto.additionalNotes,
      },
    });

    await this.auditLog.record({
      userId: student.userId,
      action: AuditAction.LEAVE_REQUEST_CREATED,
      entityType: 'LeaveRequest',
      entityId: leaveRequest.id,
    });

    await Promise.all(
      student.guardianLinks.map((link) =>
        this.notifications.dispatch({
          userId: link.parent.userId,
          type: NotificationType.LEAVE_REQUEST_CREATED,
          title: 'Leave request submitted',
          body: `${student.firstName} ${student.lastName} has requested permission to leave campus on ${leaveDate.toDateString()}.`,
          data: { leaveRequestId: leaveRequest.id },
          channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        }),
      ),
    );

    return this.findById(leaveRequest.id);
  }

  async findById(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: LEAVE_REQUEST_INCLUDE,
    });
    if (!request) throw new NotFoundException('Leave request not found');
    return request;
  }

  async findForStudent(
    studentId: string,
    params: { status?: LeaveRequestStatus; page?: number; pageSize?: number },
  ) {
    return this.paginatedFindMany(
      { studentId, status: params.status },
      params,
    );
  }

  async cancel(leaveRequestId: string, studentId: string) {
    const request = await this.findById(leaveRequestId);
    if (request.studentId !== studentId) {
      throw new ForbiddenException('Not your leave request');
    }
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    await this.prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: { status: LeaveRequestStatus.CANCELLED, resolvedAt: new Date() },
    });
    await this.auditLog.record({
      userId: request.student.userId,
      action: AuditAction.LEAVE_REQUEST_CANCELLED,
      entityType: 'LeaveRequest',
      entityId: leaveRequestId,
    });
    return this.findById(leaveRequestId);
  }

  // -- Parent decisions -----------------------------------------------

  async findPendingForParent(parentId: string) {
    const studentIds = await this.approvableStudentIds(parentId);
    return this.prisma.leaveRequest.findMany({
      where: { studentId: { in: studentIds }, status: LeaveRequestStatus.PENDING },
      include: LEAVE_REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHistoryForParent(
    parentId: string,
    params: { page?: number; pageSize?: number },
  ) {
    const studentIds = await this.approvableStudentIds(parentId);
    return this.paginatedFindMany({ studentId: { in: studentIds } }, params);
  }

  async approve(
    leaveRequestId: string,
    parentId: string,
    dto: DecideLeaveRequestDto,
  ) {
    return this.decide(leaveRequestId, parentId, ApprovalDecision.APPROVED, dto);
  }

  async reject(
    leaveRequestId: string,
    parentId: string,
    dto: DecideLeaveRequestDto,
  ) {
    return this.decide(leaveRequestId, parentId, ApprovalDecision.REJECTED, dto);
  }

  private async decide(
    leaveRequestId: string,
    parentId: string,
    decision: ApprovalDecision,
    dto: DecideLeaveRequestDto,
  ) {
    const request = await this.findById(leaveRequestId);

    const authorized = await this.prisma.studentGuardian.findFirst({
      where: { studentId: request.studentId, parentId, canApprove: true },
    });
    if (!authorized) {
      throw new ForbiddenException(
        'You are not an authorized guardian for this student',
      );
    }
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        'This leave request has already been resolved',
      );
    }

    await this.prisma.leaveApproval.create({
      data: { leaveRequestId, parentId, decision, comments: dto.comments },
    });

    const policy = await this.getPolicy();
    let finalStatus: LeaveRequestStatus = LeaveRequestStatus.PENDING;

    if (decision === ApprovalDecision.REJECTED) {
      finalStatus = LeaveRequestStatus.REJECTED;
    } else if (!policy.requireDualApproval) {
      finalStatus = LeaveRequestStatus.APPROVED;
    } else {
      const requiredGuardians = await this.prisma.studentGuardian.count({
        where: { studentId: request.studentId, canApprove: true },
      });
      const approvals = await this.prisma.leaveApproval.count({
        where: { leaveRequestId, decision: ApprovalDecision.APPROVED },
      });
      finalStatus =
        approvals >= requiredGuardians
          ? LeaveRequestStatus.APPROVED
          : LeaveRequestStatus.PENDING;
    }

    if (finalStatus !== LeaveRequestStatus.PENDING) {
      await this.prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: { status: finalStatus, resolvedAt: new Date() },
      });
    }

    await this.auditLog.record({
      userId: (await this.prisma.parent.findUnique({ where: { id: parentId } }))
        ?.userId,
      action:
        decision === ApprovalDecision.APPROVED
          ? AuditAction.LEAVE_APPROVED
          : AuditAction.LEAVE_REJECTED,
      entityType: 'LeaveRequest',
      entityId: leaveRequestId,
      metadata: { comments: dto.comments },
    });

    if (finalStatus === LeaveRequestStatus.APPROVED) {
      await this.qrService.generateForLeaveRequest(leaveRequestId);
      await this.auditLog.record({
        action: AuditAction.QR_GENERATED,
        entityType: 'LeaveRequest',
        entityId: leaveRequestId,
      });
      await this.notifications.dispatch({
        userId: request.student.userId,
        type: NotificationType.LEAVE_REQUEST_APPROVED,
        title: 'Leave request approved',
        body: 'Your leave request has been approved. Your gate pass QR code is ready.',
        data: { leaveRequestId },
      });
    } else if (finalStatus === LeaveRequestStatus.REJECTED) {
      await this.notifications.dispatch({
        userId: request.student.userId,
        type: NotificationType.LEAVE_REQUEST_REJECTED,
        title: 'Leave request rejected',
        body: dto.comments
          ? `Your leave request was rejected: ${dto.comments}`
          : 'Your leave request was rejected by your guardian.',
        data: { leaveRequestId },
      });
    }

    return this.findById(leaveRequestId);
  }

  private async approvableStudentIds(parentId: string): Promise<string[]> {
    const links = await this.prisma.studentGuardian.findMany({
      where: { parentId },
      select: { studentId: true },
    });
    return links.map((l) => l.studentId);
  }

  // -- Dashboard / reporting read models --------------------------------

  async dashboardCounts() {
    const [pending, approved, offCampus, overdue, returnedToday] =
      await Promise.all([
        this.prisma.leaveRequest.count({
          where: { status: LeaveRequestStatus.PENDING },
        }),
        this.prisma.leaveRequest.count({
          where: { status: LeaveRequestStatus.APPROVED },
        }),
        this.prisma.exitLog.count({ where: { status: ExitStatus.EXITED } }),
        this.prisma.exitLog.count({ where: { status: ExitStatus.OVERDUE } }),
        this.prisma.returnLog.count({
          where: { returnAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        }),
      ]);
    return { pending, approved, offCampus, overdue, returnedToday };
  }

  async findStudentsOffCampus() {
    return this.prisma.exitLog.findMany({
      where: { status: { in: [ExitStatus.EXITED, ExitStatus.OVERDUE] } },
      include: {
        student: true,
        leaveRequest: true,
        securityOfficer: true,
      },
      orderBy: { exitAt: 'desc' },
    });
  }

  private async paginatedFindMany(
    where: Record<string, unknown>,
    params: { page?: number; pageSize?: number },
  ) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 25, 100);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        include: LEAVE_REQUEST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}
