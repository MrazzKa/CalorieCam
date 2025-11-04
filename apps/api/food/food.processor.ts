import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma.service';
import { FoodAnalyzerService } from './food-analyzer/food-analyzer.service';
import { AnalyzeService } from '../src/analysis/analyze.service';
import * as sharp from 'sharp';

@Processor('food-analysis')
export class FoodProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodAnalyzer: FoodAnalyzerService,
    private readonly analyzeService: AnalyzeService,
  ) {}

  @Process('analyze-image')
  async handleImageAnalysis(job: Job) {
    const { analysisId, imageBufferBase64, userId } = job.data;

    try {
      // Update status to processing
      await this.prisma.analysis.update({
        where: { id: analysisId },
        data: { status: 'PROCESSING' },
      });

      // Decode base64 back to Buffer
      if (!imageBufferBase64) {
        throw new Error('Invalid image buffer: base64 string is missing');
      }

      console.log(`[FoodProcessor] Processing analysis ${analysisId}, base64 length: ${imageBufferBase64.length}`);

      let imageBuffer: Buffer;
      try {
        imageBuffer = Buffer.from(imageBufferBase64, 'base64');
        console.log(`[FoodProcessor] Decoded buffer size: ${imageBuffer.length} bytes`);
      } catch (decodeError: any) {
        console.error(`[FoodProcessor] Failed to decode base64:`, decodeError);
        throw new Error(`Failed to decode base64 image buffer: ${decodeError.message}`);
      }

      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer: decoded buffer is empty');
      }

      // Convert image to JPEG format that OpenAI supports
      // Sharp will handle any input format and convert to JPEG
      let processedBuffer: Buffer;
      try {
        processedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
        
        if (!processedBuffer || processedBuffer.length === 0) {
          throw new Error('Image processing resulted in empty buffer');
        }
      } catch (sharpError: any) {
        console.error('Image processing error:', sharpError);
        // If sharp fails, try using original buffer if it's valid
        if (imageBuffer && imageBuffer.length > 0) {
          processedBuffer = imageBuffer;
        } else {
          throw new Error(`Image processing failed: ${sharpError.message || 'Unknown error'}`);
        }
      }

      // Convert buffer to base64 for new analysis service
      const imageBase64 = processedBuffer.toString('base64');
      
      // Use new AnalyzeService with USDA + RAG
      const analysisResult = await this.analyzeService.analyzeImage({
        imageBase64,
      });

      // Transform to old format for compatibility
      const result = {
        items: analysisResult.items.map(item => ({
          label: item.name,
          kcal: item.nutrients.calories,
          protein: item.nutrients.protein,
          fat: item.nutrients.fat,
          carbs: item.nutrients.carbs,
          gramsMean: item.portion_g,
        })),
        total: analysisResult.total,
        trace: analysisResult.trace,
      };

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

      // Use new AnalyzeService for text analysis
      const analysisResult = await this.analyzeService.analyzeText(description);

      // Transform to old format for compatibility
      const result = {
        items: analysisResult.items.map(item => ({
          label: item.name,
          kcal: item.nutrients.calories,
          protein: item.nutrients.protein,
          fat: item.nutrients.fat,
          carbs: item.nutrients.carbs,
          gramsMean: item.portion_g,
        })),
        total: analysisResult.total,
        trace: analysisResult.trace,
      };

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
