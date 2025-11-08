import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { HybridService } from '../fdc/hybrid/hybrid.service';
import { VisionService } from './vision.service';
import { PortionService } from './portion.service';
import { CacheService } from '../cache/cache.service';
import * as crypto from 'crypto';

interface Component {
  name: string;
  preparation: string;
  est_portion_g: number;
  confidence: number;
}

interface AnalysisItem {
  name: string;
  fdcId: number;
  dataType: string;
  portion_g: number;
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber?: number;
    sugars?: number;
    sodium?: number;
    satFat?: number;
  };
  source: string;
  matchScore: number;
  trace?: any;
}

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
   * Analyze image and return normalized nutrition data
   */
  async analyzeImage(params: { imageUrl?: string; imageBase64?: string }): Promise<{
    items: AnalysisItem[];
    total: any;
    trace: any[];
    healthScore: any;
  }> {
    // Check cache
    const imageHash = this.hashImage(params);
    const cached = await this.cache.get<any>(imageHash, 'analysis');
    if (cached) {
      this.logger.debug('Cache hit for image analysis');
      return cached;
    }

    // Extract components via Vision
    const components = await this.vision.extractComponents(params);

    // Analyze each component
    const items: AnalysisItem[] = [];
    const trace: any[] = [];

    for (const component of components) {
      try {
        const query = `${component.name} ${component.preparation}`;
        const matches = await this.hybrid.findByText(query, 5, 0.7);

        if (matches.length === 0) {
          this.logger.warn(`No matches for: ${query}`);
          trace.push({ component: component.name, status: 'no_match' });
          continue;
        }

        // Select best match by priority
        const bestMatch = matches[0];
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
          continue;
        }

        // Get normalized nutrients
        const normalized = await this.hybrid.getFoodNormalized(bestMatch.fdcId);
        const portionG = this.portion.selectPortion(component.est_portion_g, food.portions);

        // Calculate nutrients for portion
        const nutrients = this.calculateNutrientsForPortion(
          normalized,
          portionG,
          food.label !== null,
        );

        items.push({
          name: food.description,
          fdcId: food.fdcId,
          dataType: food.dataType,
          portion_g: portionG,
          nutrients,
          source: food.source,
          matchScore: bestMatch.score || 0.8,
          trace: {
            component: component.name,
            confidence: component.confidence,
            usedLabel: food.label !== null,
            usedAtwater: !food.label,
          },
        });

        trace.push({
          component: component.name,
          fdcId: food.fdcId,
          matchScore: bestMatch.score,
          source: food.source,
        });
      } catch (error: any) {
        this.logger.error(`Error analyzing component ${component.name}:`, error.message);
        trace.push({ component: component.name, error: error.message });
      }
    }

    // Calculate totals
    const total = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutrients.calories,
        protein: acc.protein + item.nutrients.protein,
        fat: acc.fat + item.nutrients.fat,
        carbs: acc.carbs + item.nutrients.carbs,
        fiber: (acc.fiber || 0) + (item.nutrients.fiber || 0),
        sugars: (acc.sugars || 0) + (item.nutrients.sugars || 0),
        sodium: (acc.sodium || 0) + (item.nutrients.sodium || 0),
        satFat: (acc.satFat || 0) + (item.nutrients.satFat || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugars: 0, sodium: 0, satFat: 0 },
    );

    const totalPortion = items.reduce((acc, item) => acc + (item.portion_g || 0), 0);
    const healthScore = this.computeHealthScore(total, totalPortion);

    const result = { items, total, trace, healthScore };

    // Cache for 24 hours
    await this.cache.set(imageHash, result, 'analysis');

    return result;
  }

  /**
   * Analyze text description
   */
  async analyzeText(text: string): Promise<{
    items: AnalysisItem[];
    total: any;
    trace: any[];
    healthScore: any;
  }> {
    // Simple parsing: split by commas, newlines, etc.
    const components = text
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(name => ({
        name,
        preparation: 'unknown' as const,
        est_portion_g: 100,
        confidence: 0.7,
      }));

    // Reuse analyzeImage logic without vision
    const items: AnalysisItem[] = [];
    const trace: any[] = [];

    for (const component of components) {
      try {
        const query = component.name;
        const matches = await this.hybrid.findByText(query, 5, 0.7);

        if (matches.length === 0) {
          continue;
        }

        const bestMatch = matches[0];
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

        if (!food) continue;

        const normalized = await this.hybrid.getFoodNormalized(bestMatch.fdcId);
        const portionG = this.portion.selectPortion(component.est_portion_g, food.portions);
        const nutrients = this.calculateNutrientsForPortion(
          normalized,
          portionG,
          food.label !== null,
        );

        items.push({
          name: food.description,
          fdcId: food.fdcId,
          dataType: food.dataType,
          portion_g: portionG,
          nutrients,
          source: food.source,
          matchScore: bestMatch.score || 0.8,
        });

        trace.push({
          component: component.name,
          fdcId: food.fdcId,
          matchScore: bestMatch.score,
        });
      } catch (error: any) {
        this.logger.error(`Error analyzing text component ${component.name}:`, error.message);
      }
    }

    const total = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.nutrients.calories,
        protein: acc.protein + item.nutrients.protein,
        fat: acc.fat + item.nutrients.fat,
        carbs: acc.carbs + item.nutrients.carbs,
        fiber: (acc.fiber || 0) + (item.nutrients.fiber || 0),
        sugars: (acc.sugars || 0) + (item.nutrients.sugars || 0),
        sodium: (acc.sodium || 0) + (item.nutrients.sodium || 0),
        satFat: (acc.satFat || 0) + (item.nutrients.satFat || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugars: 0, sodium: 0, satFat: 0 },
    );
    const totalPortion = items.reduce((acc, item) => acc + (item.portion_g || 0), 0);
    const healthScore = this.computeHealthScore(total, totalPortion);

    return { items, total, trace, healthScore };
  }

  private calculateNutrientsForPortion(
    normalized: any,
    portionG: number,
    hasLabel: boolean,
  ): any {
    const satValue = normalized?.nutrients?.satFat ?? normalized?.nutrients?.saturatedFat ?? normalized?.nutrients?.saturated_fat ?? normalized?.nutrients?.saturated ?? 0;
    if (hasLabel && normalized.nutrients) {
      // Label nutrients are per serving - need to scale
      // Assume label is per 100g serving for simplicity
      const scale = portionG / 100;
      return {
        calories: Math.round((normalized.nutrients.calories || 0) * scale),
        protein: Math.round((normalized.nutrients.protein || 0) * scale * 10) / 10,
        fat: Math.round((normalized.nutrients.fat || 0) * scale * 10) / 10,
        carbs: Math.round((normalized.nutrients.carbs || 0) * scale * 10) / 10,
      fiber: normalized.nutrients.fiber ? Math.round(normalized.nutrients.fiber * scale * 10) / 10 : undefined,
      sugars: normalized.nutrients.sugars ? Math.round(normalized.nutrients.sugars * scale * 10) / 10 : undefined,
      sodium: normalized.nutrients.sodium ? Math.round(normalized.nutrients.sodium * scale * 10) / 10 : undefined,
        satFat: satValue ? Math.round(satValue * scale * 10) / 10 : undefined,
      };
    }

    // Per 100g scaling
    const scale = portionG / 100;
    return {
      calories: Math.round((normalized.nutrients?.calories || 0) * scale),
      protein: Math.round((normalized.nutrients?.protein || 0) * scale * 10) / 10,
      fat: Math.round((normalized.nutrients?.fat || 0) * scale * 10) / 10,
      carbs: Math.round((normalized.nutrients?.carbs || 0) * scale * 10) / 10,
      fiber: normalized.nutrients?.fiber ? Math.round(normalized.nutrients.fiber * scale * 10) / 10 : undefined,
      sugars: normalized.nutrients?.sugars ? Math.round(normalized.nutrients.sugars * scale * 10) / 10 : undefined,
      sodium: normalized.nutrients?.sodium ? Math.round(normalized.nutrients.sodium * scale * 10) / 10 : undefined,
      satFat: satValue ? Math.round(satValue * scale * 10) / 10 : undefined,
    };
  }

  private hashImage(params: { imageUrl?: string; imageBase64?: string }): string {
    const str = params.imageUrl || params.imageBase64 || '';
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  private computeHealthScore(total: any, totalPortion: number) {
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
    const feedback = this.buildFeedback(factorMap);

    return {
      score,
      grade,
      factors: factorMap,
      feedback,
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

