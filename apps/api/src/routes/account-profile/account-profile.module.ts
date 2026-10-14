import { Module } from '@nestjs/common';
import {
  ClientProfileController,
  FavoriteFreelancerController,
  FollowingFreelancerController,
  IdentityVerificationController,
  SocialLinkController,
} from './account-profile.controller';
import { AccountProfileRepository } from './account-profile.repo';
import { AccountProfileService } from './account-profile.service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [
    IdentityVerificationController,
    ClientProfileController,
    SocialLinkController,
    FavoriteFreelancerController,
    FollowingFreelancerController,
  ],
  providers: [AccountProfileRepository, AccountProfileService],
})
export class AccountProfileModule {}
