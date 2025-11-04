import { Module } from '@nestjs/common';
import { FdcIntegrationsController } from './fdc-integrations.controller';
import { HybridModule } from '../hybrid/hybrid.module';

@Module({
  imports: [HybridModule],
  controllers: [FdcIntegrationsController],
})
export class FdcIntegrationsModule {}

