import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FoodProcessor } from '../food/food.processor';
import { PrismaModule } from '../prisma.module';
import { FoodAnalyzerModule } from '../food/food-analyzer/food-analyzer.module';

@Module({
  imports: [
    PrismaModule,
    FoodAnalyzerModule,
    BullModule.registerQueue({
      name: 'food-analysis',
    }),
  ],
  providers: [FoodProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
