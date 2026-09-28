import { Injectable } from '@nestjs/common';
import { ViewListJobFilterType, ViewListJobResponseType } from '@shared/types';

import { BrowseJobRepository } from './browse-job.repo';

@Injectable()
export class BrowseJobService {
  constructor(private readonly browseJobRepository: BrowseJobRepository) {}

  async viewListJob(
    filter: ViewListJobFilterType,
  ): Promise<ViewListJobResponseType> {
    const { jobs, total } = await this.browseJobRepository.getJobLists(filter);

    return {
      data: jobs,
      pagination: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }
}
