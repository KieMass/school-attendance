import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { LeaveRequestsService } from '../leave-requests/leave-requests.service';
import { DecideLeaveRequestDto } from '../leave-requests/dto/decide-leave-request.dto';

@ApiTags('Parents')
@ApiBearerAuth()
@Controller('parents')
@Roles(Role.PARENT)
export class ParentsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get('leave-requests/pending')
  findPending(@CurrentUser() user: AuthenticatedUser) {
    return this.leaveRequestsService.findPendingForParent(user.profileId!);
  }

  @Get('leave-requests/history')
  findHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.leaveRequestsService.findHistoryForParent(user.profileId!, {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('leave-requests/:id')
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findById(id);
  }

  @Post('leave-requests/:id/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DecideLeaveRequestDto,
  ) {
    return this.leaveRequestsService.approve(id, user.profileId!, dto);
  }

  @Post('leave-requests/:id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DecideLeaveRequestDto,
  ) {
    return this.leaveRequestsService.reject(id, user.profileId!, dto);
  }
}
