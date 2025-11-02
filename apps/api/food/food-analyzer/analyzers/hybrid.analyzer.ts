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
      // Use OpenAI only (temporarily removed USDA for simplicity)
      const openAiResult = await this.openAiAnalyzer.analyzeImage(imageBuffer);
      if (openAiResult && openAiResult.items.length > 0) {
        return openAiResult;
      }
      throw new Error('OpenAI returned empty result');
    } catch (error: any) {
      console.error('OpenAI image analysis failed:', error.message);
      
      // RAG analyzer doesn't support image analysis, so we can't fallback
      // Return a more user-friendly error
      if (error.message.includes('unsupported image') || error.message.includes('invalid_image_format')) {
        throw new Error('Изображение имеет неподдерживаемый формат. Пожалуйста, используйте JPEG, PNG, GIF или WebP.');
      }
      
      throw new Error(`Не удалось проанализировать изображение: ${error.message || 'Неизвестная ошибка'}`);
    }
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    const results = [];
    const errors = [];

    // Try all analyzers: OpenAI, USDA, RAG
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
      // Prefer OpenAI if available (best quality)
      const openAiResultData = results.find(r => r.source === 'OpenAI');
      if (openAiResultData) {
        return openAiResultData.result;
      }
      // Otherwise use USDA (official data) or combine
      return this.combineResults(results);
    }

    // If no results, throw error with details
    console.error('All text analysis methods failed:', errors);
    throw new Error(`All text analysis methods failed: ${errors.map(e => `${e.source}: ${e.error}`).join(', ')}`);
  }

  private combineResults(results: Array<{ source: string; result: AnalysisResult }>): AnalysisResult {
    const combinedItems = new Map<string, any>();
    
    // Prioritize results: OpenAI > USDA > RAG
    const priorityOrder = ['OpenAI', 'USDA', 'RAG'];
    const sourceWeights: Record<string, number> = {
      'OpenAI': 1.0,
      'USDA': 0.9,
      'RAG': 0.8,
    };
    
    // Collect all items with their source priorities
    const allItems: Array<{ item: any; source: string; weight: number }> = [];
    
    for (const result of results) {
      const weight = sourceWeights[result.source] || 0.5;
      result.result.items.forEach(item => {
        allItems.push({ item, source: result.source, weight });
      });
    }
    
    // Group similar items by label
    for (const { item, source, weight } of allItems) {
      const key = item.label.toLowerCase().trim().replace(/[^\w\s]/g, '');
      
      if (!combinedItems.has(key)) {
        // Add confidence score based on source
        combinedItems.set(key, {
          ...item,
          source,
          confidence: weight,
        });
      } else {
        // If item already exists, use the one with higher priority
        const existing = combinedItems.get(key);
        if (weight > existing.confidence) {
          combinedItems.set(key, {
            ...item,
            source,
            confidence: weight,
          });
        }
      }
    }

    // Sort by confidence and take top items
    const sortedItems = Array.from(combinedItems.values())
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 5)
      .map(({ source, confidence, ...item }) => item); // Remove metadata

    return {
      items: sortedItems
    };
  }
}
