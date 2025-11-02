import { Module } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';
import { PrismaModule } from '../prisma.module';
import { RedisModule } from '../redis/redis.module';
import { LimitsModule } from '../limits/limits.module';

@Module({
  imports: [PrismaModule, RedisModule, LimitsModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
