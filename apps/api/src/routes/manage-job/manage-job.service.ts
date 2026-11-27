import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import {
  CreateJobBodyType,
  JobType,
  ManageJobMessage,
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
  CannotBookmarkOwnJobException,
  CannotBookmarkUnavailableJobException,
  FailedToBookmarkJobException,
  FailedToCreateJobException,
  FailedToDeleteJobException,
  FailedToRemoveBookmarkException,
  FailedToUpdateJobException,
  FailedToPublishJobException,
  FailedToCloseJobException,
  FailedToReopenJobException,
  JobAlreadyBookmarkedException,
  JobNotFoundException,
  JobOnlyForClientException,
  ClientIdentityNotVerifiedException,
} from './manage-job.error';
import { ManageJobRepository } from './manage-job.repo';
import { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import { FastTextService } from '../../shared/services/fasttext.service';
import { CacheService } from '../../shared/services/cache.service';

@Injectable()
export class ManageJobService {
  constructor(
    private readonly manageJobRepository: ManageJobRepository,
    private readonly embeddingOutbox: EmbeddingOutboxService,
    private readonly fastTextService: FastTextService,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  private invalidateJobCategoryCache(): void {
    this.cacheService?.delByPrefix('job_categor');
  }

  private async validateJobLanguage(
    title?: string,
    description?: string,
  ): Promise<void> {
    const issues: Array<{ path: string; message: string }> = [];

    if (title) {
      const isTitleEnglish = await this.fastTextService.isEnglish(title);
      if (!isTitleEnglish) {
        issues.push({
          path: 'title',
          message: ManageJobMessage.JOB_TITLE_MUST_BE_ENGLISH,
        });
      }
    }

    if (description) {
      const isDescEnglish = await this.fastTextService.isEnglish(description);
      if (!isDescEnglish) {
        issues.push({
          path: 'description',
          message: ManageJobMessage.JOB_DESCRIPTION_MUST_BE_ENGLISH,
        });
      }
    }

    if (issues.length > 0) {
      throw new BadRequestException(issues);
    }
  }

  async checkLanguage(
    title?: string,
    description?: string,
    userId?: number,
    roleName?: string,
    excludeJobId?: number,
  ) {
    const titleIsEnglish = title
      ? await this.fastTextService.isEnglish(title)
      : true;
    const descIsEnglish = description
      ? await this.fastTextService.isEnglish(description)
      : true;

    let isDuplicate = false;
    if (userId && roleName === RoleName.CLIENT && title) {
      isDuplicate = await this.manageJobRepository.hasDuplicateTitle(
        userId,
        title,
        excludeJobId,
      );
    }

    return {
      title: { isEnglish: titleIsEnglish, isDuplicate },
      description: { isEnglish: descIsEnglish },
      isEnglish: titleIsEnglish && descIsEnglish,
      isDuplicate,
    };
  }

  private assertClientRole(roleName: string): void {
    if (roleName !== RoleName.CLIENT) {
      throw JobOnlyForClientException();
    }
  }

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

    if (job.clientId === userId) {
      throw CannotBookmarkOwnJobException();
    }

    const isExpired = job.expiryDate
      ? new Date(job.expiryDate) < new Date()
      : false;
    if (job.status !== JobStatus.OPEN || isExpired) {
      throw CannotBookmarkUnavailableJobException();
    }

    const bookmark = await this.manageJobRepository.findBookmark(
      userId,
      job.id,
    );

    if (bookmark) {
      throw JobAlreadyBookmarkedException();
    }

    try {
      await this.manageJobRepository.bookmarkJob(userId, job.id);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw JobAlreadyBookmarkedException();
      }
      throw FailedToBookmarkJobException();
    }
  }

  async viewClientJobs(
    userId: number,
    roleName: string,
    filter: ViewListJobParsedFilterType,
  ): Promise<ViewListJobResponseType> {
    if (roleName !== RoleName.CLIENT) {
      throw JobOnlyForClientException();
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

  async searchSkills(_roleName: string, search?: string) {
    return this.manageJobRepository.searchSkills(search);
  }

  async viewClientJobDetail(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<ViewJobDetailResType> {
    if (roleName !== RoleName.CLIENT) {
      throw JobOnlyForClientException();
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

  async removeBookmark(
    userId: number,
    slug: string,
    roleName?: string,
  ): Promise<void> {
    if (roleName !== undefined) {
      this.assertFreelancerRole(roleName);
    }

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

  async createJob(
    userId: number,
    roleName: string,
    body: CreateJobBodyType,
  ): Promise<JobType> {
    this.assertClientRole(roleName);
    const isVerified =
      await this.manageJobRepository.isIdentityVerified(userId);
    if (!isVerified) {
      throw ClientIdentityNotVerifiedException();
    }
    await this.validateJobLanguage(body.title, body.description);
    try {
      const job = await this.manageJobRepository.createJob(userId, body);
      this.invalidateJobCategoryCache();
      await this.embeddingOutbox.enqueueAndProcess({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: job.id,
      });
      return job;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateJobException();
      }

      throw error;
    }
  }

  async updateJob(
    userId: number,
    roleName: string,
    jobId: number,
    body: UpdateJobBodyType,
  ): Promise<JobType> {
    this.assertClientRole(roleName);
    await this.validateJobLanguage(body.title, body.description);

    try {
      const job = await this.manageJobRepository.updateJob(userId, jobId, body);
      this.invalidateJobCategoryCache();
      await this.embeddingOutbox.enqueueAndProcess({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: job.id,
      });
      return job;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToUpdateJobException();
      }

      throw error;
    }
  }

  async deleteJob(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<void> {
    this.assertClientRole(roleName);
    try {
      await this.manageJobRepository.deleteJob(userId, jobId);
      this.invalidateJobCategoryCache();
      await this.embeddingOutbox.enqueueAndProcess({
        eventType: 'DELETE',
        documentType: 'JOB',
        documentId: jobId,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToDeleteJobException();
      }

      throw error;
    }
  }

  async publishJob(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<JobType> {
    this.assertClientRole(roleName);

    const jobDetail = await this.manageJobRepository.getClientJobDetail(
      userId,
      jobId,
    );
    if (!jobDetail) {
      throw JobNotFoundException();
    }
    await this.validateJobLanguage(
      jobDetail.title,
      jobDetail.description ?? '',
    );

    try {
      const job = await this.manageJobRepository.publishJob(userId, jobId);
      this.invalidateJobCategoryCache();
      await this.embeddingOutbox.enqueueAndProcess({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: job.id,
      });
      return job;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToPublishJobException();
      }

      throw error;
    }
  }

  async closeJob(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<JobType> {
    this.assertClientRole(roleName);

    try {
      const job = await this.manageJobRepository.closeJob(userId, jobId);
      this.invalidateJobCategoryCache();
      await this.embeddingOutbox.enqueueAndProcess({
        eventType: 'DELETE',
        documentType: 'JOB',
        documentId: job.id,
      });
      return job;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCloseJobException();
      }

      throw error;
    }
  }

  async reopenJob(
    userId: number,
    roleName: string,
    jobId: number,
  ): Promise<JobType> {
    this.assertClientRole(roleName);

    try {
      const job = await this.manageJobRepository.reopenJob(userId, jobId);
      this.invalidateJobCategoryCache();
      await this.embeddingOutbox.enqueueAndProcess({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: job.id,
      });
      return job;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToReopenJobException();
      }

      throw error;
    }
  }
}
