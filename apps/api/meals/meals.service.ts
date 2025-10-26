import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMealDto } from './dto';

@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMeals(userId: string) {
    const meals = await this.prisma.meal.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return meals;
  }

  async createMeal(userId: string, createMealDto: CreateMealDto) {
    const { items, ...mealData } = createMealDto;
    
    const meal = await this.prisma.meal.create({
      data: {
        userId,
        ...mealData,
        items: {
          create: items.map(item => ({
            name: item.name || 'Unknown',
            calories: item.calories || 0,
            protein: item.protein || 0,
            fat: item.fat || 0,
            carbs: item.carbs || 0,
            weight: item.weight || 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return meal;
  }
}
