import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import {
  ChangeJobStatusBodyType,
  ChangeJobStatusResponseType,
  CreateJobBodyType,
  JobType,
  RoleName,
  UpdateJobBodyType,
  ViewBookmarkedJobParsedFilterType,
  ViewBookmarkedJobResponseType,
  ViewListJobParsedFilterType,
  ViewListJobResponseType,
  ViewJobDetailResType,
} from '@shared/types';

import {
  BookmarkJobOnlyForFreelancerException,
  BookmarkNotFoundException,
  FailedToChangeJobStatusException,
  FailedToCreateJobException,
  FailedToDeleteJobException,
  FailedToRemoveBookmarkException,
  FailedToUpdateJobException,
  JobAlreadyBookmarkedException,
  JobNotFoundException,
} from './manage-job.error';
import { ManageJobRepository } from './manage-job.repo';

@Injectable()
export class ManageJobService {
  constructor(private readonly manageJobRepository: ManageJobRepository) {}

  private assertFreelancerRole(roleName: string): void {
    if (roleName !== RoleName.FREELANCER) {
      throw BookmarkJobOnlyForFreelancerException();
    }
  }

  async viewBookmarkedJob(
    userId: number,
    roleName: string,
    filter: ViewBookmarkedJobParsedFilterType,
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
    slug: string,
  ): Promise<void> {
    this.assertFreelancerRole(roleName);

    const job = await this.manageJobRepository.findJobBySlug(slug);

    if (!job) {
      throw JobNotFoundException();
    }

    const bookmark = await this.manageJobRepository.findBookmark(
      userId,
      job.id,
    );

    if (bookmark) {
      throw JobAlreadyBookmarkedException();
    }

    await this.manageJobRepository.bookmarkJob(userId, job.id);
  }

  async viewClientJobs(
    userId: number,
    roleName: string,
    filter: ViewListJobParsedFilterType,
  ): Promise<ViewListJobResponseType> {
    if (roleName !== RoleName.CLIENT) {
      throw BookmarkJobOnlyForFreelancerException();
    }

    const { jobs, total } = await this.manageJobRepository.getClientJobLists(
      userId,
      filter,
    );
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

  async searchSkills(roleName: string, search?: string) {
    if (roleName !== RoleName.CLIENT) {
      throw BookmarkJobOnlyForFreelancerException();
    }

    return this.manageJobRepository.searchSkills(search);
  }

  async viewClientJobDetail(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<ViewJobDetailResType> {
    if (roleName !== RoleName.CLIENT) {
      throw BookmarkJobOnlyForFreelancerException();
    }

    const job = await this.manageJobRepository.getClientJobDetail(
      userId,
      jobId,
    );
    if (!job) throw JobNotFoundException();
    return job;
  }

  async getBookmarkStatus(
    userId: number,
    roleName: string,
    slug: string,
  ): Promise<{ isBookmarked: boolean }> {
    this.assertFreelancerRole(roleName);

    const job = await this.manageJobRepository.findJobBySlug(slug);

    if (!job) {
      throw JobNotFoundException();
    }

    const bookmark = await this.manageJobRepository.findBookmark(
      userId,
      job.id,
    );

    return { isBookmarked: Boolean(bookmark) };
  }

  async removeBookmark(userId: number, slug: string): Promise<void> {
    try {
      const job = await this.manageJobRepository.findJobBySlug(slug);

      if (!job) {
        throw JobNotFoundException();
      }

      const bookmark = await this.manageJobRepository.findBookmark(
        userId,
        job.id,
      );

      if (!bookmark) {
        throw BookmarkNotFoundException();
      }

      await this.manageJobRepository.removeBookmark(userId, job.id);
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

  async updateJob(
    userId: number,
    jobId: number,
    body: UpdateJobBodyType,
  ): Promise<JobType> {
    try {
      return await this.manageJobRepository.updateJob(userId, jobId, body);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateJobException();
      }

      throw error;
    }
  }

  async deleteJob(userId: number, jobId: number): Promise<void> {
    try {
      await this.manageJobRepository.deleteJob(userId, jobId);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToDeleteJobException();
      }

      throw error;
    }
  }

  async changeJobStatus(
    userId: number,
    jobId: number,
    body: ChangeJobStatusBodyType,
  ): Promise<ChangeJobStatusResponseType> {
    try {
      return await this.manageJobRepository.changeJobStatus(
        userId,
        jobId,
        body.status,
      );
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToChangeJobStatusException();
      }

      throw error;
    }
  }
}
