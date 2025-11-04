import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { FdcSchedulerService } from './fdc-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'fdc-update',
    }),
  ],
  providers: [FdcSchedulerService],
})
export class FdcSchedulerModule {}

