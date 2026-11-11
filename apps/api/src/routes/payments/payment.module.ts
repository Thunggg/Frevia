import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PaymentAutomationService } from './payment-automation.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repo';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [SharedModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
    StripeService,
    PaymentAutomationService,
  ],
  exports: [
    PaymentService,
    PaymentRepository,
    StripeService,
    PaymentAutomationService,
  ],
})
export class PaymentModule {}
