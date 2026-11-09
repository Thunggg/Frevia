import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PaymentModule } from '../payments/payment.module';
import { ContractController } from './contract.controller';
import { ContractRepository } from './contract.repo';
import { ContractService } from './contract.service';

@Module({
  imports: [SharedModule, PaymentModule],
  controllers: [ContractController],
  providers: [ContractService, ContractRepository],
})
export class ContractModule {}
