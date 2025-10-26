import { describe, it, expect, beforeEach } from '@jest/globals';
import { StorageManager } from '../../../core/storage';

describe('StorageManager', () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager(1000); // 1 second TTL
  });

  it('should set and get item', () => {
    storageManager.set('test-key', 'test-value');
    const result = storageManager.get('test-key');
    expect(result).toBe('test-value');
  });

  it('should return null for non-existent key', () => {
    const result = storageManager.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('should return null for expired item', () => {
    storageManager.set('test-key', 'test-value', 100); // 100ms TTL
    setTimeout(() => {
      const result = storageManager.get('test-key');
      expect(result).toBeNull();
    }, 150);
  });

  it('should check if item exists', () => {
    expect(storageManager.has('test-key')).toBe(false);
    storageManager.set('test-key', 'test-value');
    expect(storageManager.has('test-key')).toBe(true);
  });

  it('should delete item', () => {
    storageManager.set('test-key', 'test-value');
    storageManager.delete('test-key');
    const result = storageManager.get('test-key');
    expect(result).toBeNull();
  });

  it('should clear all items', () => {
    storageManager.set('test-key1', 'test-value1');
    storageManager.set('test-key2', 'test-value2');
    storageManager.clear();
    expect(storageManager.get('test-key1')).toBeNull();
    expect(storageManager.get('test-key2')).toBeNull();
  });

  it('should get all keys', () => {
    storageManager.set('test-key1', 'test-value1');
    storageManager.set('test-key2', 'test-value2');
    const keys = storageManager.keys();
    expect(keys).toContain('test-key1');
    expect(keys).toContain('test-key2');
  });

  it('should get storage size', () => {
    expect(storageManager.size()).toBe(0);
    storageManager.set('test-key1', 'test-value1');
    storageManager.set('test-key2', 'test-value2');
    expect(storageManager.size()).toBe(2);
  });

  it('should cleanup expired items', () => {
    storageManager.set('test-key1', 'test-value1', 100); // 100ms TTL
    storageManager.set('test-key2', 'test-value2', 1000); // 1 second TTL
    
    setTimeout(() => {
      storageManager.cleanup();
      expect(storageManager.get('test-key1')).toBeNull();
      expect(storageManager.get('test-key2')).not.toBeNull();
    }, 150);
  });

  it('should get item info', () => {
    storageManager.set('test-key', 'test-value');
    const itemInfo = storageManager.getItemInfo('test-key');
    expect(itemInfo).toBeDefined();
    expect(itemInfo?.key).toBe('test-key');
    expect(itemInfo?.value).toBe('test-value');
  });

  it('should get all items', () => {
    storageManager.set('test-key1', 'test-value1');
    storageManager.set('test-key2', 'test-value2');
    const items = storageManager.getAllItems();
    expect(items).toHaveLength(2);
  });
});
