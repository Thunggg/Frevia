import { Injectable } from '@nestjs/common';
import {
  type AddFreelancerSkillType,
  RoleName,
  type UpdateFreelancerProfileType,
  type CvAnalyzeResponseType,
} from '@shared/types';
import { ProfileRepository } from './profile.repo';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { AiCvAnalyzerService } from '../../shared/services/ai-cv-analyzer.service';
import { SkillResolverService } from '../../shared/services/skill-resolver.service';
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
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
  CvAiUnavailableException,
} from './profile.error';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly aiCvAnalyzer: AiCvAnalyzerService,
    private readonly skillResolver: SkillResolverService,
    private readonly profileRevisionService: ProfileRevisionService,
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
    } else if (freelancerProfile?.cvUrl?.startsWith('local://')) {
      const oldPath = this.resolveLocalCvPath(freelancerProfile.cvUrl);
      if (oldPath) await unlink(oldPath).catch(() => undefined);
    }
    return {
      cvUrl: cv.cvUrl?.startsWith('local://')
        ? `/api/backend/profiles/${profile.id}/cv/file`
        : cv.cvUrl,
      cvFileName: cv.cvFileName,
    };
  }

  async deleteCv(profileId: number, userId: number) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const cv = profile.freelancerProfile;
    const cvUrl = cv?.cvUrl;
    if (!cvUrl) throw CvNotFoundException();

    if (cv?.cvPublicId) {
      await this.cloudinary.deleteFile(cv.cvPublicId).catch(() => undefined);
    } else if (cvUrl.startsWith('local://')) {
      const absolutePath = this.resolveLocalCvPath(cvUrl);
      if (absolutePath) await unlink(absolutePath).catch(() => undefined);
    }

    await this.profileRepository.clearCv(profile.id);
    return { message: 'CV deleted successfully.' };
  }

  async getCvFile(profileId: number, userId: number) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const cv = profile.freelancerProfile;
    const cvUrl = cv?.cvUrl;
    if (!cvUrl) throw CvNotFoundException();
    if (!cvUrl.startsWith('local://')) {
      return { remoteUrl: cvUrl, fileName: cv.cvFileName ?? 'cv.pdf' };
    }
    const absolutePath = this.resolveLocalCvPath(cvUrl);
    if (!absolutePath) throw CvNotFoundException();
    return { absolutePath, fileName: cv.cvFileName ?? 'cv.pdf' };
  }

  async analyzeCv(profileId: number, userId: number) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const cv = profile.freelancerProfile;
    const cvUrl = cv?.cvUrl;
    if (!cvUrl) throw CvNotFoundException();

    const { buffer, fileName } = await this.readCvBytes(
      cvUrl,
      cv.cvFileName ?? 'cv.pdf',
    );

    let extracted;
    try {
      extracted = await this.aiCvAnalyzer.extractSkills(buffer, fileName);
    } catch {
      throw CvAiUnavailableException();
    }

    const suggestedNames = extracted.map((skill) => skill.name);
    const entries =
      await this.skillResolver.resolveSkillEntries(suggestedNames);
    const proficiencyByOriginal = new Map<string, number | null>();
    for (const skill of extracted) {
      proficiencyByOriginal.set(
        skill.name.trim().toLowerCase(),
        skill.proficiencyLevel,
      );
    }

    const existingSkills =
      await this.profileRepository.findSkillsByProfileId(profileId);
    const existingByName = new Set<string>();
    for (const existing of existingSkills) {
      existingByName.add(existing.skill.name.trim().toLowerCase());
    }

    const suggestions: CvAnalyzeResponseType['suggestions'] = [];
    const seen = new Set<string>();
    for (const entry of entries) {
      const targetName = entry.skill?.name ?? entry.name;
      const key = targetName.trim().toLowerCase();
      if (seen.has(key) || existingByName.has(key)) continue;
      seen.add(key);
      suggestions.push({
        skillName: targetName,
        proficiencyLevel:
          proficiencyByOriginal.get(entry.name.trim().toLowerCase()) ?? null,
      });
    }

    return { suggestions };
  }

  private resolveLocalCvPath(cvUrl: string): string | null {
    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const absolutePath = resolve(uploadsRoot, cvUrl.slice('local://'.length));
    const pathFromRoot = relative(uploadsRoot, absolutePath);
    if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
      return null;
    }
    return absolutePath;
  }

  private async readCvBytes(
    cvUrl: string,
    fileName: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    if (cvUrl.startsWith('local://')) {
      const absolutePath = this.resolveLocalCvPath(cvUrl);
      if (!absolutePath) throw CvNotFoundException();
      const buffer = await readFile(absolutePath);
      return { buffer, fileName };
    }

    let response: Response;
    try {
      response = await fetch(cvUrl);
    } catch {
      throw CvNotFoundException();
    }
    if (!response.ok) throw CvNotFoundException();
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, fileName };
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

    const update = {
      displayName: dto.displayName,
      title: dto.title,
      bio: dto.bio,
      availabilityStatus: dto.availabilityStatus,
      education: dto.education,
      certifications: dto.certifications,
      languages: dto.languages,
      experience: dto.experience,
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
