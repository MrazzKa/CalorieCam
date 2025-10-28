import { Injectable } from '@nestjs/common';
import { OpenAiAnalyzer } from './openai.analyzer';
import { UsdaAnalyzer } from './usda.analyzer';
import { RagAnalyzer } from './rag.analyzer';
import { AnalysisResult } from '../food-analyzer.service';

@Injectable()
export class HybridAnalyzer {
  constructor(
    private readonly openAiAnalyzer: OpenAiAnalyzer,
    private readonly usdaAnalyzer: UsdaAnalyzer,
    private readonly ragAnalyzer: RagAnalyzer,
  ) {}

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    try {
      // Try OpenAI first (best for image analysis)
      const openAiResult = await this.openAiAnalyzer.analyzeImage(imageBuffer);
      if (openAiResult && openAiResult.items.length > 0) {
        return openAiResult;
      }
    } catch (error: any) {
      console.warn('OpenAI image analysis failed, trying RAG:', error.message);
    }

    // Fallback to RAG (limited image support)
    try {
      return await this.ragAnalyzer.analyzeImage(imageBuffer);
    } catch (error: any) {
      console.warn('RAG image analysis failed, trying USDA:', error.message);
    }

    // Final fallback to USDA
    try {
      return await this.usdaAnalyzer.analyzeImage(imageBuffer);
    } catch (error: any) {
      console.error('All image analysis methods failed:', error.message);
      throw new Error('All image analysis methods failed');
    }
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    const results = [];
    const errors = [];

    // Try all analyzers in parallel
    const promises = [
      this.openAiAnalyzer.analyzeText(description).catch(err => {
        errors.push({ source: 'OpenAI', error: err.message });
        return null;
      }),
      this.usdaAnalyzer.analyzeText(description).catch(err => {
        errors.push({ source: 'USDA', error: err.message });
        return null;
      }),
      this.ragAnalyzer.analyzeText(description).catch(err => {
        errors.push({ source: 'RAG', error: err.message });
        return null;
      }),
    ];

    const [openAiResult, usdaResult, ragResult] = await Promise.all(promises);

    // Collect valid results
    if (openAiResult && openAiResult.items.length > 0) {
      results.push({ source: 'OpenAI', result: openAiResult });
    }
    if (usdaResult && usdaResult.items.length > 0) {
      results.push({ source: 'USDA', result: usdaResult });
    }
    if (ragResult && ragResult.items.length > 0) {
      results.push({ source: 'RAG', result: ragResult });
    }

    // If we have results, combine them intelligently
    if (results.length > 0) {
      return this.combineResults(results);
    }

    // If no results, throw error with details
    console.error('All text analysis methods failed:', errors);
    throw new Error(`All text analysis methods failed: ${errors.map(e => `${e.source}: ${e.error}`).join(', ')}`);
  }

  private combineResults(results: Array<{ source: string; result: AnalysisResult }>): AnalysisResult {
    const combinedItems = new Map();
    
    // Prioritize results: OpenAI > USDA > RAG
    const priorityOrder = ['OpenAI', 'USDA', 'RAG'];
    
    for (const priority of priorityOrder) {
      const result = results.find(r => r.source === priority);
      if (result) {
        result.result.items.forEach(item => {
          const key = item.label.toLowerCase().trim();
          if (!combinedItems.has(key)) {
            combinedItems.set(key, item);
          }
        });
      }
    }

    return {
      items: Array.from(combinedItems.values()).slice(0, 5) // Limit to 5 items
    };
  }
}
