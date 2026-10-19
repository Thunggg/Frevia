import { Injectable } from '@nestjs/common';
import {
  type AddFreelancerSkillType,
  RoleName,
  type UpdateFreelancerProfileType,
} from '@shared/types';
import { ProfileRepository } from './profile.repo';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import {
  FreelancerProfileNotFoundException,
  FreelancerSkillNotFoundException,
  FreelancerSkillDuplicateException,
  ProfileForbiddenException,
  SkillForbiddenException,
  CvFileInvalidException,
  CvFileRequiredException,
  CvNotFoundException,
} from './profile.error';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async getOwnedFreelancerProfile(profileId: number, userId: number) {
    const profile =
      await this.profileRepository.findFreelancerProfileById(profileId);
    if (
      !profile ||
      !profile.user.userRoles.some(
        (item) => item.role.name === RoleName.FREELANCER,
      )
    ) {
      throw FreelancerProfileNotFoundException();
    }
    if (profile.userId !== userId) throw ProfileForbiddenException();
    return profile;
  }

  async uploadCv(
    profileId: number,
    userId: number,
    file?: Express.Multer.File,
  ) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    if (!file) throw CvFileRequiredException();
    const isPdf = file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (
      file.mimetype !== 'application/pdf' ||
      !isPdf ||
      file.size > 10 * 1024 * 1024
    ) {
      throw CvFileInvalidException();
    }

    let cvUrl: string;
    let cvPublicId: string | null = null;
    if (this.cloudinary.isConfigured()) {
      const uploaded = await this.cloudinary.uploadFile(
        file,
        `frevia/cvs/${userId}`,
      );
      cvUrl = uploaded.secure_url;
      cvPublicId = uploaded.public_id ?? null;
    } else {
      const relativePath = join('cvs', String(userId), `${randomUUID()}.pdf`);
      const absolutePath = join(process.cwd(), 'uploads', relativePath);
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, file.buffer);
      cvUrl = `local://${relativePath.replace(/\\/g, '/')}`;
    }
    const cv = await this.profileRepository.updateCv(profile.id, {
      cvUrl,
      cvFileName: file.originalname,
      cvPublicId,
    });
    const { freelancerProfile } = profile;
    if (freelancerProfile?.cvPublicId) {
      await this.cloudinary
        .deleteFile(freelancerProfile.cvPublicId)
        .catch(() => undefined);
    }
    return {
      cvUrl: cv.cvUrl?.startsWith('local://')
        ? `/api/backend/profiles/${profile.id}/cv/file`
        : cv.cvUrl,
      cvFileName: cv.cvFileName,
    };
  }

  async getCvFile(profileId: number, userId: number) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const cv = profile.freelancerProfile;
    const cvUrl = cv?.cvUrl;
    if (!cvUrl) throw CvNotFoundException();
    if (!cvUrl.startsWith('local://')) {
      return { remoteUrl: cvUrl, fileName: cv.cvFileName ?? 'cv.pdf' };
    }
    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const absolutePath = resolve(uploadsRoot, cvUrl.slice('local://'.length));
    const pathFromRoot = relative(uploadsRoot, absolutePath);
    if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
      throw CvNotFoundException();
    }
    return { absolutePath, fileName: cv.cvFileName ?? 'cv.pdf' };
  }

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

    return this.profileRepository.updateFreelancerProfile(profileId, {
      displayName: dto.displayName,
      title: dto.title,
      bio: dto.bio,
      availabilityStatus: dto.availabilityStatus,
      education: dto.education,
      certifications: dto.certifications,
      languages: dto.languages,
      experience: dto.experience,
    });
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
