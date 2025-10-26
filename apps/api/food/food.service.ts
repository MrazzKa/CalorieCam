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
      imageBuffer: file.buffer,
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
