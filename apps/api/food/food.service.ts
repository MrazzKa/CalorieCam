import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma.service';
import { FoodAnalyzerService } from './food-analyzer/food-analyzer.service';

@Injectable()
export class FoodService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodAnalyzer: FoodAnalyzerService,
    @InjectQueue('food-analysis') private readonly analysisQueue: Queue,
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

    // Add to queue for processing
    await this.analysisQueue.add('analyze-image', {
      analysisId: analysis.id,
      imageBuffer: imageBuffer,
      userId,
    });

    return {
      analysisId: analysis.id,
      status: 'PENDING',
      message: 'Analysis started. Results will be available shortly.',
    };
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

    return {
      dishName: items.length > 0 ? (items[0].label || 'Food Analysis') : 'Food Analysis',
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      ingredients,
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
