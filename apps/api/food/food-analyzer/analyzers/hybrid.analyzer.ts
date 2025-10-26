import { Injectable } from '@nestjs/common';
import { OpenAiAnalyzer } from './openai.analyzer';
import { UsdaAnalyzer } from './usda.analyzer';
import { AnalysisResult } from '../food-analyzer.service';

@Injectable()
export class HybridAnalyzer {
  constructor(
    private readonly openAiAnalyzer: OpenAiAnalyzer,
    private readonly usdaAnalyzer: UsdaAnalyzer,
  ) {}

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    try {
      // Try OpenAI first
      const openAiResult = await this.openAiAnalyzer.analyzeImage(imageBuffer);
      if (openAiResult && openAiResult.items.length > 0) {
        return openAiResult;
      }
    } catch (error: any) {
      console.warn('OpenAI analysis failed, falling back to USDA:', error.message);
    }

    // Fallback to USDA
    try {
      return await this.usdaAnalyzer.analyzeImage(imageBuffer);
    } catch (error: any) {
      console.error('USDA analysis also failed:', error.message);
      throw new Error('All analysis methods failed');
    }
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      // Try OpenAI first
      const openAiResult = await this.openAiAnalyzer.analyzeText(description);
      if (openAiResult && openAiResult.items.length > 0) {
        return openAiResult;
      }
    } catch (error: any) {
      console.warn('OpenAI text analysis failed, falling back to USDA:', error.message);
    }

    // Fallback to USDA
    try {
      return await this.usdaAnalyzer.analyzeText(description);
    } catch (error: any) {
      console.error('USDA text analysis also failed:', error.message);
      throw new Error('All text analysis methods failed');
    }
  }
}
