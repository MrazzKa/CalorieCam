import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';

const ComponentSchema = z.object({
  name: z.string(),
  preparation: z.enum(['raw', 'boiled', 'steamed', 'baked', 'grilled', 'fried', 'roasted', 'sauteed', 'unknown']),
  est_portion_g: z.number().positive(),
  confidence: z.number().min(0).max(1),
});

const VisionResponseSchema = z.array(ComponentSchema);

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract food components from image using OpenAI Vision
   */
  async extractComponents(params: { imageUrl?: string; imageBase64?: string }): Promise<z.infer<typeof VisionResponseSchema>> {
    const { imageUrl, imageBase64 } = params;

    if (!imageUrl && !imageBase64) {
      throw new Error('Either imageUrl or imageBase64 must be provided');
    }

    const imageContent: any = imageUrl
      ? { type: 'image_url', image_url: { url: imageUrl } }
      : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

    const systemPrompt = `You are a professional nutritionist and food analyst. Analyze food images and extract all visible food components.

CRITICAL RULES:
1. Output ONLY a valid JSON array of components - no prose, no explanations
2. Each component must have: name (English), preparation method, estimated portion in grams, confidence (0-1)
3. Include sauces, oils, dressings as separate items when visible
4. Names must be specific and in English (e.g., "grilled chicken breast", not "chicken")
5. Preparation methods: raw, boiled, steamed, baked, grilled, fried, roasted, sauteed, unknown
6. Estimate realistic portion sizes based on visual appearance
7. Confidence should reflect certainty of identification (0.55+ for visible items)

Example format:
[
  {
    "name": "grilled chicken breast",
    "preparation": "grilled",
    "est_portion_g": 180,
    "confidence": 0.87
  },
  {
    "name": "olive oil",
    "preparation": "raw",
    "est_portion_g": 15,
    "confidence": 0.65
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        // Use global OPENAI_MODEL if provided (e.g. gpt-5.1), fallback to VISION_MODEL or default
        model: process.env.OPENAI_MODEL || process.env.VISION_MODEL || 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this food image and extract all components.' },
              imageContent,
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision');
      }

      // Parse JSON (might be wrapped in object)
      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Handle both { components: [...] } and [...]
      const components = parsed.components || parsed;
      
      // Validate with Zod
      const validated = VisionResponseSchema.parse(components);

      // Filter low confidence items and log warnings
      const filtered = validated.filter(comp => {
        if (comp.confidence < 0.55) {
          this.logger.warn(`Low confidence component: ${comp.name} (${comp.confidence})`);
        }
        return comp.confidence >= 0.55;
      });

      return filtered;
    } catch (error: any) {
      this.logger.error(`Vision extraction error: ${error.message}`);
      
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }

      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }
}

