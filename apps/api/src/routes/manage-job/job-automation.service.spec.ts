import { NotificationType } from '@prisma/client';
import { JobAutomationService } from './job-automation.service';
import type { ManageJobRepository } from './manage-job.repo';
import type { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import type { CacheService } from '../../shared/services/cache.service';
import type { AppNotificationService } from '../../shared/services/app-notification.service';

describe('JobAutomationService', () => {
  let repository: {
    autoCloseExpiredJobs: jest.Mock;
    cleanupTemporaryData: jest.Mock;
  };
  let embeddingOutbox: { enqueueAndProcess: jest.Mock };
  let cacheService: { delByPrefix: jest.Mock };
  let notificationService: { sendMany: jest.Mock };
  let service: JobAutomationService;

  beforeEach(() => {
    repository = {
      autoCloseExpiredJobs: jest
        .fn()
        .mockResolvedValue({ expiredJobs: [], expiredProposals: [] }),
      cleanupTemporaryData: jest.fn().mockResolvedValue({
        verificationCodesDeleted: 3,
        sessionsDeleted: 2,
        outboxEventsDeleted: 5,
      }),
    };
    embeddingOutbox = {
      enqueueAndProcess: jest.fn().mockResolvedValue(undefined),
    };
    cacheService = {
      delByPrefix: jest.fn(),
    };
    notificationService = {
      sendMany: jest.fn().mockResolvedValue([]),
    };

    service = new JobAutomationService(
      repository as unknown as ManageJobRepository,
      embeddingOutbox as unknown as EmbeddingOutboxService,
      cacheService as unknown as CacheService,
      notificationService as unknown as AppNotificationService,
    );
  });

  it('expires overdue jobs, updates embeddings, and notifies client and applicants', async () => {
    repository.autoCloseExpiredJobs.mockResolvedValueOnce({
      expiredJobs: [
        {
          id: 10,
          clientId: 100,
          title: 'Build API',
          slug: 'build-api-10',
        },
      ],
      expiredProposals: [{ jobId: 10, freelancerId: 201 }],
    });

    await service.runExpiredJobsSweep();

    expect(cacheService.delByPrefix).toHaveBeenCalledWith('job_categor');
    expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'DELETE',
      documentType: 'JOB',
      documentId: 10,
    });
    expect(notificationService.sendMany).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 100,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Job expired',
      }),
      expect.objectContaining({
        userId: 201,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Job expired',
      }),
    ]);
  });

  it('does nothing when no jobs are expired', async () => {
    await service.runExpiredJobsSweep();

    expect(embeddingOutbox.enqueueAndProcess).not.toHaveBeenCalled();
    expect(notificationService.sendMany).not.toHaveBeenCalled();
  });

  it('runs daily temporary data cleanup', async () => {
    await service.runDailyCleanup();

    expect(repository.cleanupTemporaryData).toHaveBeenCalledTimes(1);
  });
});
