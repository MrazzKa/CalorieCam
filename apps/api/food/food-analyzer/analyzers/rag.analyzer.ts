import { Injectable } from '@nestjs/common';
import { AnalysisResult } from '../food-analyzer.service';

@Injectable()
export class RagAnalyzer {
  private readonly foodDatabase = new Map<string, any>();

  constructor() {
    this.initializeFoodDatabase();
  }

  private initializeFoodDatabase() {
    // Initialize with common foods and their nutritional data
    const commonFoods = [
      {
        keywords: ['chicken', 'breast', 'grilled', 'baked'],
        nutrition: {
          label: 'Chicken Breast (Grilled)',
          kcal: 165,
          protein: 31,
          fat: 3.6,
          carbs: 0,
          gramsMean: 100
        }
      },
      {
        keywords: ['rice', 'white', 'cooked', 'steamed'],
        nutrition: {
          label: 'White Rice (Cooked)',
          kcal: 130,
          protein: 2.7,
          fat: 0.3,
          carbs: 28,
          gramsMean: 100
        }
      },
      {
        keywords: ['apple', 'red', 'green', 'fresh'],
        nutrition: {
          label: 'Apple (Fresh)',
          kcal: 52,
          protein: 0.3,
          fat: 0.2,
          carbs: 14,
          gramsMean: 150
        }
      },
      {
        keywords: ['banana', 'yellow', 'ripe'],
        nutrition: {
          label: 'Banana (Fresh)',
          kcal: 89,
          protein: 1.1,
          fat: 0.3,
          carbs: 23,
          gramsMean: 120
        }
      },
      {
        keywords: ['bread', 'white', 'slice', 'toast'],
        nutrition: {
          label: 'White Bread (Slice)',
          kcal: 265,
          protein: 9,
          fat: 3.2,
          carbs: 49,
          gramsMean: 30
        }
      },
      {
        keywords: ['egg', 'boiled', 'fried', 'scrambled'],
        nutrition: {
          label: 'Egg (Large)',
          kcal: 155,
          protein: 13,
          fat: 11,
          carbs: 1.1,
          gramsMean: 50
        }
      },
      {
        keywords: ['milk', 'whole', 'cow', 'dairy'],
        nutrition: {
          label: 'Whole Milk',
          kcal: 61,
          protein: 3.2,
          fat: 3.3,
          carbs: 4.8,
          gramsMean: 100
        }
      },
      {
        keywords: ['yogurt', 'greek', 'plain', 'natural'],
        nutrition: {
          label: 'Greek Yogurt (Plain)',
          kcal: 59,
          protein: 10,
          fat: 0.4,
          carbs: 3.6,
          gramsMean: 100
        }
      },
      {
        keywords: ['salmon', 'fish', 'grilled', 'baked'],
        nutrition: {
          label: 'Salmon (Grilled)',
          kcal: 206,
          protein: 25,
          fat: 12,
          carbs: 0,
          gramsMean: 100
        }
      },
      {
        keywords: ['broccoli', 'vegetable', 'steamed', 'boiled'],
        nutrition: {
          label: 'Broccoli (Steamed)',
          kcal: 34,
          protein: 2.8,
          fat: 0.4,
          carbs: 7,
          gramsMean: 100
        }
      }
    ];

    // Index foods by keywords
    commonFoods.forEach(food => {
      food.keywords.forEach(keyword => {
        if (!this.foodDatabase.has(keyword)) {
          this.foodDatabase.set(keyword, []);
        }
        this.foodDatabase.get(keyword).push(food.nutrition);
      });
    });
  }

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    // RAG analyzer doesn't support image analysis directly
    // This would typically use computer vision + RAG
    throw new Error('RAG analyzer does not support image analysis directly');
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      const cleanDescription = this.cleanDescription(description);
      const words = cleanDescription.split(' ');
      
      const matchedFoods = new Set();
      const items = [];

      // Find matching foods based on keywords
      for (const word of words) {
        if (this.foodDatabase.has(word)) {
          const foods = this.foodDatabase.get(word);
          foods.forEach(food => {
            const key = `${food.label}-${food.kcal}`;
            if (!matchedFoods.has(key)) {
              matchedFoods.add(key);
              items.push(food);
            }
          });
        }
      }

      // If no exact matches, try partial matching
      if (items.length === 0) {
        for (const [keyword, foods] of this.foodDatabase) {
          if (cleanDescription.includes(keyword)) {
            foods.forEach(food => {
              const key = `${food.label}-${food.kcal}`;
              if (!matchedFoods.has(key)) {
                matchedFoods.add(key);
                items.push(food);
              }
            });
          }
        }
      }

      // If still no matches, try fuzzy matching
      if (items.length === 0) {
        const fuzzyMatches = this.findFuzzyMatches(cleanDescription);
        items.push(...fuzzyMatches);
      }

      return { items: items.slice(0, 3) }; // Limit to 3 items
    } catch (error: any) {
      console.error('RAG analysis error:', error);
      throw new Error(`RAG analysis failed: ${error.message}`);
    }
  }

  private cleanDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findFuzzyMatches(description: string): any[] {
    const matches = [];
    const words = description.split(' ');

    for (const [keyword, foods] of this.foodDatabase) {
      for (const word of words) {
        if (this.calculateSimilarity(word, keyword) > 0.6) {
          foods.forEach(food => {
            matches.push(food);
          });
        }
      }
    }

    return matches;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
