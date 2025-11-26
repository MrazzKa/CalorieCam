import { Injectable } from '@nestjs/common';
import { HybridAnalyzer } from './analyzers/hybrid.analyzer';

export interface AnalysisResult {
  items: Array<{
    label: string;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    gramsMean?: number;
  }>;
}

@Injectable()
export class FoodAnalyzerService {
  constructor(private readonly hybridAnalyzer: HybridAnalyzer) {}

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    try {
      return await this.hybridAnalyzer.analyzeImage(imageBuffer);
    } catch (error: any) {
      // Provide clearer logging and avoid raw 500s from unhandled errors
      // This will be caught by AllExceptionsFilter and returned as a 500 with a safe message
      // but we still want context for debugging
      // eslint-disable-next-line no-console
      console.error('[FoodAnalyzerService] analyzeImage failed:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      return await this.hybridAnalyzer.analyzeText(description);
    } catch (error: any) {
      // Extra context for text-based analysis failures
      // eslint-disable-next-line no-console
      console.error('[FoodAnalyzerService] analyzeText failed:', {
        message: error?.message,
        name: error?.name,
      });
      throw error;
    }
  }
}
