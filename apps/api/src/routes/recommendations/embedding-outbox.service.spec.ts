import type { PrismaService } from '../../shared/services/prisma.service';
import { EmbeddingOutboxService } from './embedding-outbox.service';
import type { RecommendationIndexService } from './recommendation-index.service';

const pendingEvent = {
  id: 1,
  eventType: 'UPSERT',
  documentType: 'JOB',
  documentId: 5,
  status: 'PENDING',
  attemptCount: 0,
};

describe('EmbeddingOutboxService', () => {
  let prisma: {
    embeddingOutboxEvent: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let index: {
    syncJob: jest.Mock;
    syncCv: jest.Mock;
    removeJob: jest.Mock;
    removeCv: jest.Mock;
  };
  let service: EmbeddingOutboxService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      embeddingOutboxEvent: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    index = {
      syncJob: jest.fn().mockResolvedValue(true),
      syncCv: jest.fn().mockResolvedValue(true),
      removeJob: jest.fn().mockResolvedValue(undefined),
      removeCv: jest.fn().mockResolvedValue(undefined),
    };
    service = new EmbeddingOutboxService(
      prisma as unknown as PrismaService,
      index as unknown as RecommendationIndexService,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('enqueues an event with a default document version', async () => {
    await service.enqueue({
      eventType: 'UPSERT',
      documentType: 'CV',
      documentId: 11,
    });

    expect(prisma.embeddingOutboxEvent.create).toHaveBeenCalledWith({
      data: {
        eventType: 'UPSERT',
        documentType: 'CV',
        documentId: 11,
        documentVersion: 1,
      },
    });
  });

  it('enqueues then processes pending events', async () => {
    await service.enqueueAndProcess({
      eventType: 'DELETE',
      documentType: 'JOB',
      documentId: 5,
    });

    expect(prisma.embeddingOutboxEvent.create).toHaveBeenCalled();
    expect(prisma.embeddingOutboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ['PENDING', 'FAILED'] },
          attemptCount: { lt: 5 },
        },
      }),
    );
  });

  it('upserts a job event and marks it processed', async () => {
    prisma.embeddingOutboxEvent.findMany.mockResolvedValue([pendingEvent]);

    await expect(service.processPending()).resolves.toEqual({
      processed: 1,
      failed: 0,
    });

    expect(index.syncJob).toHaveBeenCalledWith(5);
    expect(prisma.embeddingOutboxEvent.update).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { status: 'PROCESSING' },
    });
    expect(prisma.embeddingOutboxEvent.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'PROCESSED' }),
      }),
    );
  });

  it('routes delete events to the index removal', async () => {
    prisma.embeddingOutboxEvent.findMany.mockResolvedValue([
      { ...pendingEvent, eventType: 'DELETE', documentType: 'CV' },
    ]);

    await service.processPending();

    expect(index.removeCv).toHaveBeenCalledWith(5);
    expect(index.syncCv).not.toHaveBeenCalled();
  });

  it('marks a failed event with the error and an incremented attempt count', async () => {
    prisma.embeddingOutboxEvent.findMany.mockResolvedValue([pendingEvent]);
    index.syncJob.mockRejectedValue(new Error('AI down'));

    await expect(service.processPending()).resolves.toEqual({
      processed: 0,
      failed: 1,
    });

    expect(prisma.embeddingOutboxEvent.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'FAILED',
          attemptCount: { increment: 1 },
          lastError: 'AI down',
        }),
      }),
    );
  });

  it('recovers stuck events and starts the worker on bootstrap', () => {
    service.onApplicationBootstrap();

    expect(prisma.embeddingOutboxEvent.updateMany).toHaveBeenCalledWith({
      where: { status: 'PROCESSING' },
      data: { status: 'PENDING' },
    });
  });

  it('does not start the worker when disabled by env', () => {
    process.env.FREVIA_OUTBOX_WORKER = 'false';
    try {
      service.onApplicationBootstrap();

      expect(prisma.embeddingOutboxEvent.updateMany).not.toHaveBeenCalled();
    } finally {
      delete process.env.FREVIA_OUTBOX_WORKER;
    }
  });
});
