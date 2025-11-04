import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { FoodProcessor } from './food.processor';
import { FoodAnalyzerModule } from './food-analyzer/food-analyzer.module';
import { AnalysisModule } from '../src/analysis/analysis.module';
import { PrismaModule } from '../prisma.module';
import { RedisModule } from '../redis/redis.module';
import { LimitsModule } from '../limits/limits.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'food-analysis',
    }),
    FoodAnalyzerModule,
    AnalysisModule,
    RedisModule,
    LimitsModule,
  ],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
