import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [LeaveRequestsModule, QrModule],
  providers: [StudentsService],
  controllers: [StudentsController],
  exports: [StudentsService],
})
export class StudentsModule {}
