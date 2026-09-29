import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { ForumReportController } from './forums-reports.controller';
import { ForumReportService } from './forums-reports.service';
import { ForumReportRepository } from './forums-reports.repo';

@Module({
  controllers: [ForumReportController],
  providers: [ForumReportService, ForumReportRepository],
  imports: [SharedModule],
})
export class ForumReportModule {}
