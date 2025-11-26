import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import OpenAI from 'openai';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';

@Injectable()
export class AiAssistantService {
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AssistantOrchestratorService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getNutritionAdvice(userId: string, question: string, context?: any, language?: string) {
    const result = await this.generateCompletion('nutrition_advice', userId, question, context, 0.7, language);
    return result;
  }

  async getHealthCheck(userId: string, question: string, language?: string) {
    const result = await this.generateCompletion('health_check', userId, question, undefined, 0.3, language);
    return result;
  }

  async getGeneralQuestion(userId: string, question: string, language?: string) {
    const result = await this.generateCompletion('general_question', userId, question, undefined, 0.7, language);
    return result;
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

  async logFlowCompletion(userId: string, flowId: string, summary: string, collected: Record<string, any>) {
    await this.prisma.aiAssistant.create({
      data: {
        userId,
        type: flowId,
        question: '[flow-completion]',
        answer: summary,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        context: { flowId, collected },
      },
    });
  }

  private async generateCompletion(
    type: 'nutrition_advice' | 'health_check' | 'general_question',
    userId: string,
    question: string,
    extraContext?: any,
    temperature: number = 0.7,
    language?: string,
  ) {
    const { systemPrompt, context } = await this.buildSystemPrompt(type, userId, extraContext, language);

    try {
      const response = await this.openai.chat.completions.create({
        // Use configurable GPT model (default gpt-5.1)
        model: process.env.OPENAI_MODEL || 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 900,
        temperature,
      });

      const answer = response.choices[0]?.message?.content || 'Sorry, I could not process your question.';
      const usage = response.usage;

      await this.prisma.aiAssistant.create({
        data: {
          userId,
          type,
          question,
          answer,
          tokensUsed: usage?.total_tokens || 0,
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          context,
        },
      });

      return {
        answer,
        tokensUsed: usage?.total_tokens || 0,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
      };
    } catch (error: any) {
      // Handle OpenAI API errors
      if (error?.status === 429 || error?.response?.status === 429) {
        // Re-throw with specific error code for quota exceeded
        const quotaError: any = new Error('AI_QUOTA_EXCEEDED');
        quotaError.status = 429;
        throw quotaError;
      }
      // Re-throw other errors
      throw error;
    }
  }

  private async buildSystemPrompt(
    type: 'nutrition_advice' | 'health_check' | 'general_question',
    userId: string,
    extraContext?: any,
    language?: string,
  ) {
    // Get user language from profile or use provided language or default to English
    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const userLanguage = language || (userProfile?.preferences as any)?.language || 'en';
    
    // Map language codes to language names for OpenAI
    const languageMap: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      de: 'German',
      fr: 'French',
      ko: 'Korean',
      ja: 'Japanese',
      zh: 'Chinese',
    };
    const responseLanguage = languageMap[userLanguage] || 'English';
    
    if (type === 'general_question') {
      return {
        systemPrompt: `You are a nutrition and health assistant. Provide accurate, concise, and actionable answers.

CRITICAL RULES:
1. ALWAYS provide short, structured, and actionable responses.
2. For food analysis questions:
   - ALWAYS state what is OK about the meal and what is not (e.g., too much sugar, not enough protein).
   - ALWAYS give clear next steps: how to improve the meal, how to adjust portion sizes, etc.
3. Ask clarifying questions if needed to provide better advice.
4. NEVER give formal diagnoses or prescribe treatment - only provide nutrition-focused guidance and general explanations.
5. EVERY response must include a short disclaimer that this is not medical advice and users should consult a doctor for medical decisions.
6. Be encouraging and supportive.
7. Respond in ${responseLanguage}.

Example response format:
- What's good: [positive aspects]
- What to improve: [areas for improvement]
- Next steps: [actionable recommendations]
- Disclaimer: This is not medical advice. Please consult a healthcare professional for medical decisions.`,
        context: {},
      };
    }
    const recentMeals = await this.prisma.meal.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentAnalyses = await this.prisma.analysis.findMany({
      where: { userId },
      include: { results: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const basePrompt = type === 'nutrition_advice'
      ? this.buildNutritionSystemPrompt(userProfile, recentMeals, recentAnalyses, responseLanguage)
      : this.buildHealthCheckSystemPrompt(userProfile, responseLanguage);

    const context = {
      userProfile,
      recentMeals: recentMeals.map((meal) => ({
        name: meal.name,
        createdAt: meal.createdAt,
        items: meal.items.map((item) => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
        })),
      })),
      recentAnalyses,
      extraContext,
    };

    return { systemPrompt: basePrompt, context };
  }

  private calculateDailyUsage(conversations: any[], days: number) {
    const dailyMap = new Map<string, number>();
    conversations.forEach((conv) => {
      const date = conv.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + (conv.tokensUsed || 0));
    });
    return Array.from(dailyMap.entries())
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private buildNutritionSystemPrompt(userProfile: any, recentMeals: any[], recentAnalyses: any[], language: string = 'English') {
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
      recentMeals.forEach((meal) => {
        prompt += `\n- ${meal.name} (${meal.createdAt ? new Date(meal.createdAt).toLocaleDateString('en-US') : 'no date'})`;
        meal.items.forEach((item) => {
          prompt += `\n  * ${item.name}: ${item.calories} kcal, ${item.protein}g protein, ${item.fat}g fat, ${item.carbs}g carbs`;
        });
      });
    } else {
      prompt += '\nNo recent meals recorded.';
    }

    prompt += `\n\nRecent Food Analyses:`;
    if (recentAnalyses.length > 0) {
      recentAnalyses.forEach((analysis) => {
        prompt += `\n- ${analysis.type} analysis from ${new Date(analysis.createdAt).toLocaleDateString('en-US')}`;
      });
    } else {
      prompt += '\nNo recent analyses.';
    }

    prompt += `\n\nIMPORTANT RULES:
1. ALWAYS provide short, structured, and actionable responses.
2. For food analysis:
   - ALWAYS state what is OK about the meal and what is not (e.g., too much sugar, not enough protein).
   - ALWAYS give clear next steps: how to improve the meal, how to adjust portion sizes, etc.
3. Provide personalized advice based on profile and eating habits.
4. Suggest specific dietary improvements considering goals and activity level.
5. Be encouraging and supportive.
6. Suggest meal ideas where appropriate.
7. NEVER give formal diagnoses or prescribe treatment - only provide nutrition-focused guidance and general explanations.
8. EVERY response must include a short disclaimer that this is not medical advice and users should consult a doctor for medical decisions.
9. Respond in ${language}.`;

    return prompt;
  }

  private buildHealthCheckSystemPrompt(userProfile: any, language: string = 'English') {
    return `You are a health and wellness assistant. Provide general health information and suggestions based on the user's profile.

User Profile:
- Age: ${userProfile?.age || 'not specified'}
- Height: ${userProfile?.height ? `${userProfile.height} cm` : 'not specified'}
- Weight: ${userProfile?.weight ? `${userProfile.weight} kg` : 'not specified'}
- Gender: ${userProfile?.gender || 'not specified'}
- Activity Level: ${userProfile?.activityLevel || 'not specified'}

CRITICAL RULES:
1. ALWAYS provide short, structured, and actionable responses.
2. ALWAYS ask clarifying questions about symptoms and advise seeing professionals.
3. Provide general wellness guidance (nutrition, sleep, training, stress).
4. NEVER give formal diagnoses or prescribe treatment - only provide general wellness information.
5. EVERY response must include a short disclaimer that this is not medical advice and users should consult a doctor for medical decisions.
6. Respond in ${language}.
`;
  }

  async analyzeLabResults(userId: string, rawText: string, language?: string) {
    const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const userLanguage = language || (userProfile?.preferences as any)?.language || 'en';
    
    const languageMap: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      de: 'German',
      fr: 'French',
      ko: 'Korean',
      ja: 'Japanese',
      zh: 'Chinese',
    };
    const responseLanguage = languageMap[userLanguage] || 'English';

    const systemPrompt = `You are a medical lab results interpreter. Analyze blood test results and provide structured feedback.

CRITICAL RULES:
1. Interpret common lab metrics (e.g., WBC, RBC, platelets, glucose, cholesterol, etc.) using typical reference ranges for adults.
2. For each metric, determine if it is within a typical range, higher than typical, or lower than typical.
3. Use soft language ("higher than a typical range", "could indicate issues") - never make definitive diagnoses.
4. ALWAYS add a disclaimer that this is not a diagnosis and a doctor must be consulted.
5. Provide structured JSON output with:
   - metrics: array of { name, value, unit, isNormal, level ("low"/"high"/"normal"), comment }
   - summary: brief overall summary string
   - recommendation: actionable recommendations string
6. Respond in ${responseLanguage}.

Return ONLY valid JSON in this format:
{
  "metrics": [
    {
      "name": "WBC",
      "value": 7.5,
      "unit": "10^3/μL",
      "isNormal": true,
      "level": "normal",
      "comment": "Within typical range"
    }
  ],
  "summary": "Overall summary...",
  "recommendation": "Recommendations..."
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-5.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these lab results:\n\n${rawText}` },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Save to database
      const labResult = await this.prisma.labResult.create({
        data: {
          userId,
          rawText,
          summary: parsed.summary || '',
          recommendation: parsed.recommendation || '',
        },
      });

      // Save metrics
      if (Array.isArray(parsed.metrics)) {
        await Promise.all(
          parsed.metrics.map((metric: any) =>
            this.prisma.labMetric.create({
              data: {
                labResultId: labResult.id,
                name: metric.name || '',
                value: metric.value || 0,
                unit: metric.unit || '',
                isNormal: metric.isNormal !== false,
                level: metric.level || 'normal',
                comment: metric.comment || null,
              },
            }),
          ),
        );
      }

      return {
        id: labResult.id,
        metrics: parsed.metrics || [],
        summary: parsed.summary || '',
        recommendation: parsed.recommendation || '',
      };
    } catch (error: any) {
      if (error?.status === 429 || error?.response?.status === 429) {
        const quotaError: any = new Error('AI_QUOTA_EXCEEDED');
        quotaError.status = 429;
        throw quotaError;
      }
      throw error;
    }
  }
}
