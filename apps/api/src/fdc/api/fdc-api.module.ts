import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FdcApiService } from './fdc-api.service';
import { CacheModule } from '../../cache/cache.module';

@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.FDC_API_BASE || 'https://api.nal.usda.gov/fdc',
      timeout: 10000,
      headers: {
        'X-Api-Key': process.env.FDC_API_KEY || '',
      },
    }),
    CacheModule,
  ],
  providers: [FdcApiService],
  exports: [FdcApiService],
})
export class FdcApiModule {}

