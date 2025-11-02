import { SetMetadata } from '@nestjs/common';
import { DailyLimitOptions, DAILY_LIMIT_KEY } from './daily-limit.guard';

export const DailyLimit = (options: DailyLimitOptions) =>
  SetMetadata(DAILY_LIMIT_KEY, options);

