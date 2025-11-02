import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';

export const DAILY_LIMIT_KEY = 'dailyLimit';

export interface DailyLimitOptions {
  limit: number;
  resource: 'food' | 'chat';
}

@Injectable()
export class DailyLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<DailyLimitOptions>(
      DAILY_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true; // No limit configured
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Check user subscription (free vs paid)
    // For now, assume all users are free (5 photos/day, 10 chats/day)
    // TODO: Check user subscription from database
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `daily:${options.resource}:${userId}:${today}`;

    // Get current count
    const currentCountStr = await this.redisService.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

    const resetTime = getResetTime();

    if (currentCount >= options.limit) {
      const secondsUntilReset = Math.floor((resetTime.getTime() - Date.now()) / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily limit reached. You have used ${currentCount} of ${options.limit} ${options.resource === 'food' ? 'photo analyses' : 'chat requests'} today. Limit resets at midnight.`,
          limit: options.limit,
          used: currentCount,
          remaining: 0,
          resetAt: resetTime.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    const ttl = Math.floor((resetTime.getTime() - Date.now()) / 1000);
    await this.redisService.set(key, (currentCount + 1).toString(), ttl > 0 ? ttl : 86400);

    return true;
  }
}

// Helper function to calculate reset time (midnight)
function getResetTime(): Date {
  const resetTime = new Date();
  resetTime.setHours(24, 0, 0, 0);
  return resetTime;
}

