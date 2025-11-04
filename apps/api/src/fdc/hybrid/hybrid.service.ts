import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FdcApiService } from '../api/fdc-api.service';
import OpenAI from 'openai';
// FoodSource enum defined inline
enum FoodSource {
  USDA_LOCAL = 'USDA_LOCAL',
  USDA_API = 'USDA_API',
}

@Injectable()
export class HybridService {
  private readonly logger = new Logger(HybridService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fdcApi: FdcApiService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Find foods by text query using vector search + rerank + API fallback
   */
  async findByText(query: string, k = 10, minScore = 0.75): Promise<any[]> {
    try {
      // Get query embedding
      const embeddingResponse = await this.openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input: query,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;
      const queryVector = `[${queryEmbedding.join(',')}]`;

      // Vector search using raw SQL (cosine distance)
      // Note: This assumes pgvector is set up. If not, we'll use a simpler approach
      let results: Array<{
        id: string;
        fdcId: number;
        description: string;
        dataType: string;
        score: number;
      }>;
      
      // Use text search (pgvector requires manual setup)
      // TODO: Add pgvector support when extension is installed
      results = await this.textSearchFallback(query, k * 2);

      // Filter by min score
      const filtered = results.filter(r => r.score >= minScore).slice(0, k);

      // Rerank using BM25/tsvector (simplified)
      const reranked = await this.rerankResults(filtered, query);

      if (reranked.length > 0) {
        return reranked;
      }

      // Fallback to USDA API
      this.logger.log(`No local results for "${query}", falling back to API`);
      return await this.apiFallback(query, k);
    } catch (error: any) {
      this.logger.error(`Error in findByText: ${error.message}`);
      // Fallback to API
      return await this.apiFallback(query, k);
    }
  }

  private async textSearchFallback(query: string, limit: number): Promise<Array<{
    id: string;
    fdcId: number;
    description: string;
    dataType: string;
    score: number;
  }>> {
    const results = await this.prisma.food.findMany({
      where: {
        description: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: {
        description: 'asc',
      },
    });

    return results.map(f => ({
      id: f.id,
      fdcId: f.fdcId,
      description: f.description,
      dataType: f.dataType,
      score: 0.8, // Default score for text match
    }));
  }

  private async rerankResults(results: any[], query: string): Promise<any[]> {
    // Simple reranking based on dataType priority and text match
    const typePriority: Record<string, number> = {
      'Branded': 4,
      'Foundation': 3,
      'FNDDS': 2,
      'SR Legacy': 1,
    };

    return results
      .map(r => ({
        ...r,
        priority: typePriority[r.dataType] || 0,
        textMatch: r.description.toLowerCase().includes(query.toLowerCase()) ? 1 : 0,
      }))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.textMatch !== b.textMatch) return b.textMatch - a.textMatch;
        return b.score - a.score;
      })
      .slice(0, 10);
  }

  private async apiFallback(query: string, limit: number): Promise<any[]> {
    try {
      const apiResults = await this.fdcApi.searchFoods({
        query,
        pageSize: limit,
        dataType: ['Branded', 'Foundation'],
      });

      if (!apiResults.foods || apiResults.foods.length === 0) {
        return [];
      }

      // Save top results to database
      const saved: any[] = [];
      for (const foodData of apiResults.foods.slice(0, limit)) {
        try {
          const savedFood = await this.saveFoodFromApi(foodData);
          saved.push(savedFood);
        } catch (error: any) {
          this.logger.error(`Error saving food ${foodData.fdcId}:`, error.message);
        }
      }

      return saved.map(f => ({
        id: f.id,
        fdcId: f.fdcId,
        description: f.description,
        dataType: f.dataType,
        score: 0.9, // API results get high score
        source: 'USDA_API',
      }));
    } catch (error: any) {
      this.logger.error(`API fallback error: ${error.message}`);
      return [];
    }
  }

  private async saveFoodFromApi(foodData: any): Promise<any> {
    const food = await this.prisma.food.upsert({
      where: { fdcId: foodData.fdcId },
      update: {
        dataType: foodData.dataType,
        description: foodData.description,
        brandOwner: foodData.brandOwner,
        gtinUpc: foodData.gtinUpc,
        scientificName: foodData.scientificName,
        publishedAt: foodData.publishedDate ? new Date(foodData.publishedDate) : null,
        updatedAt: foodData.foodUpdateDate ? new Date(foodData.foodUpdateDate) : null,
        source: FoodSource.USDA_API,
      },
      create: {
        fdcId: foodData.fdcId,
        dataType: foodData.dataType,
        description: foodData.description,
        brandOwner: foodData.brandOwner,
        gtinUpc: foodData.gtinUpc,
        scientificName: foodData.scientificName,
        publishedAt: foodData.publishedDate ? new Date(foodData.publishedDate) : null,
        updatedAt: foodData.foodUpdateDate ? new Date(foodData.foodUpdateDate) : null,
        source: FoodSource.USDA_API,
      },
    });

    // Save portions
    if (foodData.foodPortions) {
      await this.prisma.foodPortion.deleteMany({ where: { foodId: food.id } });
      await this.prisma.foodPortion.createMany({
        data: foodData.foodPortions.map((p: any) => ({
          foodId: food.id,
          gramWeight: p.gramWeight || 0,
          measureUnit: p.measureUnit || '',
          modifier: p.modifier,
          amount: p.amount,
        })),
      });
    }

    // Save nutrients
    if (foodData.foodNutrients) {
      await this.prisma.foodNutrient.deleteMany({ where: { foodId: food.id } });
      await this.prisma.foodNutrient.createMany({
        data: foodData.foodNutrients
          .filter((fn: any) => fn.nutrient && fn.amount !== null)
          .map((fn: any) => ({
            foodId: food.id,
            nutrientId: fn.nutrient.id,
            amount: fn.amount || 0,
          })),
      });
    }

    // Save label nutrients
    if (foodData.labelNutrients) {
      await this.prisma.labelNutrients.upsert({
        where: { foodId: food.id },
        update: {
          calories: foodData.labelNutrients.calories,
          protein: foodData.labelNutrients.protein,
          fat: foodData.labelNutrients.fat,
          carbohydrates: foodData.labelNutrients.carbohydrates,
          fiber: foodData.labelNutrients.fiber,
          sugars: foodData.labelNutrients.sugars,
          sodium: foodData.labelNutrients.sodium,
          cholesterol: foodData.labelNutrients.cholesterol,
          potassium: foodData.labelNutrients.potassium,
          calcium: foodData.labelNutrients.calcium,
          iron: foodData.labelNutrients.iron,
        },
        create: {
          foodId: food.id,
          calories: foodData.labelNutrients.calories,
          protein: foodData.labelNutrients.protein,
          fat: foodData.labelNutrients.fat,
          carbohydrates: foodData.labelNutrients.carbohydrates,
          fiber: foodData.labelNutrients.fiber,
          sugars: foodData.labelNutrients.sugars,
          sodium: foodData.labelNutrients.sodium,
          cholesterol: foodData.labelNutrients.cholesterol,
          potassium: foodData.labelNutrients.potassium,
          calcium: foodData.labelNutrients.calcium,
          iron: foodData.labelNutrients.iron,
        },
      });
    }

    return food;
  }

  /**
   * Get normalized food data
   */
  async getFoodNormalized(fdcId: number): Promise<any> {
    // Try local first
    const localFood = await this.prisma.food.findUnique({
      where: { fdcId },
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

    if (localFood) {
      return this.normalizeFood(localFood);
    }

    // Fallback to API
    const apiFood = await this.fdcApi.getFood(fdcId);
    const savedFood = await this.saveFoodFromApi(apiFood);
    
    return this.normalizeFood(savedFood);
  }

  private normalizeFood(food: any): any {
    const nutrients = this.extractNutrients(food);
    
    return {
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      source: food.source,
      portions: food.portions || [],
      nutrients: {
        calories: nutrients.calories,
        protein: nutrients.protein,
        fat: nutrients.fat,
        carbs: nutrients.carbs,
        fiber: nutrients.fiber,
        sugars: nutrients.sugars,
        sodium: nutrients.sodium,
      },
    };
  }

  private extractNutrients(food: any): any {
    // Priority: LabelNutrients > FoodNutrient (Atwater 2047/2048) > FoodNutrient (1008)
    if (food.label) {
      return {
        calories: food.label.calories || 0,
        protein: food.label.protein || 0,
        fat: food.label.fat || 0,
        carbs: food.label.carbohydrates || 0,
        fiber: food.label.fiber || 0,
        sugars: food.label.sugars || 0,
        sodium: food.label.sodium || 0,
      };
    }

    // Extract from FoodNutrient
    const nutrients = food.nutrients || [];
    
    // Energy: try 2047 (Atwater General), 2048 (Atwater Specific), then 1008
    const energy = nutrients.find((n: any) => n.nutrientId === 2047 || n.nutrientId === 2048) 
      || nutrients.find((n: any) => n.nutrientId === 1008);
    
    // Macros: 1003 (protein), 1004 (fat), 1005 (carbs)
    const protein = nutrients.find((n: any) => n.nutrientId === 1003);
    const fat = nutrients.find((n: any) => n.nutrientId === 1004);
    const carbs = nutrients.find((n: any) => n.nutrientId === 1005);
    const fiber = nutrients.find((n: any) => n.nutrientId === 1079);
    const sugars = nutrients.find((n: any) => n.nutrientId === 1079);
    const sodium = nutrients.find((n: any) => n.nutrientId === 2000);

    return {
      calories: energy?.amount || 0,
      protein: protein?.amount || 0,
      fat: fat?.amount || 0,
      carbs: carbs?.amount || 0,
      fiber: fiber?.amount || 0,
      sugars: sugars?.amount || 0,
      sodium: sodium?.amount || 0,
    };
  }
}

