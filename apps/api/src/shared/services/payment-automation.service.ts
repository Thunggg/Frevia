import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MilestonePaymentStatus, MilestoneStatus } from '@prisma/client';
import { getEffectiveContractDeadlineMs } from '@shared/types';
import { PaymentRepository } from './payment.repo';
import { StripeService } from './stripe.service';

export const CLIENT_REVIEW_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
const AUTOMATION_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_SWEEP_DELAY_MS = 15 * 1000;
const FREELANCER_FEE_RATE = 0.05;

@Injectable()
export class PaymentAutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentAutomationService.name);
  private initialTimer: ReturnType<typeof setTimeout> | null = null;
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly stripeService: StripeService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.initialTimer = setTimeout(() => {
      void this.runScheduledChecks();
    }, INITIAL_SWEEP_DELAY_MS);
    this.initialTimer.unref?.();

    this.sweepTimer = setInterval(() => {
      void this.runScheduledChecks();
    }, AUTOMATION_SWEEP_INTERVAL_MS);
    this.sweepTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.initialTimer) {
      clearTimeout(this.initialTimer);
      this.initialTimer = null;
    }
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /**
   * Chạy đồng bộ hai luồng tự động hóa milestone (có khóa tránh chạy chồng chéo):
   * 1. Client không phản hồi submission sau 7 ngày -> tự động approve, release cho freelancer, cập nhật contract/job nếu hết tiền.
   * 2. Freelancer không nộp bài quá hạn -> đổi trạng thái milestone thành LATE, gửi thông báo yêu cầu refund và tự động refund nếu đã fund.
   */
  async runScheduledChecks(now = new Date()) {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      await this.processClientReviewTimeouts(now);
      await this.processOverdueMilestones(now);
    } finally {
      this.isProcessing = false;
    }
  }

  async processClientReviewTimeouts(now = new Date()) {
    const submittedBefore = new Date(now.getTime() - CLIENT_REVIEW_TIMEOUT_MS);
    let candidates: Awaited<
      ReturnType<PaymentRepository['findSubmittedMilestonesForAutoRelease']>
    > = [];

    try {
      candidates =
        await this.paymentRepo.findSubmittedMilestonesForAutoRelease(
          submittedBefore,
        );
    } catch (error) {
      this.logger.error(
        'Failed to query client review timeout milestones:',
        error,
      );
      return;
    }

    for (const milestone of candidates) {
      const latestSubmission = milestone.submissions[0];
      if (!latestSubmission) continue;

      const freelancer = milestone.contract.freelancer;
      if (
        !freelancer.stripeAccountId ||
        !freelancer.stripeOnboardingCompleted
      ) {
        this.logger.warn(
          `Skipping 7-day auto-release for milestone #${milestone.id}: freelancer #${freelancer.id} has not completed Stripe Connect onboarding.`,
        );
        continue;
      }

      const milestoneAmount = Number(milestone.amount);
      const feeAmount =
        Math.round(milestoneAmount * FREELANCER_FEE_RATE * 100) / 100;
      const payoutAmount =
        Math.round((milestoneAmount - feeAmount) * 100) / 100;
      const amountInCents = Math.round(payoutAmount * 100);

      try {
        const transfer = await this.stripeService.createTransfer({
          amountInCents,
          currency: 'usd',
          destination: freelancer.stripeAccountId,
          transferGroup: `contract_${milestone.contractId}`,
          metadata: {
            type: 'MILESTONE_PAYOUT',
            autoReleased: 'true',
            contractId: String(milestone.contractId),
            milestoneId: String(milestone.id),
            submissionId: String(latestSubmission.id),
            freelancerId: String(freelancer.id),
            freelancerFee: String(feeAmount),
          },
          idempotencyKey: `auto-release-milestone-${milestone.id}-sub-${latestSubmission.id}`,
        });

        await this.paymentRepo.applyAutoReleaseTransaction({
          milestoneId: milestone.id,
          contractId: milestone.contractId,
          submissionId: latestSubmission.id,
          clientId: milestone.contract.clientId,
          freelancerId: freelancer.id,
          contractSlug: milestone.contract.slug,
          milestoneTitle: milestone.title,
          transferId: transfer.id,
          payoutAmount,
          feeAmount,
          now,
        });
      } catch (error) {
        this.logger.error(
          `Auto-release failed for milestone #${milestone.id} (contract #${milestone.contractId}):`,
          error,
        );
      }
    }
  }

  private resolveEffectiveDueDateMs(milestone: {
    status: MilestoneStatus;
    dueDate: Date | null;
    submissions: { changeRequestDueDate: Date | null }[];
  }): number | null {
    const baseDueMs = milestone.dueDate
      ? getEffectiveContractDeadlineMs(milestone.dueDate)
      : null;

    if (milestone.status === MilestoneStatus.CHANGES_REQUESTED) {
      const revisionDue = milestone.submissions[0]?.changeRequestDueDate;
      if (revisionDue) {
        const revisionDueMs = getEffectiveContractDeadlineMs(revisionDue);
        return baseDueMs !== null
          ? Math.max(baseDueMs, revisionDueMs)
          : revisionDueMs;
      }
    }

    return baseDueMs;
  }

  async processOverdueMilestones(now = new Date()) {
    let candidates: Awaited<
      ReturnType<PaymentRepository['findCandidateOverdueMilestones']>
    > = [];

    try {
      candidates = await this.paymentRepo.findCandidateOverdueMilestones();
    } catch (error) {
      this.logger.error('Failed to query candidate overdue milestones:', error);
      return;
    }

    for (const milestone of candidates) {
      try {
        if (milestone.status !== MilestoneStatus.LATE) {
          const effectiveDueMs = this.resolveEffectiveDueDateMs(milestone);
          if (!effectiveDueMs || now.getTime() <= effectiveDueMs) {
            continue;
          }

          await this.paymentRepo.markMilestoneLateAndNotify({
            milestoneId: milestone.id,
            previousStatus: milestone.status,
            contractId: milestone.contractId,
            contractSlug: milestone.contract.slug,
            clientId: milestone.contract.clientId,
            freelancerId: milestone.contract.freelancerId,
            milestoneTitle: milestone.title,
            isFunded: milestone.paymentStatus === MilestonePaymentStatus.FUNDED,
          });
        }

        if (milestone.paymentStatus !== MilestonePaymentStatus.FUNDED) {
          continue;
        }

        const escrowTx = await this.paymentRepo.findEscrowDepositTransaction(
          milestone.id,
          milestone.contractId,
        );
        if (!escrowTx?.stripePaymentIntentId) {
          this.logger.warn(
            `Cannot auto-refund overdue milestone #${milestone.id}: original escrow deposit transaction not found.`,
          );
          continue;
        }

        const milestoneAmount = Number(milestone.amount);
        const refund = await this.stripeService.createRefund({
          paymentIntentId: escrowTx.stripePaymentIntentId,
          amountInCents: Math.round(milestoneAmount * 100),
          metadata: {
            type: 'REFUND',
            autoRefund: 'true',
            reason: 'FREELANCER_LATE_NO_SUBMISSION',
            contractId: String(milestone.contractId),
            milestoneId: String(milestone.id),
          },
          idempotencyKey: `auto-refund-milestone-${milestone.id}`,
        });

        await this.paymentRepo.applyMilestoneRefundTransaction({
          milestoneId: milestone.id,
          contractId: milestone.contractId,
          contractSlug: milestone.contract.slug,
          clientId: milestone.contract.clientId,
          freelancerId: milestone.contract.freelancerId,
          milestoneTitle: milestone.title,
          amount: milestoneAmount,
          refundId: refund.id,
          reason: 'FREELANCER_LATE_NO_SUBMISSION',
          isAuto: true,
        });
      } catch (error) {
        this.logger.error(
          `Overdue LATE/auto-refund processing failed for milestone #${milestone.id}:`,
          error,
        );
      }
    }
  }
}
