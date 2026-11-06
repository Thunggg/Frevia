import { Injectable } from '@nestjs/common';
import {
  type AddFreelancerSkillType,
  type CvAnalysisConfirmType,
  type CvAnalysisDraftType,
  type CvAnalysisPayloadType,
  type CvSourceType,
  type UpdateFreelancerProfileType,
  RoleName,
  ProfileMessage,
} from '@shared/types';
import { ProfileRepository } from './profile.repo';
import { CloudinaryService } from '../../shared/services/cloudinary.service';
import {
  AiCvAnalyzerService,
  type AiCvAnalysis,
  type AiCvSource,
} from '../../shared/services/ai-cv-analyzer.service';
import { SkillResolverService } from '../../shared/services/skill-resolver.service';
import { ProfileRevisionService } from '../profile-revisions/profile-revision.service';
import { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
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
  CvFileTooLargeException,
  CvFileTypeException,
  CvNotFoundException,
  CvAiUnavailableException,
  CvAnalysisNotFoundException,
  CvAnalysisNotPendingException,
  CvAnalysisStaleException,
} from './profile.error';

const CV_SOURCE_MAP: Record<AiCvSource, CvSourceType> = {
  pdf_text: 'PDF_TEXT',
  pdf_ocr: 'PDF_OCR',
  docx: 'DOCX',
  doc: 'DOC',
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly aiCvAnalyzer: AiCvAnalyzerService,
    private readonly skillResolver: SkillResolverService,
    private readonly profileRevisionService: ProfileRevisionService,
    private readonly embeddingOutbox: EmbeddingOutboxService,
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
    if (file.size > 10 * 1024 * 1024) throw CvFileTooLargeException();
    if (file.mimetype !== 'application/pdf') throw CvFileTypeException();
    // Một số PDF hợp lệ có byte dẫn (BOM/whitespace) trước header, nên tìm
    // chữ ký `%PDF-` trong 1 KB đầu thay vì bắt buộc đúng 5 byte đầu tiên.
    const isPdf = file.buffer.subarray(0, 1024).includes('%PDF-');
    if (!isPdf) throw CvFileInvalidException();

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
    await this.embeddingOutbox.enqueueAndProcess({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: profile.id,
    });
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
    await this.embeddingOutbox.enqueueAndProcess({
      eventType: 'DELETE',
      documentType: 'CV',
      documentId: profile.id,
    });
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
    if (!cvUrl || !cv) throw CvNotFoundException();

    const { buffer, fileName } = await this.readCvBytes(
      cvUrl,
      cv.cvFileName ?? 'cv.pdf',
    );

    let analysis: AiCvAnalysis;
    try {
      analysis = await this.aiCvAnalyzer.analyze(buffer, fileName);
    } catch {
      throw CvAiUnavailableException();
    }

    const suggestedNames = analysis.skills.map((skill) => skill.name);
    const entries =
      await this.skillResolver.resolveSkillEntries(suggestedNames);
    const proficiencyByOriginal = new Map<string, number | null>();
    for (const skill of analysis.skills) {
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

    const suggestions: {
      skillName: string;
      proficiencyLevel: number | null;
    }[] = [];
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

    const payload: CvAnalysisPayloadType = {
      skills: analysis.skills,
      experience: analysis.experience,
      education: analysis.education,
      projects: analysis.projects,
      summary: analysis.summary,
    };

    const row = await this.profileRepository.createCvAnalysis({
      freelancerProfileId: cv.id,
      cvUrl,
      cvFileName: cv.cvFileName,
      cvUploadedAt: cv.cvUploadedAt,
      source: CV_SOURCE_MAP[analysis.meta.source],
      pages: analysis.meta.pages,
      chars: analysis.meta.chars,
      truncated: analysis.meta.truncated,
      ocrUsed: analysis.meta.ocrUsed,
      model: analysis.meta.model,
      durationMs: analysis.meta.durationMs,
      warnings: analysis.meta.warnings,
      payload,
    });

    return {
      suggestions,
      analysis: this.toCvAnalysisDraft(row, cvUrl),
    };
  }

  async getCvAnalysis(profileId: number, userId: number) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const cv = profile.freelancerProfile;
    if (!cv) throw CvAnalysisNotFoundException();

    const row = await this.profileRepository.findPendingCvAnalysis(cv.id);
    if (!row) throw CvAnalysisNotFoundException();
    return this.toCvAnalysisDraft(row, cv.cvUrl);
  }

  async confirmCvAnalysis(
    profileId: number,
    userId: number,
    analysisId: number,
    dto: CvAnalysisConfirmType,
  ) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const analysis =
      await this.profileRepository.findCvAnalysisById(analysisId);
    if (
      !analysis ||
      analysis.freelancerProfile.id !== profile.freelancerProfile?.id
    ) {
      throw CvAnalysisNotFoundException();
    }
    if (analysis.freelancerProfile.profile.userId !== userId) {
      throw ProfileForbiddenException();
    }
    if (analysis.status !== 'PENDING') {
      throw CvAnalysisNotPendingException();
    }
    if (
      analysis.cvUrl &&
      profile.freelancerProfile?.cvUrl &&
      analysis.cvUrl !== profile.freelancerProfile.cvUrl
    ) {
      throw CvAnalysisStaleException();
    }

    const existingSkills =
      await this.profileRepository.findSkillsByProfileId(profileId);
    const existingSkillIds = new Set(
      existingSkills.map((skill) => skill.skillId),
    );

    const resolvedSkills: { skillId: number; proficiencyLevel: number }[] = [];
    const seenSkillIds = new Set<number>();
    for (const skill of dto.skills ?? []) {
      const catalog = await this.profileRepository.findOrCreateCatalogSkill(
        skill.skillName,
      );
      if (existingSkillIds.has(catalog.id) || seenSkillIds.has(catalog.id)) {
        continue;
      }
      seenSkillIds.add(catalog.id);
      resolvedSkills.push({
        skillId: catalog.id,
        proficiencyLevel: skill.proficiencyLevel,
      });
    }

    const experience = (dto.experience ?? [])
      .filter((item) =>
        Boolean(
          item.title ||
          item.company ||
          item.startDate ||
          item.endDate ||
          item.description,
        ),
      )
      .map((item) => ({
        title: item.title,
        company: item.company,
        startDate: item.startDate,
        endDate: item.endDate,
        isCurrent: item.isCurrent,
        description: item.description,
      }));

    const education = (dto.education ?? [])
      .filter((item) =>
        Boolean(
          item.degree ||
          item.school ||
          item.startYear !== null ||
          item.endYear !== null ||
          item.description,
        ),
      )
      .map((item) => ({
        degree: item.degree,
        school: item.school,
        startYear: item.startYear,
        endYear: item.endYear,
        description: item.description,
      }));

    const projects = (dto.projects ?? []).map((item) => ({
      name: item.name,
      technologies: item.technologies,
      description: item.description,
    }));

    const result = await this.profileRepository.confirmCvAnalysis({
      analysisId,
      freelancerProfileId: analysis.freelancerProfile.id,
      skills: resolvedSkills,
      experience,
      education,
      projects,
    });
    if (!result) throw CvAnalysisNotPendingException();

    await this.embeddingOutbox.enqueueAndProcess({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: profile.id,
    });

    return {
      message: ProfileMessage.CV_ANALYSIS_CONFIRMED,
      status: 'CONFIRMED' as const,
      counts: {
        skills: resolvedSkills.length,
        experience: experience.length,
        education: education.length,
        projects: projects.length,
      },
      profileCompletionPercent: result.profileCompletionPercent,
    };
  }

  async discardCvAnalysis(
    profileId: number,
    userId: number,
    analysisId: number,
  ) {
    const profile = await this.getOwnedFreelancerProfile(profileId, userId);
    const analysis =
      await this.profileRepository.findCvAnalysisById(analysisId);
    if (
      !analysis ||
      analysis.freelancerProfile.id !== profile.freelancerProfile?.id
    ) {
      throw CvAnalysisNotFoundException();
    }
    if (analysis.freelancerProfile.profile.userId !== userId) {
      throw ProfileForbiddenException();
    }

    const discarded =
      await this.profileRepository.discardCvAnalysis(analysisId);
    if (!discarded) throw CvAnalysisNotPendingException();

    return {
      message: ProfileMessage.CV_ANALYSIS_DISCARDED,
      status: 'DISCARDED' as const,
    };
  }

  private toCvAnalysisDraft(
    row: {
      id: number;
      status: string;
      cvUrl: string | null;
      cvFileName: string | null;
      cvUploadedAt: Date | null;
      source: CvSourceType;
      pages: number;
      chars: number;
      truncated: boolean;
      ocrUsed: boolean;
      model: string | null;
      durationMs: number | null;
      warnings: string[];
      payload: unknown;
      createdAt: Date;
      updatedAt: Date;
    },
    currentCvUrl: string | null | undefined,
  ): CvAnalysisDraftType {
    return {
      id: row.id,
      status: row.status as CvAnalysisDraftType['status'],
      cvFileName: row.cvFileName,
      cvUploadedAt: row.cvUploadedAt,
      isStale: Boolean(row.cvUrl && currentCvUrl && row.cvUrl !== currentCvUrl),
      payload: row.payload as CvAnalysisPayloadType,
      meta: {
        source: row.source,
        pages: row.pages,
        chars: row.chars,
        truncated: row.truncated,
        ocrUsed: row.ocrUsed,
        model: row.model,
        durationMs: row.durationMs,
        warnings: row.warnings,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
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
    await this.embeddingOutbox.enqueueAndProcess({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: profile.id,
    });
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

    const result = await this.profileRepository.addSkillToProfile(
      profileId,
      catalogSkill.id,
      dto.proficiencyLevel,
    );
    await this.embeddingOutbox.enqueueAndProcess({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: profileId,
    });
    return result;
  }

  async deleteSkill(skillId: number, currentUserId: number) {
    const skill = await this.profileRepository.findSkillById(skillId);
    if (!skill) {
      throw FreelancerSkillNotFoundException();
    }

    if (skill.freelancerProfile.profile.userId !== currentUserId) {
      throw SkillForbiddenException();
    }

    const result = await this.profileRepository.deleteSkill(skillId);
    await this.embeddingOutbox.enqueueAndProcess({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: skill.freelancerProfile.id,
    });
    return result;
  }
}
