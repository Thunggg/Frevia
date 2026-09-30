import { Injectable } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';

import {
  CreateJobBodyType,
  JobBookmarkType,
  JobType,
  UpdateJobBodyType,
  ViewJobDetailResType,
  ViewBookmarkedJobParsedFilterType,
} from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';
import { JobNotFoundException } from './manage-job.error';

const jobSelect = {
  id: true,
  clientId: true,
  title: true,
  description: true,
  budgetMin: true,
  budgetMax: true,
  budgetType: true,
  deadline: true,
  status: true,
  featured: true,
  expiryDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.JobSelect;

@Injectable()
export class ManageJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBookmarkedJobLists(
    userId: number,
    filter: ViewBookmarkedJobParsedFilterType,
  ): Promise<{
    jobs: ViewJobDetailResType[];
    total: number;
  }> {
    const { page, limit } = filter;

    const where = {
      userId,
      job: {
        deletedAt: null,
      },
    } satisfies Prisma.JobBookmarkWhereInput;

    const [bookmarks, total] = await this.prisma.$transaction([
      this.prisma.jobBookmark.findMany({
        where,

        select: {
          job: {
            select: {
              ...jobSelect,
              skills: {
                select: {
                  id: true,
                  jobId: true,
                  skillName: true,
                },
              },
            },
          },
        },

        skip: (page - 1) * limit,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.jobBookmark.count({
        where,
      }),
    ]);

    return {
      jobs: bookmarks.map(({ job }) => this.normalizeJob(job)),
      total,
    };
  }

  async findJobById(id: number): Promise<Pick<JobType, 'id'> | null> {
    return this.prisma.job.findFirst({
      where: {
        id,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });
  }

  async findBookmark(
    userId: number,
    jobId: number,
  ): Promise<JobBookmarkType | null> {
    return this.prisma.jobBookmark.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });
  }

  async bookmarkJob(userId: number, jobId: number): Promise<JobBookmarkType> {
    return this.prisma.jobBookmark.create({
      data: {
        userId,
        jobId,
      },
    });
  }

  async removeBookmark(
    userId: number,
    jobId: number,
  ): Promise<JobBookmarkType> {
    return this.prisma.jobBookmark.delete({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });
  }

  async createJob(clientId: number, data: CreateJobBodyType): Promise<JobType> {
    const job = await this.prisma.$transaction(async (tx) => {
      const createdJob = await tx.job.create({
        data: {
          clientId,
          title: data.title,
          description: data.description,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budgetType: data.budgetType,
          deadline: data.deadline,
          expiryDate: data.expiryDate,
        },

        select: jobSelect,
      });

      await tx.jobSkill.createMany({
        data: data.skills.map((skillName) => ({
          jobId: createdJob.id,
          skillName,
        })),
      });

      return createdJob;
    });

    return this.normalizeJob(job);
  }

  async updateJob(
    userId: number,
    jobId: number,
    data: UpdateJobBodyType,
  ): Promise<JobType> {
    await this.checkJobOwner(userId, jobId);

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const job = await tx.job.update({
        where: {
          id: jobId,
        },

        data: {
          title: data.title,
          description: data.description,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budgetType: data.budgetType,
          deadline: data.deadline,
          expiryDate: data.expiryDate,
        },

        select: jobSelect,
      });

      await tx.jobSkill.deleteMany({
        where: {
          jobId,
        },
      });

      await tx.jobSkill.createMany({
        data: data.skills.map((skillName) => ({
          jobId,
          skillName,
        })),
      });

      return job;
    });

    return this.normalizeJob(updatedJob);
  }

  async deleteJob(userId: number, jobId: number): Promise<void> {
    await this.checkJobOwner(userId, jobId);

    await this.prisma.job.update({
      where: {
        id: jobId,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  }

  async changeJobStatus(
    userId: number,
    jobId: number,
    status: JobStatus,
  ): Promise<JobType> {
    await this.checkJobOwner(userId, jobId);

    const updatedJob = await this.prisma.job.update({
      where: {
        id: jobId,
      },

      data: {
        status,
      },

      select: jobSelect,
    });

    return this.normalizeJob(updatedJob);
  }

  private async checkJobOwner(userId: number, jobId: number): Promise<void> {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: userId,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }
  }

  private normalizeJob<
    T extends {
      budgetMin: Prisma.Decimal | number | null;
      budgetMax: Prisma.Decimal | number | null;
    },
  >(
    job: T,
  ): Omit<T, 'budgetMin' | 'budgetMax'> & {
    budgetMin: number | null;
    budgetMax: number | null;
  } {
    return {
      ...job,

      budgetMin: job.budgetMin === null ? null : Number(job.budgetMin),

      budgetMax: job.budgetMax === null ? null : Number(job.budgetMax),
    };
  }
}
