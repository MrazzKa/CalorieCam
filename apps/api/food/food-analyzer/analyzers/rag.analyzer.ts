import { Injectable } from '@nestjs/common';
import { AnalysisResult } from '../food-analyzer.service';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class RagAnalyzer {
  private readonly foodDatabase = new Map<string, any>();

  constructor() {
    this.initializeFoodDatabase();
  }

  private initializeFoodDatabase() {
    // Load from JSON file - much larger database (70+ foods)
    try {
      // Try multiple possible paths
      const possiblePaths = [
        // Compiled path (dist)
        join(__dirname, '../data/food-database.json'),
        // Source path from process.cwd
        join(process.cwd(), 'food/food-analyzer/data/food-database.json'),
        // Alternative source path
        join(process.cwd(), 'apps/api/food/food-analyzer/data/food-database.json'),
      ];
      
      let foodDatabasePath: string | null = null;
      
      // Find the first existing path
      for (const path of possiblePaths) {
        try {
          readFileSync(path, 'utf-8');
          foodDatabasePath = path;
          break;
        } catch {
          // Continue to next path
        }
      }
      
      if (!foodDatabasePath) {
        throw new Error('Food database file not found in any expected location');
      }
      
      const foodDatabaseContent = readFileSync(foodDatabasePath, 'utf-8');
      const foods = JSON.parse(foodDatabaseContent) as Array<{ keywords: string[]; nutrition: any }>;
      
      // Index foods by keywords
      foods.forEach(food => {
        food.keywords.forEach(keyword => {
          if (!this.foodDatabase.has(keyword)) {
            this.foodDatabase.set(keyword, []);
          }
          this.foodDatabase.get(keyword).push(food.nutrition);
        });
      });
      
      console.log(`✅ Loaded ${foods.length} foods into RAG database from ${foodDatabasePath}`);
    } catch (error) {
      console.warn('⚠️  Failed to load food database, using fallback:', error);
      // Fallback to minimal database
      this.initializeFallbackDatabase();
    }
  }

  private initializeFallbackDatabase() {
    const fallbackFoods = [
      {
        keywords: ['chicken', 'breast'],
        nutrition: {
          label: 'Chicken Breast',
          kcal: 165,
          protein: 31,
          fat: 3.6,
          carbs: 0,
          gramsMean: 100
        }
      },
      {
        keywords: ['rice', 'white'],
        nutrition: {
          label: 'White Rice',
          kcal: 130,
          protein: 2.7,
          fat: 0.3,
          carbs: 28,
          gramsMean: 100
        }
      },
    ];
    
    fallbackFoods.forEach(food => {
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
