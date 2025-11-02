import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyLimitGuard } from '../limits/daily-limit.guard';
import { DailyLimit } from '../limits/daily-limit.decorator';

@ApiTags('AI Assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, DailyLimitGuard)
@ApiBearerAuth()
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('nutrition-advice')
  @DailyLimit({ limit: 10, resource: 'chat' })
  @ApiOperation({ summary: 'Get personalized nutrition advice' })
  @ApiResponse({ status: 200, description: 'Nutrition advice provided' })
  async getNutritionAdvice(@Request() req, @Body() body: { question: string; context?: any }) {
    const userId = req.user.id;
    return this.aiAssistantService.getNutritionAdvice(userId, body.question, body.context);
  }

  @Post('health-check')
  @DailyLimit({ limit: 10, resource: 'chat' })
  @ApiOperation({ summary: 'Get health check advice' })
  @ApiResponse({ status: 200, description: 'Health check advice provided' })
  async getHealthCheck(@Request() req, @Body() body: { question: string }) {
    const userId = req.user.id;
    return this.aiAssistantService.getHealthCheck(userId, body.question);
  }

  @Post('general-question')
  @DailyLimit({ limit: 10, resource: 'chat' })
  @ApiOperation({ summary: 'Ask a general question' })
  @ApiResponse({ status: 200, description: 'General question answered' })
  async getGeneralQuestion(@Request() req, @Body() body: { question: string }) {
    const userId = req.user.id;
    return this.aiAssistantService.getGeneralQuestion(userId, body.question);
  }

  @Get('conversation-history')
  @ApiOperation({ summary: 'Get conversation history' })
  @ApiResponse({ status: 200, description: 'Conversation history retrieved' })
  async getConversationHistory(@Request() req) {
    const userId = req.user.id;
    return this.aiAssistantService.getConversationHistory(userId);
  }

  @Get('token-usage')
  @ApiOperation({ summary: 'Get OpenAI token usage statistics' })
  @ApiResponse({ status: 200, description: 'Token usage statistics retrieved' })
  async getTokenUsage(@Request() req, @Query('days') days?: number) {
    const userId = req.user.id;
    return this.aiAssistantService.getTokenUsageStats(userId, days ? parseInt(days.toString()) : 30);
  }
}
