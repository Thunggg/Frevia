import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { BrowseJobController } from './browse-job.controller';
import { BrowseJobRepository } from './browse-job.repo';
import { BrowseJobService } from './browse-job.service';

@Module({
  imports: [SharedModule],
  controllers: [BrowseJobController],
  providers: [BrowseJobService, BrowseJobRepository],
})
export class BrowseJobModule {}
