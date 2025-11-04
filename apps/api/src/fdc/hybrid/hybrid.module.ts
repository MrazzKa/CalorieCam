import { Module } from '@nestjs/common';
import { HybridService } from './hybrid.service';
import { FdcApiModule } from '../api/fdc-api.module';
import { PrismaModule } from '../../../prisma.module';

@Module({
  imports: [FdcApiModule, PrismaModule],
  providers: [HybridService],
  exports: [HybridService],
})
export class HybridModule {}

