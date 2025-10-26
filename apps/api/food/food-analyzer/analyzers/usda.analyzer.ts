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
      // Search for foods in USDA database
      const searchResponse = await axios.get(`${this.usdaBaseUrl}/foods/search`, {
        params: {
          api_key: this.usdaApiKey,
          query: description,
          pageSize: 5,
        },
      });

      const foods = searchResponse.data.foods;
      if (!foods || foods.length === 0) {
        return { items: [] };
      }

      // Get detailed nutrition for the first food
      const foodId = foods[0].fdcId;
      const detailsResponse = await axios.get(`${this.usdaBaseUrl}/food/${foodId}`, {
        params: {
          api_key: this.usdaApiKey,
        },
      });

      const food = detailsResponse.data;
      const nutrients = food.foodNutrients || [];

      // Extract key nutrients
      const calories = this.getNutrientValue(nutrients, 'Energy');
      const protein = this.getNutrientValue(nutrients, 'Protein');
      const fat = this.getNutrientValue(nutrients, 'Total lipid (fat)');
      const carbs = this.getNutrientValue(nutrients, 'Carbohydrate, by difference');

      return {
        items: [
          {
            label: food.description || description,
            kcal: calories,
            protein: protein,
            fat: fat,
            carbs: carbs,
            gramsMean: 100, // Default portion size
          },
        ],
      };
    } catch (error: any) {
      console.error('USDA analysis error:', error);
      throw new Error(`USDA analysis failed: ${error.message}`);
    }
  }

  private getNutrientValue(nutrients: any[], nutrientName: string): number {
    const nutrient = nutrients.find(n => 
      n.nutrient && n.nutrient.name === nutrientName
    );
    return nutrient ? (nutrient.amount || 0) : 0;
  }
}
