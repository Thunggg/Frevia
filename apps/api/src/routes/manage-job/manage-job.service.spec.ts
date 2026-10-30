import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/types';
import { ManageJobRepository } from './manage-job.repo';
import { ManageJobService } from './manage-job.service';
import {
  JobCannotBeClosedException,
  JobCannotBePublishedException,
  JobCannotBeReopenedException,
  JobOnlyForClientException,
} from './manage-job.error';

describe('ManageJobService', () => {
  let service: ManageJobService;
  const publishJobMock = jest.fn();
  const closeJobMock = jest.fn();
  const reopenJobMock = jest.fn();

  const mockJob = {
    id: 1,
    clientId: 10,
    title: 'Senior TypeScript Engineer',
    slug: 'senior-typescript-engineer-1',
    description: 'Looking for a senior TS engineer',
    budgetMin: 1000,
    budgetMax: 2000,
    budgetType: 'FIXED_PRICE' as const,
    deadline: new Date(),
    status: 'OPEN' as const,
    featured: false,
    expiryDate: new Date(),
    hiringType: 'SINGLE' as const,
    positionsRequired: 1,
    positionsFilled: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockRepo = {
      publishJob: publishJobMock,
      closeJob: closeJobMock,
      reopenJob: reopenJobMock,
      createJob: jest.fn(),
      updateJob: jest.fn(),
      deleteJob: jest.fn(),
      getClientJobLists: jest.fn(),
      getClientJobDetail: jest.fn(),
      searchSkills: jest.fn(),
      getBookmarkedJobLists: jest.fn(),
      findJobBySlug: jest.fn(),
      findBookmark: jest.fn(),
      bookmarkJob: jest.fn(),
      removeBookmark: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManageJobService,
        {
          provide: ManageJobRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ManageJobService>(ManageJobService);
  });

  describe('publishJob', () => {
    it('should throw if role is not CLIENT', async () => {
      await expect(
        service.publishJob(10, RoleName.FREELANCER, 1),
      ).rejects.toThrow(JobOnlyForClientException());
    });

    it('should successfully publish a draft job', async () => {
      publishJobMock.mockResolvedValueOnce({
        ...mockJob,
        status: 'OPEN',
      });

      const result = await service.publishJob(10, RoleName.CLIENT, 1);
      expect(result.status).toBe('OPEN');
      expect(publishJobMock).toHaveBeenCalledWith(10, 1);
    });

    it('should rethrow error from repository', async () => {
      publishJobMock.mockRejectedValueOnce(JobCannotBePublishedException());

      await expect(service.publishJob(10, RoleName.CLIENT, 1)).rejects.toThrow(
        JobCannotBePublishedException(),
      );
    });
  });

  describe('closeJob', () => {
    it('should throw if role is not CLIENT', async () => {
      await expect(
        service.closeJob(10, RoleName.FREELANCER, 1),
      ).rejects.toThrow(JobOnlyForClientException());
    });

    it('should successfully close an open job', async () => {
      closeJobMock.mockResolvedValueOnce({
        ...mockJob,
        status: 'CLOSED',
      });

      const result = await service.closeJob(10, RoleName.CLIENT, 1);
      expect(result.status).toBe('CLOSED');
      expect(closeJobMock).toHaveBeenCalledWith(10, 1);
    });

    it('should rethrow error from repository', async () => {
      closeJobMock.mockRejectedValueOnce(JobCannotBeClosedException());

      await expect(service.closeJob(10, RoleName.CLIENT, 1)).rejects.toThrow(
        JobCannotBeClosedException(),
      );
    });
  });

  describe('reopenJob', () => {
    it('should throw if role is not CLIENT', async () => {
      await expect(
        service.reopenJob(10, RoleName.FREELANCER, 1),
      ).rejects.toThrow(JobOnlyForClientException());
    });

    it('should successfully reopen a closed job', async () => {
      reopenJobMock.mockResolvedValueOnce({
        ...mockJob,
        status: 'OPEN',
      });

      const result = await service.reopenJob(10, RoleName.CLIENT, 1);
      expect(result.status).toBe('OPEN');
      expect(reopenJobMock).toHaveBeenCalledWith(10, 1);
    });

    it('should rethrow error from repository', async () => {
      reopenJobMock.mockRejectedValueOnce(JobCannotBeReopenedException());

      await expect(service.reopenJob(10, RoleName.CLIENT, 1)).rejects.toThrow(
        JobCannotBeReopenedException(),
      );
    });
  });
});
