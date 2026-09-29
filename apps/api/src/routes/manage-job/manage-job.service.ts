import { Injectable } from '@nestjs/common';

import {
  BookmarkJobBodyType,
  RoleName,
  ViewBookmarkedJobFilterType,
  ViewBookmarkedJobResponseType,
} from '@shared/types';

import { ManageJobRepository } from './manage-job.repo';
import {
  BookmarkJobOnlyForFreelancerException,
  JobAlreadyBookmarkedException,
  JobNotFoundException,
} from './manage-job.error';

@Injectable()
export class ManageJobService {
  constructor(private readonly manageJobRepository: ManageJobRepository) {}

  private assertFreelancerRole(roleName: string) {
    if (roleName !== RoleName.FREELANCER) {
      throw BookmarkJobOnlyForFreelancerException();
    }
  }

  async viewBookmarkedJob(
    userId: number,
    roleName: string,
    filter: ViewBookmarkedJobFilterType,
  ): Promise<ViewBookmarkedJobResponseType> {
    this.assertFreelancerRole(roleName);

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
  }

  async bookmarkJob(
    userId: number,
    roleName: string,
    body: BookmarkJobBodyType,
  ): Promise<void> {
    this.assertFreelancerRole(roleName);

    const job = await this.manageJobRepository.findJobById(body.jobId);

    if (!job) {
      throw JobNotFoundException();
    }

    const bookmark = await this.manageJobRepository.findBookmark(
      userId,
      body.jobId,
    );

    if (bookmark) {
      throw JobAlreadyBookmarkedException();
    }

    await this.manageJobRepository.bookmarkJob(userId, body.jobId);
  }
}
