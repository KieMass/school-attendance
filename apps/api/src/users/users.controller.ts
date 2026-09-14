import { Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
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
    const record = await this.usersService.findById(user.userId);
    const { passwordHash, ...safe } = record;
    return safe;
  }

  @Post('me/change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const record = await this.usersService.findById(user.userId);
    const matches = await bcrypt.compare(dto.currentPassword, record.passwordHash);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');
    await this.usersService.changePassword(user.userId, dto.newPassword);
    return { success: true };
  }
}
