import { Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    // No manual stripping needed — PrismaService omits passwordHash from
    // every User read by default.
    return this.usersService.findById(user.userId);
  }

  @Post('me/change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const matches = await this.usersService.verifyPassword(user.userId, dto.currentPassword);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');
    await this.usersService.changePassword(user.userId, dto.newPassword);
    return { success: true };
  }
}
