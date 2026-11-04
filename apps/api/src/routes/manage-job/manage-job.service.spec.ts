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
  JobCannotBeClosedException,
  JobCannotBeDeletedWithActiveContractException,
  JobCannotBePublishedException,
  JobCannotBeReopenedException,
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
    it('queues an upsert after creating a job', async () => {
      await service.createJob(1, {} as never);

      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });
  });

  describe('updateJob', () => {
    it('queues an upsert after updating a job', async () => {
      await service.updateJob(1, 5, {} as never);

      expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
        eventType: 'UPSERT',
        documentType: 'JOB',
        documentId: 5,
      });
    });
  });

  describe('deleteJob', () => {
    it('queues a delete after removing a job', async () => {
      await service.deleteJob(1, 5);

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

      await expect(service.deleteJob(1, 5)).rejects.toThrow(
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
});
