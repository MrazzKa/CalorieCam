export interface StorageItem<T = any> {
  key: string;
  value: T;
  expiry?: number;
  createdAt: Date;
}

export class StorageManager {
  private storage: Map<string, StorageItem> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) { // 24 hours
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const item: StorageItem<T> = {
      key,
      value,
      expiry: Date.now() + (ttl || this.defaultTTL),
      createdAt: new Date(),
    };
    
    this.storage.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.storage.get(key);
    
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key: string): boolean {
    const item = this.storage.get(key);
    
    if (!item) return false;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  keys(): string[] {
    return Array.from(this.storage.keys());
  }

  size(): number {
    return this.storage.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.storage.entries()) {
      if (item.expiry && now > item.expiry) {
        this.storage.delete(key);
      }
    }
  }

  getItemInfo(key: string): StorageItem | null {
    const item = this.storage.get(key);
    
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }
    
    return item;
  }

  getAllItems(): StorageItem[] {
    return Array.from(this.storage.values());
  }
}

export const storageManager = new StorageManager();
