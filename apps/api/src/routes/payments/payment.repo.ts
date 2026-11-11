import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  PlatformFeeStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { GetTransactionListQueryType } from '@shared/types';
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
