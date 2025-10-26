import { Controller, Post, Body, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoodService } from './food.service';
import { AnalyzeImageDto, AnalyzeTextDto } from './dto';

@ApiTags('Food Analysis')
@Controller('food')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Analyze food image' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  @ApiConsumes('multipart/form-data')
  async analyzeImage(
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
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
}
