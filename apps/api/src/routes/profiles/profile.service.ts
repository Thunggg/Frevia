import { Injectable, HttpException } from '@nestjs/common';
import { ProfileRepository } from './profile.repo';
import {
  FreelancerProfileNotFoundException,
  FailedToLoadProfileException,
} from './profile.error';
import { RoleName } from '@shared/types';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getFreelancerProfile(profileId: number) {
    try {
      const profile =
        await this.profileRepository.findFreelancerProfileById(profileId);
      if (!profile) {
        throw FreelancerProfileNotFoundException();
      }

      const isFreelancer = profile.user.userRoles.some(
        (ur) => ur.role.name === RoleName.FREELANCER,
      );
      if (!isFreelancer) {
        throw FreelancerProfileNotFoundException();
      }

      return profile;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadProfileException();
    }
  }
}
