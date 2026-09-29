import { Injectable } from '@nestjs/common';

import {
  CreateJobBodyType,
  JobType,
  RoleName,
  ViewBookmarkedJobFilterType,
  ViewBookmarkedJobResponseType,
} from '@shared/types';

import { ManageJobRepository } from './manage-job.repo';
import {
  BookmarkJobOnlyForFreelancerException,
  BookmarkNotFoundException,
  FailedToCreateJobException,
  FailedToRemoveBookmarkException,
  JobAlreadyBookmarkedException,
  JobNotFoundException,
} from './manage-job.error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

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
    jobId: number,
  ): Promise<void> {
    this.assertFreelancerRole(roleName);

    const job = await this.manageJobRepository.findJobById(jobId);

    if (!job) {
      throw JobNotFoundException();
    }

    const bookmark = await this.manageJobRepository.findBookmark(userId, jobId);

    if (bookmark) {
      throw JobAlreadyBookmarkedException();
    }

    await this.manageJobRepository.bookmarkJob(userId, jobId);
  }

  async removeBookmark(userId: number, jobId: number): Promise<void> {
    try {
      const bookmark = await this.manageJobRepository.findBookmark(
        userId,
        jobId,
      );

      if (!bookmark) {
        throw BookmarkNotFoundException();
      }

      await this.manageJobRepository.removeBookmark(userId, jobId);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToRemoveBookmarkException();
      }

      throw error;
    }
  }

  async createJob(userId: number, body: CreateJobBodyType): Promise<JobType> {
    try {
      return await this.manageJobRepository.createJob(userId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateJobException();
      }

      throw error;
    }
  }
}
