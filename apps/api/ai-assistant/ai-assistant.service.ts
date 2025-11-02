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
            content: `Вы - помощник по питанию и здоровью. Предоставляйте точную и полезную информацию о питании, здоровье и благополучии.

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ОБЯЗАТЕЛЬНО задавайте уточняющие вопросы, если вопрос недостаточно ясен или требует контекста:
   - Если вопрос общий ("как правильно питаться") - уточните: цель, текущий рацион, образ жизни
   - Если вопрос о продуктах - узнайте: цель использования, предпочтения, ограничения
   - Если вопрос о симптомах - задайте детальные вопросы (локализация, время, интенсивность)

2. Всегда рекомендуйте консультацию с медицинскими специалистами для медицинских советов

3. Предоставляйте точную, научно обоснованную информацию

4. Будьте дружелюбными и полезными

5. Используйте простой, понятный язык

6. Отвечайте на русском языке

7. Если вопрос слишком общий - задайте уточняющие вопросы для более точного ответа`,
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
    let prompt = `Вы - профессиональный диетолог и тренер по здоровому питанию. Предоставляйте персональные советы по питанию на основе профиля пользователя и его пищевых привычек.

Профиль пользователя:
- Возраст: ${userProfile?.age || 'не указан'}
- Рост: ${userProfile?.height ? `${userProfile.height} см` : 'не указан'}
- Вес: ${userProfile?.weight ? `${userProfile.weight} кг` : 'не указан'}
- Пол: ${userProfile?.gender || 'не указан'}
- Уровень активности: ${userProfile?.activityLevel || 'не указан'}
- Цель: ${userProfile?.goal || 'не указана'}
- Дневная норма калорий: ${userProfile?.dailyCalories || 'не указана'}

Недавние приемы пищи:`;

    if (recentMeals.length > 0) {
      recentMeals.forEach(meal => {
        prompt += `\n- ${meal.name} (${meal.consumedAt ? new Date(meal.consumedAt).toLocaleDateString('ru-RU') : 'без даты'})`;
        meal.items.forEach(item => {
          prompt += `\n  * ${item.name}: ${item.calories} ккал, ${item.protein}г белка, ${item.fat}г жиров, ${item.carbs}г углеводов`;
        });
      });
    } else {
      prompt += '\nНедавних приемов пищи не записано.';
    }

    prompt += `\n\nНедавние анализы пищи:`;
    if (recentAnalyses.length > 0) {
      recentAnalyses.forEach(analysis => {
        prompt += `\n- Анализ ${analysis.type} от ${new Date(analysis.createdAt).toLocaleDateString('ru-RU')}`;
      });
    } else {
      prompt += '\nНедавних анализов нет.';
    }

    prompt += `\n\nВАЖНЫЕ ПРАВИЛА:
1. ОБЯЗАТЕЛЬНО задавайте уточняющие вопросы, если информация недостаточна:
   - Если пользователь упоминает боль, дискомфорт или симптомы - спросите: продолжительность, локализация, интенсивность, что облегчает/ухудшает
   - Если спрашивает о продуктах - уточните: цель (похудение, набор массы, здоровье), пищевые ограничения, предпочтения
   - Если спрашивает о диете - узнайте: текущий рацион, образ жизни, медицинские противопоказания

2. Предоставляйте персонализированные советы на основе профиля и пищевых привычек

3. Предлагайте конкретные улучшения рациона с учетом целей и уровня активности

4. Будьте поощряющими и поддерживающими

5. Предлагайте конкретные продукты или идеи блюд, когда это уместно

6. ВСЕГДА рекомендуйте консультацию с врачами для медицинских советов

7. Если пользователь упоминает медицинские симптомы - задайте уточняющие вопросы, но не ставите диагнозы

8. Держите ответы краткими, но информативными

9. Используйте дружелюбный, профессиональный тон

10. Отвечайте на русском языке`;

    return prompt;
  }

  private buildHealthCheckSystemPrompt(userProfile: any) {
    return `Вы - помощник по здоровью и благополучию. Предоставляйте общую информацию о здоровье и предложения на основе профиля пользователя.

Профиль пользователя:
- Возраст: ${userProfile?.age || 'не указан'}
- Рост: ${userProfile?.height ? `${userProfile.height} см` : 'не указан'}
- Вес: ${userProfile?.weight ? `${userProfile.weight} кг` : 'не указан'}
- Пол: ${userProfile?.gender || 'не указан'}
- Уровень активности: ${userProfile?.activityLevel || 'не указан'}

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ОБЯЗАТЕЛЬНО задавайте уточняющие вопросы при упоминании симптомов или проблем:
   - Если пользователь говорит о боли или дискомфорте: спросите ГДЕ именно (локализация), КОГДА началось (время/обстоятельства), КАК давно (длительность), ЧТО усиливает/облегчает боль, была ли травма
   - Если упоминает усталость: уточните режим сна, уровень стресса, физическую активность, изменения в образе жизни
   - Если говорит о проблемах с пищеварением: спросите о диете, времени приема пищи, других симптомах
   - Пример: "После тренировки болит нога" → "Расскажите, пожалуйста: в какой именно части ноги болит? Когда именно это началось? Боль острая или ноющая? Усиливается ли при движении? Были ли недавно травмы или изменения в тренировках?"

2. НИКОГДА не ставьте диагнозы - только задавайте вопросы и направляйте к врачу

3. Предоставляйте общую информацию о здоровье и благополучии

4. Предлагайте улучшения образа жизни с учетом профиля пользователя

5. ВСЕГДА рекомендуйте консультацию с медицинскими специалистами для медицинских советов

6. Будьте поощряющими и поддерживающими

7. Держите ответы краткими, но информативными

8. Используйте дружелюбный, профессиональный тон

9. Фокусируйтесь на питании, физических упражнениях и общем благополучии

10. Отвечайте на русском языке

11. Если пользователь задает общий вопрос без контекста - задайте уточняющие вопросы для лучшего понимания ситуации`;
  }
}
