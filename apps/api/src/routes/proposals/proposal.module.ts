import { Module } from '@nestjs/common';

import { SharedModule } from '../../shared/shared.module';
import { ProposalController } from './proposal.controller';
import { ProposalRepository } from './proposal.repo';
import { ProposalService } from './proposal.service';

@Module({
  imports: [SharedModule],
  controllers: [ProposalController],
  providers: [ProposalService, ProposalRepository],
})
export class ProposalModule {}
