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
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image and provide detailed nutritional information. Return a JSON object with an "items" array, where each item has: label (food name), kcal (calories), protein (grams), fat (grams), carbs (grams), and gramsMean (estimated weight in grams).',
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
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      return result;
    } catch (error: any) {
      console.error('OpenAI image analysis error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  async analyzeText(description: string): Promise<AnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Analyze this food description and provide detailed nutritional information: "${description}". Return a JSON object with an "items" array, where each item has: label (food name), kcal (calories), protein (grams), fat (grams), carbs (grams), and gramsMean (estimated weight in grams).`,
          },
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      return result;
    } catch (error: any) {
      console.error('OpenAI text analysis error:', error);
      throw new Error(`OpenAI text analysis failed: ${error.message}`);
    }
  }
}
