import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 5;

type StoredOtpPayload = {
  hash: string;
  attempts: number;
  createdAt: string;
};

type VerifyStatus = 'valid' | 'invalid' | 'expired';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  generateOtp(): string {
    const random = crypto.randomInt(0, 1_000_000);
    return random.toString().padStart(6, '0');
  }

  async saveOtp(email: string, otp: string): Promise<void> {
    const key = this.buildKey(email);
    const payload: StoredOtpPayload = {
      hash: this.hashCode(otp),
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    await this.redisService.set(key, JSON.stringify(payload), OTP_TTL_SECONDS);
  }

  async verifyOtp(email: string, code: string): Promise<VerifyStatus> {
    const key = this.buildKey(email);
    const raw = await this.redisService.get(key);
    if (!raw) {
      return 'expired';
    }

    let payload: StoredOtpPayload | null = null;
    try {
      payload = JSON.parse(raw) as StoredOtpPayload;
    } catch (error) {
      this.logger.warn(`[OtpService] Failed to parse OTP payload for ${email}: ${error instanceof Error ? error.message : 'unknown error'}`);
      await this.redisService.del(key);
      return 'expired';
    }

    const normalizedCodeHash = this.hashCode(code);
    if (payload.hash !== normalizedCodeHash) {
      payload.attempts = (payload.attempts ?? 0) + 1;
      const ttl = await this.redisService.ttl(key);
      if (payload.attempts >= MAX_ATTEMPTS) {
        await this.redisService.del(key);
      } else {
        await this.redisService.set(key, JSON.stringify(payload), ttl > 0 ? ttl : OTP_TTL_SECONDS);
      }
      return 'invalid';
    }

    await this.redisService.del(key);
    return 'valid';
  }

  async getOtpTtl(email: string): Promise<number> {
    const ttl = await this.redisService.ttl(this.buildKey(email));
    return ttl < 0 ? 0 : ttl;
  }

  private buildKey(email: string): string {
    const normalized = this.normalizeEmail(email);
    return `auth:otp:${normalized}`;
  }

  private hashCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update((code || '').toString().trim().toUpperCase())
      .digest('hex');
  }

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }
}
