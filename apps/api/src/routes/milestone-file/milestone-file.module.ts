import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { MilestoneFileController } from './milestone-file.controller';
import { MilestoneFileRepository } from './milestone-file.repo';
import { MilestoneFileService } from './milestone-file.service';

@Module({
  imports: [SharedModule],
  controllers: [MilestoneFileController],
  providers: [MilestoneFileService, MilestoneFileRepository],
})
export class MilestoneFileModule {}
