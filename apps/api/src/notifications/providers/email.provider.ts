import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    if (!host) {
      this.logger.warn(
        'SMTP not configured — emails will be logged only',
      );
      return;
    }
    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('smtp.port'),
      secure: this.config.get<boolean>('smtp.secure'),
      auth: {
        user: this.config.get<string>('smtp.user'),
        pass: this.config.get<string>('smtp.password'),
      },
    });
  }

  async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      this.logger.debug(`[DEV] Email -> ${to}: ${subject}`);
      return { success: true };
    }
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('smtp.from'),
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (err) {
      this.logger.error('Email send failed', err as Error);
      return { success: false, error: (err as Error).message };
    }
  }
}
