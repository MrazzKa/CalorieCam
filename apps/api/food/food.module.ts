import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { FoodAnalyzerModule } from './food-analyzer/food-analyzer.module';
import { AnalysisModule } from '../src/analysis/analysis.module';
import { PrismaModule } from '../prisma.module';
import { RedisModule } from '../redis/redis.module';
import { LimitsModule } from '../limits/limits.module';
import { MealsModule } from '../meals/meals.module';
import { MediaModule } from '../media/media.module';

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
    MealsModule,
    MediaModule,
  ],
  controllers: [FoodController],
  providers: [FoodService],
  exports: [FoodService],
})
export class FoodModule {}
