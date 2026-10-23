import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { JobCategoriesAdminController } from './job-categories-admin.controller';
import { JobCategoriesAdminRepository } from './job-categories-admin.repo';
import { JobCategoriesAdminService } from './job-categories-admin.service';

@Module({
  imports: [SharedModule],
  controllers: [JobCategoriesAdminController],
  providers: [JobCategoriesAdminService, JobCategoriesAdminRepository],
})
export class JobCategoriesAdminModule {}
