import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FoodProcessor } from '../food/food.processor';
import { PrismaModule } from '../prisma.module';
import { FoodAnalyzerModule } from '../food/food-analyzer/food-analyzer.module';
import { AnalysisModule } from '../src/analysis/analysis.module';
import { MealsModule } from '../meals/meals.module';

@Module({
  imports: [
    PrismaModule,
    FoodAnalyzerModule,
    AnalysisModule,
    MealsModule,
    BullModule.registerQueue({
      name: 'food-analysis',
    }),
  ],
  providers: [FoodProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
