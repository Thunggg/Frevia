import { Injectable } from '@nestjs/common';
import {
  AiDocumentType,
  Prisma,
  RecommendationFeedbackType,
} from '@prisma/client';

import { PrismaService } from '../../shared/services/prisma.service';

// Hồ sơ freelancer đã gom đủ dữ liệu để dựng payload CV + xếp hạng.
export type FreelancerDocument = {
  profileId: number;
  userId: number;
  displayName: string | null;
  avatarUrl: string | null;
  title: string | null;
  bio: string | null;
  cvUrl: string | null;
  skills: Array<{ name: string; proficiencyLevel: number }>;
  experiences: Array<{
    title: string | null;
    company: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
  }>;
  educations: Array<{
    degree: string | null;
    school: string | null;
    startYear: number | null;
    endYear: number | null;
  }>;
  legacyExperience: string[];
};

// Job đã gom đủ dữ liệu để dựng payload JD + hiển thị card.
export type JobDocument = {
  id: number;
  clientId: number;
  slug: string;
  title: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType: Prisma.JobGetPayload<{
    select: typeof jobSelect;
  }>['budgetType'];
  status: Prisma.JobGetPayload<{ select: typeof jobSelect }>['status'];
  createdAt: Date;
  skills: string[];
};

export type RecommendationRow = {
  requesterId: number;
  sourceType: AiDocumentType;
  sourceDocumentId: number;
  targetType: AiDocumentType;
  targetDocumentId: number;
  semanticScore: number;
  skillScore: number;
  experienceScore: number;
  budgetScore: number;
  preferenceScore: number;
  finalScore: number;
  rankingVersion: string;
  embeddingModel: string;
};

const freelancerSelect = {
  id: true,
  title: true,
  experience: true,
  cvUrl: true,
  profile: {
    select: {
      userId: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
    },
  },
  skills: {
    select: {
      proficiencyLevel: true,
      skill: { select: { name: true } },
    },
  },
  experiences: {
    where: { deletedAt: null },
    orderBy: { startDate: Prisma.SortOrder.desc },
    select: {
      title: true,
      company: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      description: true,
    },
  },
  educations: {
    where: { deletedAt: null },
    select: {
      degree: true,
      school: true,
      startYear: true,
      endYear: true,
    },
  },
} satisfies Prisma.FreelancerProfileSelect;

const jobSelect = {
  id: true,
  clientId: true,
  slug: true,
  title: true,
  description: true,
  budgetMin: true,
  budgetMax: true,
  budgetType: true,
  status: true,
  createdAt: true,
  expiryDate: true,
  positionsRequired: true,
  positionsFilled: true,
  skills: { select: { skill: { select: { name: true } } } },
} satisfies Prisma.JobSelect;

@Injectable()
export class RecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFreelancerByUserId(
    userId: number,
  ): Promise<FreelancerDocument | null> {
    const profile = await this.prisma.freelancerProfile.findFirst({
      where: {
        profile: {
          userId,
          user: { isBanned: false, deletedAt: null },
        },
      },
      select: freelancerSelect,
    });

    return profile ? mapFreelancer(profile) : null;
  }

  async findFreelancerByProfileId(
    profileId: number,
  ): Promise<FreelancerDocument | null> {
    const profile = await this.prisma.freelancerProfile.findUnique({
      where: { id: profileId },
      select: freelancerSelect,
    });

    return profile ? mapFreelancer(profile) : null;
  }

  async findJobById(jobId: number): Promise<JobDocument | null> {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        deletedAt: null,
        client: { isBanned: false, deletedAt: null },
      },
      select: jobSelect,
    });

    return job ? mapJob(job) : null;
  }

  /** Job OPEN còn nhận ứng viên, loại job của chính người yêu cầu. */
  async listOpenJobs(options: {
    excludeClientId?: number;
    limit: number;
  }): Promise<JobDocument[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'OPEN',
        deletedAt: null,
        client: { isBanned: false, deletedAt: null },
        positionsFilled: { lt: this.prisma.job.fields.positionsRequired },
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        ...(options.excludeClientId !== undefined && {
          clientId: { not: options.excludeClientId },
        }),
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
      take: options.limit,
      select: jobSelect,
    });

    return jobs.map(mapJob);
  }

  /** Hồ sơ freelancer có kỹ năng, loại chính người yêu cầu. */
  async listFreelancers(options: {
    excludeUserId?: number;
    limit: number;
  }): Promise<FreelancerDocument[]> {
    const profiles = await this.prisma.freelancerProfile.findMany({
      where: {
        skills: { some: {} },
        profile: {
          ...(options.excludeUserId !== undefined && {
            userId: { not: options.excludeUserId },
          }),
          user: { isBanned: false, deletedAt: null },
        },
      },
      orderBy: { updatedAt: Prisma.SortOrder.desc },
      take: options.limit,
      select: freelancerSelect,
    });

    return profiles.map(mapFreelancer);
  }

  async saveRecommendations(
    rows: RecommendationRow[],
  ): Promise<Array<{ id: number; targetDocumentId: number }>> {
    if (rows.length === 0) {
      return [];
    }

    return this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.recommendation.create({
          data: row,
          select: { id: true, targetDocumentId: true },
        }),
      ),
    );
  }

  async findRecommendationById(id: number) {
    return this.prisma.recommendation.findUnique({ where: { id } });
  }

  async createFeedback(
    recommendationId: number,
    type: RecommendationFeedbackType,
  ) {
    return this.prisma.recommendationFeedback.create({
      data: { recommendationId, type },
      select: {
        id: true,
        recommendationId: true,
        type: true,
        createdAt: true,
      },
    });
  }
}

function mapFreelancer(
  profile: Prisma.FreelancerProfileGetPayload<{
    select: typeof freelancerSelect;
  }>,
): FreelancerDocument {
  return {
    profileId: profile.id,
    userId: profile.profile.userId,
    displayName: profile.profile.displayName,
    avatarUrl: profile.profile.avatarUrl,
    title: profile.title,
    bio: profile.profile.bio,
    cvUrl: profile.cvUrl,
    skills: profile.skills.map((item) => ({
      name: item.skill.name,
      proficiencyLevel: item.proficiencyLevel,
    })),
    experiences: profile.experiences,
    educations: profile.educations,
    legacyExperience: profile.experience,
  };
}

function mapJob(
  job: Prisma.JobGetPayload<{ select: typeof jobSelect }>,
): JobDocument {
  return {
    id: job.id,
    clientId: job.clientId,
    slug: job.slug,
    title: job.title,
    description: job.description,
    budgetMin: job.budgetMin === null ? null : Number(job.budgetMin),
    budgetMax: job.budgetMax === null ? null : Number(job.budgetMax),
    budgetType: job.budgetType,
    status: job.status,
    createdAt: job.createdAt,
    skills: job.skills.map((item) => item.skill.name),
  };
}
