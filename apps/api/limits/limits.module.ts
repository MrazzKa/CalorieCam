import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { DailyLimitGuard } from './daily-limit.guard';

@Module({
  imports: [RedisModule],
  providers: [DailyLimitGuard],
  exports: [DailyLimitGuard],
})
export class LimitsModule {}

