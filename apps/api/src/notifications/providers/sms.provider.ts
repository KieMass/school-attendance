import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private client: Twilio | null = null;
  private fromNumber?: string;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get<string>('twilio.accountSid');
    const authToken = this.config.get<string>('twilio.authToken');
    this.fromNumber = this.config.get<string>('twilio.fromNumber');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio not configured — SMS will be logged only');
      return;
    }
    this.client = new Twilio(accountSid, authToken);
  }

  async send(
    to: string,
    body: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      this.logger.debug(`[DEV] SMS -> ${to}: ${body}`);
      return { success: true };
    }
    try {
      await this.client.messages.create({ to, from: this.fromNumber, body });
      return { success: true };
    } catch (err) {
      this.logger.error('SMS send failed', err as Error);
      return { success: false, error: (err as Error).message };
    }
  }
}
