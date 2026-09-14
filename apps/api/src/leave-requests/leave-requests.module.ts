import { Module } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { QrModule } from '../qr/qr.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [QrModule, NotificationsModule, AuditLogModule],
  providers: [LeaveRequestsService],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
