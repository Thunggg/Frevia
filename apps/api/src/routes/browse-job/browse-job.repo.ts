import { Injectable } from '@nestjs/common';
import type {
  JobType,
  ViewJobDetailResType,
  ViewListJobParsedFilterType,
} from '@shared/types';
import { JobStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/services/prisma.service';
import { JobNotFoundException } from './browse-job.error';

@Injectable()
export class BrowseJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getJobLists(filter: ViewListJobParsedFilterType): Promise<{
    jobs: JobType[];
    total: number;
  }> {
    const {
      page,
      limit,
      search,
      budgetType,
      budgetMin,
      budgetMax,
      createdAfter,
      skill,
      featured,
      clientId,
      sortBy,
      order,
    } = filter;

    const where = {
      deletedAt: null,
      status: JobStatus.OPEN,

      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          // {
          //   description: {
          //     contains: search,
          //     mode: Prisma.QueryMode.insensitive,
          //   },
          // },
          // {
          //   skills: {
          //     some: {
          //       skillName: {
          //         contains: search,
          //         mode: Prisma.QueryMode.insensitive,
          //       },
          //     },
          //   },
          // },
        ],
      }),

      ...(budgetType && { budgetType }),

      ...(budgetMin !== undefined && {
        budgetMin: {
          gte: budgetMin,
        },
      }),

      ...(budgetMax !== undefined && {
        budgetMax: {
          lte: budgetMax,
        },
      }),

      ...(createdAfter && {
        createdAt: {
          gte: createdAfter,
        },
      }),

      ...(skill && {
        skills: {
          some: {
            skill: {
              is: {
                name: {
                  contains: skill,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        },
      }),

      ...(featured !== undefined && { featured }),

      ...(clientId !== undefined && { clientId }),
    } satisfies Prisma.JobWhereInput;

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

        skip: (page - 1) * limit,
        take: limit,

        orderBy: {
          [sortBy]: order,
        },
      }),

      this.prisma.job.count({
        where,
      }),
    ]);

    return {
      jobs: jobs.map((job) => this.normalizeJob(job)),
      total,
    };
  }

  async viewJobDetail(id: number): Promise<ViewJobDetailResType> {
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
            jobId: true,
            skillId: true,
            skill: { select: { name: true } },
          },
        },
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }

    return this.normalizeJob(job);
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
