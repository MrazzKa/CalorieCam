import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FdcService } from './fdc.service';
import { FdcController } from './fdc.controller';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.FDC_API_BASE || 'https://api.nal.usda.gov/fdc',
      timeout: 10000,
      headers: {
        'X-Api-Key': process.env.FDC_API_KEY || '',
      },
    }),
    RedisModule,
  ],
  providers: [FdcService],
  controllers: [FdcController],
  exports: [FdcService],
})
export class FdcModule {}

