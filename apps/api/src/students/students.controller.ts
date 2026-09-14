import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeaveRequestStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';
import { CreateLeaveRequestDto } from '../leave-requests/dto/create-leave-request.dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
@Roles(Role.STUDENT)
export class StudentsController {
  constructor(
    private readonly leaveRequestsService: LeaveRequestsService,
    private readonly studentsService: StudentsService,
  ) {}

  @Post('leave-requests')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveRequestsService.create(user.profileId!, dto);
  }

  @Get('leave-requests')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: LeaveRequestStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.leaveRequestsService.findForStudent(user.profileId!, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('leave-requests/:id')
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findById(id);
  }

  @Post('leave-requests/:id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leaveRequestsService.cancel(id, user.profileId!);
  }

  @Get('leave-requests/:id/qr')
  getQr(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.getQrForLeaveRequest(user.profileId!, id);
  }
}
