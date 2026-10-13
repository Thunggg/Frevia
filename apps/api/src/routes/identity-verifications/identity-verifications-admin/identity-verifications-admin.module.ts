import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { IdentityVerificationsAdminController } from './identity-verifications-admin.controller';
import { IdentityVerificationsAdminRepository } from './identity-verifications-admin.repo';
import { IdentityVerificationsAdminService } from './identity-verifications-admin.service';

@Module({
  controllers: [IdentityVerificationsAdminController],
  providers: [
    IdentityVerificationsAdminService,
    IdentityVerificationsAdminRepository,
  ],
  imports: [SharedModule],
  exports: [IdentityVerificationsAdminService],
})
export class IdentityVerificationsAdminModule {}
