import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto';

@ApiTags('Meals')
@Controller('meals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user meals' })
  @ApiResponse({ status: 200, description: 'Meals retrieved successfully' })
  async getMeals(@Request() req) {
    return this.mealsService.getMeals(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new meal' })
  @ApiResponse({ status: 201, description: 'Meal created successfully' })
  async createMeal(
    @Body() createMealDto: CreateMealDto,
    @Request() req,
  ) {
    return this.mealsService.createMeal(req.user.id, createMealDto);
  }
}
