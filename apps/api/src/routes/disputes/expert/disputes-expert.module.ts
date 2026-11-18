import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { PaymentModule } from '../../payments/payment.module';
import { DisputesExpertController } from './disputes-expert.controller';
import { DisputesExpertRepository } from './disputes-expert.repo';
import { DisputesExpertService } from './disputes-expert.service';

@Module({
  imports: [SharedModule, PaymentModule],
  controllers: [DisputesExpertController],
  providers: [DisputesExpertService, DisputesExpertRepository],
  exports: [DisputesExpertService, DisputesExpertRepository],
})
export class DisputesExpertModule { }
