import { Module } from '@nestjs/common';

import { BrowseJobController } from './browse-job.controller';
import { BrowseJobRepository } from './browse-job.repo';
import { BrowseJobService } from './browse-job.service';

@Module({
  controllers: [BrowseJobController],
  providers: [BrowseJobService, BrowseJobRepository],
})
export class BrowseJobModule {}
