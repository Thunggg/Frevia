import { Injectable } from '@nestjs/common';
import { JobSkillType, JobType, ViewListJobFilterType } from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';
import { JobStatus } from '@prisma/client';

import { JobNotFoundException } from './browse-job.error';

@Injectable()
export class BrowseJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getJobLists(filter: ViewListJobFilterType): Promise<{
    jobs: JobType[];
    total: number;
  }> {
    const { page, limit } = filter;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      status: 'OPEN' as const,
    };

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.job.count({
        where,
      }),
    ]);

    const normalizedJobs: JobType[] = jobs.map((job) => ({
      ...job,
      budgetMin: job.budgetMin !== null ? Number(job.budgetMin) : null,
      budgetMax: job.budgetMax !== null ? Number(job.budgetMax) : null,
    }));

    return {
      jobs: normalizedJobs,
      total,
    };
  }

  async viewJobDetail(id: number): Promise<
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
    > & {
      skills: Pick<JobSkillType, 'id' | 'jobId' | 'skillName'>[];
    }
  > {
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        deletedAt: null,
        status: JobStatus.OPEN,
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

        skills: {
          select: {
            id: true,
            jobId: true,
            skillName: true,
          },
        },
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }

    return {
      ...job,
      budgetMin: job.budgetMin !== null ? Number(job.budgetMin) : null,
      budgetMax: job.budgetMax !== null ? Number(job.budgetMax) : null,
    };
  }
}
