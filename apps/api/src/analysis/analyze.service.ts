import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { HybridService } from '../fdc/hybrid/hybrid.service';
import { VisionService, VisionComponent } from './vision.service';
import { PortionService } from './portion.service';
import { CacheService } from '../cache/cache.service';
import { normalizeFoodName } from './text-utils';
import {
  AnalysisData,
  AnalyzedItem,
  AnalysisTotals,
  Nutrients,
  HealthScore,
  AnalysisDebug,
  AnalysisSanityIssue,
} from './analysis.types';
import * as crypto from 'crypto';

type HealthWeights = {
  protein: number;
  fiber: number;
  satFat: number;
  sugar: number;
  energyDensity: number;
};

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hybrid: HybridService,
    private readonly vision: VisionService,
    private readonly portion: PortionService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Helper: Estimate portion in grams
   * Priority: Vision > FDC serving > default 150g
   * Clamps to reasonable range: 10g - 800g
   */
  private estimatePortionInGrams(
    component: VisionComponent,
    fdcServingSizeG: number | null,
    debug?: AnalysisDebug,
  ): number {
    const originalEstimate = component.est_portion_g && component.est_portion_g > 0
      ? component.est_portion_g
      : fdcServingSizeG && fdcServingSizeG > 0
      ? fdcServingSizeG
      : 150;

    // Мягкие пределы: минимум 10 г, максимум 800 г
    let portion = originalEstimate;
    if (portion < 10) portion = 10;
    if (portion > 800) portion = 800;

    // Log clamping in debug mode
    if (process.env.ANALYSIS_DEBUG === 'true' && debug && portion !== originalEstimate) {
      debug.components = debug.components || [];
      debug.components.push({
        type: 'portion_clamped',
        componentName: component.name,
        originalPortionG: originalEstimate,
        finalPortionG: portion,
      });
    }

    return portion;
  }

  /**
   * Helper: Round number to 1 decimal or integer
   */
  private round(value: number, decimals: number = 1): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Analyze image and return normalized nutrition data
   */
  async analyzeImage(params: { imageUrl?: string; imageBase64?: string }): Promise<AnalysisData> {
    const isDebugMode = process.env.ANALYSIS_DEBUG === 'true';
    
    // Check cache
    const imageHash = this.hashImage(params);
    const cached = await this.cache.get<AnalysisData>(imageHash, 'analysis');
    if (cached) {
      this.logger.debug('Cache hit for image analysis');
      return cached;
    }

    // Extract components via Vision
    const visionComponents = await this.vision.extractComponents(params);
    
    // Initialize debug object
    const debug: AnalysisDebug = {
      componentsRaw: visionComponents,
      components: [],
      timestamp: new Date().toISOString(),
      model: process.env.OPENAI_MODEL || process.env.VISION_MODEL || 'gpt-5.1',
    };

    // Analyze each component
    const items: AnalyzedItem[] = [];

    for (const component of visionComponents) {
      try {
        const query = `${component.name} ${component.preparation || ''}`.trim();
        const matches = await this.hybrid.findByText(query, 5, 0.7);

        if (!matches || matches.length === 0) {
          debug.components.push({ type: 'no_match', vision: component });
          // Q4: Fallback при отсутствии FDC
          this.addVisionFallback(component, items, debug);
          continue;
        }

        // Select best match only (already sorted by score)
        const bestMatch = matches[0];
        
        // Filter weak matches
        if (bestMatch.score < 0.7) {
          debug.components.push({ type: 'low_score', vision: component, bestMatch, score: bestMatch.score });
          // Q4: Fallback при отсутствии FDC
          this.addVisionFallback(component, items, debug);
          continue;
        }

        // Check text overlap between component name and food description
        const desc = (bestMatch.description || '').toLowerCase();
        const componentWords = component.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const hasOverlap = componentWords.some(w => desc.includes(w));
        
        if (!hasOverlap) {
          debug.components.push({ type: 'no_overlap', vision: component, bestMatch });
          // Q4: Fallback при отсутствии FDC
          this.addVisionFallback(component, items, debug);
          continue;
        }

        const food = await this.prisma.food.findUnique({
          where: { fdcId: bestMatch.fdcId },
          include: {
            portions: true,
            nutrients: {
              include: {
                nutrient: true,
              },
            },
            label: true,
          },
        });

        if (!food) {
          debug.components.push({ type: 'no_match', vision: component, reason: 'food_not_found' });
          continue;
        }

        // Get normalized nutrients (per 100g)
        const normalized = await this.hybrid.getFoodNormalized(bestMatch.fdcId);
        
        // Get FDC serving size (if available)
        const fdcServingSizeG = food.portions?.[0]?.gramWeight || null;
        
        // Estimate portion (with clamping)
        const portionG = this.estimatePortionInGrams(component, fdcServingSizeG, debug);

        // Calculate nutrients for portion (FDC data is per 100g)
        const nutrients = this.calculateNutrientsForPortion(
          normalized,
          portionG,
        );

        // Create AnalyzedItem
        const item: AnalyzedItem = {
          name: normalizeFoodName(bestMatch.description || food.description),
          label: component.name,
          portion_g: portionG,
          nutrients,
          source: 'fdc',
          fdcId: bestMatch.fdcId,
          fdcScore: bestMatch.score,
          dataType: food.dataType,
        };

        items.push(item);
        debug.components.push({ type: 'matched', vision: component, bestMatch, score: bestMatch.score });
      } catch (error: any) {
        this.logger.error(`Error analyzing component ${component.name}:`, error.message);
        debug.components.push({ type: 'no_match', vision: component, error: error.message });
        // Q4: Fallback при отсутствии FDC
        this.addVisionFallback(component, items, debug);
      }
    }

    // Calculate totals
    const total: AnalysisTotals = items.reduce(
      (acc, item) => {
        acc.portion_g += item.portion_g;
        acc.calories += item.nutrients.calories;
        acc.protein += item.nutrients.protein;
        acc.carbs += item.nutrients.carbs;
        acc.fat += item.nutrients.fat;
        acc.fiber += item.nutrients.fiber;
        acc.sugars += item.nutrients.sugars;
        acc.satFat += item.nutrients.satFat;
        acc.energyDensity += item.nutrients.energyDensity;
        return acc;
      },
      {
        portion_g: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugars: 0,
        satFat: 0,
        energyDensity: 0,
      },
    );

    // Recalculate energyDensity as calories per 100g
    if (total.portion_g > 0) {
      total.energyDensity = this.round((total.calories / total.portion_g) * 100, 1);
    }

    const healthScore = this.computeHealthScore(total, total.portion_g);

    // Q1: Run sanity check
    const sanity = this.runSanityCheck({ items, total, healthScore, debug });
    if (debug) {
      debug.sanity = sanity;
    }
    
    // Q3: Mark suspicious analyses
    const hasSeriousIssues = sanity.some(
      (i) => i.type === 'macro_kcal_mismatch' || i.type === 'suspicious_energy_density',
    );
    const isSuspicious = hasSeriousIssues;

    // Log sanity issues in debug mode
    if (process.env.ANALYSIS_DEBUG === 'true' && sanity.length > 0) {
      this.logger.warn('[AnalysisSanity] Issues detected', {
        issues: sanity,
        total: total,
      });
    }

    // Debug instrumentation for zero-calorie analyses
    if (total.calories === 0 && items.length > 0) {
      this.logger.warn('[AnalyzeService] Zero-calorie analysis detected', {
        componentCount: visionComponents.length,
        itemCount: items.length,
        sampleComponents: visionComponents.slice(0, 5).map((c) => ({
          name: c.name,
          preparation: c.preparation,
          est_portion_g: c.est_portion_g,
          confidence: c.confidence,
        })),
        sampleItems: items.slice(0, 5).map((it) => ({
          name: it.name,
          portion_g: it.portion_g,
          nutrients: it.nutrients,
        })),
      });
    }

    // Log final analysis in debug mode or for first N analyses
    if (isDebugMode) {
      this.logger.log('[AnalysisDebug] Final analysis', {
        totals: total,
        items: items.map(i => ({
          name: i.name,
          portion_g: i.portion_g,
          calories: i.nutrients.calories,
          protein: i.nutrients.protein,
          carbs: i.nutrients.carbs,
          fat: i.nutrients.fat,
        })),
      });
    }

    const result: AnalysisData = {
      items,
      total,
      healthScore,
      debug: isDebugMode ? debug : undefined,
      isSuspicious,
    };

    // Cache for 24 hours
    await this.cache.set(imageHash, result, 'analysis');

    return result;
  }

  /**
   * Analyze text description
   */
  async analyzeText(text: string): Promise<AnalysisData> {
    const isDebugMode = process.env.ANALYSIS_DEBUG === 'true';
    
    // Simple parsing: split by commas, newlines, etc.
    const components: VisionComponent[] = text
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(name => ({
        name,
        preparation: 'unknown',
        est_portion_g: 100,
        confidence: 0.7,
      }));

    const debug: AnalysisDebug = {
      componentsRaw: components,
      components: [],
      timestamp: new Date().toISOString(),
      model: 'text-input',
    };

    const items: AnalyzedItem[] = [];

    for (const component of components) {
      try {
        const query = component.name;
        const matches = await this.hybrid.findByText(query, 5, 0.7);

        if (!matches || matches.length === 0) {
          debug.components.push({ type: 'no_match', vision: component });
          this.addVisionFallback(component, items, debug);
          continue;
        }

        const bestMatch = matches[0];
        
        if (bestMatch.score < 0.7) {
          debug.components.push({ type: 'low_score', vision: component, bestMatch, score: bestMatch.score });
          this.addVisionFallback(component, items, debug);
          continue;
        }

        // Check text overlap
        const desc = (bestMatch.description || '').toLowerCase();
        const componentWords = component.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const hasOverlap = componentWords.some(w => desc.includes(w));
        
        if (!hasOverlap) {
          debug.components.push({ type: 'no_overlap', vision: component, bestMatch });
          this.addVisionFallback(component, items, debug);
          continue;
        }

        const food = await this.prisma.food.findUnique({
          where: { fdcId: bestMatch.fdcId },
          include: {
            portions: true,
            nutrients: {
              include: {
                nutrient: true,
              },
            },
            label: true,
          },
        });

        if (!food) {
          debug.components.push({ type: 'no_match', vision: component, reason: 'food_not_found' });
          this.addVisionFallback(component, items, debug);
          continue;
        }

        const normalized = await this.hybrid.getFoodNormalized(bestMatch.fdcId);
        const fdcServingSizeG = food.portions?.[0]?.gramWeight || null;
        const portionG = this.estimatePortionInGrams(component, fdcServingSizeG, debug);
        const nutrients = this.calculateNutrientsForPortion(normalized, portionG);

        const item: AnalyzedItem = {
          name: normalizeFoodName(bestMatch.description || food.description),
          label: component.name,
          portion_g: portionG,
          nutrients,
          source: 'fdc',
          fdcId: bestMatch.fdcId,
          fdcScore: bestMatch.score,
          dataType: food.dataType,
        };

        items.push(item);
        debug.components.push({ type: 'matched', vision: component, bestMatch, score: bestMatch.score });
      } catch (error: any) {
        this.logger.error(`Error analyzing text component ${component.name}:`, error.message);
        debug.components.push({ type: 'no_match', vision: component, error: error.message });
        this.addVisionFallback(component, items, debug);
      }
    }

    // Calculate totals
    const total: AnalysisTotals = items.reduce(
      (acc, item) => {
        acc.portion_g += item.portion_g;
        acc.calories += item.nutrients.calories;
        acc.protein += item.nutrients.protein;
        acc.carbs += item.nutrients.carbs;
        acc.fat += item.nutrients.fat;
        acc.fiber += item.nutrients.fiber;
        acc.sugars += item.nutrients.sugars;
        acc.satFat += item.nutrients.satFat;
        acc.energyDensity += item.nutrients.energyDensity;
        return acc;
      },
      {
        portion_g: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugars: 0,
        satFat: 0,
        energyDensity: 0,
      },
    );

    if (total.portion_g > 0) {
      total.energyDensity = this.round((total.calories / total.portion_g) * 100, 1);
    }

    const healthScore = this.computeHealthScore(total, total.portion_g);

    // Q1: Run sanity check
    const sanity = this.runSanityCheck({ items, total, healthScore, debug });
    if (debug) {
      debug.sanity = sanity;
    }
    
    // Q3: Mark suspicious analyses
    const hasSeriousIssues = sanity.some(
      (i) => i.type === 'macro_kcal_mismatch' || i.type === 'suspicious_energy_density',
    );
    const isSuspicious = hasSeriousIssues;

    // Log sanity issues in debug mode
    if (process.env.ANALYSIS_DEBUG === 'true' && sanity.length > 0) {
      this.logger.warn('[AnalysisSanity] Issues detected', {
        issues: sanity,
        total: total,
      });
    }

    return {
      items,
      total,
      healthScore,
      debug: isDebugMode ? debug : undefined,
      isSuspicious,
    };
  }

  /**
   * Calculate nutrients for a specific portion size
   * FDC data is per 100g, so we scale by portionG / 100
   */
  private calculateNutrientsForPortion(
    normalized: any,
    portionG: number,
  ): Nutrients {
    // FDC nutrients are always per 100g
    const scale = portionG / 100;
    const base = normalized.nutrients || {};

    // Extract saturated fat from various possible fields
    const satFat = base.satFat ?? base.saturatedFat ?? base.saturated_fat ?? base.saturated ?? 0;

    // Calculate energy density (kcal per 100g)
    const energyDensity = base.calories || 0;

    return {
      calories: Math.round((base.calories || 0) * scale),
      protein: this.round((base.protein || 0) * scale, 1),
      carbs: this.round((base.carbs || 0) * scale, 1),
      fat: this.round((base.fat || 0) * scale, 1),
      fiber: this.round((base.fiber || 0) * scale, 1),
      sugars: this.round((base.sugars || 0) * scale, 1),
      satFat: this.round(satFat * scale, 1),
      energyDensity: this.round(energyDensity, 1),
    };
  }

  private hashImage(params: { imageUrl?: string; imageBase64?: string }): string {
    const str = params.imageUrl || params.imageBase64 || '';
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  private computeHealthScore(total: AnalysisTotals, totalPortion: number): HealthScore {
    const weights = this.getHealthWeights();
    const portionWeight = totalPortion || 250; // fallback 250g meal
    const proteinScore = this.positiveScore(total.protein, 30);
    const fiberScore = this.positiveScore(total.fiber || 0, 10);
    const satFatScore = this.negativeScore(total.satFat || (total.fat * 0.3) || 0, 8);
    const sugarScore = this.negativeScore(total.sugars || 0, 15);
    const energyDensity = portionWeight ? total.calories / portionWeight : total.calories / 250;
    const energyDensityScore = this.negativeScore(energyDensity, 4);

    const factorMap = {
      protein: { label: 'Protein', score: proteinScore, weight: weights.protein },
      fiber: { label: 'Fiber', score: fiberScore, weight: weights.fiber },
      satFat: { label: 'Saturated fat', score: satFatScore, weight: weights.satFat },
      sugar: { label: 'Sugar', score: sugarScore, weight: weights.sugar },
      energyDensity: { label: 'Energy density', score: energyDensityScore, weight: weights.energyDensity },
    } as const;

    const totalWeight = Object.values(weights).reduce((acc: number, weight: number) => acc + weight, 0) || 1;
    const factorEntries = Object.values(factorMap) as Array<{ label: string; score: number; weight: number }>;
    const weightedScore = factorEntries.reduce((acc: number, factor) => acc + factor.score * (factor.weight || 0), 0) /
      totalWeight;
    const score = Math.round(Math.max(0, Math.min(100, weightedScore)));
    const grade = this.deriveGrade(score);
    const feedbackObjects = this.buildFeedback(factorMap);

    return {
      score,
      grade,
      factors: factorMap,
      // Expose only human-readable messages; internal structure is kept in debug if needed
      feedback: feedbackObjects.map((f) => f.message),
    };
  }

  private getHealthWeights(): HealthWeights {
    const fallback: HealthWeights = {
      protein: 0.25,
      fiber: 0.2,
      satFat: 0.2,
      sugar: 0.2,
      energyDensity: 0.15,
    };
    try {
      const parsed = JSON.parse(process.env.HEALTH_SCORE_WEIGHTS || '{}') as Partial<HealthWeights>;
      return { ...fallback, ...parsed };
    } catch (error) {
      return fallback;
    }
  }

  private positiveScore(value: number, target: number) {
    if (target <= 0) return 0;
    const ratio = Math.min(1.5, value / target);
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }

  private negativeScore(value: number, threshold: number) {
    if (threshold <= 0) return 100;
    if (value <= threshold) {
      return 100;
    }
    const ratio = Math.min(2, (value - threshold) / threshold);
    return Math.max(0, Math.round(100 - ratio * 100));
  }

  private deriveGrade(score: number) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private buildFeedback(
    factors: Record<string, { label: string; score: number; weight: number }>,
  ): Array<{ key: string; label: string; action: 'celebrate' | 'increase' | 'reduce' | 'monitor'; message: string }> {
    const entries: Array<{ key: string; label: string; action: 'celebrate' | 'increase' | 'reduce' | 'monitor'; message: string }> = [];
    const penaltyKeys = ['satFat', 'sugar', 'energyDensity'];

    Object.entries(factors).forEach(([key, factor]) => {
      const label = factor.label || key;
      const labelLower = label.toLowerCase();

      if (penaltyKeys.includes(key)) {
        if (factor.score < 70) {
          entries.push({
            key,
            label,
            action: 'reduce',
            message: `Reduce ${labelLower} to improve overall score.`,
          });
        } else if (factor.score < 85) {
          entries.push({
            key,
            label,
            action: 'monitor',
            message: `Keep an eye on ${labelLower} to stay on track.`,
          });
        }
      } else if (factor.score < 70) {
        entries.push({
          key,
          label,
          action: 'increase',
          message: `Increase ${labelLower} to improve overall score.`,
        });
      }
    });

    if (entries.length === 0) {
      entries.push({
        key: 'overall',
        label: 'Overall balance',
        action: 'celebrate',
        message: 'Great job! This meal looks well balanced.',
      });
    }

    return entries;
  }
}

