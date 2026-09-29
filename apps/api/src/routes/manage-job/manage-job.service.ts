import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  ViewBookmarkedJobFilterType,
  ViewBookmarkedJobResponseType,
} from '@shared/types';

import { ManageJobRepository } from './manage-job.repo';
import { FailedToLoadBookmarkedJobsException } from './manage-job.error';

@Injectable()
export class ManageJobService {
  constructor(private readonly manageJobRepository: ManageJobRepository) {}

  async viewBookmarkedJob(
    userId: number,
    filter: ViewBookmarkedJobFilterType,
  ): Promise<ViewBookmarkedJobResponseType> {
    try {
      const { jobs, total } =
        await this.manageJobRepository.getBookmarkedJobLists(userId, filter);

      return {
        data: jobs,
        pagination: {
          page: filter.page,
          limit: filter.limit,
          total,
          totalPages: Math.ceil(total / filter.limit),
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw FailedToLoadBookmarkedJobsException();
      }

      throw error;
    }
  }
}
