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

      // Extract token usage
      const usage = response.usage;
      const tokensUsed = usage?.total_tokens || 0;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;

      // Save the conversation with token tracking
      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type: 'nutrition_advice',
          question,
          answer,
          tokensUsed,
          promptTokens,
          completionTokens,
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

      return { 
        answer,
        tokensUsed,
        promptTokens,
        completionTokens,
      };
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

      // Extract token usage
      const usage = response.usage;
      const tokensUsed = usage?.total_tokens || 0;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;

      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type: 'health_check',
          question,
          answer,
          tokensUsed,
          promptTokens,
          completionTokens,
          context: { userProfile },
        },
      });

      return { 
        answer,
        tokensUsed,
        promptTokens,
        completionTokens,
      };
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
            content: `You are a nutrition and health assistant. Provide accurate and helpful information about nutrition, health, and wellness.

CRITICALLY IMPORTANT RULES:
1. ALWAYS ask clarifying questions if the question is not clear enough or requires context:
   - If the question is general ("how to eat properly") - clarify: goal, current diet, lifestyle
   - If the question is about products - find out: purpose of use, preferences, restrictions
   - If the question is about symptoms - ask detailed questions (location, time, intensity)

2. Always recommend consulting with medical professionals for medical advice

3. Provide accurate, scientifically-based information

4. Be friendly and helpful

5. Use simple, clear language

6. Respond in English only

7. If the question is too general - ask clarifying questions for a more accurate answer`,
          },
          { role: 'user', content: question },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const answer = response.choices[0]?.message?.content || 'Sorry, I could not process your question.';

      // Extract token usage
      const usage = response.usage;
      const tokensUsed = usage?.total_tokens || 0;
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;

      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type: 'general_question',
          question,
          answer,
          tokensUsed,
          promptTokens,
          completionTokens,
        },
      });

      return { 
        answer,
        tokensUsed,
        promptTokens,
        completionTokens,
      };
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

  async getTokenUsageStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const conversations = await this.prisma.aiAssistant.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        tokensUsed: true,
        promptTokens: true,
        completionTokens: true,
        createdAt: true,
      },
    });

    const totalTokens = conversations.reduce((sum, c) => sum + (c.tokensUsed || 0), 0);
    const totalPromptTokens = conversations.reduce((sum, c) => sum + (c.promptTokens || 0), 0);
    const totalCompletionTokens = conversations.reduce((sum, c) => sum + (c.completionTokens || 0), 0);

    return {
      period: `${days} days`,
      totalRequests: conversations.length,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      averageTokensPerRequest: conversations.length > 0 ? Math.round(totalTokens / conversations.length) : 0,
      dailyUsage: this.calculateDailyUsage(conversations, days),
    };
  }

  private calculateDailyUsage(conversations: any[], days: number) {
    const dailyMap = new Map<string, number>();

    conversations.forEach(conv => {
      const date = conv.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + (conv.tokensUsed || 0));
    });

    return Array.from(dailyMap.entries()).map(([date, tokens]) => ({
      date,
      tokens,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private buildNutritionSystemPrompt(userProfile: any, recentMeals: any[], recentAnalyses: any[]) {
    let prompt = `You are a professional nutritionist and healthy eating coach. Provide personalized nutrition advice based on the user's profile and eating habits.

User Profile:
- Age: ${userProfile?.age || 'not specified'}
- Height: ${userProfile?.height ? `${userProfile.height} cm` : 'not specified'}
- Weight: ${userProfile?.weight ? `${userProfile.weight} kg` : 'not specified'}
- Gender: ${userProfile?.gender || 'not specified'}
- Activity Level: ${userProfile?.activityLevel || 'not specified'}
- Goal: ${userProfile?.goal || 'not specified'}
- Daily Calorie Target: ${userProfile?.dailyCalories || 'not specified'}

Recent Meals:`;

    if (recentMeals.length > 0) {
      recentMeals.forEach(meal => {
        prompt += `\n- ${meal.name} (${meal.consumedAt ? new Date(meal.consumedAt).toLocaleDateString('en-US') : 'no date'})`;
        meal.items.forEach(item => {
          prompt += `\n  * ${item.name}: ${item.calories} kcal, ${item.protein}g protein, ${item.fat}g fat, ${item.carbs}g carbs`;
        });
      });
    } else {
      prompt += '\nNo recent meals recorded.';
    }

    prompt += `\n\nRecent Food Analyses:`;
    if (recentAnalyses.length > 0) {
      recentAnalyses.forEach(analysis => {
        prompt += `\n- ${analysis.type} analysis from ${new Date(analysis.createdAt).toLocaleDateString('en-US')}`;
      });
    } else {
      prompt += '\nNo recent analyses.';
    }

    prompt += `\n\nIMPORTANT RULES:
1. ALWAYS ask clarifying questions if information is insufficient:
   - If the user mentions pain, discomfort, or symptoms - ask: duration, location, intensity, what alleviates/worsens
   - If asking about products - clarify: goal (weight loss, muscle gain, health), dietary restrictions, preferences
   - If asking about diet - find out: current diet, lifestyle, medical contraindications

2. Provide personalized advice based on profile and eating habits

3. Suggest specific dietary improvements considering goals and activity level

4. Be encouraging and supportive

5. Suggest specific products or meal ideas when appropriate

6. ALWAYS recommend consulting with doctors for medical advice

7. If the user mentions medical symptoms - ask clarifying questions, but do not diagnose

8. Keep responses brief but informative

9. Use a friendly, professional tone

10. Respond in English only`;

    return prompt;
  }

  private buildHealthCheckSystemPrompt(userProfile: any) {
    return `You are a health and wellness assistant. Provide general health information and suggestions based on the user's profile.

User Profile:
- Age: ${userProfile?.age || 'not specified'}
- Height: ${userProfile?.height ? `${userProfile.height} cm` : 'not specified'}
- Weight: ${userProfile?.weight ? `${userProfile.weight} kg` : 'not specified'}
- Gender: ${userProfile?.gender || 'not specified'}
- Activity Level: ${userProfile?.activityLevel || 'not specified'}

CRITICALLY IMPORTANT RULES:
1. ALWAYS ask clarifying questions when symptoms or problems are mentioned:
   - If the user talks about pain or discomfort: ask WHERE exactly (location), WHEN it started (time/circumstances), HOW LONG (duration), WHAT aggravates/alleviates the pain, was there an injury
   - If mentioning fatigue: clarify sleep schedule, stress level, physical activity, lifestyle changes
   - If talking about digestive issues: ask about diet, meal timing, other symptoms
   - Example: "My leg hurts after workout" → "Please tell me: which part of the leg hurts? When exactly did this start? Is the pain sharp or dull? Does it get worse with movement? Have there been any recent injuries or changes in training?"

2. NEVER diagnose - only ask questions and direct to a doctor

3. Provide general information about health and wellness

4. Suggest lifestyle improvements considering the user's profile

5. ALWAYS recommend consulting with medical professionals for medical advice

6. Be encouraging and supportive

7. Keep responses brief but informative

8. Use a friendly, professional tone

9. Focus on nutrition, physical exercise, and overall wellness

10. Respond in English only

11. If the user asks a general question without context - ask clarifying questions for better understanding of the situation`;
  }
}
