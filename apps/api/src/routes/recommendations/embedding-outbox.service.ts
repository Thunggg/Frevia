import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { AiDocumentType, OutboxEventType } from '@prisma/client';

import { PrismaService } from '../../shared/services/prisma.service';
import { RecommendationIndexService } from './recommendation-index.service';

const DEFAULT_BATCH = 25;
const MAX_ATTEMPTS = 5;
const WORKER_INTERVAL_MS = 30_000;

export type EmbeddingOutboxInput = {
  eventType: OutboxEventType;
  documentType: AiDocumentType;
  documentId: number;
  documentVersion?: number;
};

export type EmbeddingOutboxProcessResult = {
  processed: number;
  failed: number;
};

/**
 * Transactional-outbox worker đồng bộ index sang ChromaDB (§6.3, §16).
 *
 * Write-flow (job/CV) chỉ ghi một dòng `EmbeddingOutboxEvent` rồi thử xử lý ngay
 * (best-effort). Nếu AI service không sẵn sàng, sự kiện còn lại ở trạng thái
 * `PENDING`/`FAILED` và được worker nền (hoặc endpoint vận hành) retry — nhờ đó
 * index không phụ thuộc việc request nghiệp vụ có gọi AI thành công hay không.
 */
@Injectable()
export class EmbeddingOutboxService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(EmbeddingOutboxService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly index: RecommendationIndexService,
  ) {}

  onApplicationBootstrap(): void {
    if (process.env.FREVIA_OUTBOX_WORKER === 'false') {
      return;
    }

    void this.recoverStuck().catch(() => undefined);
    this.timer = setInterval(() => {
      void this.tick();
    }, WORKER_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** Ghi một sự kiện đồng bộ vào outbox. */
  async enqueue(input: EmbeddingOutboxInput): Promise<void> {
    await this.prisma.embeddingOutboxEvent.create({
      data: {
        eventType: input.eventType,
        documentType: input.documentType,
        documentId: input.documentId,
        documentVersion: input.documentVersion ?? 1,
      },
    });
  }

  /** Ghi sự kiện rồi xử lý ngay; lỗi AI không làm hỏng request nghiệp vụ. */
  async enqueueAndProcess(input: EmbeddingOutboxInput): Promise<void> {
    await this.enqueue(input);
    await this.processPending().catch((error: unknown) => {
      this.logger.warn('Outbox processing failed', error);
    });
  }

  /** Xử lý các sự kiện PENDING/FAILED chưa vượt số lần thử tối đa. */
  async processPending(
    limit: number = DEFAULT_BATCH,
  ): Promise<EmbeddingOutboxProcessResult> {
    const events = await this.prisma.embeddingOutboxEvent.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        attemptCount: { lt: MAX_ATTEMPTS },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let processed = 0;
    let failed = 0;
    for (const event of events) {
      const ok = await this.processEvent(event);
      if (ok) processed += 1;
      else failed += 1;
    }

    return { processed, failed };
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.processPending();
    } catch (error) {
      this.logger.warn('Outbox tick failed', error);
    } finally {
      this.running = false;
    }
  }

  private async processEvent(event: {
    id: number;
    eventType: OutboxEventType;
    documentType: AiDocumentType;
    documentId: number;
  }): Promise<boolean> {
    await this.prisma.embeddingOutboxEvent.update({
      where: { id: event.id },
      data: { status: 'PROCESSING' },
    });

    try {
      await this.dispatch(event);
      await this.prisma.embeddingOutboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          lastError: null,
        },
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.embeddingOutboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'FAILED',
          attemptCount: { increment: 1 },
          lastError: message.slice(0, 500),
        },
      });
      return false;
    }
  }

  private async dispatch(event: {
    eventType: OutboxEventType;
    documentType: AiDocumentType;
    documentId: number;
  }): Promise<void> {
    if (event.documentType === 'JOB') {
      if (event.eventType === 'DELETE')
        await this.index.removeJob(event.documentId);
      else await this.index.syncJob(event.documentId);
      return;
    }

    if (event.eventType === 'DELETE')
      await this.index.removeCv(event.documentId);
    else await this.index.syncCv(event.documentId);
  }

  /** Khôi phục sự kiện kẹt ở PROCESSING (worker chết giữa chừng) về PENDING. */
  private async recoverStuck(): Promise<void> {
    await this.prisma.embeddingOutboxEvent.updateMany({
      where: { status: 'PROCESSING' },
      data: { status: 'PENDING' },
    });
  }
}
