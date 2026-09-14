import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [LeaveRequestsModule, SecurityModule],
  controllers: [StaffController],
})
export class StaffModule {}
