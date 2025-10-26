import { describe, it, expect, beforeEach } from '@jest/globals';
import { AnalysisCache } from '../../../core/analysis-cache';

describe('AnalysisCache', () => {
  let analysisCache: AnalysisCache;

  beforeEach(() => {
    analysisCache = new AnalysisCache(1000); // 1 second TTL
  });

  it('should generate image hash', () => {
    const hash1 = analysisCache.generateImageHash('test-image-1.jpg');
    const hash2 = analysisCache.generateImageHash('test-image-2.jpg');
    const hash3 = analysisCache.generateImageHash('test-image-1.jpg');

    expect(hash1).toBe(hash3);
    expect(hash1).not.toBe(hash2);
  });

  it('should set and get analysis result', () => {
    const mockResult = {
      items: [{ label: 'Test Food', kcal: 100 }],
      totalCalories: 100,
      totalProtein: 10,
      totalFat: 5,
      totalCarbs: 15,
      confidence: 0.95,
      processingTime: 1000,
      timestamp: new Date(),
    };

    const imageHash = analysisCache.generateImageHash('test-image.jpg');
    analysisCache.set(imageHash, mockResult);
    const result = analysisCache.get(imageHash);

    expect(result).toEqual(mockResult);
  });

  it('should return null for non-existent hash', () => {
    const result = analysisCache.get('non-existent-hash');
    expect(result).toBeNull();
  });

  it('should return null for expired result', () => {
    const mockResult = {
      items: [{ label: 'Test Food', kcal: 100 }],
      totalCalories: 100,
      totalProtein: 10,
      totalFat: 5,
      totalCarbs: 15,
      confidence: 0.95,
      processingTime: 1000,
      timestamp: new Date(),
    };

    const imageHash = analysisCache.generateImageHash('test-image.jpg');
    analysisCache.set(imageHash, mockResult, 100); // 100ms TTL

    // Wait for expiration
    setTimeout(() => {
      const result = analysisCache.get(imageHash);
      expect(result).toBeNull();
    }, 150);
  });

  it('should check if result exists', () => {
    const mockResult = {
      items: [{ label: 'Test Food', kcal: 100 }],
      totalCalories: 100,
      totalProtein: 10,
      totalFat: 5,
      totalCarbs: 15,
      confidence: 0.95,
      processingTime: 1000,
      timestamp: new Date(),
    };

    const imageHash = analysisCache.generateImageHash('test-image.jpg');
    expect(analysisCache.has(imageHash)).toBe(false);

    analysisCache.set(imageHash, mockResult);
    expect(analysisCache.has(imageHash)).toBe(true);
  });

  it('should delete result', () => {
    const mockResult = {
      items: [{ label: 'Test Food', kcal: 100 }],
      totalCalories: 100,
      totalProtein: 10,
      totalFat: 5,
      totalCarbs: 15,
      confidence: 0.95,
      processingTime: 1000,
      timestamp: new Date(),
    };

    const imageHash = analysisCache.generateImageHash('test-image.jpg');
    analysisCache.set(imageHash, mockResult);
    analysisCache.delete(imageHash);

    expect(analysisCache.get(imageHash)).toBeNull();
  });

  it('should clear all results', () => {
    const mockResult = {
      items: [{ label: 'Test Food', kcal: 100 }],
      totalCalories: 100,
      totalProtein: 10,
      totalFat: 5,
      totalCarbs: 15,
      confidence: 0.95,
      processingTime: 1000,
      timestamp: new Date(),
    };

    const imageHash1 = analysisCache.generateImageHash('test-image-1.jpg');
    const imageHash2 = analysisCache.generateImageHash('test-image-2.jpg');
    analysisCache.set(imageHash1, mockResult);
    analysisCache.set(imageHash2, mockResult);
    analysisCache.clear();

    expect(analysisCache.get(imageHash1)).toBeNull();
    expect(analysisCache.get(imageHash2)).toBeNull();
  });

  it('should cleanup expired results', () => {
    const mockResult = {
      items: [{ label: 'Test Food', kcal: 100 }],
      totalCalories: 100,
      totalProtein: 10,
      totalFat: 5,
      totalCarbs: 15,
      confidence: 0.95,
      processingTime: 1000,
      timestamp: new Date(),
    };

    const imageHash1 = analysisCache.generateImageHash('test-image-1.jpg');
    const imageHash2 = analysisCache.generateImageHash('test-image-2.jpg');
    analysisCache.set(imageHash1, mockResult, 100); // 100ms TTL
    analysisCache.set(imageHash2, mockResult, 1000); // 1 second TTL

    // Wait for first to expire
    setTimeout(() => {
      analysisCache.cleanup();
      expect(analysisCache.get(imageHash1)).toBeNull();
      expect(analysisCache.get(imageHash2)).not.toBeNull();
    }, 150);
  });
});
