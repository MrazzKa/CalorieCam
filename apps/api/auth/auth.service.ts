import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { OtpService } from './otp.service';
import { RedisService } from '../redis/redis.service';
import { MailerService } from '../mailer/mailer.service';
import {
  LoginDto,
  RegisterDto,
  VerifyOtpDto,
  RefreshTokenDto,
  RequestOtpDto,
  RequestMagicLinkDto,
} from './dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const OTP_TTL_SECONDS = 10 * 60;
const OTP_EMAIL_COOLDOWN_SECONDS = 60;
const OTP_EMAIL_HOURLY_LIMIT = 5;
const OTP_IP_HOURLY_LIMIT = 40;
const MAGIC_LINK_HOURLY_LIMIT = 5;
const MAGIC_LINK_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService,
  ) {}

  async register(_: RegisterDto) {
    throw new BadRequestException('Password registration is disabled. Use email code login.');
  }

  async validateUser(): Promise<any> {
    return null;
  }

  async login(_: LoginDto) {
    throw new BadRequestException('Password login is disabled. Use email code login.');
  }

  async requestOtp(requestOtpDto: RequestOtpDto, clientIp?: string) {
    const normalizedEmail = this.normalizeEmail(requestOtpDto.email);
    const sanitizedIp = this.sanitizeIp(clientIp);

    await this.enforceOtpRateLimits(normalizedEmail, sanitizedIp);

    const otpCode = this.otpService.generateOtp();
    await this.otpService.saveOtp(normalizedEmail, otpCode);

    try {
      await this.mailerService.sendOtpEmail(normalizedEmail, otpCode);
    } catch (error) {
      this.logger.error(`[AuthService] Failed to dispatch OTP email for ${this.maskEmail(normalizedEmail)}`);
      throw new ServiceUnavailableException('We could not send the verification email. Please try again later.');
    }

    const retryAfter = await this.redisService.ttl(this.cooldownKey(normalizedEmail));
    const otpTtl = await this.otpService.getOtpTtl(normalizedEmail);

    this.logger.log(`[AuthService] OTP requested for ${this.maskEmail(normalizedEmail)}`);

    return {
      message: 'If this email is registered, we just sent a 6-digit code.',
      retryAfter: retryAfter > 0 ? retryAfter : OTP_EMAIL_COOLDOWN_SECONDS,
      expiresIn: otpTtl > 0 ? otpTtl : OTP_TTL_SECONDS,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const normalizedEmail = this.normalizeEmail(verifyOtpDto.email);
    const status = await this.otpService.verifyOtp(normalizedEmail, verifyOtpDto.code);

    if (status === 'expired') {
      throw new BadRequestException({ message: 'Verification code expired. Request a new one.', code: 'OTP_EXPIRED' });
    }
    if (status === 'invalid') {
      throw new BadRequestException({ message: 'Incorrect verification code. Check the email and try again.', code: 'OTP_INVALID' });
    }

    const user = await this.findOrCreateUser(normalizedEmail);
    const tokens = await this.generateTokens(user.id, user.email);

    this.logger.log(`[AuthService] OTP verified for ${this.maskEmail(normalizedEmail)}`);

    return {
      message: 'Signed in successfully.',
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    };
  }

  async requestMagicLink(requestMagicLinkDto: RequestMagicLinkDto, clientIp?: string) {
    const normalizedEmail = this.normalizeEmail(requestMagicLinkDto.email);
    const sanitizedIp = this.sanitizeIp(clientIp);

    await this.enforceMagicLinkRateLimits(normalizedEmail, sanitizedIp);

    const user = await this.findOrCreateUser(normalizedEmail);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

    await this.prisma.magicLink.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/v1/auth/magic-link?token=${token}`;

    try {
      await this.mailerService.sendMagicLinkEmail(user.email, magicLinkUrl);
    } catch (error) {
      this.logger.error(`[AuthService] Failed to dispatch magic link for ${this.maskEmail(user.email)}`);
      throw new ServiceUnavailableException('We could not send the magic link. Please try again later.');
    }

    this.logger.log(`[AuthService] Magic link requested for ${this.maskEmail(user.email)}`);

    return {
      message: 'If this email is registered, we sent a magic link to your inbox.',
    };
  }

  async consumeMagicLink(token: string) {
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

    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true },
    });

    const tokens = await this.generateTokens(magicLink.user.id, magicLink.user.email);

    this.logger.log(`[AuthService] Magic link consumed for ${this.maskEmail(magicLink.user.email)}`);

    return {
      message: 'Signed in successfully.',
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
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.revoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);

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

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async findOrCreateUser(email: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const password = await this.generateRandomPasswordHash();
      user = await this.prisma.user.create({
        data: {
          email,
          password,
        },
      });
      return user;
    }

    if (!user.password || user.password.trim().length === 0) {
      const password = await this.generateRandomPasswordHash();
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { password },
      });
    }

    return user;
  }

  private async generateRandomPasswordHash() {
    const random = crypto.randomBytes(32).toString('hex');
    return bcrypt.hash(random, 10);
  }

  private async enforceOtpRateLimits(email: string, ip?: string | null) {
    await this.ensureCooldown(email);
    await this.ensureHourlyLimit(OTP_EMAIL_HOURLY_LIMIT, this.emailHourlyKey(email));

    if (ip) {
      await this.ensureHourlyLimit(OTP_IP_HOURLY_LIMIT, this.ipHourlyKey(ip));
    }
  }

  private async enforceMagicLinkRateLimits(email: string, ip?: string | null) {
    await this.ensureHourlyLimit(MAGIC_LINK_HOURLY_LIMIT, this.magicHourlyKey(email));

    if (ip) {
      await this.ensureHourlyLimit(MAGIC_LINK_HOURLY_LIMIT * 2, this.magicIpHourlyKey(ip));
    }
  }

  private async ensureCooldown(email: string) {
    const key = this.cooldownKey(email);
    const acquired = await this.redisService.setNx(key, '1', OTP_EMAIL_COOLDOWN_SECONDS);

    if (!acquired) {
      const ttl = await this.redisService.ttl(key);
      if (ttl > 0) {
        throw new HttpException(
          {
            message: 'Too many requests. Wait a moment before trying again.',
            retryAfter: ttl,
            code: 'OTP_RATE_LIMIT',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  private async ensureHourlyLimit(limit: number, key: string) {
    const count = await this.redisService.incr(key);
    if (count <= 0) {
      return;
    }

    if (count === 1) {
      await this.redisService.expire(key, 60 * 60);
    }

    if (count > limit) {
      const ttl = await this.redisService.ttl(key);
      throw new HttpException(
        {
          message: 'Too many requests. Please try again later.',
          retryAfter: ttl > 0 ? ttl : 60 * 60,
          code: 'OTP_RATE_LIMIT',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private sanitizeIp(ip?: string | null): string | null {
    if (!ip) {
      return null;
    }
    const first = ip.split(',')[0].trim();
    return first.replace('::ffff:', '') || null;
  }

  private cooldownKey(email: string) {
    return `auth:otp:cooldown:${email}`;
  }

  private emailHourlyKey(email: string) {
    return `auth:otp:rate:${email}`;
  }

  private ipHourlyKey(ip: string) {
    return `auth:otp:rate:ip:${ip}`;
  }

  private magicHourlyKey(email: string) {
    return `auth:magic:rate:${email}`;
  }

  private magicIpHourlyKey(ip: string) {
    return `auth:magic:rate:ip:${ip}`;
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split('@');
    if (!domain) {
      return `${email.slice(0, 3)}***`;
    }
    const visibleLocal = local.slice(0, Math.min(2, local.length));
    return `${visibleLocal}***@${domain}`;
  }
}
