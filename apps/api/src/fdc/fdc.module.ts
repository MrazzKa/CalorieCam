import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FdcService } from './fdc.service';
import { FdcController } from './fdc.controller';
import { PrismaModule } from '../../prisma.module';
import { FtsService } from './fts/fts.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    HttpModule.register({
      baseURL: process.env.FDC_API_BASE || 'https://api.nal.usda.gov/fdc',
      timeout: 10000,
      headers: {
        'X-Api-Key': process.env.FDC_API_KEY || '',
      },
    }),
    PrismaModule,
    CacheModule,
  ],
  providers: [FdcService, FtsService],
  controllers: [FdcController],
  exports: [FdcService],
})
export class FdcModule {}

