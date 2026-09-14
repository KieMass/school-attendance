import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeaveRequestStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';
import { SecurityService } from '../security/security.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
@Roles(Role.STAFF, Role.ADMIN)
export class StaffController {
  constructor(
    private readonly leaveRequestsService: LeaveRequestsService,
    private readonly securityService: SecurityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.leaveRequestsService.dashboardCounts();
  }

  @Get('leave-requests')
  findAll(
    @Query('status') status?: LeaveRequestStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.prisma.leaveRequest.findMany({
      where: { status },
      include: {
        student: true,
        approvals: { include: { parent: true } },
        exitLog: true,
        returnLog: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: page ? (parseInt(page, 10) - 1) * (pageSize ? parseInt(pageSize, 10) : 25) : 0,
      take: pageSize ? parseInt(pageSize, 10) : 25,
    });
  }

  @Get('off-campus')
  offCampus() {
    return this.securityService.findOffCampus();
  }

  @Get('returns/today')
  returnsToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.prisma.returnLog.findMany({
      where: { returnAt: { gte: startOfDay } },
      include: { student: true, leaveRequest: true, securityOfficer: true },
      orderBy: { returnAt: 'desc' },
    });
  }
}
