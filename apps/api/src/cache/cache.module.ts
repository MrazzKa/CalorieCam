import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

@Module({
  imports: [RedisModule],
  controllers: [CacheController],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
