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

    // In development, if SMTP is not configured, log to console instead
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (isDevelopment && !hasSmtpConfig) {
      console.log('========================================');
      console.log('📧 EMAIL (Development Mode - SMTP not configured)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Text:', text);
      if (html) {
        console.log('HTML:', html);
      }
      console.log('========================================');
      return { messageId: 'dev-mode', accepted: [to] };
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // In development, if email fails, still log to console
      if (isDevelopment) {
        console.log('========================================');
        console.log('📧 EMAIL (Fallback - SMTP failed, showing in console)');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Text:', text);
        if (html) {
          console.log('HTML:', html);
        }
        console.log('========================================');
        return { messageId: 'dev-mode-fallback', accepted: [to] };
      }
      
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

  async sendMagicLinkEmail(to: string, magicLinkUrl: string) {
    const subject = 'Sign in to CalorieCam';
    const text = `Click this link to sign in: ${magicLinkUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sign in to CalorieCam</h2>
        <p>Click the button below to sign in to your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLinkUrl}" 
             style="background-color: #007AFF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Sign In
          </a>
        </div>
        <p style="color: #8E8E93; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #8E8E93; font-size: 12px; word-break: break-all;">${magicLinkUrl}</p>
        <p style="color: #8E8E93; font-size: 14px; margin-top: 20px;">This link will expire in 15 minutes.</p>
        <p style="color: #8E8E93; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }
}
