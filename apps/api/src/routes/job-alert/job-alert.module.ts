import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { JobAlertController } from './job-alert.controller';
import { JobAlertRepository } from './job-alert.repo';
import { JobAlertService } from './job-alert.service';

@Module({
  imports: [SharedModule],
  controllers: [JobAlertController],
  providers: [JobAlertRepository, JobAlertService],
})
export class JobAlertModule {}
