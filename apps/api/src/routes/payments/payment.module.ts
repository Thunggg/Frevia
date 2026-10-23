import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repo';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [SharedModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, StripeService],
  exports: [PaymentService, PaymentRepository, StripeService],
})
export class PaymentModule {}
