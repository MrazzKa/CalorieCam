import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma.service';
import { FoodAnalyzerService } from './food-analyzer/food-analyzer.service';
import { RedisService } from '../redis/redis.service';
import { calculateHealthScore } from './food-health-score.util';

@Injectable()
export class FoodService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodAnalyzer: FoodAnalyzerService,
    @InjectQueue('food-analysis') private readonly analysisQueue: Queue,
    private readonly redisService: RedisService,
  ) {}

  async analyzeImage(file: any, userId: string) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Validate and prepare buffer
    let imageBuffer: Buffer;
    if (file.buffer && Buffer.isBuffer(file.buffer)) {
      imageBuffer = file.buffer;
    } else if (file.buffer) {
      // Convert to buffer if it's not already
      imageBuffer = Buffer.from(file.buffer);
    } else {
      throw new BadRequestException('File buffer is missing. Please check multer configuration.');
    }

    if (imageBuffer.length === 0) {
      throw new BadRequestException('File buffer is empty');
    }

    // Create analysis record
    const analysis = await this.prisma.analysis.create({
      data: {
        userId,
        type: 'IMAGE',
        status: 'PENDING',
        metadata: {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      },
    });

    // Convert buffer to base64 for Bull queue serialization
    // Bull queues serialize to JSON, which doesn't support Buffer directly
    const imageBufferBase64 = imageBuffer.toString('base64');

    // Add to queue for processing
    await this.analysisQueue.add('analyze-image', {
      analysisId: analysis.id,
      imageBufferBase64: imageBufferBase64,
      userId,
    });

    // Increment daily limit counter after successful analysis creation
    await this.incrementDailyLimit(userId, 'food');

    return {
      analysisId: analysis.id,
      status: 'PENDING',
      message: 'Analysis started. Results will be available shortly.',
    };
  }

  private async incrementDailyLimit(userId: string, resource: 'food' | 'chat') {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `daily:${resource}:${userId}:${today}`;
      
      const currentCountStr = await this.redisService.get(key);
      const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;
      
      const resetTime = new Date();
      resetTime.setHours(24, 0, 0, 0);
      const ttl = Math.floor((resetTime.getTime() - Date.now()) / 1000);
      
      await this.redisService.set(key, (currentCount + 1).toString(), ttl > 0 ? ttl : 86400);
    } catch (error) {
      console.error('Error incrementing daily limit:', error);
      // Don't throw - limit increment failure shouldn't block analysis
    }
  }

  async analyzeText(description: string, userId: string) {
    if (!description || description.trim().length === 0) {
      throw new BadRequestException('Description cannot be empty');
    }

    // Create analysis record
    const analysis = await this.prisma.analysis.create({
      data: {
        userId,
        type: 'TEXT',
        status: 'PENDING',
        metadata: {
          description: description.trim(),
        },
      },
    });

    // Add to queue for processing
    await this.analysisQueue.add('analyze-text', {
      analysisId: analysis.id,
      description: description.trim(),
      userId,
    });

    // Increment daily limit counter after successful analysis creation
    await this.incrementDailyLimit(userId, 'food');

    return {
      analysisId: analysis.id,
      status: 'PENDING',
      message: 'Analysis started. Results will be available shortly.',
    };
  }

  async getAnalysis(analysisId: string, userId: string) {
    const analysis = await this.prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      include: {
        results: true,
      },
    });

    if (!analysis) {
      throw new BadRequestException('Analysis not found');
    }

    return analysis;
  }

  async getAnalysisStatus(analysisId: string, userId: string) {
    const analysis = await this.prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      throw new BadRequestException('Analysis not found');
    }

    return {
      status: analysis.status.toLowerCase(),
      analysisId: analysis.id,
    };
  }

  async getAnalysisResult(analysisId: string, userId: string) {
    const analysis = await this.prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      include: {
        results: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!analysis) {
      throw new BadRequestException('Analysis not found');
    }

    if (analysis.status !== 'COMPLETED') {
      throw new BadRequestException(`Analysis is ${analysis.status}, not completed`);
    }

    if (!analysis.results || analysis.results.length === 0) {
      throw new BadRequestException('Analysis result not found');
    }

    const resultData = analysis.results[0].data as any;
    
    // Transform API format to frontend format
    const items = resultData.items || [];
    const ingredients = items.map((item: any) => ({
      name: item.label || item.name,
      calories: item.kcal || item.calories,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      weight: item.gramsMean || item.weight || 100,
    }));

    const totalCalories = ingredients.reduce((sum: number, ing: any) => sum + (ing.calories || 0), 0);
    const totalProtein = ingredients.reduce((sum: number, ing: any) => sum + (ing.protein || 0), 0);
    const totalCarbs = ingredients.reduce((sum: number, ing: any) => sum + (ing.carbs || 0), 0);
    const totalFat = ingredients.reduce((sum: number, ing: any) => sum + (ing.fat || 0), 0);

    // Extract Health Score (new pipeline provides this)
    let healthScore = resultData.healthScore;

    if (!healthScore) {
      const fallbackScore = calculateHealthScore({
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        items: items,
      });
      healthScore = {
        score: fallbackScore.score,
        grade: fallbackScore.grade,
        factors: {
          macroBalance: {
            label: 'Macro balance',
            score: fallbackScore.factors.macroBalance,
            weight: 0.35,
          },
          calorieDensity: {
            label: 'Calorie density',
            score: fallbackScore.factors.calorieDensity,
            weight: 0.25,
          },
          proteinQuality: {
            label: 'Protein quality',
            score: fallbackScore.factors.proteinQuality,
            weight: 0.25,
          },
          processingLevel: {
            label: 'Processing level',
            score: fallbackScore.factors.processingLevel,
            weight: 0.15,
          },
        },
        feedback: fallbackScore.feedback,
      };
    }

    const autoSave = resultData.autoSave
      ? {
          mealId: resultData.autoSave.mealId,
          savedAt: resultData.autoSave.savedAt,
        }
      : null;

    return {
      dishName: items.length > 0 ? (items[0].label || 'Food Analysis') : 'Food Analysis',
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      ingredients,
      healthScore,
      autoSave,
    };
  }

  async getUserAnalyses(userId: string, limit: number = 10, offset: number = 0) {
    const analyses = await this.prisma.analysis.findMany({
      where: { userId },
      include: {
        results: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.analysis.count({
      where: { userId },
    });

    return {
      analyses,
      total,
      limit,
      offset,
    };
  }
}
