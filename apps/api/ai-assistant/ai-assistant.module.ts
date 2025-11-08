import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaModule } from '../prisma.module';
import { CacheModule } from '../src/cache/cache.module';
import { AssistantOrchestratorService } from './assistant-orchestrator.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, AssistantOrchestratorService],
  exports: [AiAssistantService, AssistantOrchestratorService],
})
export class AiAssistantModule {}
