import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@ApiTags('Statistics')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get personal meal statistics for the selected range' })
  @ApiResponse({ status: 200, description: 'Aggregated stats returned successfully' })
  async getPersonalStats(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statsService.getPersonalStats(req.user.id, from, to);
  }
}

