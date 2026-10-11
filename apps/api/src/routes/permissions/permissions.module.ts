import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsRepository } from './permissions.repo';
import { PermissionsService } from './permissions.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsRepository],
  imports: [SharedModule],
})
export class PermissionsModule {}
