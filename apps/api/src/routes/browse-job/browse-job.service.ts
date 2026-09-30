import { Injectable } from '@nestjs/common';
import {
  ViewJobDetailResType,
  ViewListJobParsedFilterType,
  ViewListJobResponseType,
} from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import {
  FailedToLoadJobDetailException,
  FailedToLoadJobListException,
} from './browse-job.error';
import { BrowseJobRepository } from './browse-job.repo';

@Injectable()
export class BrowseJobService {
  constructor(private readonly browseJobRepository: BrowseJobRepository) {}

  async viewListJob(
    filter: ViewListJobParsedFilterType,
  ): Promise<ViewListJobResponseType> {
    try {
      const { jobs, total } =
        await this.browseJobRepository.getJobLists(filter);

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
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobListException();
      }

      throw error;
    }
  }

  async viewJobDetail(id: number): Promise<ViewJobDetailResType> {
    try {
      return await this.browseJobRepository.viewJobDetail(id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadJobDetailException();
      }

      throw error;
    }
  }
}
