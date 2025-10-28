export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export class MemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, { value: any; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes
    this.defaultTTL = defaultTTL;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

import { createRedisCacheAdapter } from './redis-cache-adapter';

// Create hybrid cache that tries Redis first, falls back to memory
class HybridCacheAdapter implements CacheAdapter {
  private memoryCache: MemoryCacheAdapter;
  private redisCache: any;
  private useRedis: boolean = true;

  constructor() {
    this.memoryCache = new MemoryCacheAdapter();
    try {
      this.redisCache = createRedisCacheAdapter();
    } catch (error) {
      console.warn('Redis cache unavailable, using memory cache only:', error);
      this.useRedis = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis && this.redisCache) {
      try {
        const result = await this.redisCache.get<T>(key);
        if (result !== null) {
          return result;
        }
      } catch (error) {
        console.warn('Redis cache get failed, falling back to memory:', error);
      }
    }
    
    return this.memoryCache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Always set in memory cache for fast local access
    await this.memoryCache.set(key, value, ttl);
    
    // Try to set in Redis if available
    if (this.useRedis && this.redisCache) {
      try {
        await this.redisCache.set(key, value, ttl);
      } catch (error) {
        console.warn('Redis cache set failed:', error);
      }
    }
  }

  async delete(key: string): Promise<void> {
    // Delete from both caches
    await this.memoryCache.delete(key);
    
    if (this.useRedis && this.redisCache) {
      try {
        await this.redisCache.delete(key);
      } catch (error) {
        console.warn('Redis cache delete failed:', error);
      }
    }
  }

  async clear(): Promise<void> {
    await this.memoryCache.clear();
    
    if (this.useRedis && this.redisCache) {
      try {
        await this.redisCache.clear();
      } catch (error) {
        console.warn('Redis cache clear failed:', error);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    if (this.useRedis && this.redisCache) {
      try {
        const hasRedis = await this.redisCache.has(key);
        if (hasRedis) return true;
      } catch (error) {
        console.warn('Redis cache has failed, checking memory:', error);
      }
    }
    
    return this.memoryCache.has(key);
  }
}

export const cacheAdapter = new HybridCacheAdapter();
