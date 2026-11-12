import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  NotificationType,
  PlatformFeeStatus,
  Prisma,
  SubmissionStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { GetTransactionListQueryType } from '@shared/types';
import { syncContractAndJobCompletion } from '../../shared/helper/contract-activation.helper';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        stripeAccountId: true,
        stripeOnboardingCompleted: true,
        profile: { select: { displayName: true } },
      },
    });
  }

  async updateUserStripe(
    userId: number,
    data: {
      stripeCustomerId?: string;
      stripeAccountId?: string;
      stripeOnboardingCompleted?: boolean;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async findContractById(contractId: number) {
    return this.prisma.contract.findUnique({
      where: { id: contractId, deletedAt: null },
      include: {
        client: { select: { id: true, email: true, stripeCustomerId: true } },
        freelancer: {
          select: {
            id: true,
            email: true,
            stripeCustomerId: true,
            stripeAccountId: true,
            stripeOnboardingCompleted: true,
          },
        },
        milestones: {
          where: { deletedAt: null },
          orderBy: { id: 'asc' },
        },
      },
    });
  }

  async setContractHoldIntent(params: {
    contractId: number;
    paymentIntentId: string;
    milestoneIds: number[];
    clientPlatformFee: number;
  }) {
    const { contractId, paymentIntentId, milestoneIds, clientPlatformFee } =
      params;
    return this.prisma.contract.update({
      where: { id: contractId },
      data: {
        holdPaymentIntentId: paymentIntentId,
        holdMilestoneIds: milestoneIds,
        clientPlatformFee,
        platformFee: clientPlatformFee,
      },
    });
  }

  async clearContractHold(contractId: number) {
    return this.prisma.contract.update({
      where: { id: contractId },
      data: {
        holdPaymentIntentId: null,
        holdMilestoneIds: [],
      },
    });
  }

  async markContractHoldAuthorized(params: {
    contractId: number;
    paymentIntentId: string;
    milestoneIds: number[];
  }) {
    const { contractId, paymentIntentId, milestoneIds } = params;
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
      });
      if (!contract) return null;

      const updatedContract =
        contract.status === ContractStatus.AWAITING_PAYMENT
          ? await tx.contract.update({
              where: { id: contractId },
              data: {
                status: ContractStatus.PENDING_SIGN,
                holdPaymentIntentId: paymentIntentId,
                holdMilestoneIds: milestoneIds,
              },
            })
          : contract;

      const existingTx = await tx.transaction.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });
      if (existingTx) {
        const prevMeta =
          (existingTx.metadata as Record<string, unknown> | null) ?? {};
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: {
            metadata: {
              ...prevMeta,
              holdStatus: 'REQUIRES_CAPTURE',
              milestoneIds,
            } as Prisma.InputJsonValue,
          },
        });
      }

      return updatedContract;
    });
  }

  async finalizeContractHoldCaptured(params: {
    contractId: number;
    paymentIntentId: string;
    milestoneIds: number[];
    milestonesAmount: number;
    clientFeeAmount: number;
  }) {
    const {
      contractId,
      paymentIntentId,
      milestoneIds,
      milestonesAmount,
      clientFeeAmount,
    } = params;
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
      });
      if (!contract) return null;

      const existingTx = await tx.transaction.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      const wasAlreadyProcessed =
        existingTx?.status === TransactionStatus.SUCCEEDED;

      if (existingTx && !wasAlreadyProcessed) {
        const prevMeta =
          (existingTx.metadata as Record<string, unknown> | null) ?? {};
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: {
            status: TransactionStatus.SUCCEEDED,
            amount: milestonesAmount,
            metadata: {
              ...prevMeta,
              holdStatus: 'CAPTURED',
              milestoneIds,
              milestonesAmount,
              clientFeeAmount,
            } as Prisma.InputJsonValue,
          },
        });
      } else if (!existingTx) {
        await tx.transaction.create({
          data: {
            userId: contract.clientId,
            contractId,
            milestoneId: milestoneIds.length === 1 ? milestoneIds[0] : null,
            amount: milestonesAmount,
            currency: 'usd',
            type: TransactionType.ESCROW_DEPOSIT,
            status: TransactionStatus.SUCCEEDED,
            stripePaymentIntentId: paymentIntentId,
            metadata: {
              type: 'CONTRACT_HOLD',
              holdStatus: 'CAPTURED',
              milestoneIds,
              milestonesAmount,
              clientFeeAmount,
            } as Prisma.InputJsonValue,
          },
        });
      }

      if (!wasAlreadyProcessed && clientFeeAmount > 0) {
        await tx.transaction.create({
          data: {
            userId: contract.clientId,
            contractId,
            amount: clientFeeAmount,
            currency: 'usd',
            type: TransactionType.PLATFORM_FEE,
            status: TransactionStatus.SUCCEEDED,
            metadata: {
              type: 'CONTRACT_PLATFORM_FEE',
              feeRole: 'CLIENT',
              feePercent: 3,
              capturedPaymentIntentId: paymentIntentId,
            } as Prisma.InputJsonValue,
          },
        });
      }

      if (milestoneIds.length > 0) {
        await tx.milestone.updateMany({
          where: {
            contractId,
            id: { in: milestoneIds },
            deletedAt: null,
          },
          data: {
            paymentStatus: MilestonePaymentStatus.FUNDED,
          },
        });
      }

      const now = new Date();
      return tx.contract.update({
        where: { id: contractId },
        data: {
          platformFee: clientFeeAmount,
          clientPlatformFee: clientFeeAmount,
          clientFeeStatus: PlatformFeeStatus.PAID,
          clientFeePaidAt: now,
          platformFeeStatus: PlatformFeeStatus.PAID,
          platformFeePaidAt: now,
        },
      });
    });
  }

  async markContractHoldCanceled(params: {
    contractId: number;
    paymentIntentId: string;
    reason?: string;
  }) {
    const { contractId, paymentIntentId, reason } = params;
    return this.prisma.$transaction(async (tx) => {
      const existingTx = await tx.transaction.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (existingTx && existingTx.status === TransactionStatus.PENDING) {
        const prevMeta =
          (existingTx.metadata as Record<string, unknown> | null) ?? {};
        await tx.transaction.update({
          where: { id: existingTx.id },
          data: {
            status: TransactionStatus.FAILED,
            metadata: {
              ...prevMeta,
              holdStatus: 'CANCELED',
              ...(reason && { cancelReason: reason }),
            } as Prisma.InputJsonValue,
          },
        });
      }

      await tx.contract.update({
        where: { id: contractId },
        data: {
          holdPaymentIntentId: null,
          holdMilestoneIds: [],
        },
      });
    });
  }

  async findMilestoneById(milestoneId: number) {
    return this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            client: {
              select: { id: true, email: true, stripeCustomerId: true },
            },
            freelancer: {
              select: {
                id: true,
                email: true,
                stripeAccountId: true,
                stripeOnboardingCompleted: true,
              },
            },
          },
        },
      },
    });
  }

  async updateMilestonePaymentStatus(
    milestoneId: number,
    paymentStatus: MilestonePaymentStatus,
    status?: MilestoneStatus,
  ) {
    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        paymentStatus,
        ...(status && { status }),
      },
    });
  }

  async findDisputeById(disputeId: number) {
    return this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        milestone: {
          include: {
            contract: {
              include: {
                client: {
                  select: { id: true, email: true, stripeCustomerId: true },
                },
                freelancer: {
                  select: {
                    id: true,
                    email: true,
                    stripeAccountId: true,
                    stripeOnboardingCompleted: true,
                  },
                },
              },
            },
          },
        },
        decisionBy: {
          select: {
            id: true,
            email: true,
            stripeAccountId: true,
            stripeOnboardingCompleted: true,
          },
        },
      },
    });
  }

  async updateDisputeStatus(
    disputeId: number,
    status: DisputeStatus,
    finalDecisionAt?: Date,
  ) {
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        ...(finalDecisionAt && { finalDecisionAt }),
      },
    });
  }

  async createTransaction(data: {
    userId: number;
    contractId?: number;
    milestoneId?: number;
    disputeId?: number;
    amount: number;
    currency?: string;
    type: TransactionType;
    status: TransactionStatus;
    stripePaymentIntentId?: string;
    stripeTransferId?: string;
    stripeRefundId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const tx = await this.prisma.transaction.create({
      data: {
        userId: data.userId,
        contractId: data.contractId,
        milestoneId: data.milestoneId,
        disputeId: data.disputeId,
        amount: data.amount,
        currency: data.currency ?? 'usd',
        type: data.type,
        status: data.status,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeTransferId: data.stripeTransferId,
        stripeRefundId: data.stripeRefundId,
        metadata: data.metadata,
      },
    });

    return {
      ...tx,
      amount: Number(tx.amount),
    };
  }

  async updateTransactionStatus(
    id: number,
    status: TransactionStatus,
    extra?: {
      stripePaymentIntentId?: string;
      stripeTransferId?: string;
      stripeRefundId?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const tx = await this.prisma.transaction.update({
      where: { id },
      data: {
        status,
        ...extra,
      },
    });

    return {
      ...tx,
      amount: Number(tx.amount),
    };
  }

  async findTransactionByPaymentIntentId(paymentIntentId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!tx) return null;
    return {
      ...tx,
      amount: Number(tx.amount),
    };
  }

  async findTransactionBySessionId(sessionId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: {
        metadata: {
          path: ['sessionId'],
          equals: sessionId,
        },
      },
    });
    if (!tx) return null;
    return {
      ...tx,
      amount: Number(tx.amount),
    };
  }

  async findEscrowDepositTransaction(milestoneId: number, contractId?: number) {
    const directTx = await this.prisma.transaction.findFirst({
      where: {
        milestoneId,
        type: TransactionType.ESCROW_DEPOSIT,
        status: TransactionStatus.SUCCEEDED,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (directTx) {
      return {
        ...directTx,
        amount: Number(directTx.amount),
      };
    }

    if (!contractId) return null;

    const contractTxs = await this.prisma.transaction.findMany({
      where: {
        contractId,
        type: TransactionType.ESCROW_DEPOSIT,
        status: TransactionStatus.SUCCEEDED,
      },
      orderBy: { createdAt: 'desc' },
    });

    const matched = contractTxs.find((item) => {
      const meta = item.metadata as { milestoneIds?: unknown } | null;
      return (
        Array.isArray(meta?.milestoneIds) &&
        meta.milestoneIds.includes(milestoneId)
      );
    });

    if (!matched) return null;
    return {
      ...matched,
      amount: Number(matched.amount),
    };
  }

  async findContractEscrowDeposits(contractId: number) {
    return this.prisma.transaction.findMany({
      where: {
        contractId,
        type: TransactionType.ESCROW_DEPOSIT,
        status: TransactionStatus.SUCCEEDED,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAllContractMilestonesPaymentStatus(
    contractId: number,
    fromStatus: MilestonePaymentStatus,
    toStatus: MilestonePaymentStatus,
  ) {
    return this.prisma.milestone.updateMany({
      where: {
        contractId,
        deletedAt: null,
        paymentStatus: fromStatus,
      },
      data: {
        paymentStatus: toStatus,
      },
    });
  }

  async checkAndCompleteFreelancerFee(contractId: number) {
    const unreleasedMilestones = await this.prisma.milestone.count({
      where: {
        contractId,
        deletedAt: null,
        paymentStatus: {
          not: MilestonePaymentStatus.RELEASED,
        },
      },
    });

    if (unreleasedMilestones === 0) {
      await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          freelancerFeeStatus: PlatformFeeStatus.PAID,
          freelancerFeePaidAt: new Date(),
        },
      });
    }
  }

  async syncContractCompletion(contractId: number): Promise<boolean> {
    return this.prisma.$transaction((tx) =>
      syncContractAndJobCompletion(tx, contractId),
    );
  }

  async findSubmittedMilestonesForAutoRelease(submittedBefore: Date) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        deletedAt: null,
        status: MilestoneStatus.SUBMITTED,
        paymentStatus: MilestonePaymentStatus.FUNDED,
        contract: {
          deletedAt: null,
          status: ContractStatus.ACTIVE,
        },
        OR: [
          { dispute: null },
          { dispute: { status: DisputeStatus.CANCELLED } },
        ],
      },
      include: {
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
        contract: {
          select: {
            id: true,
            slug: true,
            jobId: true,
            clientId: true,
            freelancerId: true,
            job: { select: { title: true } },
            freelancer: {
              select: {
                id: true,
                stripeAccountId: true,
                stripeOnboardingCompleted: true,
              },
            },
          },
        },
      },
    });

    return milestones.filter((milestone) => {
      const latestSubmission = milestone.submissions[0];
      return (
        latestSubmission &&
        latestSubmission.status === SubmissionStatus.PENDING_REVIEW &&
        latestSubmission.submittedAt <= submittedBefore
      );
    });
  }

  async applyAutoReleaseTransaction(params: {
    milestoneId: number;
    contractId: number;
    submissionId: number;
    clientId: number;
    freelancerId: number;
    contractSlug: string;
    milestoneTitle: string;
    transferId: string;
    payoutAmount: number;
    feeAmount: number;
    now: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.milestone.updateMany({
        where: {
          id: params.milestoneId,
          status: MilestoneStatus.SUBMITTED,
          paymentStatus: MilestonePaymentStatus.FUNDED,
          deletedAt: null,
        },
        data: {
          paymentStatus: MilestonePaymentStatus.RELEASED,
          status: MilestoneStatus.COMPLETED,
          completedAt: params.now,
        },
      });

      if (claimed.count === 0) {
        return { released: false, contractCompleted: false };
      }

      await tx.milestoneSubmission.updateMany({
        where: {
          id: params.submissionId,
          status: SubmissionStatus.PENDING_REVIEW,
        },
        data: {
          status: SubmissionStatus.APPROVED,
          reviewedAt: params.now,
        },
      });

      await tx.transaction.create({
        data: {
          userId: params.freelancerId,
          contractId: params.contractId,
          milestoneId: params.milestoneId,
          amount: params.payoutAmount,
          currency: 'usd',
          type: TransactionType.MILESTONE_PAYOUT,
          status: TransactionStatus.SUCCEEDED,
          stripeTransferId: params.transferId,
          metadata: {
            autoReleased: true,
            reason: 'CLIENT_REVIEW_TIMEOUT_7_DAYS',
            submissionId: params.submissionId,
          } as Prisma.InputJsonValue,
        },
      });

      if (params.feeAmount > 0) {
        await tx.transaction.create({
          data: {
            userId: params.freelancerId,
            contractId: params.contractId,
            milestoneId: params.milestoneId,
            amount: params.feeAmount,
            currency: 'usd',
            type: TransactionType.PLATFORM_FEE,
            status: TransactionStatus.SUCCEEDED,
            metadata: {
              type: 'FREELANCER_RELEASE_FEE',
              feeRole: 'FREELANCER',
              feePercent: 5,
              transferId: params.transferId,
              autoReleased: true,
            } as Prisma.InputJsonValue,
          },
        });
      }

      await tx.notification.createMany({
        data: [
          {
            userId: params.freelancerId,
            type: NotificationType.PAYMENT_RELEASED,
            title: 'Milestone payment auto-released',
            message: `Client did not respond within 7 days of your submission for "${params.milestoneTitle}". Escrow payment ($${params.payoutAmount.toFixed(2)} net) has been automatically released to your Stripe account.`,
            data: {
              href: `/freelancer/contracts/${params.contractSlug}/milestones/${params.milestoneId}`,
              contractId: params.contractId,
              milestoneId: params.milestoneId,
            },
          },
          {
            userId: params.clientId,
            type: NotificationType.MILESTONE_COMPLETED,
            title: 'Milestone auto-approved & released',
            message: `No review was submitted within 7 days for "${params.milestoneTitle}". The milestone was marked Completed and escrowed funds were released to the freelancer.`,
            data: {
              href: `/client/contracts/${params.contractSlug}/milestones/${params.milestoneId}`,
              contractId: params.contractId,
              milestoneId: params.milestoneId,
            },
          },
        ],
      });

      const contractCompleted = await syncContractAndJobCompletion(
        tx,
        params.contractId,
      );

      return { released: true, contractCompleted };
    });
  }

  async findCandidateOverdueMilestones() {
    return this.prisma.milestone.findMany({
      where: {
        deletedAt: null,
        contract: {
          deletedAt: null,
          status: ContractStatus.ACTIVE,
        },
        OR: [
          {
            status: {
              in: [
                MilestoneStatus.PENDING,
                MilestoneStatus.IN_PROGRESS,
                MilestoneStatus.CHANGES_REQUESTED,
              ],
            },
          },
          {
            status: MilestoneStatus.LATE,
            paymentStatus: MilestonePaymentStatus.FUNDED,
          },
        ],
        AND: [
          {
            OR: [
              { dispute: null },
              { dispute: { status: DisputeStatus.CANCELLED } },
            ],
          },
        ],
      },
      include: {
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
        contract: {
          select: {
            id: true,
            slug: true,
            jobId: true,
            clientId: true,
            freelancerId: true,
            job: { select: { title: true } },
          },
        },
      },
    });
  }

  async markMilestoneLateAndNotify(params: {
    milestoneId: number;
    previousStatus: MilestoneStatus;
    contractId: number;
    contractSlug: string;
    clientId: number;
    freelancerId: number;
    milestoneTitle: string;
    isFunded: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.milestone.updateMany({
        where: {
          id: params.milestoneId,
          status: params.previousStatus,
          deletedAt: null,
        },
        data: {
          status: MilestoneStatus.LATE,
        },
      });

      if (updated.count === 0) return false;

      await tx.notification.createMany({
        data: [
          {
            userId: params.clientId,
            type: NotificationType.TASK_OVERDUE,
            title: 'Milestone overdue — refund requested',
            message: params.isFunded
              ? `Freelancer missed the deadline for "${params.milestoneTitle}" without submitting work. Milestone status is now Late and an automatic escrow refund request has been triggered.`
              : `Freelancer missed the deadline for "${params.milestoneTitle}" without submitting work. Milestone status has been changed to Late.`,
            data: {
              href: `/client/contracts/${params.contractSlug}/milestones/${params.milestoneId}`,
              contractId: params.contractId,
              milestoneId: params.milestoneId,
              refundRequested: params.isFunded,
            },
          },
          {
            userId: params.freelancerId,
            type: NotificationType.TASK_OVERDUE,
            title: 'Milestone marked as Late',
            message: params.isFunded
              ? `You did not submit deliverables before the deadline for "${params.milestoneTitle}". The milestone was marked Late and the funded escrow is subject to automatic refund.`
              : `You did not submit deliverables before the deadline for "${params.milestoneTitle}". The milestone status was changed to Late.`,
            data: {
              href: `/freelancer/contracts/${params.contractSlug}/milestones/${params.milestoneId}`,
              contractId: params.contractId,
              milestoneId: params.milestoneId,
              refundRequested: params.isFunded,
            },
          },
        ],
      });

      return true;
    });
  }

  async applyMilestoneRefundTransaction(params: {
    milestoneId: number;
    contractId: number;
    contractSlug?: string;
    clientId: number;
    freelancerId: number;
    milestoneTitle: string;
    amount: number;
    refundId: string;
    reason: string;
    isAuto: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.milestone.updateMany({
        where: {
          id: params.milestoneId,
          paymentStatus: MilestonePaymentStatus.FUNDED,
          deletedAt: null,
        },
        data: {
          paymentStatus: MilestonePaymentStatus.REFUNDED,
        },
      });

      if (claimed.count === 0) {
        return { refunded: false, contractCompleted: false };
      }

      await tx.transaction.create({
        data: {
          userId: params.clientId,
          contractId: params.contractId,
          milestoneId: params.milestoneId,
          amount: params.amount,
          currency: 'usd',
          type: TransactionType.REFUND,
          status: TransactionStatus.SUCCEEDED,
          stripeRefundId: params.refundId,
          metadata: {
            autoRefund: params.isAuto,
            reason: params.reason,
          } as Prisma.InputJsonValue,
        },
      });

      const slugSegment = params.contractSlug ?? String(params.contractId);
      await tx.notification.createMany({
        data: [
          {
            userId: params.clientId,
            type: NotificationType.PAYMENT_RELEASED,
            title: 'Milestone escrow refunded',
            message: `$${params.amount.toFixed(2)} for milestone "${params.milestoneTitle}" has been automatically refunded to your payment card.`,
            data: {
              href: `/client/contracts/${slugSegment}/milestones/${params.milestoneId}`,
              contractId: params.contractId,
              milestoneId: params.milestoneId,
              refundId: params.refundId,
            },
          },
          {
            userId: params.freelancerId,
            type: NotificationType.TASK_OVERDUE,
            title: 'Milestone escrow refunded to client',
            message: `Escrowed funds ($${params.amount.toFixed(2)}) for milestone "${params.milestoneTitle}" were refunded to the client (${params.reason === 'FREELANCER_LATE_NO_SUBMISSION' ? 'deadline passed without submission' : 'work not started / overdue'}).`,
            data: {
              href: `/freelancer/contracts/${slugSegment}/milestones/${params.milestoneId}`,
              contractId: params.contractId,
              milestoneId: params.milestoneId,
            },
          },
        ],
      });

      const contractCompleted = await syncContractAndJobCompletion(
        tx,
        params.contractId,
      );

      return { refunded: true, contractCompleted };
    });
  }

  async getTransactions(
    query: GetTransactionListQueryType,
    filter: { userId?: number },
  ) {
    const { page, limit, type, status, contractId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      ...(filter.userId && {
        OR: [
          { userId: filter.userId },
          { contract: { clientId: filter.userId } },
        ],
      }),
      ...(type && { type: type as TransactionType }),
      ...(status && { status: status as TransactionStatus }),
      ...(contractId && { contractId }),
    };

    const [transactions, totalItems] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              job: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
  }
}
