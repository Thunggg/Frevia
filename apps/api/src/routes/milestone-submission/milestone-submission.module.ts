import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { MilestoneSubmissionController } from './milestone-submission.controller';
import { MilestoneSubmissionRepository } from './milestone-submission.repo';
import { MilestoneSubmissionService } from './milestone-submission.service';
import { PaymentModule } from '../payments/payment.module';

@Module({
  imports: [SharedModule, PaymentModule],
  controllers: [MilestoneSubmissionController],
  providers: [MilestoneSubmissionService, MilestoneSubmissionRepository],
})
export class MilestoneSubmissionModule {}
