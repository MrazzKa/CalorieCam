export interface AnalysisLock {
  id: string;
  userId: string;
  imageHash: string;
  timestamp: Date;
  ttl: number;
}

export class AnalysisLockManager {
  private locks = new Map<string, AnalysisLock>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes
    this.defaultTTL = defaultTTL;
  }

  generateLockKey(userId: string, imageHash: string): string {
    return `${userId}:${imageHash}`;
  }

  acquireLock(userId: string, imageHash: string): boolean {
    const lockKey = this.generateLockKey(userId, imageHash);
    const existingLock = this.locks.get(lockKey);
    
    if (existingLock) {
      if (Date.now() > existingLock.timestamp.getTime() + existingLock.ttl) {
        this.locks.delete(lockKey);
      } else {
        return false; // Lock already exists and is still valid
      }
    }
    
    const lock: AnalysisLock = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      imageHash,
      timestamp: new Date(),
      ttl: this.defaultTTL,
    };
    
    this.locks.set(lockKey, lock);
    return true;
  }

  releaseLock(userId: string, imageHash: string): void {
    const lockKey = this.generateLockKey(userId, imageHash);
    this.locks.delete(lockKey);
  }

  isLocked(userId: string, imageHash: string): boolean {
    const lockKey = this.generateLockKey(userId, imageHash);
    const lock = this.locks.get(lockKey);
    
    if (!lock) return false;
    
    if (Date.now() > lock.timestamp.getTime() + lock.ttl) {
      this.locks.delete(lockKey);
      return false;
    }
    
    return true;
  }

  getLockInfo(userId: string, imageHash: string): AnalysisLock | null {
    const lockKey = this.generateLockKey(userId, imageHash);
    const lock = this.locks.get(lockKey);
    
    if (!lock) return null;
    
    if (Date.now() > lock.timestamp.getTime() + lock.ttl) {
      this.locks.delete(lockKey);
      return null;
    }
    
    return lock;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (now > lock.timestamp.getTime() + lock.ttl) {
        this.locks.delete(key);
      }
    }
  }

  getAllLocks(): AnalysisLock[] {
    return Array.from(this.locks.values());
  }
}

export const analysisLockManager = new AnalysisLockManager();
