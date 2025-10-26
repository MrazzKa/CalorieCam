import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@ApiTags('Statistics')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats(@Request() req) {
    return this.statsService.getDashboardStats(req.user.id);
  }

  @Get('nutrition')
  @ApiOperation({ summary: 'Get nutrition statistics' })
  @ApiResponse({ status: 200, description: 'Nutrition statistics retrieved successfully' })
  async getNutritionStats(@Request() req) {
    return this.statsService.getNutritionStats(req.user.id);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get progress statistics' })
  @ApiResponse({ status: 200, description: 'Progress statistics retrieved successfully' })
  async getProgressStats(@Request() req) {
    return this.statsService.getProgressStats(req.user.id);
  }
}
