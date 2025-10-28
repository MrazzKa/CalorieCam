import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AnalysisResult } from '../food-analyzer.service';

@Injectable()
export class UsdaAnalyzer {
  private readonly usdaApiKey: string;
  private readonly usdaBaseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor() {
    this.usdaApiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
  }

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    // For image analysis, we'll use a simple approach
    // In a real implementation, you might use computer vision APIs
    throw new Error('USDA analyzer does not support image analysis directly');
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      // Clean and prepare the search query
      const cleanDescription = this.cleanDescription(description);
      
      // Search for foods in USDA database
      const searchResponse = await axios.get(`${this.usdaBaseUrl}/foods/search`, {
        params: {
          api_key: this.usdaApiKey,
          query: cleanDescription,
          pageSize: 10,
          dataType: ['Foundation', 'SR Legacy'],
        },
        timeout: 10000,
      });

      const foods = searchResponse.data.foods;
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
          
          // Get detailed nutrition
          const detailsResponse = await axios.get(`${this.usdaBaseUrl}/food/${foodId}`, {
            params: {
              api_key: this.usdaApiKey,
            },
            timeout: 10000,
          });

          const foodDetails = detailsResponse.data;
          const nutrients = foodDetails.foodNutrients || [];

          // Extract key nutrients
          const calories = this.getNutrientValue(nutrients, 'Energy');
          const protein = this.getNutrientValue(nutrients, 'Protein');
          const fat = this.getNutrientValue(nutrients, 'Total lipid (fat)');
          const carbs = this.getNutrientValue(nutrients, 'Carbohydrate, by difference');

          // Only add if we have meaningful nutritional data
          if (calories > 0 || protein > 0 || fat > 0 || carbs > 0) {
            items.push({
              label: foodDetails.description || food.description || cleanDescription,
              kcal: Math.round(calories),
              protein: Math.round(protein * 10) / 10,
              fat: Math.round(fat * 10) / 10,
              carbs: Math.round(carbs * 10) / 10,
              gramsMean: this.estimatePortionSize(foodDetails.description || food.description),
            });
          }
        } catch (itemError) {
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

  private getNutrientValue(nutrients: any[], nutrientName: string): number {
    const nutrient = nutrients.find(n => 
      n.nutrient && n.nutrient.name === nutrientName
    );
    return nutrient ? (nutrient.amount || 0) : 0;
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
