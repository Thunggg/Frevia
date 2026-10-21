import { Injectable } from '@nestjs/common';
import {
  DisputeDecisionResponse,
  DisputeEvidenceType,
  DisputeFeeStatus,
  DisputeStatus,
  MilestonePaymentStatus,
  MilestoneStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import { GetDisputeListQueryType } from '@shared/types';

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
      include: {
        milestone: {
          include: {
            contract: true,
          },
        },
        openedBy: { select: { id: true, email: true } },
        respondent: { select: { id: true, email: true } },
        decisionBy: { select: { id: true, email: true } },
        fees: true,
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
          orderBy: { createdAt: 'asc' },
        },
        decisionReviews: true,
      },
    });
  }

  async findDisputeByMilestoneId(milestoneId: number) {
    return this.prisma.dispute.findUnique({
      where: { milestoneId },
      include: {
        milestone: {
          include: {
            contract: true,
          },
        },
        openedBy: { select: { id: true, email: true } },
        respondent: { select: { id: true, email: true } },
        decisionBy: { select: { id: true, email: true } },
        fees: true,
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
          orderBy: { createdAt: 'asc' },
        },
        decisionReviews: true,
      },
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
    arbitrationFee: number;
    feeDeadline: Date;
    responseDeadline: Date;
    evidenceFiles?: { fileId?: number; description?: string }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Dispute
      const dispute = await tx.dispute.create({
        data: {
          milestoneId: data.milestoneId,
          openedById: data.openedById,
          respondentId: data.respondentId,
          reason: data.reason,
          description: data.description,
          arbitrationFee: new Prisma.Decimal(data.arbitrationFee),
          feeDeadline: data.feeDeadline,
          responseDeadline: data.responseDeadline,
          status: DisputeStatus.OPEN,
        },
      });

      // 2. Tạo 2 DisputeFee records cho Creator và Respondent
      await tx.disputeFee.createMany({
        data: [
          {
            disputeId: dispute.id,
            userId: data.openedById,
            amount: new Prisma.Decimal(data.arbitrationFee),
            status: DisputeFeeStatus.PENDING,
            deadline: data.feeDeadline,
          },
          {
            disputeId: dispute.id,
            userId: data.respondentId,
            amount: new Prisma.Decimal(data.arbitrationFee),
            status: DisputeFeeStatus.PENDING,
            deadline: data.feeDeadline,
          },
        ],
      });

      // 3. Tạo DisputeEvidence records cho Creator (CLAIM)
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

      // 4. Khóa Milestone: status = DISPUTED, paymentStatus = DISPUTED
      await tx.milestone.update({
        where: { id: data.milestoneId },
        data: {
          status: MilestoneStatus.DISPUTED,
          paymentStatus: MilestonePaymentStatus.DISPUTED,
        },
      });

      return tx.dispute.findUnique({
        where: { id: dispute.id },
        include: {
          milestone: {
            include: { contract: true },
          },
          openedBy: { select: { id: true, email: true } },
          respondent: { select: { id: true, email: true } },
          fees: true,
          evidences: {
            include: { file: true },
          },
          decisionReviews: true,
        },
      });
    });
  }

  async findFeeByDisputeAndUser(disputeId: number, userId: number) {
    return this.prisma.disputeFee.findUnique({
      where: {
        disputeId_userId: {
          disputeId,
          userId,
        },
      },
    });
  }

  async updateFeeStatus(
    feeId: number,
    status: DisputeFeeStatus,
    paymentIntentId: string,
    paidAt: Date,
  ) {
    return this.prisma.disputeFee.update({
      where: { id: feeId },
      data: {
        status,
        paymentIntentId,
        paidAt,
      },
    });
  }

  async markFeeOverdue(feeId: number) {
    return this.prisma.disputeFee.update({
      where: { id: feeId },
      data: {
        status: DisputeFeeStatus.OVERDUE,
      },
    });
  }

  async hasUserSubmittedEvidence(
    disputeId: number,
    userId: number,
    type: DisputeEvidenceType,
  ) {
    const existing = await this.prisma.disputeEvidence.findFirst({
      where: {
        disputeId,
        submittedById: userId,
        type,
      },
    });
    return !!existing;
  }

  async submitResponseTransaction(
    disputeId: number,
    respondentId: number,
    description: string,
    evidenceFiles?: { fileId?: number; description?: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo evidence chính mô tả phản hồi
      await tx.disputeEvidence.create({
        data: {
          disputeId,
          submittedById: respondentId,
          type: DisputeEvidenceType.RESPONSE,
          description,
        },
      });

      // 2. Tạo evidence cho các file đính kèm
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

      // 3. Chuyển trạng thái Dispute sang UNDER_REVIEW
      return tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.UNDER_REVIEW,
        },
        include: {
          milestone: true,
          openedBy: { select: { id: true, email: true } },
          respondent: { select: { id: true, email: true } },
          fees: true,
          evidences: {
            include: { file: true },
          },
          decisionReviews: true,
        },
      });
    });
  }

  async listDisputes(query: GetDisputeListQueryType, userId?: number) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {};
    if (userId) {
      where.OR = [{ openedById: userId }, { respondentId: userId }];
    }
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
        include: {
          milestone: {
            include: { contract: true },
          },
          openedBy: { select: { id: true, email: true } },
          respondent: { select: { id: true, email: true } },
          decisionBy: { select: { id: true, email: true } },
          fees: true,
          evidences: {
            include: { file: true },
          },
          decisionReviews: true,
        },
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
    adminId: number,
    freelancerAmount: number,
    clientAmount: number,
    decisionReason: string,
    clientId: number,
    freelancerId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật Dispute với quyết định đầu tiên
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          freelancerAmount: new Prisma.Decimal(freelancerAmount),
          clientAmount: new Prisma.Decimal(clientAmount),
          decisionReason,
          decisionById: adminId,
          decisionAt: new Date(),
          status: DisputeStatus.DECISION_MADE,
        },
      });

      // 2. Chuẩn bị 2 bản ghi DisputeDecisionReview (PENDING) cho 2 bên
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
        include: {
          milestone: { include: { contract: true } },
          openedBy: { select: { id: true, email: true } },
          respondent: { select: { id: true, email: true } },
          decisionBy: { select: { id: true, email: true } },
          fees: true,
          evidences: { include: { file: true } },
          decisionReviews: true,
        },
      });
    });
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
      include: {
        milestone: { include: { contract: true } },
        openedBy: { select: { id: true, email: true } },
        respondent: { select: { id: true, email: true } },
        decisionBy: { select: { id: true, email: true } },
        fees: true,
        evidences: { include: { file: true } },
        decisionReviews: true,
      },
    });
  }

  async finalizeDisputeTransaction(data: {
    disputeId: number;
    milestoneId: number;
    adminId?: number;
    freelancerAmount: number;
    clientAmount: number;
    decisionReason?: string;
    finalDecisionAt: Date;
    milestoneStatus: MilestoneStatus;
    milestonePaymentStatus: MilestonePaymentStatus;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật Dispute thành FINALIZED
      await tx.dispute.update({
        where: { id: data.disputeId },
        data: {
          freelancerAmount: new Prisma.Decimal(data.freelancerAmount),
          clientAmount: new Prisma.Decimal(data.clientAmount),
          ...(data.decisionReason
            ? { decisionReason: data.decisionReason }
            : {}),
          ...(data.adminId ? { decisionById: data.adminId } : {}),
          finalDecisionAt: data.finalDecisionAt,
          status: DisputeStatus.FINALIZED,
        },
      });

      // 2. Cập nhật Milestone với trạng thái hoàn tất và thanh toán
      await tx.milestone.update({
        where: { id: data.milestoneId },
        data: {
          status: data.milestoneStatus,
          paymentStatus: data.milestonePaymentStatus,
          completedAt: new Date(),
        },
      });

      return tx.dispute.findUnique({
        where: { id: data.disputeId },
        include: {
          milestone: { include: { contract: true } },
          openedBy: { select: { id: true, email: true } },
          respondent: { select: { id: true, email: true } },
          decisionBy: { select: { id: true, email: true } },
          fees: true,
          evidences: { include: { file: true } },
          decisionReviews: true,
        },
      });
    });
  }
}
