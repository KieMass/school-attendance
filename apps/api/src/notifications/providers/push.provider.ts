import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/** Wraps Firebase Cloud Messaging. Also accepts Expo push tokens transparently
 * in development if Firebase credentials are not configured — logs instead
 * of throwing, so the rest of the system remains testable without live
 * Firebase project credentials. */
@Injectable()
export class PushProvider implements OnModuleInit {
  private readonly logger = new Logger(PushProvider.name);
  private app: admin.app.App | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('firebase.projectId');
    const clientEmail = this.config.get<string>('firebase.clientEmail');
    const privateKey = this.config.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured — push notifications will be logged only',
      );
      return;
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  async send(
    deviceTokens: string[],
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<{ success: boolean; error?: string }> {
    if (deviceTokens.length === 0) return { success: true };

    if (!this.app) {
      this.logger.debug(
        `[DEV] Push -> ${deviceTokens.join(',')}: ${payload.title} — ${payload.body}`,
      );
      return { success: true };
    }

    try {
      await admin.messaging(this.app).sendEachForMulticast({
        tokens: deviceTokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      });
      return { success: true };
    } catch (err) {
      this.logger.error('FCM send failed', err as Error);
      return { success: false, error: (err as Error).message };
    }
  }
}
