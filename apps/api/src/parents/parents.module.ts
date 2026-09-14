import { Module } from '@nestjs/common';
import { ParentsController } from './parents.controller';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';

@Module({
  imports: [LeaveRequestsModule],
  controllers: [ParentsController],
})
export class ParentsModule {}
