import { Injectable } from '@nestjs/common';
import { JobStatus } from '@prisma/client';

import {
  CreateJobBodyType,
  JobBookmarkType,
  JobType,
  UpdateJobBodyType,
  ViewBookmarkedJobFilterType,
} from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';
import { JobNotFoundException } from './manage-job.error';

@Injectable()
export class ManageJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBookmarkedJobLists(
    userId: number,
    filter: ViewBookmarkedJobFilterType,
  ): Promise<{
    jobs: Pick<
      JobType,
      | 'id'
      | 'clientId'
      | 'title'
      | 'description'
      | 'budgetMin'
      | 'budgetMax'
      | 'budgetType'
      | 'deadline'
      | 'status'
      | 'featured'
      | 'expiryDate'
      | 'createdAt'
      | 'updatedAt'
    >[];
    total: number;
  }> {
    const { page, limit } = filter;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      job: {
        deletedAt: null,
      },
    };

    const [bookmarks, total] = await this.prisma.$transaction([
      this.prisma.jobBookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          job: {
            select: {
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
            },
          },
        },
      }),

      this.prisma.jobBookmark.count({
        where,
      }),
    ]);

    return {
      jobs: bookmarks.map(({ job }) => ({
        ...job,
        budgetMin: job.budgetMin?.toNumber() ?? null,
        budgetMax: job.budgetMax?.toNumber() ?? null,
      })),
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

  async createJob(
    clientId: number,
    data: CreateJobBodyType,
  ): Promise<
    Pick<
      JobType,
      | 'id'
      | 'clientId'
      | 'title'
      | 'description'
      | 'budgetMin'
      | 'budgetMax'
      | 'budgetType'
      | 'deadline'
      | 'status'
      | 'featured'
      | 'expiryDate'
      | 'createdAt'
      | 'updatedAt'
    >
  > {
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
        select: {
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
        },
      });

      await tx.jobSkill.createMany({
        data: data.skills.map((skillName) => ({
          jobId: createdJob.id,
          skillName,
        })),
      });

      return createdJob;
    });

    return {
      ...job,
      budgetMin: job.budgetMin?.toNumber() ?? null,
      budgetMax: job.budgetMax?.toNumber() ?? null,
    };
  }

  async updateJob(
    userId: number,
    jobId: number,
    data: UpdateJobBodyType,
  ): Promise<
    Pick<
      JobType,
      | 'id'
      | 'clientId'
      | 'title'
      | 'description'
      | 'budgetMin'
      | 'budgetMax'
      | 'budgetType'
      | 'deadline'
      | 'status'
      | 'featured'
      | 'expiryDate'
      | 'createdAt'
      | 'updatedAt'
    >
  > {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: userId,
        deletedAt: null,
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }

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
        select: {
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
        },
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

    return {
      ...updatedJob,
      budgetMin: updatedJob.budgetMin?.toNumber() ?? null,
      budgetMax: updatedJob.budgetMax?.toNumber() ?? null,
    };
  }

  async deleteJob(userId: number, jobId: number): Promise<void> {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: userId,
        deletedAt: null,
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }

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
  ): Promise<
    Pick<
      JobType,
      | 'id'
      | 'clientId'
      | 'title'
      | 'description'
      | 'budgetMin'
      | 'budgetMax'
      | 'budgetType'
      | 'deadline'
      | 'status'
      | 'featured'
      | 'expiryDate'
      | 'createdAt'
      | 'updatedAt'
    >
  > {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: userId,
        deletedAt: null,
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }

    const updatedJob = await this.prisma.job.update({
      where: {
        id: jobId,
      },
      data: {
        status,
      },
      select: {
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
      },
    });

    return {
      ...updatedJob,
      budgetMin: updatedJob.budgetMin?.toNumber() ?? null,
      budgetMax: updatedJob.budgetMax?.toNumber() ?? null,
    };
  }
}
