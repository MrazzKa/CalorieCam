import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@caloriecam.app',
      to,
      subject,
      text,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendOTPEmail(to: string, otp: string) {
    const subject = 'Your CalorieCam Verification Code';
    const text = `Your verification code is: ${otp}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>CalorieCam Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to CalorieCam!';
    const text = `Welcome to CalorieCam, ${name}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to CalorieCam!</h2>
        <p>Hi ${name},</p>
        <p>Welcome to CalorieCam! We're excited to help you track your nutrition and achieve your health goals.</p>
        <p>Get started by taking a photo of your next meal!</p>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }
}
