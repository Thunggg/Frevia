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
  WithdrawalMethod,
  WithdrawalStatus,
} from '@prisma/client';
import {
  GetTransactionListQueryType,
  GetWithdrawalListQueryType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  InsufficientWalletBalanceException,
  MilestoneAlreadyReleasedException,
  WithdrawalAlreadyProcessedException,
  WithdrawalNotFoundException,
} from './payment.error';

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
        walletBalance: true,
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

  async creditMilestoneToWalletAtomic(params: {
    freelancerId: number;
    contractId: number;
    milestoneId: number;
    milestoneTitle: string;
    milestoneAmount: number;
    freelancerPayout: number;
    freelancerFee: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const milestoneUpdate = await tx.milestone.updateMany({
        where: {
          id: params.milestoneId,
          paymentStatus: MilestonePaymentStatus.FUNDED,
        },
        data: {
          paymentStatus: MilestonePaymentStatus.RELEASED,
          status: MilestoneStatus.COMPLETED,
        },
      });

      if (milestoneUpdate.count === 0) {
        throw MilestoneAlreadyReleasedException();
      }

      const updatedUser = await tx.user.update({
        where: { id: params.freelancerId },
        data: {
          walletBalance: { increment: params.freelancerPayout },
        },
        select: { walletBalance: true },
      });

      await tx.transaction.create({
        data: {
          userId: params.freelancerId,
          contractId: params.contractId,
          milestoneId: params.milestoneId,
          amount: params.freelancerPayout,
          currency: 'usd',
          type: TransactionType.MILESTONE_PAYOUT,
          status: TransactionStatus.SUCCEEDED,
          metadata: {
            payoutDestination: 'WALLET',
            milestoneTitle: params.milestoneTitle,
            grossAmount: params.milestoneAmount,
            feeAmount: params.freelancerFee,
            feeRate: '5%',
            netAmount: params.freelancerPayout,
          } as Prisma.InputJsonValue,
        },
      });

      if (params.freelancerFee > 0) {
        await tx.transaction.create({
          data: {
            userId: params.freelancerId,
            contractId: params.contractId,
            milestoneId: params.milestoneId,
            amount: params.freelancerFee,
            currency: 'usd',
            type: TransactionType.PLATFORM_FEE,
            status: TransactionStatus.SUCCEEDED,
            metadata: {
              type: 'FREELANCER_RELEASE_FEE',
              feeRole: 'FREELANCER',
              feePercent: 5,
              payoutDestination: 'WALLET',
            } as Prisma.InputJsonValue,
          },
        });
      }

      return {
        newWalletBalance: Number(updatedUser.walletBalance),
      };
    });
  }

  async creditDisputePayoutToWalletAtomic(params: {
    freelancerId: number;
    contractId: number;
    milestoneId: number;
    disputeId: number;
    amount: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: params.freelancerId },
        data: {
          walletBalance: { increment: params.amount },
        },
        select: { walletBalance: true },
      });

      await tx.transaction.create({
        data: {
          userId: params.freelancerId,
          contractId: params.contractId,
          milestoneId: params.milestoneId,
          disputeId: params.disputeId,
          amount: params.amount,
          currency: 'usd',
          type: TransactionType.MILESTONE_PAYOUT,
          status: TransactionStatus.SUCCEEDED,
          metadata: {
            payoutDestination: 'WALLET',
            disputeSettlement: true,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        newWalletBalance: Number(updatedUser.walletBalance),
      };
    });
  }

  async getWalletSummary(userId: number) {
    const [user, earnedAgg, completedWithdrawnAgg, pendingWithdrawnAgg] =
      await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId, deletedAt: null },
          select: { walletBalance: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.MILESTONE_PAYOUT,
            status: TransactionStatus.SUCCEEDED,
          },
          _sum: { amount: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: {
            userId,
            status: WithdrawalStatus.COMPLETED,
          },
          _sum: { amount: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: {
            userId,
            status: WithdrawalStatus.PENDING,
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      balance: Number(user?.walletBalance ?? 0),
      currency: 'usd',
      totalEarned: Number(earnedAgg._sum.amount ?? 0),
      totalWithdrawn: Number(completedWithdrawnAgg._sum.amount ?? 0),
      pendingWithdrawalAmount: Number(pendingWithdrawnAgg._sum.amount ?? 0),
    };
  }

  async createWithdrawalReserveAtomic(params: {
    userId: number;
    amount: number;
    method: WithdrawalMethod;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    note?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const deducted = await tx.user.updateMany({
        where: {
          id: params.userId,
          deletedAt: null,
          walletBalance: { gte: params.amount },
        },
        data: {
          walletBalance: { decrement: params.amount },
        },
      });

      if (deducted.count === 0) {
        throw InsufficientWalletBalanceException();
      }

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: params.userId },
        select: { walletBalance: true },
      });

      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          currency: 'usd',
          method: params.method,
          status: WithdrawalStatus.PENDING,
          bankName: params.bankName,
          bankAccountNumber: params.bankAccountNumber,
          bankAccountHolder: params.bankAccountHolder,
          note: params.note,
        },
      });

      const maskedAccount =
        params.bankAccountNumber && params.bankAccountNumber.length > 4
          ? `****${params.bankAccountNumber.slice(-4)}`
          : params.bankAccountNumber;

      const transaction = await tx.transaction.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          currency: 'usd',
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          metadata: {
            withdrawalId: withdrawal.id,
            method: params.method,
            ...(params.bankName && { bankName: params.bankName }),
            ...(params.bankAccountHolder && {
              bankAccountHolder: params.bankAccountHolder,
            }),
            ...(maskedAccount && { maskedAccount }),
          } as Prisma.InputJsonValue,
        },
      });

      return {
        withdrawal: {
          ...withdrawal,
          amount: Number(withdrawal.amount),
        },
        transactionId: transaction.id,
        newBalance: Number(updatedUser.walletBalance),
      };
    });
  }

  async completeStripeWithdrawalAtomic(params: {
    withdrawalId: number;
    transactionId: number;
    stripeTransferId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const withdrawal = await tx.withdrawalRequest.update({
        where: { id: params.withdrawalId },
        data: {
          status: WithdrawalStatus.COMPLETED,
          stripeTransferId: params.stripeTransferId,
          processedAt: now,
        },
      });

      await tx.transaction.update({
        where: { id: params.transactionId },
        data: {
          status: TransactionStatus.SUCCEEDED,
          stripeTransferId: params.stripeTransferId,
        },
      });

      return {
        ...withdrawal,
        amount: Number(withdrawal.amount),
      };
    });
  }

  async rollbackFailedStripeWithdrawalAtomic(params: {
    userId: number;
    withdrawalId: number;
    transactionId: number;
    amount: number;
    reason: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: params.userId },
        data: {
          walletBalance: { increment: params.amount },
        },
      });

      await tx.withdrawalRequest.update({
        where: { id: params.withdrawalId },
        data: {
          status: WithdrawalStatus.REJECTED,
          rejectionReason: params.reason,
          processedAt: new Date(),
        },
      });

      await tx.transaction.update({
        where: { id: params.transactionId },
        data: {
          status: TransactionStatus.FAILED,
        },
      });
    });
  }

  async processWithdrawalByAdminAtomic(params: {
    withdrawalId: number;
    adminId: number;
    status: 'COMPLETED' | 'REJECTED';
    rejectionReason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.withdrawalRequest.findUnique({
        where: { id: params.withdrawalId },
      });
      if (!existing) {
        throw WithdrawalNotFoundException();
      }
      if (existing.status !== WithdrawalStatus.PENDING) {
        throw WithdrawalAlreadyProcessedException();
      }

      const now = new Date();
      const updated = await tx.withdrawalRequest.update({
        where: { id: params.withdrawalId },
        data: {
          status:
            params.status === 'COMPLETED'
              ? WithdrawalStatus.COMPLETED
              : WithdrawalStatus.REJECTED,
          processedAt: now,
          processedById: params.adminId,
          ...(params.status === 'REJECTED' &&
            params.rejectionReason && {
              rejectionReason: params.rejectionReason,
            }),
        },
      });

      if (params.status === 'REJECTED') {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            walletBalance: { increment: Number(existing.amount) },
          },
        });
      }

      const matchingTx = await tx.transaction.findFirst({
        where: {
          userId: existing.userId,
          type: TransactionType.WITHDRAWAL,
          metadata: {
            path: ['withdrawalId'],
            equals: params.withdrawalId,
          },
        },
      });

      if (matchingTx) {
        await tx.transaction.update({
          where: { id: matchingTx.id },
          data: {
            status:
              params.status === 'COMPLETED'
                ? TransactionStatus.SUCCEEDED
                : TransactionStatus.FAILED,
          },
        });
      }

      return {
        ...updated,
        amount: Number(updated.amount),
      };
    });
  }

  async getWithdrawals(
    query: GetWithdrawalListQueryType,
    filter: { userId?: number },
  ) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WithdrawalRequestWhereInput = {
      ...(filter.userId && { userId: filter.userId }),
      ...(status && { status: status as WithdrawalStatus }),
    };

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        ...row,
        amount: Number(row.amount),
      })),
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
  }
}
