import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { OtpService } from './otp.service';
import { RedisService } from '../redis/redis.service';
import { MailerService } from '../mailer/mailer.service';
import { LoginDto, RegisterDto, VerifyOtpDto, RefreshTokenDto, RequestOtpDto, RequestMagicLinkDto } from './dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Generate OTP
    const otpCode = this.otpService.generateOtp();
    const otp = await this.otpService.saveOtp(email, otpCode);

    return {
      message: 'User registered successfully. Please verify your email.',
      userId: user.id,
      otpId: otp.id,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, code } = verifyOtpDto;

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(email, code);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    };
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const { email } = requestOtpDto;

    // Rate limiting: 5 requests per hour per email
    const rateLimitKey = `otp:rate:${email}`;
    const rateLimitCount = await this.redisService.get(rateLimitKey);
    const currentCount = rateLimitCount ? parseInt(rateLimitCount, 10) : 0;

    if (currentCount >= 5) {
      throw new BadRequestException('Too many OTP requests. Please try again later.');
    }

    // Create user if doesn't exist
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user without password (OTP-only auth)
      user = await this.prisma.user.create({
        data: {
          email,
          password: '', // No password needed for OTP auth
        },
      });
    }

    // Generate and save OTP
    const otpCode = this.otpService.generateOtp();
    await this.otpService.saveOtp(email, otpCode);

    // Increment rate limit counter
    await this.redisService.set(rateLimitKey, (currentCount + 1).toString(), 3600); // 1 hour TTL

    // Send OTP email
    try {
      await this.mailerService.sendOTPEmail(email, otpCode);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Don't fail the request if email fails
    }

    return {
      message: 'OTP sent successfully',
      email,
    };
  }

  async requestMagicLink(requestMagicLinkDto: RequestMagicLinkDto) {
    const { email } = requestMagicLinkDto;

    // Rate limiting: 5 requests per hour per email
    const rateLimitKey = `magic:rate:${email}`;
    const rateLimitCount = await this.redisService.get(rateLimitKey);
    const currentCount = rateLimitCount ? parseInt(rateLimitCount, 10) : 0;

    if (currentCount >= 5) {
      throw new BadRequestException('Too many magic link requests. Please try again later.');
    }

    // Create user if doesn't exist
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          password: '', // No password needed for magic link auth
        },
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link
    await this.prisma.magicLink.create({
      data: {
        userId: user.id,
        email,
        token,
        expiresAt,
      },
    });

    // Increment rate limit counter
    await this.redisService.set(rateLimitKey, (currentCount + 1).toString(), 3600); // 1 hour TTL

    // Generate magic link URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/v1/auth/magic/consume?token=${token}`;

    // Send magic link email
    try {
      await this.mailerService.sendMagicLinkEmail(email, magicLinkUrl);
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      // Don't fail the request if email fails
    }

    return {
      message: 'Magic link sent successfully',
      email,
    };
  }

  async consumeMagicLink(token: string) {
    // Find magic link
    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      throw new BadRequestException('Invalid magic link');
    }

    if (magicLink.used) {
      throw new BadRequestException('Magic link already used');
    }

    if (magicLink.expiresAt < new Date()) {
      throw new BadRequestException('Magic link expired');
    }

    // Mark as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true },
    });

    // Generate tokens
    const tokens = await this.generateTokens(magicLink.user.id, magicLink.user.email);

    return {
      message: 'Magic link verified successfully',
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      // Check if token exists in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.revoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);

      // Revoke old token
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      return {
        message: 'Token refreshed successfully',
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Logout successful' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: '30d',
    });

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
