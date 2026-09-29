import { Injectable, HttpException } from '@nestjs/common';
import { UpdateFreelancerProfileType } from '@shared/types';
import { ProfileRepository } from './profile.repo';
import {
  FreelancerProfileNotFoundException,
  ProfileForbiddenException,
  FailedToLoadProfileException,
  FailedToUpdateProfileException,
  FreelancerSkillsNotFoundException,
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

  async updateFreelancerProfile(
    profileId: number,
    currentUserId: number,
    data: UpdateFreelancerProfileType,
  ) {
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

      if (profile.userId !== currentUserId) {
        throw ProfileForbiddenException();
      }

      return await this.profileRepository.updateFreelancerProfile(
        profileId,
        data,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateProfileException();
    }
  }

  async getFreelancerSkills(profileId: number) {
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

      const skills =
        await this.profileRepository.findSkillsByProfileId(profileId);
      if (!skills || skills.length === 0) {
        throw FreelancerSkillsNotFoundException();
      }

      return skills;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadProfileException();
    }
  }
}
