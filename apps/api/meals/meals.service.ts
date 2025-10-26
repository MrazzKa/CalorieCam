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
    const meal = await this.prisma.meal.create({
      data: {
        userId,
        ...createMealDto,
      },
      include: {
        items: true,
      },
    });

    return meal;
  }
}
