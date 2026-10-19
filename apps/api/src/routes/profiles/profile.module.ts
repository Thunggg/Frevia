import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repo';
import { SharedModule } from '../../shared/shared.module';
import { ProfileRevisionModule } from '../profile-revisions/profile-revision.module';

@Module({
  imports: [SharedModule, ProfileRevisionModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository],
  exports: [ProfileService, ProfileRepository],
})
export class ProfilesModule {}
