import { Controller, Post, Body, Get, Param, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyLimitGuard } from '../limits/daily-limit.guard';
import { DailyLimit } from '../limits/daily-limit.decorator';
import { FoodService } from './food.service';
import { AnalyzeImageDto, AnalyzeTextDto } from './dto';

@ApiTags('Food Analysis')
@Controller('food')
@UseGuards(JwtAuthGuard, DailyLimitGuard)
@ApiBearerAuth()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: undefined, // Use memory storage (default)
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @DailyLimit({ resource: 'food' }) // Uses FREE_DAILY_ANALYSES or PRO_DAILY_ANALYSES from env
  @ApiOperation({ summary: 'Analyze food image' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  @ApiConsumes('multipart/form-data')
  async analyzeImage(
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.foodService.analyzeImage(file, userId);
  }

  @Post('analyze-text')
  @ApiOperation({ summary: 'Analyze food description' })
  @ApiResponse({ status: 200, description: 'Text analysis completed successfully' })
  async analyzeText(
    @Body() analyzeTextDto: AnalyzeTextDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.foodService.analyzeText(analyzeTextDto.description, userId);
  }

  @Get('analysis/:analysisId/status')
  @ApiOperation({ summary: 'Get analysis status' })
  @ApiResponse({ status: 200, description: 'Analysis status retrieved' })
  async getAnalysisStatus(
    @Param('analysisId') analysisId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.foodService.getAnalysisStatus(analysisId, userId);
  }

  @Get('analysis/:analysisId/result')
  @ApiOperation({ summary: 'Get analysis result' })
  @ApiResponse({ status: 200, description: 'Analysis result retrieved' })
  async getAnalysisResult(
    @Param('analysisId') analysisId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    return this.foodService.getAnalysisResult(analysisId, userId);
  }
}
