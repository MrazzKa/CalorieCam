import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiAssistantService {
  private readonly openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getNutritionAdvice(userId: string, question: string, context?: any) {
    try {
      // Get user profile for context
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      // Get recent meals for context
      const recentMeals = await this.prisma.meal.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Get recent analyses for context
      const recentAnalyses = await this.prisma.analysis.findMany({
        where: { userId },
        include: { results: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const systemPrompt = this.buildNutritionSystemPrompt(userProfile, recentMeals, recentAnalyses);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const answer = response.choices[0]?.message?.content || 'Sorry, I could not process your question.';

      // Save the conversation
      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type: 'nutrition_advice',
          question,
          answer,
          context: {
            userProfile,
            recentMeals: recentMeals.map(meal => ({
              name: meal.name,
              items: meal.items.map(item => ({
                name: item.name,
                calories: item.calories,
                protein: item.protein,
                fat: item.fat,
                carbs: item.carbs,
              })),
            })),
            recentAnalyses: recentAnalyses.map(analysis => ({
              type: analysis.type,
              results: analysis.results,
            })),
          },
        },
      });

      return { answer };
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      throw new Error(`AI Assistant failed: ${error.message}`);
    }
  }

  async getHealthCheck(userId: string, question: string) {
    try {
      const userProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      const systemPrompt = this.buildHealthCheckSystemPrompt(userProfile);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const answer = response.choices[0]?.message?.content || 'Sorry, I could not process your question.';

      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type: 'health_check',
          question,
          answer,
          context: { userProfile },
        },
      });

      return { answer };
    } catch (error: any) {
      console.error('AI Assistant health check error:', error);
      throw new Error(`AI Assistant health check failed: ${error.message}`);
    }
  }

  async getGeneralQuestion(userId: string, question: string) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful nutrition and health assistant. Provide accurate, helpful information about nutrition, health, and wellness. Always recommend consulting with healthcare professionals for medical advice.`,
          },
          { role: 'user', content: question },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const answer = response.choices[0]?.message?.content || 'Sorry, I could not process your question.';

      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type: 'general_question',
          question,
          answer,
        },
      });

      return { answer };
    } catch (error: any) {
      console.error('AI Assistant general question error:', error);
      throw new Error(`AI Assistant general question failed: ${error.message}`);
    }
  }

  async getConversationHistory(userId: string, limit: number = 10) {
    return this.prisma.aiAssistant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private buildNutritionSystemPrompt(userProfile: any, recentMeals: any[], recentAnalyses: any[]) {
    let prompt = `You are a professional nutritionist and health coach. Provide personalized nutrition advice based on the user's profile and recent eating patterns.

User Profile:
- Age: ${userProfile?.age || 'Not specified'}
- Height: ${userProfile?.height ? `${userProfile.height}cm` : 'Not specified'}
- Weight: ${userProfile?.weight ? `${userProfile.weight}kg` : 'Not specified'}
- Gender: ${userProfile?.gender || 'Not specified'}
- Activity Level: ${userProfile?.activityLevel || 'Not specified'}
- Goal: ${userProfile?.goal || 'Not specified'}
- Daily Calorie Target: ${userProfile?.dailyCalories || 'Not specified'}

Recent Meals:`;

    if (recentMeals.length > 0) {
      recentMeals.forEach(meal => {
        prompt += `\n- ${meal.name} (${meal.consumedAt ? new Date(meal.consumedAt).toLocaleDateString() : 'No date'})`;
        meal.items.forEach(item => {
          prompt += `\n  * ${item.name}: ${item.calories} cal, ${item.protein}g protein, ${item.fat}g fat, ${item.carbs}g carbs`;
        });
      });
    } else {
      prompt += '\nNo recent meals recorded.';
    }

    prompt += `\n\nRecent Food Analyses:`;
    if (recentAnalyses.length > 0) {
      recentAnalyses.forEach(analysis => {
        prompt += `\n- ${analysis.type} analysis on ${new Date(analysis.createdAt).toLocaleDateString()}`;
      });
    } else {
      prompt += '\nNo recent food analyses.';
    }

    prompt += `\n\nGuidelines:
- Provide personalized advice based on the user's profile and eating patterns
- Suggest specific improvements to their diet
- Consider their health goals and activity level
- Be encouraging and supportive
- Suggest specific foods or meal ideas when appropriate
- Always recommend consulting with healthcare professionals for medical advice
- Keep responses concise but informative
- Use a friendly, professional tone`;

    return prompt;
  }

  private buildHealthCheckSystemPrompt(userProfile: any) {
    return `You are a health and wellness assistant. Provide general health information and suggestions based on the user's profile.

User Profile:
- Age: ${userProfile?.age || 'Not specified'}
- Height: ${userProfile?.height ? `${userProfile.height}cm` : 'Not specified'}
- Weight: ${userProfile?.weight ? `${userProfile.weight}kg` : 'Not specified'}
- Gender: ${userProfile?.gender || 'Not specified'}
- Activity Level: ${userProfile?.activityLevel || 'Not specified'}

Guidelines:
- Provide general health and wellness information
- Suggest lifestyle improvements
- Always recommend consulting with healthcare professionals for medical advice
- Be encouraging and supportive
- Keep responses concise but informative
- Use a friendly, professional tone
- Focus on nutrition, exercise, and general wellness topics`;
  }
}
