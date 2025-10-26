import { Module } from '@nestjs/common';
import { FoodService } from './food.service';
import { FoodController } from '../../food/food.controller';
import { PrismaModule } from '../../prisma.module';
import { BullModule } from '@nestjs/bull';
import { FoodAnalyzerModule } from '../../food/food-analyzer/food-analyzer.module';
import { MediaModule } from '../../media/media.module';
import { FoodProcessor } from '../../food/food.processor';
import { QueuesModule } from '../../queues/queues.module';

@Module({
  imports: [
    PrismaModule,
    FoodAnalyzerModule,
    MediaModule,
    QueuesModule,
    BullModule.registerQueue({
      name: 'food-analysis',
    }),
  ],
  providers: [FoodService, FoodProcessor],
  controllers: [FoodController],
  exports: [FoodService],
})
export class FoodModule {}