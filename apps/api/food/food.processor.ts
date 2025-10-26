import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma.service';
import { FoodAnalyzerService } from './food-analyzer/food-analyzer.service';

@Processor('food-analysis')
export class FoodProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodAnalyzer: FoodAnalyzerService,
  ) {}

  @Process('analyze-image')
  async handleImageAnalysis(job: Job) {
    const { analysisId, imageBuffer, userId } = job.data;

    try {
      // Update status to processing
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'PROCESSING' },
      });

      // Analyze image
      const result = await this.foodAnalyzer.analyzeImage(imageBuffer);

      // Save results
      await this.prisma.analysisResult.create({
        data: {
          analysisId,
          data: result as any,
        },
      });

      // Update status to completed
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'COMPLETED' },
      });

      console.log(`Image analysis completed for analysis ${analysisId}`);
    } catch (error: any) {
      console.error(`Image analysis failed for analysis ${analysisId}:`, error);
      
      // Update status to failed
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { 
          status: 'FAILED',
          error: error.message,
        },
      });
    }
  }

  @Process('analyze-text')
  async handleTextAnalysis(job: Job) {
    const { analysisId, description, userId } = job.data;

    try {
      // Update status to processing
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'PROCESSING' },
      });

      // Analyze text
      const result = await this.foodAnalyzer.analyzeText(description);

      // Save results
      await this.prisma.analysisResult.create({
        data: {
          analysisId,
          data: result as any,
        },
      });

      // Update status to completed
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'COMPLETED' },
      });

      console.log(`Text analysis completed for analysis ${analysisId}`);
    } catch (error: any) {
      console.error(`Text analysis failed for analysis ${analysisId}:`, error);
      
      // Update status to failed
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { 
          status: 'FAILED',
          error: error.message,
        },
      });
    }
  }
}
