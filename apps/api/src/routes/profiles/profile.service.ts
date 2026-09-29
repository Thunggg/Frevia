import { Injectable } from '@nestjs/common';
import { ProfileRepository } from './profile.repo';
import {
  UpdateFreelancerProfileDto,
  AddFreelancerSkillDto,
} from './profile.dto';
import {
  FreelancerProfileNotFoundException,
  FreelancerSkillsNotFoundException,
  FreelancerSkillNotFoundException,
  FreelancerSkillDuplicateException,
  ProfileForbiddenException,
  SkillForbiddenException,
} from './profile.error';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async viewProfile(profileId: number) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (!profile) {
      throw FreelancerProfileNotFoundException();
    }
    return profile;
  }

  async updateProfile(
    profileId: number,
    currentUserId: number,
    dto: UpdateFreelancerProfileDto,
  ) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (!profile) {
      throw FreelancerProfileNotFoundException();
    }

    if (profile.userId !== currentUserId) {
      throw ProfileForbiddenException();
    }

    return this.profileRepository.updateFreelancerProfile(profileId, {
      displayName: dto.displayName,
      title: dto.title,
      bio: dto.bio,
      availabilityStatus: dto.availabilityStatus,
      education: dto.education,
      certifications: dto.certifications,
      languages: dto.languages,
    });
  }

  async getSkills(profileId: number) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (!profile) {
      throw FreelancerProfileNotFoundException();
    }

    const skills =
      await this.profileRepository.findSkillsByProfileId(profileId);
    if (skills.length === 0) {
      throw FreelancerSkillsNotFoundException();
    }
    return skills;
  }

  async addSkill(
    profileId: number,
    currentUserId: number,
    dto: AddFreelancerSkillDto,
  ) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (!profile) {
      throw FreelancerProfileNotFoundException();
    }

    if (profile.userId !== currentUserId) {
      throw ProfileForbiddenException();
    }

    const existingSkill =
      await this.profileRepository.findSkillByNameAndProfileId(
        profileId,
        dto.skillName,
      );
    if (existingSkill) {
      throw FreelancerSkillDuplicateException();
    }

    return this.profileRepository.addSkillToProfile(
      profileId,
      dto.skillName,
      dto.proficiencyLevel,
    );
  }

  async deleteSkill(skillId: number, currentUserId: number) {
    const skill = await this.profileRepository.findSkillById(skillId);
    if (!skill) {
      throw FreelancerSkillNotFoundException();
    }

    if (skill.freelancerProfile.profile.userId !== currentUserId) {
      throw SkillForbiddenException();
    }

    await this.profileRepository.deleteSkill(skillId);
    return { message: 'Skill removed successfully.' };
  }
}
