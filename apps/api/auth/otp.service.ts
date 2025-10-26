import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as speakeasy from 'speakeasy';

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  generateOtp() {
    // Generate OTP code
    const secret = speakeasy.generateSecret({ length: 32 });
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
    });

    return token;
  }

  async saveOtp(email: string, code: string) {
    // Find user by email first
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Store OTP in database
    const otp = await this.prisma.otp.create({
      data: {
        userId: user.id,
        code,
        secret: '', // Not needed for simple OTP
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    return otp;
  }


  async verifyOtp(email: string, code: string): Promise<boolean> {
    // Find user by email first
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;
    }

    // Find the most recent OTP for this user
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return false;
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    return true;
  }

  async verifyOtpById(otpId: string, code: string): Promise<boolean> {
    const otp = await this.prisma.otp.findUnique({
      where: { id: otpId },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return false;
    }

    // Verify OTP code
    const verified = speakeasy.totp.verify({
      secret: otp.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps (1 minute) tolerance
    });

    if (verified) {
      // Mark OTP as used
      await this.prisma.otp.update({
        where: { id: otpId },
        data: { used: true },
      });
    }

    return verified;
  }
}
