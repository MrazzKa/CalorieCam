import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's meals
    const todayMeals = await this.prisma.meal.findMany({
      where: {
        userId,
        consumedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        items: true,
      },
    });

    // Calculate totals
    const totalCalories = todayMeals.reduce((sum, meal) => {
      return sum + meal.items.reduce((mealSum, item) => mealSum + item.calories, 0);
    }, 0);

    const totalProtein = todayMeals.reduce((sum, meal) => {
      return sum + meal.items.reduce((mealSum, item) => mealSum + item.protein, 0);
    }, 0);

    const totalFat = todayMeals.reduce((sum, meal) => {
      return sum + meal.items.reduce((mealSum, item) => mealSum + item.fat, 0);
    }, 0);

    const totalCarbs = todayMeals.reduce((sum, meal) => {
      return sum + meal.items.reduce((mealSum, item) => mealSum + item.carbs, 0);
    }, 0);

    return {
      today: {
        calories: totalCalories,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        meals: todayMeals.length,
      },
      goals: {
        calories: 2000, // Default goal
        protein: 150,
        fat: 65,
        carbs: 200,
      },
    };
  }

  async getNutritionStats(userId: string) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const meals = await this.prisma.meal.findMany({
      where: {
        userId,
        consumedAt: {
          gte: last30Days,
        },
      },
      include: {
        items: true,
      },
    });

    const dailyStats = meals.reduce((acc, meal) => {
      const date = meal.consumedAt?.toISOString().split('T')[0] || 'unknown';
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0, fat: 0, carbs: 0 };
      }
      
      meal.items.forEach(item => {
        acc[date].calories += item.calories;
        acc[date].protein += item.protein;
        acc[date].fat += item.fat;
        acc[date].carbs += item.carbs;
      });
      
      return acc;
    }, {} as Record<string, any>);

    return {
      dailyStats,
      average: {
        calories: Object.values(dailyStats).reduce((sum: number, day: any) => sum + day.calories, 0) / Object.keys(dailyStats).length || 0,
        protein: Object.values(dailyStats).reduce((sum: number, day: any) => sum + day.protein, 0) / Object.keys(dailyStats).length || 0,
        fat: Object.values(dailyStats).reduce((sum: number, day: any) => sum + day.fat, 0) / Object.keys(dailyStats).length || 0,
        carbs: Object.values(dailyStats).reduce((sum: number, day: any) => sum + day.carbs, 0) / Object.keys(dailyStats).length || 0,
      },
    };
  }

  async getProgressStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });

    const profile = user?.profile as any;
    
    return {
      weight: {
        current: profile?.weight || 0,
        target: profile?.targetWeight || 0,
        change: 0, // Would need historical data
      },
      goal: profile?.goal || 'MAINTENANCE',
      activityLevel: profile?.activityLevel || 'MODERATE',
    };
  }
}
