import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';

import { AppNotificationService } from '../../shared/services/app-notification.service';
import { CacheService } from '../../shared/services/cache.service';
import { EmbeddingOutboxService } from '../recommendations/embedding-outbox.service';
import { ManageJobRepository } from './manage-job.repo';

const EXPIRED_JOB_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_SWEEP_DELAY_MS = 15 * 1000;
const DAILY_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const INITIAL_CLEANUP_DELAY_MS = 60 * 1000;

@Injectable()
export class JobAutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobAutomationService.name);
  private initialSweepTimer: ReturnType<typeof setTimeout> | null = null;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private initialCleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private isSweeping = false;
  private isCleaning = false;

  constructor(
    private readonly manageJobRepository: ManageJobRepository,
    private readonly embeddingOutbox: EmbeddingOutboxService,
    @Optional() private readonly cacheService?: CacheService,
    @Optional() private readonly notificationService?: AppNotificationService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.initialSweepTimer = setTimeout(() => {
      void this.runExpiredJobsSweep();
    }, INITIAL_SWEEP_DELAY_MS);
    this.initialSweepTimer.unref?.();

    this.sweepTimer = setInterval(() => {
      void this.runExpiredJobsSweep();
    }, EXPIRED_JOB_SWEEP_INTERVAL_MS);
    this.sweepTimer.unref?.();

    this.initialCleanupTimer = setTimeout(() => {
      void this.runDailyCleanup();
    }, INITIAL_CLEANUP_DELAY_MS);
    this.initialCleanupTimer.unref?.();

    this.cleanupTimer = setInterval(() => {
      void this.runDailyCleanup();
    }, DAILY_CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.initialSweepTimer) {
      clearTimeout(this.initialSweepTimer);
      this.initialSweepTimer = null;
    }
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    if (this.initialCleanupTimer) {
      clearTimeout(this.initialCleanupTimer);
      this.initialCleanupTimer = null;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Quét định kỳ 5 phút/lần: chuyển Job quá hạn -> EXPIRED, Proposal SUBMITTED -> EXPIRED và gửi thông báo.
   */
  async runExpiredJobsSweep(): Promise<void> {
    if (this.isSweeping) return;
    this.isSweeping = true;

    try {
      const { expiredJobs, expiredProposals } =
        await this.manageJobRepository.autoCloseExpiredJobs();

      if (expiredJobs.length === 0) return;

      this.cacheService?.delByPrefix('job_categor');

      const jobMap = new Map(expiredJobs.map((job) => [job.id, job]));

      await Promise.all(
        expiredJobs.map((job) =>
          this.embeddingOutbox.enqueueAndProcess({
            eventType: 'DELETE',
            documentType: 'JOB',
            documentId: job.id,
          }),
        ),
      );

      if (this.notificationService) {
        const notifications = [
          ...expiredJobs.map((job) => ({
            userId: job.clientId,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: 'Job expired',
            message: `Your job "${job.title}" has expired because the application deadline passed.`,
            data: {
              jobId: job.id,
              jobSlug: job.slug,
              href: `/client/jobs/${job.id}`,
            },
          })),
          ...expiredProposals.flatMap((proposal) => {
            const job = jobMap.get(proposal.jobId);
            if (!job) return [];
            return [
              {
                userId: proposal.freelancerId,
                type: NotificationType.SYSTEM_ANNOUNCEMENT,
                title: 'Job expired',
                message: `The job "${job.title}" you applied to has expired.`,
                data: {
                  jobId: job.id,
                  jobSlug: job.slug,
                  href: `/freelancer/jobs/${job.slug}`,
                },
              },
            ];
          }),
        ];

        await this.notificationService.sendMany(notifications);
      }

      this.logger.log(
        `Expired ${expiredJobs.length} job(s) and ${expiredProposals.length} proposal(s).`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sweep expired jobs: ${(error as Error).message}`,
      );
    } finally {
      this.isSweeping = false;
    }
  }

  /**
   * Dọn dữ liệu tạm hằng ngày (VerificationCode hết hạn, Session hết hạn, EmbeddingOutboxEvent đã xử lý quá 7 ngày).
   */
  async runDailyCleanup(): Promise<void> {
    if (this.isCleaning) return;
    this.isCleaning = true;

    try {
      const result = await this.manageJobRepository.cleanupTemporaryData();
      this.logger.log(
        `Daily cleanup removed ${result.verificationCodesDeleted} verification code(s), ${result.sessionsDeleted} session(s), ${result.outboxEventsDeleted} outbox event(s).`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run daily cleanup: ${(error as Error).message}`,
      );
    } finally {
      this.isCleaning = false;
    }
  }
}
