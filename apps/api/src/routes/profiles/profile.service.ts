import { Injectable } from '@nestjs/common';
import {
  type AddFreelancerSkillType,
  RoleName,
  type UpdateFreelancerProfileType,
} from '@shared/types';
import { ProfileRepository } from './profile.repo';
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';
import {
  FreelancerProfileNotFoundException,
  FreelancerSkillNotFoundException,
  FreelancerSkillDuplicateException,
  ProfileForbiddenException,
  SkillForbiddenException,
} from './profile.error';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly profileRevisionService: ProfileRevisionService,
  ) {}

  async viewProfile(profileId: number) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (
      !profile ||
      !profile.user.userRoles.some(
        (userRole) => userRole.role.name === RoleName.FREELANCER,
      )
    ) {
      throw FreelancerProfileNotFoundException();
    }
    return profile;
  }

  async updateProfile(
    profileId: number,
    currentUserId: number,
    dto: UpdateFreelancerProfileType,
  ) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (
      !profile ||
      !profile.user.userRoles.some(
        (userRole) => userRole.role.name === RoleName.FREELANCER,
      )
    ) {
      throw FreelancerProfileNotFoundException();
    }

    if (profile.userId !== currentUserId) {
      throw ProfileForbiddenException();
    }

    const update = {
      displayName: dto.displayName,
      title: dto.title,
      bio: dto.bio,
      availabilityStatus: dto.availabilityStatus,
      education: dto.education,
      certifications: dto.certifications,
      languages: dto.languages,
    };

    if (
      this.profileRevisionService.requiresManualReview(
        profile.profileCompletionPercent,
      )
    ) {
      return this.profileRevisionService.submitFreelancer(
        currentUserId,
        profile.id,
        update,
        profile.profileCompletionPercent,
      );
    }

    const updated = await this.profileRepository.updateFreelancerProfile(
      profile.id,
      update,
    );
    return this.profileRevisionService.directUpdateResult(
      updated?.profileCompletionPercent ?? profile.profileCompletionPercent,
    );
  }

  async getSkills(profileId: number) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (
      !profile ||
      !profile.user.userRoles.some(
        (userRole) => userRole.role.name === RoleName.FREELANCER,
      )
    ) {
      throw FreelancerProfileNotFoundException();
    }

    return this.profileRepository.findSkillsByProfileId(profileId);
  }

  async searchSkillSuggestions(search?: string) {
    return this.profileRepository.searchActiveCatalogSkills(search?.trim());
  }

  async addSkill(
    profileId: number,
    currentUserId: number,
    dto: AddFreelancerSkillType,
  ) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (
      !profile ||
      !profile.user.userRoles.some(
        (userRole) => userRole.role.name === RoleName.FREELANCER,
      )
    ) {
      throw FreelancerProfileNotFoundException();
    }

    if (profile.userId !== currentUserId) {
      throw ProfileForbiddenException();
    }

    // Chuẩn hoá về skill trong catalog: kỹ năng gõ tự do chưa tồn tại sẽ được tạo mới
    const catalogSkill = await this.profileRepository.findOrCreateCatalogSkill(
      dto.skillName,
    );

    const existingSkill =
      await this.profileRepository.findSkillByProfileIdAndSkillId(
        profileId,
        catalogSkill.id,
      );
    if (existingSkill) {
      throw FreelancerSkillDuplicateException();
    }

    return this.profileRepository.addSkillToProfile(
      profileId,
      catalogSkill.id,
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

    return this.profileRepository.deleteSkill(skillId);
  }
}
