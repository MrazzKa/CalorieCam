import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { FoodProcessor } from '../food/food.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'food-analysis',
    }),
  ],
  providers: [FoodProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
