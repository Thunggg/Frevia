import { Injectable } from '@nestjs/common';
import type {
  JobType,
  ViewJobDetailResType,
  ViewListJobParsedFilterType,
} from '@shared/types';
import { JobCategoryStatus, JobStatus, Prisma } from '@prisma/client';

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
      category,
      featured,
      clientId,
      sortBy,
      order,
    } = filter;

    const where = {
      deletedAt: null,
      status: JobStatus.OPEN,
      client: {
        isBanned: false,
        deletedAt: null,
      },

      // Tìm theo tiêu đề, mô tả hoặc tên kỹ năng của job.
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            skills: {
              some: {
                skill: {
                  is: {
                    name: {
                      contains: search,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            },
          },
        ],
      }),

      ...(budgetType && { budgetType }),

      // Include jobs whose offered budget range overlaps the selected range.
      ...(budgetMin !== undefined && { budgetMax: { gte: budgetMin } }),

      ...(budgetMax !== undefined && { budgetMin: { lte: budgetMax } }),

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

      // Lọc theo danh mục công việc (UC-46.07 A.2): chỉ khớp danh mục đang ACTIVE,
      // chưa bị xoá — danh mục bị vô hiệu hoá sẽ biến mất khỏi flow tìm kiếm (BR-CAT-15).
      ...(category && {
        jobCategories: {
          some: {
            category: {
              is: {
                slug: category,
                status: JobCategoryStatus.ACTIVE,
                deletedAt: null,
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
          slug: true,
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

          jobCategories: {
            select: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
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

  async viewJobDetail(slug: string): Promise<ViewJobDetailResType> {
    const job = await this.prisma.job.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: JobStatus.OPEN,
        client: {
          isBanned: false,
          deletedAt: null,
        },
      },

      select: {
        id: true,
        slug: true,
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

        jobCategories: {
          select: {
            category: { select: { id: true, name: true, slug: true } },
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
      jobCategories?: Array<{
        category: { id: number; name: string; slug: string };
      }>;
    },
  >(
    job: T,
  ): Omit<T, 'budgetMin' | 'budgetMax' | 'jobCategories'> & {
    budgetMin: number | null;
    budgetMax: number | null;
    jobCategories?: Array<{ id: number; name: string; slug: string }>;
  } {
    const { jobCategories, budgetMin, budgetMax, ...rest } = job;

    const normalized = {
      ...rest,
      budgetMin: budgetMin === null ? null : Number(budgetMin),
      budgetMax: budgetMax === null ? null : Number(budgetMax),
    };

    // Quan hệ N-N: làm phẳng bảng trung gian JobJobCategory về danh mục thực tế.
    return (
      jobCategories
        ? {
            ...normalized,
            jobCategories: jobCategories.map(({ category }) => category),
          }
        : normalized
    ) as Omit<T, 'budgetMin' | 'budgetMax' | 'jobCategories'> & {
      budgetMin: number | null;
      budgetMax: number | null;
      jobCategories?: Array<{ id: number; name: string; slug: string }>;
    };
  }
}
