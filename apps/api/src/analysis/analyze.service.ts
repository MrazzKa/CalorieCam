import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HybridService } from '../fdc/hybrid/hybrid.service';
import { VisionService } from './vision.service';
import { PortionService } from './portion.service';
import { RedisService } from '../../redis/redis.service';
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
  };
  source: string;
  matchScore: number;
  trace?: any;
}

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hybrid: HybridService,
    private readonly vision: VisionService,
    private readonly portion: PortionService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Analyze image and return normalized nutrition data
   */
  async analyzeImage(params: { imageUrl?: string; imageBase64?: string }): Promise<{
    items: AnalysisItem[];
    total: any;
    trace: any[];
  }> {
    // Check cache
    const imageHash = this.hashImage(params);
    const cacheKey = `analysis:image:${imageHash}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for image analysis');
      return JSON.parse(cached);
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
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugars: 0, sodium: 0 },
    );

    const result = { items, total, trace };

    // Cache for 24 hours
    await this.redis.set(cacheKey, JSON.stringify(result), 86400);

    return result;
  }

  /**
   * Analyze text description
   */
  async analyzeText(text: string): Promise<{
    items: AnalysisItem[];
    total: any;
    trace: any[];
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
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sugars: 0, sodium: 0 },
    );

    return { items, total, trace };
  }

  private calculateNutrientsForPortion(
    normalized: any,
    portionG: number,
    hasLabel: boolean,
  ): any {
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
    };
  }

  private hashImage(params: { imageUrl?: string; imageBase64?: string }): string {
    const str = params.imageUrl || params.imageBase64 || '';
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}

