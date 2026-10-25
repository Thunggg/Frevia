import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PaymentModule } from '../payments/payment.module';
import { DisputeAdminController } from './dispute.admin.controller';
import { DisputeController } from './dispute.controller';
import { DisputeExpertController } from './dispute.expert.controller';
import { DisputeRepository } from './dispute.repo';
import { DisputeService } from './dispute.service';

@Module({
  imports: [SharedModule, PaymentModule],
  controllers: [
    DisputeController,
    DisputeAdminController,
    DisputeExpertController,
  ],
  providers: [DisputeService, DisputeRepository],
  exports: [DisputeService, DisputeRepository],
})
export class DisputeModule {}
