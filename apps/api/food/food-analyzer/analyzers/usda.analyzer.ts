import { Injectable } from '@nestjs/common';
import { FdcService } from '../../../src/fdc/fdc.service';
import { AnalysisResult } from '../food-analyzer.service';

@Injectable()
export class UsdaAnalyzer {
  constructor(private readonly fdcService: FdcService) {}

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    // USDA does not support image analysis directly
    throw new Error('USDA analyzer does not support image analysis directly');
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      // Clean and prepare the search query
      const cleanDescription = this.cleanDescription(description);
      
      // Search for foods in USDA database using FdcService
      const searchResult = await this.fdcService.searchFoods({
        query: cleanDescription,
        dataType: ['Branded', 'Foundation'],
        pageSize: 5,
        sortBy: 'fdcId',
        sortOrder: 'desc',
      });

      const foods = searchResult.foods || [];
      if (!foods || foods.length === 0) {
        return { items: [] };
      }

      // Process multiple foods if found
      const items = [];
      const maxItems = Math.min(3, foods.length); // Limit to 3 items

      for (let i = 0; i < maxItems; i++) {
        try {
          const food = foods[i];
          const foodId = food.fdcId;
          
          // Get detailed nutrition using FdcService
          const foodDetails = await this.fdcService.getFood(foodId, { format: 'full' });

          // Extract nutrition using FdcService helper
          const nutrition = this.fdcService.extractNutrition(foodDetails);

          // Only add if we have meaningful nutritional data
          if (nutrition.calories > 0 || nutrition.protein > 0 || nutrition.fat > 0 || nutrition.carbs > 0) {
            items.push({
              label: foodDetails.description || food.description || cleanDescription,
              kcal: Math.round(nutrition.calories),
              protein: Math.round(nutrition.protein * 10) / 10,
              fat: Math.round(nutrition.fat * 10) / 10,
              carbs: Math.round(nutrition.carbs * 10) / 10,
              gramsMean: this.estimatePortionSize(foodDetails.description || food.description || cleanDescription),
            });
          }
        } catch (itemError: any) {
          console.warn(`Failed to process food item ${i}:`, itemError.message);
          continue;
        }
      }

      return { items };
    } catch (error: any) {
      console.error('USDA analysis error:', error);
      throw new Error(`USDA analysis failed: ${error.message}`);
    }
  }

  private cleanDescription(description: string): string {
    // Clean the description for better search results
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private estimatePortionSize(foodName: string): number {
    // Estimate portion size based on food type
    const name = foodName.toLowerCase();
    
    if (name.includes('bread') || name.includes('slice')) return 30;
    if (name.includes('apple') || name.includes('banana') || name.includes('orange')) return 150;
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork')) return 100;
    if (name.includes('rice') || name.includes('pasta') || name.includes('potato')) return 150;
    if (name.includes('salad') || name.includes('vegetable')) return 100;
    if (name.includes('cheese')) return 30;
    if (name.includes('milk') || name.includes('yogurt')) return 250;
    if (name.includes('egg')) return 50;
    
    return 100; // Default portion size
  }
}
