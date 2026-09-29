import { Injectable } from '@nestjs/common';

import {
  CreateJobBodyType,
  JobBookmarkType,
  JobType,
  ViewBookmarkedJobFilterType,
} from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';

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
}
