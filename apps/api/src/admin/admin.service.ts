import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateParentDto } from './dto/create-parent.dto';
import {
  CreateAdminDto,
  CreateSecurityOfficerDto,
  CreateStaffDto,
} from './dto/create-staff-account.dto';
import { AssignGuardianDto } from './dto/assign-guardian.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private auditLog: AuditLogService,
  ) {}

  // -- Account onboarding ------------------------------------------------

  async createStudent(dto: CreateStudentDto, actingUserId: string) {
    const user = await this.usersService.createUserWithProfile({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: Role.STUDENT,
      student: {
        studentIdCode: dto.studentIdCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dormitory: dto.dormitory,
        gradeLevel: dto.gradeLevel,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { role: Role.STUDENT },
    });
    return user;
  }

  async createParent(dto: CreateParentDto, actingUserId: string) {
    const user = await this.usersService.createUserWithProfile({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: Role.PARENT,
      parent: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        relationship: dto.relationship,
      },
    });
    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { role: Role.PARENT },
    });
    return user;
  }

  async createSecurityOfficer(
    dto: CreateSecurityOfficerDto,
    actingUserId: string,
  ) {
    const user = await this.usersService.createUserWithProfile({
      email: dto.email,
      password: dto.password,
      role: Role.SECURITY,
      securityOfficer: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        badgeNumber: dto.badgeNumber,
        postLocation: dto.postLocation,
      },
    });
    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { role: Role.SECURITY },
    });
    return user;
  }

  async createStaff(dto: CreateStaffDto, actingUserId: string) {
    const user = await this.usersService.createUserWithProfile({
      email: dto.email,
      password: dto.password,
      role: Role.STAFF,
      staff: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        department: dto.department,
      },
    });
    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { role: Role.STAFF },
    });
    return user;
  }

  async createAdmin(dto: CreateAdminDto, actingUserId: string) {
    const user = await this.usersService.createUserWithProfile({
      email: dto.email,
      password: dto.password,
      role: Role.ADMIN,
      admin: { firstName: dto.firstName, lastName: dto.lastName },
    });
    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { role: Role.ADMIN },
    });
    return user;
  }

  async setUserActive(userId: string, isActive: boolean, actingUserId: string) {
    const user = await this.usersService.setActive(userId, isActive);
    await this.auditLog.record({
      userId: actingUserId,
      action: isActive ? AuditAction.USER_UPDATED : AuditAction.USER_DEACTIVATED,
      entityType: 'User',
      entityId: userId,
    });
    return user;
  }

  listUsers(params: { role?: Role; page?: number; pageSize?: number; search?: string }) {
    return this.usersService.list(params);
  }

  listStudents(params: { page?: number; pageSize?: number; search?: string }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 25, 100);
    return this.prisma.$transaction([
      this.prisma.student.findMany({
        where: params.search
          ? {
              OR: [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { studentIdCode: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: { user: true, guardianLinks: { include: { parent: { include: { user: true } } } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.student.count(),
    ]).then(([items, total]) => ({ items, total, page, pageSize }));
  }

  listParents(params: { page?: number; pageSize?: number; search?: string }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 25, 100);
    return this.prisma.$transaction([
      this.prisma.parent.findMany({
        where: params.search
          ? {
              OR: [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        include: { user: true, studentLinks: { include: { student: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.parent.count(),
    ]).then(([items, total]) => ({ items, total, page, pageSize }));
  }

  // -- Guardian assignment -------------------------------------------------

  async assignGuardian(
    studentId: string,
    dto: AssignGuardianDto,
    actingUserId: string,
  ) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const parent = await this.prisma.parent.findUnique({ where: { id: dto.parentId } });
    if (!parent) throw new NotFoundException('Parent not found');

    const link = await this.prisma.studentGuardian.upsert({
      where: { studentId_parentId: { studentId, parentId: dto.parentId } },
      update: {
        isPrimary: dto.isPrimary ?? false,
        canApprove: dto.canApprove ?? true,
      },
      create: {
        studentId,
        parentId: dto.parentId,
        isPrimary: dto.isPrimary ?? false,
        canApprove: dto.canApprove ?? true,
      },
    });

    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.GUARDIAN_ASSIGNED,
      entityType: 'Student',
      entityId: studentId,
      metadata: { parentId: dto.parentId },
    });
    return link;
  }

  async removeGuardian(studentId: string, parentId: string, actingUserId: string) {
    await this.prisma.studentGuardian
      .delete({ where: { studentId_parentId: { studentId, parentId } } })
      .catch(() => {
        throw new NotFoundException('Guardian link not found');
      });

    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.GUARDIAN_REMOVED,
      entityType: 'Student',
      entityId: studentId,
      metadata: { parentId },
    });
    return { success: true };
  }

  // -- Policy ---------------------------------------------------------------

  async getPolicy() {
    const policy = await this.prisma.leavePolicy.findUnique({ where: { key: 'default' } });
    return policy ?? this.prisma.leavePolicy.create({ data: { key: 'default' } });
  }

  async updatePolicy(dto: UpdatePolicyDto, actingUserId: string) {
    await this.getPolicy(); // ensure it exists
    const updated = await this.prisma.leavePolicy.update({
      where: { key: 'default' },
      data: { ...dto },
    });
    await this.auditLog.record({
      userId: actingUserId,
      action: AuditAction.POLICY_UPDATED,
      entityType: 'LeavePolicy',
      metadata: { ...dto },
    });
    return updated;
  }

  // -- Reports ---------------------------------------------------------------

  async dailyExitsReport(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.prisma.exitLog.findMany({
      where: { exitAt: { gte: start, lt: end } },
      include: { student: true, leaveRequest: true, securityOfficer: true, returnLog: true },
      orderBy: { exitAt: 'asc' },
    });
  }

  async weeklyExitsReport(weekStart: Date) {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.prisma.exitLog.findMany({
      where: { exitAt: { gte: start, lt: end } },
      include: { student: true, leaveRequest: true, securityOfficer: true, returnLog: true },
      orderBy: { exitAt: 'asc' },
    });
  }

  async studentLeaveHistory(studentId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { studentId },
      include: { approvals: { include: { parent: true } }, exitLog: true, returnLog: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async parentApprovalHistory(parentId: string) {
    return this.prisma.leaveApproval.findMany({
      where: { parentId },
      include: { leaveRequest: { include: { student: true } } },
      orderBy: { decidedAt: 'desc' },
    });
  }

  async lateReturnReport(from: Date, to: Date) {
    return this.prisma.returnLog.findMany({
      where: { wasLate: true, returnAt: { gte: from, lte: to } },
      include: { student: true, leaveRequest: true, securityOfficer: true },
      orderBy: { returnAt: 'desc' },
    });
  }
}
