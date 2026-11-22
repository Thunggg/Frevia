import { Injectable } from '@nestjs/common';
import {
  DisputeDecisionResponse,
  DisputeEvidenceType,
  DisputeResolutionType,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import { GetDisputeListQueryType } from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';
import { syncContractAndJobCompletion } from '../../../shared/helper/contract-activation.helper';

const disputeDetailInclude = {
  milestone: {
    include: {
      contract: true,
    },
  },
  openedBy: { select: { id: true, email: true } },
  respondent: { select: { id: true, email: true } },
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
export class DisputeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMilestoneWithContract(milestoneId: number) {
    return this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            client: { select: { id: true, email: true } },
            freelancer: { select: { id: true, email: true } },
          },
        },
        dispute: true,
      },
    });
  }

  async findDisputeById(disputeId: number) {
    return this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: disputeDetailInclude,
    });
  }

  async findDisputeByMilestoneId(milestoneId: number) {
    return this.prisma.dispute.findUnique({
      where: { milestoneId },
      include: disputeDetailInclude,
    });
  }

  async findSharedFilesByIds(fileIds: number[], contractId: number) {
    return this.prisma.sharedFile.findMany({
      where: {
        id: { in: fileIds },
        contractId,
        deletedAt: null,
      },
    });
  }

  async createDisputeTransaction(data: {
    milestoneId: number;
    openedById: number;
    respondentId: number;
    reason: string;
    description: string;
    resolutionType: DisputeResolutionType;
    proposedFreelancerAmount?: number | null;
    proposedClientAmount?: number | null;
    proposedDueDate?: Date | null;
    previousMilestoneStatus: MilestoneStatus;
    responseDeadline: Date;
    evidenceFiles?: { fileId?: number; description?: string }[];
    replaceCancelledDisputeId?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (data.replaceCancelledDisputeId) {
        await tx.dispute.delete({
          where: { id: data.replaceCancelledDisputeId },
        });
      }

      const dispute = await tx.dispute.create({
        data: {
          milestoneId: data.milestoneId,
          openedById: data.openedById,
          respondentId: data.respondentId,
          reason: data.reason,
          description: data.description,
          resolutionType: data.resolutionType,
          proposedFreelancerAmount:
            data.proposedFreelancerAmount !== undefined &&
            data.proposedFreelancerAmount !== null
              ? new Prisma.Decimal(data.proposedFreelancerAmount)
              : null,
          proposedClientAmount:
            data.proposedClientAmount !== undefined &&
            data.proposedClientAmount !== null
              ? new Prisma.Decimal(data.proposedClientAmount)
              : null,
          proposedDueDate: data.proposedDueDate ?? null,
          previousMilestoneStatus: data.previousMilestoneStatus,
          arbitrationFee: new Prisma.Decimal(0),
          feeDeadline: new Date(),
          responseDeadline: data.responseDeadline,
          status: DisputeStatus.WAITING_RESPONSE,
        },
      });

      if (data.evidenceFiles && data.evidenceFiles.length > 0) {
        await tx.disputeEvidence.createMany({
          data: data.evidenceFiles.map((evidence) => ({
            disputeId: dispute.id,
            submittedById: data.openedById,
            type: DisputeEvidenceType.CLAIM,
            description: evidence.description ?? null,
            fileId: evidence.fileId ?? null,
          })),
        });
      }

      await tx.milestone.update({
        where: { id: data.milestoneId },
        data: {
          status: MilestoneStatus.DISPUTED,
          paymentStatus: MilestonePaymentStatus.DISPUTED,
        },
      });

      return tx.dispute.findUnique({
        where: { id: dispute.id },
        include: disputeDetailInclude,
      });
    });
  }

  async declineDisputeTransaction(
    disputeId: number,
    respondentId: number,
    declineReason: string,
    evidenceFiles?: { fileId?: number; description?: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.disputeEvidence.create({
        data: {
          disputeId,
          submittedById: respondentId,
          type: DisputeEvidenceType.RESPONSE,
          description: declineReason,
        },
      });

      if (evidenceFiles && evidenceFiles.length > 0) {
        await tx.disputeEvidence.createMany({
          data: evidenceFiles.map((evidence) => ({
            disputeId,
            submittedById: respondentId,
            type: DisputeEvidenceType.RESPONSE,
            description: evidence.description ?? null,
            fileId: evidence.fileId ?? null,
          })),
        });
      }

      return tx.dispute.update({
        where: { id: disputeId },
        data: {
          declineReason,
          declinedAt: new Date(),
          escalatedAt: new Date(),
          status: DisputeStatus.UNDER_REVIEW,
        },
        include: disputeDetailInclude,
      });
    });
  }

  async acceptExtendDeadlineTransaction(data: {
    disputeId: number;
    milestoneId: number;
    proposedDueDate: Date;
    restoredStatus: MilestoneStatus;
    decisionReason: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.milestone.update({
        where: { id: data.milestoneId },
        data: {
          dueDate: data.proposedDueDate,
          status: data.restoredStatus,
          paymentStatus: MilestonePaymentStatus.FUNDED,
        },
      });

      return tx.dispute.update({
        where: { id: data.disputeId },
        data: {
          status: DisputeStatus.FINALIZED,
          decisionReason: data.decisionReason,
          finalDecisionAt: new Date(),
        },
        include: disputeDetailInclude,
      });
    });
  }

  async withdrawDisputeTransaction(
    disputeId: number,
    milestoneId: number,
    restoredStatus: MilestoneStatus,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: restoredStatus,
          paymentStatus: MilestonePaymentStatus.FUNDED,
        },
      });

      return tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.CANCELLED,
        },
        include: disputeDetailInclude,
      });
    });
  }

  async escalateDisputeTransaction(disputeId: number) {
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.UNDER_REVIEW,
        escalatedAt: new Date(),
      },
      include: disputeDetailInclude,
    });
  }

  async listDisputes(query: GetDisputeListQueryType, userId: number) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {
      OR: [{ openedById: userId }, { respondentId: userId }],
    };
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
        include: disputeDetailInclude,
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

  async upsertDecisionReview(
    disputeId: number,
    userId: number,
    response: DisputeDecisionResponse,
    reason?: string,
  ) {
    return this.prisma.disputeDecisionReview.upsert({
      where: { disputeId_userId: { disputeId, userId } },
      update: {
        response,
        reason: reason ?? null,
      },
      create: {
        disputeId,
        userId,
        response,
        reason: reason ?? null,
      },
    });
  }

  async findDecisionReviews(disputeId: number) {
    return this.prisma.disputeDecisionReview.findMany({
      where: { disputeId },
    });
  }

  async updateDisputeStatus(disputeId: number, status: DisputeStatus) {
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status },
      include: disputeDetailInclude,
    });
  }

  async finalizeDisputeTransaction(data: {
    disputeId: number;
    milestoneId: number;
    freelancerAmount: number;
    clientAmount: number;
    decisionReason?: string;
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
          ...(data.decisionReason
            ? { decisionReason: data.decisionReason }
            : {}),
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

      await syncContractAndJobCompletion(tx, updatedMilestone.contractId);

      return tx.dispute.findUnique({
        where: { id: data.disputeId },
        include: disputeDetailInclude,
      });
    });
  }
}
