import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../../../redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class FdcApiService {
  private readonly logger = new Logger(FdcApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Search foods via USDA API
   * Cached for 12 hours
   */
  async searchFoods(body: any): Promise<any> {
    const cacheKey = `fdc:search:${this.hashBody(body)}`;
    
    // Check cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${cacheKey}`);
      return JSON.parse(cached);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post('/v1/foods/search', body),
      );

      // Log rate limit headers
      const rateLimitHeaders = {
        'X-RateLimit-Limit': response.headers['x-ratelimit-limit'],
        'X-RateLimit-Remaining': response.headers['x-ratelimit-remaining'],
        'X-RateLimit-Reset': response.headers['x-ratelimit-reset'],
      };
      this.logger.debug('Rate limit info:', rateLimitHeaders);

      // Cache for 12 hours (43200 seconds)
      await this.redisService.set(cacheKey, JSON.stringify(response.data), 43200);

      return response.data;
    } catch (error: any) {
      this.logger.error('USDA search error:', error.message);
      
      if (error.response?.status === 429) {
        throw new HttpException(
          'Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      if (error.response?.status >= 500) {
        throw new HttpException(
          'USDA API server error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        error.response?.data?.message || 'Failed to search foods',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get food by FDC ID
   * Cached for 72 hours
   */
  async getFood(fdcId: number): Promise<any> {
    const cacheKey = `fdc:food:${fdcId}`;
    
    // Check cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for food: ${fdcId}`);
      return JSON.parse(cached);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`/v1/food/${fdcId}`),
      );

      // Cache for 72 hours (259200 seconds)
      await this.redisService.set(cacheKey, JSON.stringify(response.data), 259200);

      return response.data;
    } catch (error: any) {
      this.logger.error(`USDA getFood error for ${fdcId}:`, error.message);
      
      if (error.response?.status === 404) {
        throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.response?.status === 429) {
        throw new HttpException(
          'Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        error.response?.data?.message || 'Failed to get food',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get multiple foods by FDC IDs
   */
  async getFoods(fdcIds: number[]): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/v1/foods', { fdcIds }),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('USDA getFoods error:', error.message);
      throw new HttpException(
        error.response?.data?.message || 'Failed to get foods',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * List foods with pagination
   */
  async listFoods(body: any): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/v1/foods/list', body),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('USDA listFoods error:', error.message);
      throw new HttpException(
        error.response?.data?.message || 'Failed to list foods',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private hashBody(body: any): string {
    const str = JSON.stringify(body);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}

