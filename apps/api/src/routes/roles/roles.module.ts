import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { RolesController } from './roles.controller';
import { RolesRepository } from './roles.repo';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  imports: [SharedModule],
})
export class RolesModule {}
