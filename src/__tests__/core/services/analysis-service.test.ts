import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AnalysisService } from '../../../core/services/analysis-service';

// Mock dependencies
jest.mock('../../../core/analysis-cache', () => ({
  analysisCache: {
    generateImageHash: jest.fn(() => 'test-hash'),
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../../../core/analysis-lock', () => ({
  analysisLockManager: {
    isLocked: jest.fn(),
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
  },
}));

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  const mockAnalysisCache = require('../../../core/analysis-cache').analysisCache;
  const mockAnalysisLockManager = require('../../../core/analysis-lock').analysisLockManager;

  beforeEach(() => {
    analysisService = new AnalysisService();
    jest.clearAllMocks();
  });

  it('should analyze image with cached result', async () => {
    const mockCachedResult = {
      result: {
        items: [{ label: 'Test Food', kcal: 100 }],
        totalCalories: 100,
        totalProtein: 10,
        totalFat: 5,
        totalCarbs: 15,
        confidence: 0.95,
        processingTime: 1000,
        timestamp: new Date(),
      },
    };

    mockAnalysisCache.get.mockReturnValue(mockCachedResult);

    const result = await analysisService.analyzeImage({
      imageUri: 'test-image.jpg',
      userId: 'user1',
    });

    expect(result.result).toEqual(mockCachedResult.result);
    expect(result.status).toBe('completed');
  });

  it('should analyze image with new processing', async () => {
    mockAnalysisCache.get.mockReturnValue(null);
    mockAnalysisLockManager.isLocked.mockReturnValue(false);
    mockAnalysisLockManager.acquireLock.mockReturnValue(true);

    const result = await analysisService.analyzeImage({
      imageUri: 'test-image.jpg',
      userId: 'user1',
    });

    expect(result.status).toBe('completed');
    expect(result.result.items).toHaveLength(1);
    expect(result.result.items[0].label).toBe('Grilled Chicken Breast');
  });

  it('should throw error if analysis is locked', async () => {
    mockAnalysisCache.get.mockReturnValue(null);
    mockAnalysisLockManager.isLocked.mockReturnValue(true);

    await expect(analysisService.analyzeImage({
      imageUri: 'test-image.jpg',
      userId: 'user1',
    })).rejects.toThrow('Analysis already in progress');
  });

  it('should throw error if lock acquisition fails', async () => {
    mockAnalysisCache.get.mockReturnValue(null);
    mockAnalysisLockManager.isLocked.mockReturnValue(false);
    mockAnalysisLockManager.acquireLock.mockReturnValue(false);

    await expect(analysisService.analyzeImage({
      imageUri: 'test-image.jpg',
      userId: 'user1',
    })).rejects.toThrow('Failed to acquire analysis lock');
  });

  it('should get analysis by id', async () => {
    const result = await analysisService.getAnalysis('analysis1');
    expect(result).toBeDefined();
    expect(result?.id).toBe('analysis1');
  });

  it('should get user analyses', async () => {
    const result = await analysisService.getUserAnalyses('user1', 10);
    expect(result).toEqual([]);
  });

  it('should delete analysis', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await analysisService.deleteAnalysis('analysis1');
    
    expect(consoleSpy).toHaveBeenCalledWith('Deleted analysis analysis1');
    
    consoleSpy.mockRestore();
  });
});
