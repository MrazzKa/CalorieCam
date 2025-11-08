import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PrismaModule } from '../prisma.module';
import { CacheModule } from '../src/cache/cache.module';
import { MeStatsController } from './me-stats.controller';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [StatsController, MeStatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
