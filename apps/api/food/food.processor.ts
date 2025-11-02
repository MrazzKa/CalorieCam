import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma.service';
import { FoodAnalyzerService } from './food-analyzer/food-analyzer.service';
import * as sharp from 'sharp';

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

      // Validate and convert image to JPEG format that OpenAI supports
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error('Invalid image buffer: buffer is missing or empty');
      }

      // Convert image to JPEG format that OpenAI supports
      // Sharp will handle any input format and convert to JPEG
      let processedBuffer: Buffer;
      try {
        // Ensure we have a valid buffer
        const inputBuffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);
        processedBuffer = await sharp(inputBuffer)
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
        
        if (!processedBuffer || processedBuffer.length === 0) {
          throw new Error('Image processing resulted in empty buffer');
        }
      } catch (sharpError: any) {
        console.error('Image processing error:', sharpError);
        // If sharp fails, try using original buffer if it's valid
        if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 0) {
          processedBuffer = imageBuffer;
        } else {
          throw new Error(`Image processing failed: ${sharpError.message || 'Unknown error'}`);
        }
      }

      // Analyze image with processed buffer
      const result = await this.foodAnalyzer.analyzeImage(processedBuffer);

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
