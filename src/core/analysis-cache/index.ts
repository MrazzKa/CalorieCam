export interface AnalysisCacheItem {
  id: string;
  imageHash: string;
  result: any;
  timestamp: Date;
  ttl: number;
}

export class AnalysisCache {
  private cache = new Map<string, AnalysisCacheItem>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) { // 24 hours
    this.defaultTTL = defaultTTL;
  }

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

  get(imageHash: string): AnalysisCacheItem | null {
    const item = this.cache.get(imageHash);
    
    if (!item) return null;
    
    if (Date.now() > item.timestamp.getTime() + item.ttl) {
      this.cache.delete(imageHash);
      return null;
    }
    
    return item;
  }

  set(imageHash: string, result: any, ttl?: number): void {
    const item: AnalysisCacheItem = {
      id: Math.random().toString(36).substr(2, 9),
      imageHash,
      result,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
    };
    
    this.cache.set(imageHash, item);
  }

  has(imageHash: string): boolean {
    const item = this.cache.get(imageHash);
    
    if (!item) return false;
    
    if (Date.now() > item.timestamp.getTime() + item.ttl) {
      this.cache.delete(imageHash);
      return false;
    }
    
    return true;
  }

  delete(imageHash: string): void {
    this.cache.delete(imageHash);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp.getTime() + item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const analysisCache = new AnalysisCache();
