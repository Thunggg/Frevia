import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { MilestoneController } from './milestone.controller';
import { MilestoneRepository } from './milestone.repo';
import { MilestoneService } from './milestone.service';

@Module({
  imports: [SharedModule],
  controllers: [MilestoneController],
  providers: [MilestoneService, MilestoneRepository],
})
export class MilestoneModule {}
