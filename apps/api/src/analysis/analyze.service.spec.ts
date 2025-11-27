import { AnalyzeService } from './analyze.service';
import { PrismaService } from '../../prisma.service';
import { HybridService } from '../fdc/hybrid/hybrid.service';
import { VisionService } from './vision.service';
import { PortionService } from './portion.service';
import { CacheService } from '../cache/cache.service';

// Simple unit test for nutrient scaling logic
describe('AnalyzeService.calculateNutrientsForPortion', () => {
  const prisma = {} as unknown as PrismaService;
  const hybrid = {} as unknown as HybridService;
  const vision = {} as unknown as VisionService;
  const portion = {} as unknown as PortionService;
  const cache = {} as unknown as CacheService;

  const service = new AnalyzeService(prisma, hybrid, vision, portion, cache);

  it('scales nutrients correctly for a 150g portion (per 100g base)', () => {
    const normalized = {
      nutrients: {
        calories: 200,
        protein: 20,
        fat: 10,
        carbs: 15,
      },
    };

    const portionG = 150;

    // Access private method via any to avoid changing public API
    const nutrients = (service as any).calculateNutrientsForPortion(
      normalized,
      portionG,
      false, // hasLabel
    );

    expect(nutrients.calories).toBe(300); // 200 * 1.5
    expect(nutrients.protein).toBeCloseTo(30);
    expect(nutrients.fat).toBeCloseTo(15);
    expect(nutrients.carbs).toBeCloseTo(22.5);
  });
});


