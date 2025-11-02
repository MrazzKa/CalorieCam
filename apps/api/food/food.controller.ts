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
  @DailyLimit({ limit: 5, resource: 'food' })
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
    console.log('[FoodController] File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length || 0,
      isBuffer: Buffer.isBuffer(file.buffer),
    });
    return this.foodService.analyzeImage(file, req.user.id);
  }

  @Post('analyze-text')
  @ApiOperation({ summary: 'Analyze food description' })
  @ApiResponse({ status: 200, description: 'Text analysis completed successfully' })
  async analyzeText(
    @Body() analyzeTextDto: AnalyzeTextDto,
    @Request() req: any,
  ) {
    return this.foodService.analyzeText(analyzeTextDto.description, req.user.id);
  }

  @Get('analysis/:analysisId/status')
  @ApiOperation({ summary: 'Get analysis status' })
  @ApiResponse({ status: 200, description: 'Analysis status retrieved' })
  async getAnalysisStatus(
    @Param('analysisId') analysisId: string,
    @Request() req: any,
  ) {
    return this.foodService.getAnalysisStatus(analysisId, req.user.id);
  }

  @Get('analysis/:analysisId/result')
  @ApiOperation({ summary: 'Get analysis result' })
  @ApiResponse({ status: 200, description: 'Analysis result retrieved' })
  async getAnalysisResult(
    @Param('analysisId') analysisId: string,
    @Request() req: any,
  ) {
    return this.foodService.getAnalysisResult(analysisId, req.user.id);
  }
}
