import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import {
  ProfileRevisionAdminController,
  ProfileRevisionController,
} from './profile-revision.controller';
import { ProfileRevisionRepository } from './profile-revision.repo';
import { ProfileRevisionService } from './profile-revision.service';

@Module({
  imports: [SharedModule],
  controllers: [ProfileRevisionController, ProfileRevisionAdminController],
  providers: [ProfileRevisionRepository, ProfileRevisionService],
  exports: [ProfileRevisionService],
})
export class ProfileRevisionModule {}
