import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ProfileRevisionModule } from '../profile-revisions/profile-revision.module';
import {
  AdminExpertProfileController,
  ExpertProfileController,
} from './expert-profile.controller';
import { ExpertProfileRepository } from './expert-profile.repo';
import { ExpertProfileService } from './expert-profile.service';
import { PublicExpertsController } from './public-experts.controller';
import { PublicExpertsService } from './public-experts.service';

@Module({
  imports: [SharedModule, ProfileRevisionModule],
  controllers: [
    ExpertProfileController,
    AdminExpertProfileController,
    PublicExpertsController,
  ],
  providers: [
    ExpertProfileRepository,
    ExpertProfileService,
    PublicExpertsService,
  ],
})
export class ExpertProfileModule {}
