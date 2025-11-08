import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(
    private readonly assistantService: AiAssistantService,
    private readonly orchestrator: AssistantOrchestratorService,
  ) {}

  @Get('flows')
  listFlows() {
    return this.orchestrator.listFlows();
  }

  @Post('session')
  async createSession(
    @Body('flowId') flowId: string,
    @Body('userId') userId: string,
    @Body('resume') resume?: boolean,
  ) {
    if (!flowId || !userId) {
      throw new BadRequestException('flowId and userId are required');
    }
    const response = await this.orchestrator.startSession(flowId, userId, resume ?? true);
    if (response.complete && response.summary) {
      await this.assistantService.logFlowCompletion(userId, response.flowId, response.summary, response.collected);
    }
    return response;
  }

  @Get('session/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    const response = await this.orchestrator.resumeSession(sessionId);
    if (!response) {
      throw new NotFoundException('Session not found');
    }
    return response;
  }

  @Post('step')
  async submitStep(
    @Body('sessionId') sessionId: string,
    @Body('userId') userId: string,
    @Body('input') input: string,
  ) {
    if (!sessionId || !userId) {
      throw new BadRequestException('sessionId and userId are required');
    }
    const response = await this.orchestrator.submitStep(sessionId, userId, input);
    if (response.complete && response.summary) {
      await this.assistantService.logFlowCompletion(userId, response.flowId, response.summary, response.collected);
    }
    return response;
  }

  @Delete('session/:sessionId')
  async cancelSession(
    @Param('sessionId') sessionId: string,
    @Query('userId') userIdQuery?: string,
    @Body('userId') userIdBody?: string,
  ) {
    const userId = userIdQuery ?? userIdBody;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    await this.orchestrator.cancelSession(sessionId, userId);
    return { status: 'cancelled' };
  }

  @Post('flows/:flowId/start')
  async startFlow(@Param('flowId') flowId: string, @Body('userId') userId: string) {
    const response = await this.orchestrator.startSession(flowId, userId, true);
    if (response.complete && response.summary) {
      await this.assistantService.logFlowCompletion(userId, response.flowId, response.summary, response.collected);
    }
    return response;
  }

  @Post('flows/:flowId/step')
  async respondToFlow(
    @Param('flowId') flowId: string,
    @Body('userId') userId: string,
    @Body('input') input: string,
  ) {
    const response = await this.orchestrator.submitStepForFlow(flowId, userId, input);
    if (response.complete && response.summary) {
      await this.assistantService.logFlowCompletion(userId, response.flowId, response.summary, response.collected);
    }
    return response;
  }

  @Post('flows/:flowId/cancel')
  async cancelFlow(@Param('flowId') flowId: string, @Body('userId') userId: string) {
    await this.orchestrator.cancelActiveFlow(flowId, userId);
    return { status: 'cancelled' };
  }

  @Post('nutrition-advice')
  getNutritionAdvice(@Body('userId') userId: string, @Body('question') question: string, @Body('context') context?: any) {
    return this.assistantService.getNutritionAdvice(userId, question, context);
  }

  @Post('health-check')
  getHealthCheck(@Body('userId') userId: string, @Body('question') question: string) {
    return this.assistantService.getHealthCheck(userId, question);
  }

  @Post('general-question')
  getGeneralQuestion(@Body('userId') userId: string, @Body('question') question: string) {
    return this.assistantService.getGeneralQuestion(userId, question);
  }

  @Get('conversation-history')
  getConversationHistory(@Query('userId') userId: string, @Query('limit') limit?: string) {
    return this.assistantService.getConversationHistory(userId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('token-usage')
  getTokenUsage(@Query('userId') userId: string, @Query('days') days?: string) {
    return this.assistantService.getTokenUsageStats(userId, days ? parseInt(days, 10) : 30);
  }
}
