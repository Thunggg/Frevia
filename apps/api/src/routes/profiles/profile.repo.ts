import { Injectable } from '@nestjs/common';
import {
  AvailabilityStatus,
  CvAnalysisStatus,
  CvSourceType,
  Prisma,
  ProfileContentSource,
} from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { calculateFreelancerProfileStrength } from '../../shared/utils/profile-strength';

export type CvAnalysisCreateData = {
  freelancerProfileId: number;
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
};

export type CvAnalysisConfirmInput = {
  analysisId: number;
  freelancerProfileId: number;
  skills: { skillId: number; proficiencyLevel: number }[];
  experience: {
    title: string | null;
    company: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
  }[];
  education: {
    degree: string | null;
    school: string | null;
    startYear: number | null;
    endYear: number | null;
    description: string | null;
  }[];
  projects: {
    name: string;
    technologies: string[];
    description: string | null;
  }[];
};

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFreelancerProfileById(profileId: number) {
    const byId = await this.prisma.profile.findFirst({
      where: {
        id: profileId,
        user: {
          deletedAt: null,
        },
      },
      include: {
        freelancerProfile: true,
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });
    if (byId) return byId;
    return this.prisma.profile.findFirst({
      where: {
        userId: profileId,
        user: {
          deletedAt: null,
        },
      },
      include: {
        freelancerProfile: true,
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });
  }

  async updateFreelancerProfile(
    profileId: number,
    data: {
      displayName: string;
      title: string;
      bio?: string | null;
      availabilityStatus?: AvailabilityStatus;
      education?: string[] | null;
      certifications?: string[] | null;
      languages?: string[] | null;
      experience?: string[] | null;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const freelancerProfile = await tx.freelancerProfile.findUnique({
        where: { profileId },
        select: {
          _count: {
            select: {
              skills: true,
              portfolioItems: { where: { deletedAt: null } },
            },
          },
        },
      });
      const profileCompletionPercent = calculateFreelancerProfileStrength({
        ...data,
        skillCount: freelancerProfile?._count.skills ?? 0,
        portfolioCount: freelancerProfile?._count.portfolioItems ?? 0,
      });

      // 1. Update Profile fields
      await tx.profile.update({
        where: { id: profileId },
        data: {
          displayName: data.displayName,
          bio: data.bio ?? null,
          availabilityStatus: data.availabilityStatus,
          profileCompletionPercent,
        },
      });

      // 2. Upsert FreelancerProfile fields
      // Lưu ý: education/certifications/languages là String[] (không nullable),
      // null → [] (xoá hết mục)
      await tx.freelancerProfile.upsert({
        where: { profileId },
        update: {
          title: data.title,
          education: data.education ?? [],
          certifications: data.certifications ?? [],
          languages: data.languages ?? [],
          experience: data.experience ?? [],
        },
        create: {
          profileId,
          title: data.title,
          education: data.education ?? [],
          certifications: data.certifications ?? [],
          languages: data.languages ?? [],
          experience: data.experience ?? [],
        },
      });

      // 3. Fetch the fully updated profile to return
      return tx.profile.findUnique({
        where: { id: profileId },
        include: {
          freelancerProfile: true,
        },
      });
    });
  }

  updateCv(
    profileId: number,
    data: { cvUrl: string; cvFileName: string; cvPublicId: string | null },
  ) {
    return this.prisma.freelancerProfile.upsert({
      where: { profileId },
      update: { ...data, cvUploadedAt: new Date() },
      create: { profileId, ...data, cvUploadedAt: new Date() },
    });
  }

  async clearCv(profileId: number) {
    return this.prisma.freelancerProfile.update({
      where: { profileId },
      data: {
        cvUrl: null,
        cvFileName: null,
        cvPublicId: null,
        cvUploadedAt: null,
      },
    });
  }

  async findSkillsByProfileId(profileId: number) {
    const freelancerProfile =
      (await this.prisma.freelancerProfile.findUnique({
        where: { profileId },
      })) ??
      (await this.prisma.freelancerProfile.findFirst({
        where: { profile: { userId: profileId } },
      }));
    if (!freelancerProfile) return [];
    return this.prisma.freelancerSkill.findMany({
      where: {
        freelancerProfileId: freelancerProfile.id,
        skill: { deletedAt: null },
      },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } },
    });
  }

  async searchActiveCatalogSkills(search?: string) {
    return this.prisma.skill.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: Prisma.QueryMode.insensitive },
        }),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  async findOrCreateCatalogSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Skill name is required.');
    }

    const existing = await this.prisma.skill.findFirst({
      where: {
        deletedAt: null,
        name: { equals: trimmed, mode: Prisma.QueryMode.insensitive },
      },
    });
    if (existing) return existing;

    const slug = await this.generateUniqueSlug(trimmed);
    return this.prisma.skill.create({ data: { name: trimmed, slug } });
  }

  async findSkillByProfileIdAndSkillId(profileId: number, skillId: number) {
    const freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { profileId },
    });
    if (!freelancerProfile) return null;
    return this.prisma.freelancerSkill.findFirst({
      where: {
        freelancerProfileId: freelancerProfile.id,
        skillId,
      },
    });
  }

  async addSkillToProfile(
    profileId: number,
    skillId: number,
    proficiencyLevel: number,
  ) {
    let freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { profileId },
    });
    if (!freelancerProfile) {
      freelancerProfile = await this.prisma.freelancerProfile.create({
        data: { profileId },
      });
    }

    return this.prisma.freelancerSkill.create({
      data: {
        freelancerProfileId: freelancerProfile.id,
        skillId,
        proficiencyLevel,
      },
      include: { skill: true },
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = this.slugify(name) || 'skill';
    let slug = base;
    let suffix = 2;
    while (
      await this.prisma.skill.findFirst({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  async findSkillById(skillId: number) {
    return this.prisma.freelancerSkill.findUnique({
      where: { id: skillId },
      include: {
        freelancerProfile: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async deleteSkill(skillId: number) {
    return this.prisma.freelancerSkill.delete({
      where: { id: skillId },
    });
  }

  /**
   * Tạo bản nháp phân tích mới. Bản nháp PENDING trước đó (nếu có) bị đánh dấu
   * DISCARDED để mỗi hồ sơ chỉ có tối đa một bản nháp đang chờ xác nhận.
   */
  createCvAnalysis(data: CvAnalysisCreateData) {
    return this.prisma.$transaction(async (tx) => {
      await tx.cvAnalysis.updateMany({
        where: {
          freelancerProfileId: data.freelancerProfileId,
          status: CvAnalysisStatus.PENDING,
        },
        data: {
          status: CvAnalysisStatus.DISCARDED,
          discardedAt: new Date(),
        },
      });
      return tx.cvAnalysis.create({
        data: { ...data, payload: data.payload as Prisma.InputJsonValue },
      });
    });
  }

  findPendingCvAnalysis(freelancerProfileId: number) {
    return this.prisma.cvAnalysis.findFirst({
      where: {
        freelancerProfileId,
        status: CvAnalysisStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findCvAnalysisById(analysisId: number) {
    return this.prisma.cvAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        freelancerProfile: {
          select: {
            id: true,
            profileId: true,
            cvUrl: true,
            profile: { select: { userId: true } },
          },
        },
      },
    });
  }

  async discardCvAnalysis(analysisId: number) {
    const result = await this.prisma.cvAnalysis.updateMany({
      where: { id: analysisId, status: CvAnalysisStatus.PENDING },
      data: {
        status: CvAnalysisStatus.DISCARDED,
        discardedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  /**
   * Ghi dữ liệu bản nháp đã xác nhận vào hồ sơ: FreelancerSkill /
   * FreelancerExperience / FreelancerEducation / PortfolioItem, rồi đánh dấu
   * CvAnalysis = CONFIRMED. Trả về `null` nếu bản nháp không còn ở PENDING
   * (đã xác nhận/huỷ ở nơi khác — optimistic claim).
   */
  async confirmCvAnalysis(input: CvAnalysisConfirmInput) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.cvAnalysis.updateMany({
        where: { id: input.analysisId, status: CvAnalysisStatus.PENDING },
        data: {
          status: CvAnalysisStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });
      if (claimed.count === 0) return null;

      if (input.skills.length > 0) {
        await tx.freelancerSkill.createMany({
          data: input.skills.map((skill) => ({
            freelancerProfileId: input.freelancerProfileId,
            skillId: skill.skillId,
            proficiencyLevel: skill.proficiencyLevel,
          })),
          skipDuplicates: true,
        });
      }

      if (input.experience.length > 0) {
        await tx.freelancerExperience.createMany({
          data: input.experience.map((experience) => ({
            freelancerProfileId: input.freelancerProfileId,
            ...experience,
            source: ProfileContentSource.CV_IMPORT,
          })),
        });
      }

      if (input.education.length > 0) {
        await tx.freelancerEducation.createMany({
          data: input.education.map((education) => ({
            freelancerProfileId: input.freelancerProfileId,
            ...education,
            source: ProfileContentSource.CV_IMPORT,
          })),
        });
      }

      if (input.projects.length > 0) {
        await tx.portfolioItem.createMany({
          data: input.projects.map((project) => ({
            freelancerProfileId: input.freelancerProfileId,
            title: project.name,
            technologies: project.technologies,
            description: project.description,
            source: ProfileContentSource.CV_IMPORT,
          })),
        });
      }

      const freelancerProfile = await tx.freelancerProfile.findUniqueOrThrow({
        where: { id: input.freelancerProfileId },
        select: {
          profileId: true,
          title: true,
          education: true,
          certifications: true,
          _count: {
            select: {
              skills: true,
              portfolioItems: { where: { deletedAt: null } },
            },
          },
        },
      });
      const profile = await tx.profile.findUniqueOrThrow({
        where: { id: freelancerProfile.profileId },
        select: { displayName: true, bio: true },
      });
      const profileCompletionPercent = calculateFreelancerProfileStrength({
        displayName: profile.displayName,
        bio: profile.bio,
        title: freelancerProfile.title,
        education: freelancerProfile.education,
        certifications: freelancerProfile.certifications,
        skillCount: freelancerProfile._count.skills,
        portfolioCount: freelancerProfile._count.portfolioItems,
      });
      await tx.profile.update({
        where: { id: freelancerProfile.profileId },
        data: { profileCompletionPercent },
      });

      return { profileCompletionPercent };
    });
  }
}
