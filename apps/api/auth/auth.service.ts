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
  AppleSignInDto,
  GoogleSignInDto,
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
      // Check if we should ignore mail errors (for development/testing)
      const ignoreMailErrors = (process.env.AUTH_DEV_IGNORE_MAIL_ERRORS || 'false').toLowerCase() === 'true';
      if (ignoreMailErrors) {
        this.logger.warn(`[AuthService] Ignoring OTP email error due to AUTH_DEV_IGNORE_MAIL_ERRORS=true. OTP code: ${otpCode}`);
        // Continue without throwing - OTP is still saved and can be used
      } else {
        throw new ServiceUnavailableException('We could not send the verification email. Please try again later.');
      }
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
    this.logger.log(`[AuthService] verifyOtp() called for email: ${this.maskEmail(verifyOtpDto.email)}`);
    
    const normalizedEmail = this.normalizeEmail(verifyOtpDto.email);
    this.logger.log(`[AuthService] verifyOtp() - normalized email: ${this.maskEmail(normalizedEmail)}`);
    
    this.logger.log(`[AuthService] verifyOtp() - verifying OTP code...`);
    const status = await this.otpService.verifyOtp(normalizedEmail, verifyOtpDto.code);
    this.logger.log(`[AuthService] verifyOtp() - OTP verification status: ${status}`);

    if (status === 'expired') {
      this.logger.warn(`[AuthService] verifyOtp() - OTP expired for ${this.maskEmail(normalizedEmail)}`);
      throw new BadRequestException({ message: 'Verification code expired. Request a new one.', code: 'OTP_EXPIRED' });
    }
    if (status === 'invalid') {
      this.logger.warn(`[AuthService] verifyOtp() - OTP invalid for ${this.maskEmail(normalizedEmail)}`);
      throw new BadRequestException({ message: 'Incorrect verification code. Check the email and try again.', code: 'OTP_INVALID' });
    }

    this.logger.log(`[AuthService] verifyOtp() - OTP valid, calling findOrCreateUser()...`);
    const user = await this.findOrCreateUser(normalizedEmail);
    this.logger.log(`[AuthService] verifyOtp() - user found/created: id=${user.id}, email=${this.maskEmail(user.email)}`);
    
    this.logger.log(`[AuthService] verifyOtp() - calling generateTokens()...`);
    const tokens = await this.generateTokens(user.id, user.email);
    this.logger.log(`[AuthService] verifyOtp() - tokens generated successfully, hasAccessToken=${!!tokens.accessToken}, hasRefreshToken=${!!tokens.refreshToken}`);

    this.logger.log(`[AuthService] OTP verified for ${this.maskEmail(normalizedEmail)}`);

    const response = {
      message: 'Signed in successfully.',
      user: {
        id: user.id,
        email: user.email,
      },
      ...tokens,
    };
    this.logger.log(`[AuthService] verifyOtp() - returning response with tokens`);
    return response;
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
      // Check if token is blacklisted in Redis
      const blacklistKey = `${process.env.REDIS_BLACKLIST_PREFIX || 'auth:refresh:blacklist:'}${refreshToken}`;
      const isBlacklisted = await this.redisService.exists(blacklistKey);
      
      if (isBlacklisted) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.revoked) {
        // Add to blacklist if token was revoked
        if (tokenRecord?.revoked) {
          const ttl = Math.max(0, Math.floor((tokenRecord.expiresAt.getTime() - Date.now()) / 1000));
          if (ttl > 0) {
            await this.redisService.set(blacklistKey, '1', ttl);
          }
        }
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens (rotation)
      const tokens = await this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);

      // Revoke old token and add to blacklist
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });

      // Add old token to Redis blacklist until it expires
      const oldTokenTtl = Math.max(0, Math.floor((tokenRecord.expiresAt.getTime() - Date.now()) / 1000));
      if (oldTokenTtl > 0) {
        await this.redisService.set(blacklistKey, '1', oldTokenTtl);
      }

      this.logger.log(`[AuthService] Token refreshed for user ${this.maskEmail(tokenRecord.user.email)}`);

      return {
        message: 'Token refreshed successfully',
        ...tokens,
      };
    } catch (error) {
      this.logger.warn(`[AuthService] Refresh token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Get all active refresh tokens for the user
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });

    // Add all active tokens to Redis blacklist
    const blacklistPrefix = process.env.REDIS_BLACKLIST_PREFIX || 'auth:refresh:blacklist:';
    for (const token of refreshTokens) {
      const blacklistKey = `${blacklistPrefix}${token.token}`;
      const ttl = Math.max(0, Math.floor((token.expiresAt.getTime() - Date.now()) / 1000));
      if (ttl > 0) {
        await this.redisService.set(blacklistKey, '1', ttl);
      }
    }

    // Revoke all refresh tokens in database
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    this.logger.log(`[AuthService] User ${userId} logged out, ${refreshTokens.length} tokens revoked`);

    return { message: 'Logout successful' };
  }

  async signInWithApple(appleSignInDto: AppleSignInDto) {
    try {
      // Verify Apple identity token (simplified - in production, verify with Apple's public keys)
      // For now, we'll trust the token from the client and extract email/user info
      const email = appleSignInDto.email || appleSignInDto.user;
      const normalizedEmail = this.normalizeEmail(email);

      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        throw new BadRequestException('Invalid email from Apple Sign In');
      }

      // Find or create user
      const user = await this.findOrCreateUser(normalizedEmail);

      // Update or create user profile with name if provided
      if (appleSignInDto.fullName) {
        const firstName = appleSignInDto.fullName.givenName || '';
        const lastName = appleSignInDto.fullName.familyName || '';
        if (firstName || lastName) {
          await this.prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
              firstName: firstName || undefined,
              lastName: lastName || undefined,
            },
            create: {
              userId: user.id,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
            },
          });
        }
      }

      const tokens = await this.generateTokens(user.id, user.email);

      this.logger.log(`[AuthService] Apple Sign In successful for ${this.maskEmail(normalizedEmail)}`);

      return {
        message: 'Signed in successfully with Apple.',
        user: {
          id: user.id,
          email: user.email,
        },
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`[AuthService] Apple Sign In failed:`, error);
      throw new UnauthorizedException('Apple Sign In failed. Please try again.');
    }
  }

  async signInWithGoogle(googleSignInDto: GoogleSignInDto) {
    try {
      const normalizedEmail = this.normalizeEmail(googleSignInDto.email);

      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        throw new BadRequestException('Invalid email from Google Sign In');
      }

      // Verify Google access token by fetching user info (already done on client, but we can verify)
      // For production, verify the idToken signature with Google's public keys
      // For now, we trust the email provided

      // Find or create user
      const user = await this.findOrCreateUser(normalizedEmail);

      // Update or create user profile with name if provided
      if (googleSignInDto.name) {
        const nameParts = googleSignInDto.name.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        if (firstName || lastName) {
          await this.prisma.userProfile.upsert({
            where: { userId: user.id },
            update: {
              firstName: firstName || undefined,
              lastName: lastName || undefined,
            },
            create: {
              userId: user.id,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
            },
          });
        }
      }

      const tokens = await this.generateTokens(user.id, user.email);

      this.logger.log(`[AuthService] Google Sign In successful for ${this.maskEmail(normalizedEmail)}`);

      return {
        message: 'Signed in successfully with Google.',
        user: {
          id: user.id,
          email: user.email,
        },
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`[AuthService] Google Sign In failed:`, error);
      throw new UnauthorizedException('Google Sign In failed. Please try again.');
    }
  }

  private async generateTokens(userId: string, email: string) {
    this.logger.log(`[AuthService] generateTokens() called for userId=${userId}, email=${this.maskEmail(email)}`);
    
    const payload = { sub: userId, email };
    this.logger.log(`[AuthService] generateTokens() - payload created`);

    this.logger.log(`[AuthService] generateTokens() - signing access token...`);
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '45m', // 30-60 minutes as requested, using 45m as middle ground
    });
    this.logger.log(`[AuthService] generateTokens() - access token signed, length=${accessToken.length}`);

    this.logger.log(`[AuthService] generateTokens() - signing refresh token...`);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: '30d',
    });
    this.logger.log(`[AuthService] generateTokens() - refresh token signed, length=${refreshToken.length}`);

    this.logger.log(`[AuthService] generateTokens() - creating refresh token in database...`);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    this.logger.log(`[AuthService] generateTokens() - refresh token saved to database`);

    const result = {
      accessToken,
      refreshToken,
    };
    this.logger.log(`[AuthService] generateTokens() - returning tokens successfully`);
    return result;
  }

  private async findOrCreateUser(email: string) {
    this.logger.log(`[AuthService] findOrCreateUser() called for email: ${this.maskEmail(email)}`);
    
    this.logger.log(`[AuthService] findOrCreateUser() - searching for user in database...`);
    let user = await this.prisma.user.findUnique({
      where: { email },
    });
    this.logger.log(`[AuthService] findOrCreateUser() - user search completed, found=${!!user}, userId=${user?.id || 'N/A'}`);

    if (!user) {
      this.logger.log(`[AuthService] findOrCreateUser() - user not found, creating new user...`);
      const password = await this.generateRandomPasswordHash();
      this.logger.log(`[AuthService] findOrCreateUser() - password hash generated, creating user record...`);
      user = await this.prisma.user.create({
        data: {
          email,
          password,
        },
      });
      this.logger.log(`[AuthService] findOrCreateUser() - new user created: id=${user.id}, email=${this.maskEmail(user.email)}`);
      return user;
    }

    this.logger.log(`[AuthService] findOrCreateUser() - user found, checking password...`);
    if (!user.password || user.password.trim().length === 0) {
      this.logger.log(`[AuthService] findOrCreateUser() - user has no password, generating and updating...`);
      const password = await this.generateRandomPasswordHash();
      this.logger.log(`[AuthService] findOrCreateUser() - password hash generated, updating user...`);
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { password },
      });
      this.logger.log(`[AuthService] findOrCreateUser() - user password updated`);
    } else {
      this.logger.log(`[AuthService] findOrCreateUser() - user has password, no update needed`);
    }

    this.logger.log(`[AuthService] findOrCreateUser() - returning user: id=${user.id}, email=${this.maskEmail(user.email)}`);
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
