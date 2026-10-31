import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ContractController } from './contract.controller';
import { ContractRepository } from './contract.repo';
import { ContractService } from './contract.service';

@Module({
  imports: [SharedModule],
  controllers: [ContractController],
  providers: [ContractService, ContractRepository],
})
export class ContractModule {}
