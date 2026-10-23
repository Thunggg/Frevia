import { Injectable } from '@nestjs/common';
import {
  DisputeFeeStatus,
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
            stripeAccountId: true,
            stripeOnboardingCompleted: true,
          },
        },
      },
    });
  }

  async updateContractPlatformFee(
    contractId: number,
    status: PlatformFeeStatus,
    paidAt?: Date,
  ) {
    return this.prisma.contract.update({
      where: { id: contractId },
      data: {
        platformFeeStatus: status,
        platformFeePaidAt: paidAt ?? new Date(),
      },
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
        fees: true,
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

  async findDisputeFee(disputeId: number, userId: number) {
    return this.prisma.disputeFee.findUnique({
      where: {
        disputeId_userId: {
          disputeId,
          userId,
        },
      },
    });
  }

  async updateDisputeFeeStatus(
    disputeFeeId: number,
    status: DisputeFeeStatus,
    paymentIntentId?: string,
    paidAt?: Date,
  ) {
    return this.prisma.disputeFee.update({
      where: { id: disputeFeeId },
      data: {
        status,
        ...(paymentIntentId && { paymentIntentId }),
        ...(paidAt && { paidAt }),
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

  async findEscrowDepositTransaction(milestoneId: number) {
    const tx = await this.prisma.transaction.findFirst({
      where: {
        milestoneId,
        type: TransactionType.ESCROW_DEPOSIT,
        status: TransactionStatus.SUCCEEDED,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!tx) return null;
    return {
      ...tx,
      amount: Number(tx.amount),
    };
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
