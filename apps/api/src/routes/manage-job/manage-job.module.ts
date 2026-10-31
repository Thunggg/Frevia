import { Module } from '@nestjs/common';

import { ManageJobController } from './manage-job.controller';
import { ManageJobRepository } from './manage-job.repo';
import { ManageJobService } from './manage-job.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ManageJobController],
  providers: [ManageJobRepository, ManageJobService],
})
export class ManageJobModule {}
