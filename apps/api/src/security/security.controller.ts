import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { SecurityService } from './security.service';
import { ScanQrDto } from './dto/scan-qr.dto';
import { SignInDto } from './dto/sign-in.dto';

@ApiTags('Security')
@ApiBearerAuth()
@Controller('security')
@Roles(Role.SECURITY)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('scan')
  scan(@CurrentUser() user: AuthenticatedUser, @Body() dto: ScanQrDto) {
    return this.securityService.scan(dto.content, user.userId);
  }

  @Post('sign-out')
  signOut(@CurrentUser() user: AuthenticatedUser, @Body() dto: ScanQrDto) {
    return this.securityService.signOut(
      dto.content,
      user.profileId!,
      user.userId,
      dto.gateLocation,
    );
  }

  @Get('active-exit/:studentIdCode')
  findActiveExit(@Param('studentIdCode') studentIdCode: string) {
    return this.securityService.findActiveExitForStudent(studentIdCode);
  }

  @Post('sign-in')
  signIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: SignInDto) {
    return this.securityService.signIn(
      dto.exitLogId,
      user.profileId!,
      user.userId,
      dto.gateLocation,
      dto.notes,
    );
  }

  @Get('off-campus')
  @Roles(Role.SECURITY, Role.STAFF, Role.ADMIN)
  findOffCampus() {
    return this.securityService.findOffCampus();
  }
}
