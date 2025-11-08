import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { MailDataRequired } from '@sendgrid/mail';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly fromAddress: string;
  private readonly mailDisabled: boolean;
  private readonly ignoreErrors: boolean;
  private readonly sendgridEnabled: boolean;

  constructor() {
    this.fromAddress = process.env.MAIL_FROM || 'CalorieCam <noreply@caloriecam.app>';
    this.mailDisabled = (process.env.MAIL_DISABLE || 'false').toLowerCase() === 'true';
    this.ignoreErrors = (process.env.AUTH_DEV_IGNORE_MAIL_ERRORS || 'false').toLowerCase() === 'true';

    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.sendgridEnabled = true;
      this.logger.log('[Mailer] SendGrid configured');
    } else {
      this.sendgridEnabled = false;
      this.logger.warn('[Mailer] SENDGRID_API_KEY missing - emails will be skipped');
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    const subject = `Your CalorieCam code: ${otp}`;
    const text = [
      'Hi!',
      '',
      `Your one-time sign-in code is ${otp}.`,
      'This code expires in 10 minutes.',
      '',
      'If you did not request this code, you can safely ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 520px; margin: 0 auto;">
        <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">Hi!</p>
        <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">Your one-time sign-in code is:</p>
        <p style="margin: 0 0 24px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563EB; text-align: center;">${otp}</p>
        <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="margin: 0; color: #6B7280; font-size: 14px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `;

    await this.dispatchMail('otp', { to, from: this.fromAddress, subject, text, html });
  }

  async sendMagicLinkEmail(to: string, magicLinkUrl: string) {
    const subject = 'Your CalorieCam magic link';
    const text = [
      'Hi!',
      '',
      'Use the link below to sign in to CalorieCam:',
      magicLinkUrl,
      '',
      'This link expires in 15 minutes. If you did not request it, you can ignore this email.',
    ].join('\n');

    const html = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 520px; margin: 0 auto;">
        <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">Hi!</p>
        <p style="margin: 0 0 16px; color: #111827; font-size: 16px;">Tap the button below to sign in to CalorieCam:</p>
        <p style="margin: 0 0 24px; text-align: center;">
          <a href="${magicLinkUrl}" style="background-color: #2563EB; color: #FFFFFF; padding: 14px 28px; border-radius: 12px; font-weight: 600; text-decoration: none; display: inline-block;">Sign in</a>
        </p>
        <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">Or paste this link into your browser:</p>
        <p style="margin: 0 0 24px; color: #2563EB; font-size: 13px; word-break: break-all;">${magicLinkUrl}</p>
        <p style="margin: 0; color: #6B7280; font-size: 14px;">This link expires in 15 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `;

    await this.dispatchMail('magic-link', { to, from: this.fromAddress, subject, text, html });
  }

  private async dispatchMail(type: 'otp' | 'magic-link', message: MailDataRequired) {
    if (this.mailDisabled) {
      this.logger.warn(`[Mailer] Mail disabled (MAIL_DISABLE=true). Skipping ${type} email.`);
      return;
    }

    if (!this.sendgridEnabled) {
      const warning = `[Mailer] SendGrid not configured. ${type} email skipped.`;
      if (this.ignoreErrors) {
        this.logger.warn(warning);
        return;
      }
      throw new Error(warning);
    }

    const recipient = Array.isArray(message.to) ? message.to[0] : message.to;
    const recipientEmail = typeof recipient === 'string' ? recipient : recipient?.email ?? '';

    try {
      await sgMail.send(message);
      this.logger.log(`[Mailer] ${type} email dispatched to ${this.maskEmail(recipientEmail)}`);
    } catch (error: any) {
      const errorMessage = error?.response?.body || error?.message || 'Unknown error';
      this.logger.error(`[Mailer] Failed to send ${type} email to ${this.maskEmail(recipientEmail)}:`, errorMessage);
      if (this.ignoreErrors) {
        this.logger.warn('[Mailer] Ignoring mail send error due to AUTH_DEV_IGNORE_MAIL_ERRORS=true');
        return;
      }
      throw error;
    }
  }

  private maskEmail(email: string) {
    if (!email) {
      return '[unknown]';
    }
    const [local, domain] = email.split('@');
    if (!domain) {
      return `${email.slice(0, 3)}***`;
    }
    const visibleLocal = local.slice(0, Math.min(2, local.length));
    return `${visibleLocal}***@${domain}`;
  }
}
