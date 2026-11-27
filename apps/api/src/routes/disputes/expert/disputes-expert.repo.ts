import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  DisputeDecisionResponse,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import { GetDisputeListQueryType } from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';
import { syncContractAndJobCompletion } from '../../contract/contract.repo';

const expertDisputeListInclude = {
  milestone: {
    include: {
      contract: true,
    },
  },
  openedBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  respondent: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  decisionBy: { select: { id: true, email: true } },
  evidences: {
    include: {
      file: {
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  decisionReviews: true,
};

const expertDisputeFullDetailInclude = {
  milestone: {
    include: {
      files: {
        where: { deletedAt: null },
        select: {
          id: true,
          uploaderId: true,
          fileUrl: true,
          fileName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' as const },
      },
      submissions: {
        include: {
          files: {
            include: {
              file: {
                select: {
                  id: true,
                  fileUrl: true,
                  fileName: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' as const },
      },
      contract: {
        include: {
          job: { select: { id: true, title: true } },
          milestones: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              amount: true,
              status: true,
              paymentStatus: true,
            },
            orderBy: { id: 'asc' as const },
          },
        },
      },
    },
  },
  openedBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  respondent: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  decisionBy: { select: { id: true, email: true } },
  evidences: {
    include: {
      file: {
        select: {
          id: true,
          fileUrl: true,
          fileName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  decisionReviews: true,
};

@Injectable()
export class DisputesExpertRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveExpert(userId: number) {
    return this.prisma.expert.findFirst({
      where: { profile: { userId }, isActive: true },
      select: { id: true },
    });
  }

  async findDisputeById(disputeId: number) {
    return this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: expertDisputeFullDetailInclude,
    });
  }

  async findConversationMessages(userA: number, userB: number, limit = 50) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { participant1: userA, participant2: userB },
          { participant1: userB, participant2: userA },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      return [];
    }

    const latestMessages = await this.prisma.directMessage.findMany({
      where: {
        conversationId: conversation.id,
        deletedAt: null,
      },
      select: {
        id: true,
        senderId: true,
        message: true,
        fileUrl: true,
        fileName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return latestMessages.reverse();
  }

  async listDisputes(query: GetDisputeListQueryType) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {};
    if (query.status) {
      where.status = query.status as DisputeStatus;
    }

    const orderBy: Prisma.DisputeOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.order || 'desc',
    };

    const [total, data] = await Promise.all([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: expertDisputeListInclude,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async makeDecisionTransaction(
    disputeId: number,
    expertId: number,
    freelancerAmount: number,
    clientAmount: number,
    decisionReason: string,
    clientId: number,
    freelancerId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          freelancerAmount: new Prisma.Decimal(freelancerAmount),
          clientAmount: new Prisma.Decimal(clientAmount),
          decisionReason,
          decisionById: expertId,
          decisionAt: new Date(),
          status: DisputeStatus.DECISION_MADE,
        },
      });

      await tx.disputeDecisionReview.upsert({
        where: { disputeId_userId: { disputeId, userId: clientId } },
        update: { response: DisputeDecisionResponse.PENDING, reason: null },
        create: {
          disputeId,
          userId: clientId,
          response: DisputeDecisionResponse.PENDING,
        },
      });

      await tx.disputeDecisionReview.upsert({
        where: { disputeId_userId: { disputeId, userId: freelancerId } },
        update: { response: DisputeDecisionResponse.PENDING, reason: null },
        create: {
          disputeId,
          userId: freelancerId,
          response: DisputeDecisionResponse.PENDING,
        },
      });

      return tx.dispute.findUnique({
        where: { id: disputeId },
        include: expertDisputeFullDetailInclude,
      });
    });
  }

  async finalizeDisputeTransaction(data: {
    disputeId: number;
    milestoneId: number;
    expertId: number;
    freelancerAmount: number;
    clientAmount: number;
    decisionReason: string;
    finalDecisionAt: Date;
    milestoneStatus: MilestoneStatus;
    milestonePaymentStatus: MilestonePaymentStatus;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: data.disputeId },
        data: {
          freelancerAmount: new Prisma.Decimal(data.freelancerAmount),
          clientAmount: new Prisma.Decimal(data.clientAmount),
          decisionReason: data.decisionReason,
          decisionById: data.expertId,
          finalDecisionAt: data.finalDecisionAt,
          status: DisputeStatus.FINALIZED,
        },
      });

      const updatedMilestone = await tx.milestone.update({
        where: { id: data.milestoneId },
        data: {
          status: data.milestoneStatus,
          paymentStatus: data.milestonePaymentStatus,
          completedAt: new Date(),
        },
      });

      const otherDisputedCount = await tx.milestone.count({
        where: {
          contractId: updatedMilestone.contractId,
          id: { not: data.milestoneId },
          status: MilestoneStatus.DISPUTED,
          deletedAt: null,
        },
      });

      if (otherDisputedCount === 0) {
        await tx.contract.update({
          where: { id: updatedMilestone.contractId },
          data: { status: ContractStatus.ACTIVE },
        });
      }

      await syncContractAndJobCompletion(tx, updatedMilestone.contractId);

      return tx.dispute.findUnique({
        where: { id: data.disputeId },
        include: expertDisputeFullDetailInclude,
      });
    });
  }
}
