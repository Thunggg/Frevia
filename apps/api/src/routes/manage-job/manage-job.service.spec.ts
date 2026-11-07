import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  CreateJobBodySchema,
  ManageJobMessage,
  RoleName,
  type JobType,
} from '@shared/types';
import type { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import type { ManageJobRepository } from './manage-job.repo';
import { ManageJobService } from './manage-job.service';
import {
  BookmarkJobOnlyForFreelancerException,
  BookmarkNotFoundException,
  CannotBookmarkOwnJobException,
  CannotBookmarkUnavailableJobException,
  JobAlreadyBookmarkedException,
  JobCannotBeClosedException,
  JobCannotBeDeletedWithActiveContractException,
  JobCannotBePublishedException,
  JobCannotBeReopenedException,
  JobNotFoundException,
  JobOnlyForClientException,
  JobReopenPeriodExpiredException,
  JobCategoryOnlyOneException,
} from './manage-job.error';

const mockJob = { id: 5, status: 'OPEN' } as unknown as JobType;

describe('ManageJobService', () => {
  let repository: {
    createJob: jest.Mock;
    updateJob: jest.Mock;
    deleteJob: jest.Mock;
    publishJob: jest.Mock;
    closeJob: jest.Mock;
    reopenJob: jest.Mock;
    getBookmarkedJobLists: jest.Mock;
    findJobBySlug: jest.Mock;
    findBookmark: jest.Mock;
    bookmarkJob: jest.Mock;
    removeBookmark: jest.Mock;
  };
  let embeddingOutbox: {
    enqueueAndProcess: jest.Mock;
  };
  let service: ManageJobService;

  beforeEach(() => {
    repository = {
      createJob: jest.fn().mockResolvedValue(mockJob),
      updateJob: jest.fn().mockResolvedValue(mockJob),
      deleteJob: jest.fn().mockResolvedValue(undefined),
      publishJob: jest.fn().mockResolvedValue({ ...mockJob, status: 'OPEN' }),
      closeJob: jest.fn().mockResolvedValue({ ...mockJob, status: 'CLOSED' }),
      reopenJob: jest.fn().mockResolvedValue({ ...mockJob, status: 'OPEN' }),
      getBookmarkedJobLists: jest.fn(),
      findJobBySlug: jest.fn(),
      findBookmark: jest.fn(),
      bookmarkJob: jest.fn(),
      removeBookmark: jest.fn(),
    };
    embeddingOutbox = {
      enqueueAndProcess: jest.fn().mockResolvedValue(undefined),
    };
    service = new ManageJobService(
      repository as unknown as ManageJobRepository,
      embeddingOutbox as unknown as EmbeddingOutboxService,
    );
  });

  describe('createJob', () => {
    it('throws if role is not CLIENT', async () => {
      await expect(
        service.createJob(1, RoleName.FREELANCER, {} as never),
      ).rejects.toThrow(JobOnlyForClientException());
    });
    it('queues an upsert after creating a job', async () => {
      await service.createJob(1, RoleName.CLIENT, {} as never);

      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });
  });

  describe('updateJob', () => {
    it('throws if role is not CLIENT', async () => {
      await expect(
        service.updateJob(1, RoleName.FREELANCER, 5, {} as never),
      ).rejects.toThrow(JobOnlyForClientException());
    });
    it('queues an upsert after updating a job', async () => {
      await service.updateJob(1, RoleName.CLIENT, 5, {} as never);

      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });
  });

  describe('deleteJob', () => {
    it('throws if role is not CLIENT', async () => {
      await expect(
        service.deleteJob(1, RoleName.FREELANCER, 5),
      ).rejects.toThrow(JobOnlyForClientException());
    });
    it('queues a delete after removing a job', async () => {
      await service.deleteJob(1, RoleName.CLIENT, 5);

      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'DELETE',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    it('rethrows JobCannotBeDeletedWithActiveContractException', async () => {
      repository.deleteJob.mockRejectedValueOnce(
        JobCannotBeDeletedWithActiveContractException(),
      );

      await expect(service.deleteJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBeDeletedWithActiveContractException(),
      );
    });
  });

  describe('publishJob', () => {
    it('throws if role is not CLIENT', async () => {
      await expect(
        service.publishJob(1, RoleName.FREELANCER, 5),
      ).rejects.toThrow(JobOnlyForClientException());
    });

    it('queues an upsert when a job is published', async () => {
      await service.publishJob(1, RoleName.CLIENT, 5);

      expect(repository.publishJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    it('rethrows error from repository', async () => {
      repository.publishJob.mockRejectedValueOnce(
        JobCannotBePublishedException(),
      );

      await expect(service.publishJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBePublishedException(),
      );
    });
  });

  describe('closeJob', () => {
    it('throws if role is not CLIENT', async () => {
      await expect(service.closeJob(1, RoleName.FREELANCER, 5)).rejects.toThrow(
        JobOnlyForClientException(),
      );
    });

    it('queues a delete when a job is closed', async () => {
      await service.closeJob(1, RoleName.CLIENT, 5);

      expect(repository.closeJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'DELETE',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    it('rethrows error from repository', async () => {
      repository.closeJob.mockRejectedValueOnce(JobCannotBeClosedException());

      await expect(service.closeJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBeClosedException(),
      );
    });
  });

  describe('reopenJob', () => {
    it('throws if role is not CLIENT', async () => {
      await expect(
        service.reopenJob(1, RoleName.FREELANCER, 5),
      ).rejects.toThrow(JobOnlyForClientException());
    });

    it('queues an upsert when a job is reopened', async () => {
      await service.reopenJob(1, RoleName.CLIENT, 5);

      expect(repository.reopenJob).toHaveBeenCalledWith(1, 5);
      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });

    it('rethrows error from repository', async () => {
      repository.reopenJob.mockRejectedValueOnce(
        JobCannotBeReopenedException(),
      );

      await expect(service.reopenJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobCannotBeReopenedException(),
      );
    });

    it('rethrows error when reopen period expired (>60 days)', async () => {
      repository.reopenJob.mockRejectedValueOnce(
        JobReopenPeriodExpiredException(),
      );

      await expect(service.reopenJob(1, RoleName.CLIENT, 5)).rejects.toThrow(
        JobReopenPeriodExpiredException(),
      );
    });
  });
  describe('CreateJobBodySchema single category validation (BR-J53)', () => {
    it('fails when more than 1 category is selected', () => {
      const result = CreateJobBodySchema.safeParse({
        title: 'Backend Developer Position',
        description: 'We need a senior NestJS engineer',
        budgetMin: 500,
        budgetMax: 1000,
        budgetType: 'FIXED_PRICE',
        skills: [1, 2],
        jobCategories: [1, 2],
        hiringType: 'SINGLE',
        positionsRequired: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) => issue.message === ManageJobMessage.JOB_CATEGORY_ONLY_ONE,
          ),
        ).toBe(true);
      }
    });

    it('succeeds when at most 1 category is selected', () => {
      const result = CreateJobBodySchema.safeParse({
        title: 'Backend Developer Position',
        description: 'We need a senior NestJS engineer',
        budgetMin: 500,
        budgetMax: 1000,
        budgetType: 'FIXED_PRICE',
        skills: [1, 2],
        jobCategories: [1],
        hiringType: 'SINGLE',
        positionsRequired: 1,
      });

      expect(result.success).toBe(true);
    });

    it('JobCategoryOnlyOneException returns proper message', () => {
      const exception = JobCategoryOnlyOneException();
      expect(exception.message).toBe(ManageJobMessage.JOB_CATEGORY_ONLY_ONE);
    });
  });

  describe('viewBookmarkedJob (UC-12.01)', () => {
    it('throws if role is not FREELANCER', async () => {
      await expect(
        service.viewBookmarkedJob(1, RoleName.CLIENT, { page: 1, limit: 10 }),
      ).rejects.toThrow(BookmarkJobOnlyForFreelancerException());
    });

    it('returns bookmarked jobs with pagination including closed jobs', async () => {
      const mockJobs = [
        { id: 1, title: 'Job 1', status: 'CLOSED' },
        { id: 2, title: 'Job 2', status: 'OPEN' },
      ];
      repository.getBookmarkedJobLists.mockResolvedValueOnce({
        jobs: mockJobs,
        total: 2,
      });

      const result = await service.viewBookmarkedJob(1, RoleName.FREELANCER, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('bookmarkJob (UC-12.02)', () => {
    it('throws if role is not FREELANCER', async () => {
      await expect(
        service.bookmarkJob(1, RoleName.CLIENT, 'slug-1'),
      ).rejects.toThrow(BookmarkJobOnlyForFreelancerException());
    });

    it('throws JobNotFoundException if job does not exist', async () => {
      repository.findJobBySlug.mockResolvedValueOnce(null);

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'non-existent-slug'),
      ).rejects.toThrow(JobNotFoundException());
    });

    it('throws CannotBookmarkOwnJobException if user is the job owner', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 1,
        status: 'OPEN',
        expiryDate: null,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'own-job-slug'),
      ).rejects.toThrow(CannotBookmarkOwnJobException());
    });

    it('throws CannotBookmarkUnavailableJobException if job is not OPEN', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'CLOSED',
        expiryDate: null,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'closed-job-slug'),
      ).rejects.toThrow(CannotBookmarkUnavailableJobException());
    });

    it('throws CannotBookmarkUnavailableJobException if job is expired', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'OPEN',
        expiryDate: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'expired-job-slug'),
      ).rejects.toThrow(CannotBookmarkUnavailableJobException());
    });

    it('throws JobAlreadyBookmarkedException if already bookmarked', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'OPEN',
        expiryDate: null,
      });
      repository.findBookmark.mockResolvedValueOnce({ userId: 1, jobId: 10 });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'job-slug'),
      ).rejects.toThrow(JobAlreadyBookmarkedException());
    });

    it('handles concurrency duplicate by catching P2002 error', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'OPEN',
        expiryDate: null,
      });
      repository.findBookmark.mockResolvedValueOnce(null);
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      repository.bookmarkJob.mockRejectedValueOnce(prismaError);

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'job-slug'),
      ).rejects.toThrow(JobAlreadyBookmarkedException());
    });

    it('successfully bookmarks an open job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'OPEN',
        expiryDate: null,
      });
      repository.findBookmark.mockResolvedValueOnce(null);
      repository.bookmarkJob.mockResolvedValueOnce({ userId: 1, jobId: 10 });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'job-slug'),
      ).resolves.toBeUndefined();

      expect(repository.bookmarkJob).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('removeBookmark (UC-12.03)', () => {
    it('throws JobNotFoundException if job is not found', async () => {
      repository.findJobBySlug.mockResolvedValueOnce(null);

      await expect(
        service.removeBookmark(1, 'non-existent-slug'),
      ).rejects.toThrow(JobNotFoundException());
    });

    it('throws BookmarkNotFoundException if not bookmarked', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'CLOSED',
        expiryDate: null,
      });
      repository.findBookmark.mockResolvedValueOnce(null);

      await expect(service.removeBookmark(1, 'job-slug')).rejects.toThrow(
        BookmarkNotFoundException(),
      );
    });

    it('successfully removes bookmark on any existing job (even CLOSED)', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        id: 10,
        clientId: 2,
        status: 'CLOSED',
        expiryDate: null,
      });
      repository.findBookmark.mockResolvedValueOnce({ userId: 1, jobId: 10 });
      repository.removeBookmark.mockResolvedValueOnce({ userId: 1, jobId: 10 });

      await expect(
        service.removeBookmark(1, 'job-slug'),
      ).resolves.toBeUndefined();

      expect(repository.removeBookmark).toHaveBeenCalledWith(1, 10);
    });
  });
});
