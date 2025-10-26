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
    return this.hybridAnalyzer.analyzeImage(imageBuffer);
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    return this.hybridAnalyzer.analyzeText(description);
  }
}
