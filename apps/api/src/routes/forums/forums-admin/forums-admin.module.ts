import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { ForumAdminController } from './forums-admin.controller';
import { ForumAdminService } from './forums-admin.service';
import { ForumAdminRepository } from './forums-admin.repo';

@Module({
  controllers: [ForumAdminController],
  providers: [ForumAdminService, ForumAdminRepository],
  imports: [SharedModule],
})
export class ForumAdminModule {}
