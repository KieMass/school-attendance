import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [UsersModule, AuditLogModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
