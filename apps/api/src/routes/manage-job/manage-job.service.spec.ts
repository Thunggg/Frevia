import type { JobType } from '@shared/types';

import type { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import type { ManageJobRepository } from './manage-job.repo';
import { ManageJobService } from './manage-job.service';

const job = { id: 5 } as unknown as JobType;

describe('ManageJobService index sync', () => {
  let repository: {
    createJob: jest.Mock;
    updateJob: jest.Mock;
    deleteJob: jest.Mock;
    changeJobStatus: jest.Mock;
  };
  let embeddingOutbox: {
    enqueueAndProcess: jest.Mock;
  };
  let service: ManageJobService;

  beforeEach(() => {
    repository = {
      createJob: jest.fn().mockResolvedValue(job),
      updateJob: jest.fn().mockResolvedValue(job),
      deleteJob: jest.fn().mockResolvedValue(undefined),
      changeJobStatus: jest.fn().mockResolvedValue(job),
    };
    embeddingOutbox = {
      enqueueAndProcess: jest.fn().mockResolvedValue(undefined),
    };
    service = new ManageJobService(
      repository as unknown as ManageJobRepository,
      embeddingOutbox as unknown as EmbeddingOutboxService,
    );
  });

  it('queues an upsert after creating a job', async () => {
    await service.createJob(1, {} as never);

    expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'UPSERT',
      documentType: 'JOB',
      documentId: 5,
    });
  });

  it('queues an upsert after updating a job', async () => {
    await service.updateJob(1, 5, {} as never);

    expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'UPSERT',
      documentType: 'JOB',
      documentId: 5,
    });
  });

  it('queues a delete after removing a job', async () => {
    await service.deleteJob(1, 5);

    expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'DELETE',
      documentType: 'JOB',
      documentId: 5,
    });
  });

  it('queues an upsert when a job is switched to OPEN', async () => {
    await service.changeJobStatus(1, 5, { status: 'OPEN' });

    expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'UPSERT',
      documentType: 'JOB',
      documentId: 5,
    });
  });

  it('queues a delete when a job leaves OPEN', async () => {
    await service.changeJobStatus(1, 5, { status: 'CLOSED' });

    expect(embeddingOutbox.enqueueAndProcess).toHaveBeenCalledWith({
      eventType: 'DELETE',
      documentType: 'JOB',
      documentId: 5,
    });
  });
});
