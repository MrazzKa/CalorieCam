export interface PresignedUrl {
  url: string;
  expiresAt: Date;
  fields?: Record<string, string>;
}

export class PresignMemoization {
  private cache = new Map<string, PresignedUrl>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes
    this.defaultTTL = defaultTTL;
  }

  generateKey(bucket: string, key: string, operation: string): string {
    return `${bucket}:${key}:${operation}`;
  }

  get(bucket: string, key: string, operation: string): PresignedUrl | null {
    const cacheKey = this.generateKey(bucket, key, operation);
    const item = this.cache.get(cacheKey);
    
    if (!item) return null;
    
    if (Date.now() > item.expiresAt.getTime()) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return item;
  }

  set(bucket: string, key: string, operation: string, url: string, expiresAt: Date): void {
    const cacheKey = this.generateKey(bucket, key, operation);
    this.cache.set(cacheKey, { url, expiresAt });
  }

  has(bucket: string, key: string, operation: string): boolean {
    const cacheKey = this.generateKey(bucket, key, operation);
    const item = this.cache.get(cacheKey);
    
    if (!item) return false;
    
    if (Date.now() > item.expiresAt.getTime()) {
      this.cache.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  delete(bucket: string, key: string, operation: string): void {
    const cacheKey = this.generateKey(bucket, key, operation);
    this.cache.delete(cacheKey);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt.getTime()) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

export const presignMemoization = new PresignMemoization();
