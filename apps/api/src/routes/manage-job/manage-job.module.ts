import { Module } from '@nestjs/common';

import { ManageJobController } from './manage-job.controller';
import { ManageJobRepository } from './manage-job.repo';
import { ManageJobService } from './manage-job.service';
import { JobAutomationService } from './job-automation.service';
import { SharedModule } from '../../shared/shared.module';
import { RecommendationModule } from '../recommendations/recommendation.module';

@Module({
  imports: [SharedModule, RecommendationModule],
  controllers: [ManageJobController],
  providers: [ManageJobRepository, ManageJobService, JobAutomationService],
})
export class ManageJobModule {}
