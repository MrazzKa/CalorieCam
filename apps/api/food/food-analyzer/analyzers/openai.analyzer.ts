import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AnalysisResult } from '../food-analyzer.service';

@Injectable()
export class OpenAiAnalyzer {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        // gpt-4-vision-preview deprecated → use gpt-4o-mini for image inputs
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional nutritionist and food analyst. Analyze food images and provide accurate nutritional information. 
            
            Guidelines:
            - Identify all visible food items
            - Estimate portion sizes realistically
            - Provide accurate nutritional data per 100g
            - Consider cooking methods (fried, baked, raw, etc.)
            - Account for common ingredients and seasonings
            - Be specific about food names and brands when visible
            
            Return a JSON object with an "items" array, where each item has:
            - label: specific food name
            - kcal: calories per 100g
            - protein: protein in grams per 100g
            - fat: fat in grams per 100g
            - carbs: carbohydrates in grams per 100g
            - gramsMean: estimated portion size in grams
            
            Example format:
            {
              "items": [
                {
                  "label": "Grilled Chicken Breast",
                  "kcal": 165,
                  "protein": 31,
                  "fat": 3.6,
                  "carbs": 0,
                  "gramsMean": 150
                }
              ]
            }`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this food image and provide detailed nutritional information for all visible food items.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response with better error handling
      try {
        const result = JSON.parse(content);
        if (!result.items || !Array.isArray(result.items)) {
          throw new Error('Invalid response format');
        }
        return result;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (error: any) {
      console.error('OpenAI image analysis error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional nutritionist and food analyst. Analyze food descriptions and provide accurate nutritional information.
            
            Guidelines:
            - Parse the description to identify all food items
            - Estimate realistic portion sizes
            - Provide accurate nutritional data per 100g
            - Consider cooking methods mentioned
            - Account for common ingredients and seasonings
            - Be specific about food names and preparation methods
            
            Return a JSON object with an "items" array, where each item has:
            - label: specific food name
            - kcal: calories per 100g
            - protein: protein in grams per 100g
            - fat: fat in grams per 100g
            - carbs: carbohydrates in grams per 100g
            - gramsMean: estimated portion size in grams
            
            Example format:
            {
              "items": [
                {
                  "label": "Grilled Chicken Breast",
                  "kcal": 165,
                  "protein": 31,
                  "fat": 3.6,
                  "carbs": 0,
                  "gramsMean": 150
                }
              ]
            }`,
          },
          {
            role: 'user',
            content: `Analyze this food description and provide detailed nutritional information: "${description}"`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response with better error handling
      try {
        const result = JSON.parse(content);
        if (!result.items || !Array.isArray(result.items)) {
          throw new Error('Invalid response format');
        }
        return result;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (error: any) {
      console.error('OpenAI text analysis error:', error);
      throw new Error(`OpenAI text analysis failed: ${error.message}`);
    }
  }
}
