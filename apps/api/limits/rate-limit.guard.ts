import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
    const { req } = context.switchToHttp().getRequest();
    const key = this.generateKey(context, req.ip, 'default');
    
    const totalHits = await this.storageService.increment(key, ttl);
    
    if (totalHits.totalHits > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter: Math.round(ttl / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    return true;
  }
}
