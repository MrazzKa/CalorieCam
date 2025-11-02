import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisService } from '../../redis/redis.service';
import * as crypto from 'crypto';

interface SearchFoodsBody {
  query: string;
  dataType?: ('Branded' | 'Foundation' | 'Survey (FNDDS)' | 'SR Legacy')[];
  pageSize?: number;
  pageNumber?: number;
  sortBy?: 'dataType.keyword' | 'lowercaseDescription.keyword' | 'fdcId' | 'publishedDate';
  sortOrder?: 'asc' | 'desc';
  brandOwner?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class FdcService {
  private readonly cacheTTL: number;

  constructor(
    private readonly http: HttpService,
    private readonly redis: RedisService,
  ) {
    this.cacheTTL = parseInt(process.env.FDC_CACHE_TTL_SECONDS || '86400', 10); // 24 hours default
  }

  private generateCacheKey(prefix: string, identifier: string): string {
    return `fdc:${prefix}:${identifier}`;
  }

  private hashSearchQuery(body: any): string {
    const str = JSON.stringify(body);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  async searchFoods(body: SearchFoodsBody) {
    const cacheKey = this.generateCacheKey('search', this.hashSearchQuery(body));
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const { data, headers } = await firstValueFrom(
        this.http.post('/v1/foods/search', body),
      );

      // Log rate limit info
      const remaining = headers['x-ratelimit-remaining'];
      const limit = headers['x-ratelimit-limit'];
      if (remaining !== undefined) {
        console.log(`[FDC] Rate limit: ${remaining}/${limit} remaining`);
      }

      // Cache result (shorter TTL for search - 1 hour)
      await this.redis.set(cacheKey, JSON.stringify(data), 3600);

      return data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('[FDC] Rate limit exceeded');
        throw new HttpException('USDA API rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (error.response?.status === 403) {
        throw new HttpException('USDA API access forbidden. Check API key.', HttpStatus.FORBIDDEN);
      }
      console.error('[FDC] Search error:', error.message);
      throw new HttpException(`USDA API error: ${error.message}`, error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFood(fdcId: number | string, opts?: { format?: 'abridged' | 'full'; nutrients?: number[] }) {
    const cacheKey = this.generateCacheKey('food', `${fdcId}_${opts?.format || 'full'}`);
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const params: any = {};
      if (opts?.format) params.format = opts.format;
      if (opts?.nutrients?.length) params.nutrients = opts.nutrients.join(',');

      const { data } = await firstValueFrom(
        this.http.get(`/v1/food/${fdcId}`, { params }),
      );

      // Cache result (longer TTL for individual foods - 24 hours)
      await this.redis.set(cacheKey, JSON.stringify(data), this.cacheTTL);

      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException('Food not found in USDA database', HttpStatus.NOT_FOUND);
      }
      if (error.response?.status === 429) {
        throw new HttpException('USDA API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      console.error('[FDC] Get food error:', error.message);
      throw new HttpException(`USDA API error: ${error.message}`, error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getFoods(fdcIds: (number | string)[], opts?: { format?: 'abridged' | 'full'; nutrients?: number[] }) {
    if (!fdcIds || fdcIds.length === 0) {
      throw new HttpException('fdcIds array is required', HttpStatus.BAD_REQUEST);
    }
    if (fdcIds.length > 20) {
      throw new HttpException('Maximum 20 fdcIds allowed per request', HttpStatus.BAD_REQUEST);
    }

    const body: any = { fdcIds: fdcIds.map(Number) };
    if (opts?.format) body.format = opts.format;
    if (opts?.nutrients?.length) body.nutrients = opts.nutrients;

    try {
      const { data } = await firstValueFrom(
        this.http.post('/v1/foods', body),
      );

      return data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new HttpException('USDA API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      console.error('[FDC] Get foods error:', error.message);
      throw new HttpException(`USDA API error: ${error.message}`, error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async listFoods(body: {
    dataType?: ('Branded' | 'Foundation' | 'Survey (FNDDS)' | 'SR Legacy')[];
    pageSize?: number;
    pageNumber?: number;
    sortBy?: 'dataType.keyword' | 'lowercaseDescription.keyword' | 'fdcId' | 'publishedDate';
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const { data } = await firstValueFrom(
        this.http.post('/v1/foods/list', body),
      );

      return data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new HttpException('USDA API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      console.error('[FDC] List foods error:', error.message);
      throw new HttpException(`USDA API error: ${error.message}`, error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Extract nutrition data from USDA food item
   * Handles both Branded (labelNutrients) and Foundation/SR Legacy (foodNutrients)
   */
  extractNutrition(foodItem: any): {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  } {
    let calories = 0;
    let protein = 0;
    let fat = 0;
    let carbs = 0;

    // Branded foods have labelNutrients
    if (foodItem.labelNutrients) {
      calories = foodItem.labelNutrients.energy?.value || 0;
      protein = foodItem.labelNutrients.protein?.value || 0;
      fat = foodItem.labelNutrients.fat?.value || 0;
      carbs = foodItem.labelNutrients.carbohydrates?.value || 0;
    } else if (foodItem.foodNutrients) {
      // Foundation/SR Legacy foods use foodNutrients array
      for (const nutrient of foodItem.foodNutrients) {
        const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
        const value = nutrient.amount || nutrient.value || 0;

        // Energy: Use Atwater (2047 or 2048) if available, otherwise 1008
        if (nutrientId === 2047 || nutrientId === 2048) {
          calories = value;
        } else if (nutrientId === 1008 && calories === 0) {
          calories = value;
        }
        
        // Protein (ID 1003)
        if (nutrientId === 1003) {
          protein = value;
        }
        
        // Fat (ID 1004)
        if (nutrientId === 1004) {
          fat = value;
        }
        
        // Carbs (ID 1005)
        if (nutrientId === 1005) {
          carbs = value;
        }
      }
    }

    return { calories, protein, fat, carbs };
  }
}

