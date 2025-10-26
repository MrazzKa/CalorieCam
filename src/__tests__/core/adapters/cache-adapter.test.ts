import { describe, it, expect, beforeEach } from '@jest/globals';
import { MemoryCacheAdapter } from '../../../core/adapters/cache-adapter';

describe('MemoryCacheAdapter', () => {
  let cacheAdapter: MemoryCacheAdapter;

  beforeEach(() => {
    cacheAdapter = new MemoryCacheAdapter(1000); // 1 second TTL
  });

  it('should set and get item', async () => {
    await cacheAdapter.set('test-key', 'test-value');
    const result = await cacheAdapter.get('test-key');
    expect(result).toBe('test-value');
  });

  it('should return null for non-existent key', async () => {
    const result = await cacheAdapter.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('should return null for expired item', async () => {
    await cacheAdapter.set('test-key', 'test-value', 100); // 100ms TTL
    await new Promise(resolve => setTimeout(resolve, 150));
    const result = await cacheAdapter.get('test-key');
    expect(result).toBeNull();
  });

  it('should check if item exists', async () => {
    await cacheAdapter.set('test-key', 'test-value');
    expect(await cacheAdapter.has('test-key')).toBe(true);
    expect(await cacheAdapter.has('non-existent-key')).toBe(false);
  });

  it('should delete item', async () => {
    await cacheAdapter.set('test-key', 'test-value');
    await cacheAdapter.delete('test-key');
    const result = await cacheAdapter.get('test-key');
    expect(result).toBeNull();
  });

  it('should clear all items', async () => {
    await cacheAdapter.set('test-key1', 'test-value1');
    await cacheAdapter.set('test-key2', 'test-value2');
    await cacheAdapter.clear();
    expect(await cacheAdapter.get('test-key1')).toBeNull();
    expect(await cacheAdapter.get('test-key2')).toBeNull();
  });
});
