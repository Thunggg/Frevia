import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { DisputeAdminController } from './dispute.admin.controller';
import { DisputeController } from './dispute.controller';
import { DisputeRepository } from './dispute.repo';
import { DisputeService } from './dispute.service';

@Module({
  imports: [SharedModule],
  controllers: [DisputeController, DisputeAdminController],
  providers: [DisputeService, DisputeRepository],
  exports: [DisputeService, DisputeRepository],
})
export class DisputeModule {}
