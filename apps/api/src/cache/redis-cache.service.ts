import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface CacheItem<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface AnalysisCacheItem {
  id: string;
  imageHash: string;
  result: any;
  timestamp: Date;
  ttl: number;
}

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private defaultTTL: number = 24 * 60 * 60; // 24 hours in seconds
  private keyPrefix: string = 'caloriecam:cache:';

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    console.log('RedisCacheService initialized');
  }

  private getKey(key: string, namespace: string = 'general'): string {
    return `${this.keyPrefix}${namespace}:${key}`;
  }

  // Generic cache methods
  async get<T>(key: string, namespace?: string): Promise<T | null> {
    try {
      const redisKey = this.getKey(key, namespace);
      const data = await this.redisService.get(redisKey);
      
      if (!data) return null;
      
      const item: CacheItem<T> = JSON.parse(data);
      
      // Check if item has expired
      if (Date.now() > item.timestamp + (item.ttl * 1000)) {
        await this.delete(key, namespace);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number, namespace?: string): Promise<void> {
    try {
      const redisKey = this.getKey(key, namespace);
      const actualTTL = ttl || this.defaultTTL;
      
      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: actualTTL,
      };
      
      await this.redisService.set(redisKey, JSON.stringify(item), actualTTL);
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async delete(key: string, namespace?: string): Promise<void> {
    try {
      const redisKey = this.getKey(key, namespace);
      await this.redisService.del(redisKey);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  async has(key: string, namespace?: string): Promise<boolean> {
    try {
      const redisKey = this.getKey(key, namespace);
      return await this.redisService.exists(redisKey);
    } catch (error) {
      console.error('Redis cache has error:', error);
      return false;
    }
  }

  async clear(namespace?: string): Promise<void> {
    try {
      // This is a simple implementation - in production you might want to use SCAN
      // to avoid blocking Redis for too long
      const pattern = namespace 
        ? `${this.keyPrefix}${namespace}:*`
        : `${this.keyPrefix}*`;
      
      // Note: This is a simplified version. In production, use SCAN for better performance
      console.warn('Redis cache clear called - implement SCAN pattern for production');
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  // Analysis-specific cache methods
  async getAnalysisCache(imageHash: string): Promise<AnalysisCacheItem | null> {
    try {
      const data = await this.get<any>(imageHash, 'analysis');
      if (!data) return null;

      return {
        id: data.id || Math.random().toString(36).substr(2, 9),
        imageHash,
        result: data.result || data,
        timestamp: new Date(data.timestamp || Date.now()),
        ttl: data.ttl || this.defaultTTL * 1000,
      };
    } catch (error) {
      console.error('Analysis cache get error:', error);
      return null;
    }
  }

  async setAnalysisCache(imageHash: string, result: any, ttl?: number): Promise<void> {
    try {
      const item = {
        id: Math.random().toString(36).substr(2, 9),
        imageHash,
        result,
        timestamp: Date.now(),
        ttl: (ttl || this.defaultTTL) * 1000,
      };

      await this.set(imageHash, item, ttl, 'analysis');
    } catch (error) {
      console.error('Analysis cache set error:', error);
    }
  }

  async hasAnalysisCache(imageHash: string): Promise<boolean> {
    return this.has(imageHash, 'analysis');
  }

  async deleteAnalysisCache(imageHash: string): Promise<void> {
    return this.delete(imageHash, 'analysis');
  }

  // Memoization cache methods
  async getMemoized<T>(key: string): Promise<T | null> {
    return this.get<T>(key, 'memoized');
  }

  async setMemoized<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    return this.set(key, value, ttl, 'memoized');
  }

  // Presign URL cache methods
  async getPresignedUrl(key: string): Promise<any | null> {
    return this.get(key, 'presign');
  }

  async setPresignedUrl(key: string, urlData: any, ttl: number = 3600): Promise<void> {
    return this.set(key, urlData, ttl, 'presign');
  }

  // Storage cache methods
  async getStorage<T>(key: string): Promise<T | null> {
    return this.get<T>(key, 'storage');
  }

  async setStorage<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.set(key, value, ttl, 'storage');
  }

  // Utility methods
  generateImageHash(imageUri: string): string {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < imageUri.length; i++) {
      const char = imageUri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = this.getKey('health_check', 'test');
      const testValue = Date.now().toString();
      
      await this.redisService.set(testKey, testValue, 60);
      const result = await this.redisService.get(testKey);
      await this.redisService.del(testKey);
      
      return result === testValue;
    } catch (error) {
      console.error('Redis cache health check failed:', error);
      return false;
    }
  }
}
