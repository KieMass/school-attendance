import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Role as RoleEnum } from '../common/enums/role.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateParentDto } from './dto/create-parent.dto';
import {
  CreateAdminDto,
  CreateSecurityOfficerDto,
  CreateStaffDto,
} from './dto/create-staff-account.dto';
import { AssignGuardianDto } from './dto/assign-guardian.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(RoleEnum.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // -- Users -------------------------------------------------------------

  @Get('users')
  listUsers(
    @Query('role') role?: Role,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listUsers({
      role,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Patch('users/:id/activate')
  activate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminService.setUserActive(id, true, user.userId);
  }

  @Patch('users/:id/deactivate')
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminService.setUserActive(id, false, user.userId);
  }

  // -- Students ------------------------------------------------------------

  @Post('students')
  createStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentDto,
  ) {
    return this.adminService.createStudent(dto, user.userId);
  }

  @Get('students')
  listStudents(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listStudents({
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post('students/:studentId/guardians')
  assignGuardian(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Body() dto: AssignGuardianDto,
  ) {
    return this.adminService.assignGuardian(studentId, dto, user.userId);
  }

  @Delete('students/:studentId/guardians/:parentId')
  removeGuardian(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Param('parentId') parentId: string,
  ) {
    return this.adminService.removeGuardian(studentId, parentId, user.userId);
  }

  @Get('students/:studentId/leave-history')
  studentLeaveHistory(@Param('studentId') studentId: string) {
    return this.adminService.studentLeaveHistory(studentId);
  }

  // -- Parents ---------------------------------------------------------------

  @Post('parents')
  createParent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateParentDto,
  ) {
    return this.adminService.createParent(dto, user.userId);
  }

  @Get('parents')
  listParents(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listParents({
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('parents/:parentId/approval-history')
  parentApprovalHistory(@Param('parentId') parentId: string) {
    return this.adminService.parentApprovalHistory(parentId);
  }

  // -- Staff / security / admin accounts -------------------------------------

  @Post('security-officers')
  createSecurityOfficer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSecurityOfficerDto,
  ) {
    return this.adminService.createSecurityOfficer(dto, user.userId);
  }

  @Post('staff')
  createStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStaffDto,
  ) {
    return this.adminService.createStaff(dto, user.userId);
  }

  @Post('admins')
  createAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminDto,
  ) {
    return this.adminService.createAdmin(dto, user.userId);
  }

  // -- Policy ---------------------------------------------------------------

  @Get('policy')
  getPolicy() {
    return this.adminService.getPolicy();
  }

  @Patch('policy')
  updatePolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.adminService.updatePolicy(dto, user.userId);
  }

  // -- Reports ---------------------------------------------------------------

  @Get('reports/daily-exits')
  dailyExits(@Query('date') date?: string) {
    return this.adminService.dailyExitsReport(date ? new Date(date) : new Date());
  }

  @Get('reports/weekly-exits')
  weeklyExits(@Query('weekStart') weekStart?: string) {
    return this.adminService.weeklyExitsReport(
      weekStart ? new Date(weekStart) : new Date(),
    );
  }

  @Get('reports/late-returns')
  lateReturns(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.lateReturnReport(
      from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000),
      to ? new Date(to) : new Date(),
    );
  }
}
