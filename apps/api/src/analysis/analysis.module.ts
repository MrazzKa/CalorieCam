import { Module } from '@nestjs/common';
import { VisionService } from './vision.service';
import { PortionService } from './portion.service';
import { AnalyzeService } from './analyze.service';
import { HybridModule } from '../fdc/hybrid/hybrid.module';
import { PrismaModule } from '../../prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [HybridModule, PrismaModule, RedisModule],
  providers: [VisionService, PortionService, AnalyzeService],
  exports: [AnalyzeService, VisionService],
})
export class AnalysisModule {}

