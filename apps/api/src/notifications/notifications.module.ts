import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushProvider } from './providers/push.provider';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushProvider, EmailProvider, SmsProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
