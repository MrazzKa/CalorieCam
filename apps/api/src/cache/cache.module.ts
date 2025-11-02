import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { RedisCacheService } from './redis-cache.service';
import { CacheController } from './cache.controller';

@Module({
  imports: [RedisModule],
  controllers: [CacheController],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
