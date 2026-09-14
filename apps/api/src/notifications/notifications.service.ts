import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushProvider } from './providers/push.provider';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';

export interface DispatchParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Defaults to PUSH + EMAIL; pass explicit channels to override, e.g. add
   * SMS for time-critical alerts like overdue returns. */
  channels?: NotificationChannel[];
}

/** Fan-out layer: persists one `Notification` row per channel (so delivery
 * status is independently tracked and auditable) then sends via the
 * relevant provider. Called from LeaveRequestsService, SecurityService,
 * etc. — never call providers directly from a business module. */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private pushProvider: PushProvider,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
  ) {}

  async dispatch(params: DispatchParams) {
    const channels = params.channels ?? [
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
    ];

    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      include: { deviceTokens: true },
    });
    if (!user) {
      this.logger.warn(`dispatch() called for unknown user ${params.userId}`);
      return;
    }

    await Promise.all(
      channels.map((channel) =>
        this.sendOnChannel(channel, user, params),
      ),
    );
  }

  private async sendOnChannel(
    channel: NotificationChannel,
    user: { id: string; email: string | null; phone: string | null; deviceTokens: { token: string }[] },
    params: DispatchParams,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        channel,
        title: params.title,
        body: params.body,
        data: (params.data as any) ?? undefined,
        status: NotificationStatus.PENDING,
      },
    });

    let result: { success: boolean; error?: string } = { success: false };

    if (channel === NotificationChannel.PUSH) {
      result = await this.pushProvider.send(
        user.deviceTokens.map((d) => d.token),
        {
          title: params.title,
          body: params.body,
          data: params.data
            ? Object.fromEntries(
                Object.entries(params.data).map(([k, v]) => [k, String(v)]),
              )
            : undefined,
        },
      );
    } else if (channel === NotificationChannel.EMAIL) {
      if (!user.email) {
        result = { success: false, error: 'No email on file' };
      } else {
        result = await this.emailProvider.send(
          user.email,
          params.title,
          `<p>${params.body}</p>`,
        );
      }
    } else if (channel === NotificationChannel.SMS) {
      if (!user.phone) {
        result = { success: false, error: 'No phone on file' };
      } else {
        result = await this.smsProvider.send(
          user.phone,
          `${params.title}: ${params.body}`,
        );
      }
    }

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: result.success
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
        sentAt: result.success ? new Date() : undefined,
        error: result.error,
      },
    });
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: string,
  ) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async removeDeviceToken(token: string) {
    await this.prisma.deviceToken
      .delete({ where: { token } })
      .catch(() => undefined);
  }

  async findForUser(userId: string, page = 1, pageSize = 30) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, pageSize };
  }
}
