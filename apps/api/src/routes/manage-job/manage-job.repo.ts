import { Injectable } from '@nestjs/common';

import { JobType, ViewBookmarkedJobFilterType } from '@shared/types';

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
}
