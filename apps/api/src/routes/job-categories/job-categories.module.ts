import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { JobCategoriesController } from './job-categories.controller';
import { JobCategoriesRepository } from './job-categories.repo';
import { JobCategoriesService } from './job-categories.service';

@Module({
  imports: [SharedModule],
  controllers: [JobCategoriesController],
  providers: [JobCategoriesService, JobCategoriesRepository],
})
export class JobCategoriesModule {}
