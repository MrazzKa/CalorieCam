import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';
import { FoodProcessor } from './food.processor';
import { FoodAnalyzerModule } from './food-analyzer.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'food-analysis',
    }),
    FoodAnalyzerModule,
  ],
  controllers: [FoodController],
  providers: [FoodService, FoodProcessor],
  exports: [FoodService],
})
export class FoodModule {}
