import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMealDto, UpdateMealItemDto } from './dto';

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

  async updateMeal(userId: string, mealId: string, updateMealDto: Partial<CreateMealDto>) {
    // Verify meal belongs to user
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
    });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    const { items, ...mealData } = updateMealDto;

    const updateData: any = { ...mealData };

    if (items) {
      // Delete existing items and create new ones
      await this.prisma.mealItem.deleteMany({
        where: { mealId },
      });

      updateData.items = {
        create: items.map(item => ({
          name: item.name || 'Unknown',
          calories: item.calories || 0,
          protein: item.protein || 0,
          fat: item.fat || 0,
          carbs: item.carbs || 0,
          weight: item.weight || 0,
        })),
      };
    }

    return this.prisma.meal.update({
      where: { id: mealId },
      data: updateData,
      include: { items: true },
    });
  }

  async deleteMeal(userId: string, mealId: string) {
    // Verify meal belongs to user
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
    });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    await this.prisma.meal.delete({
      where: { id: mealId },
    });

    return { message: 'Meal deleted successfully' };
  }

  async updateMealItem(userId: string, mealId: string, itemId: string, updateItemDto: UpdateMealItemDto) {
    // Verify meal belongs to user
    const meal = await this.prisma.meal.findFirst({
      where: { id: mealId, userId },
      include: { items: true },
    });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    // Verify item belongs to meal
    const item = meal.items.find(i => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Meal item not found');
    }

    // Update the item
    return this.prisma.mealItem.update({
      where: { id: itemId },
      data: updateItemDto,
    });
  }
}
