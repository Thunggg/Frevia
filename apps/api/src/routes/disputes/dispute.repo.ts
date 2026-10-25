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

export const disputeDetailInclude = {
  milestone: {
    include: {
      contract: {
        include: {
          client: { select: { id: true, email: true } },
          freelancer: { select: { id: true, email: true } },
          job: {
            include: {
              jobCategories: {
                include: { category: true },
              },
              skills: {
                include: { skill: true },
              },
            },
          },
        },
      },
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
            job: {
              include: {
                jobCategories: {
                  include: { category: true },
                },
                skills: {
                  include: { skill: true },
                },
              },
            },
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

  /**
   * Tạo Dispute ở Giai đoạn 1: Thương lượng 2 bên (Miễn phí, 48h).
   */
  async createDisputeTransaction(data: {
    milestoneId: number;
    openedById: number;
    respondentId: number;
    reason: string;
    description: string;
    arbitrationFee: number;
    feeDeadline: Date;
    responseDeadline: Date;
    freelancerAmount: number;
    clientAmount: number;
    evidenceFiles?: { fileId?: number; description?: string }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Dispute với status OPEN và số tiền đề xuất ban đầu
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
          freelancerAmount: new Prisma.Decimal(data.freelancerAmount),
          clientAmount: new Prisma.Decimal(data.clientAmount),
          status: DisputeStatus.OPEN,
        },
      });

      // 2. Tạo DisputeEvidence ban đầu (nếu có)
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

      // 3. Khởi tạo trạng thái đồng thuận: Claimant đã ACCEPT đề xuất của mình, Respondent là PENDING
      await tx.disputeDecisionReview.createMany({
        data: [
          {
            disputeId: dispute.id,
            userId: data.openedById,
            response: DisputeDecisionResponse.ACCEPTED,
          },
          {
            disputeId: dispute.id,
            userId: data.respondentId,
            response: DisputeDecisionResponse.PENDING,
          },
        ],
      });

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
        include: disputeDetailInclude,
      });
    });
  }

  /**
   * Bổ sung bằng chứng (không giới hạn lần gửi trong thời gian thương lượng 48h).
   */
  async addEvidenceTransaction(
    disputeId: number,
    userId: number,
    type: DisputeEvidenceType,
    description?: string,
    evidenceFiles?: { fileId?: number; description?: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (description) {
        await tx.disputeEvidence.create({
          data: {
            disputeId,
            submittedById: userId,
            type,
            description,
          },
        });
      }

      if (evidenceFiles && evidenceFiles.length > 0) {
        await tx.disputeEvidence.createMany({
          data: evidenceFiles.map((evidence) => ({
            disputeId,
            submittedById: userId,
            type,
            description: evidence.description ?? null,
            fileId: evidence.fileId ?? null,
          })),
        });
      }

      return tx.dispute.findUnique({
        where: { id: disputeId },
        include: disputeDetailInclude,
      });
    });
  }

  /**
   * Đưa ra đề xuất phân chia mới (Counter-offer) trong 48h thương lượng.
   */
  async counterOfferTransaction(data: {
    disputeId: number;
    userId: number;
    otherUserId: number;
    freelancerAmount: number;
    clientAmount: number;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: data.disputeId },
        data: {
          freelancerAmount: new Prisma.Decimal(data.freelancerAmount),
          clientAmount: new Prisma.Decimal(data.clientAmount),
          decisionReason: data.reason ?? null,
          status: DisputeStatus.WAITING_RESPONSE,
        },
      });

      // Bên đưa đề xuất tự động ACCEPT đề xuất của mình
      await tx.disputeDecisionReview.upsert({
        where: {
          disputeId_userId: {
            disputeId: data.disputeId,
            userId: data.userId,
          },
        },
        update: {
          response: DisputeDecisionResponse.ACCEPTED,
          reason: data.reason ?? null,
        },
        create: {
          disputeId: data.disputeId,
          userId: data.userId,
          response: DisputeDecisionResponse.ACCEPTED,
          reason: data.reason ?? null,
        },
      });

      // Bên kia chuyển về PENDING chờ phản hồi
      await tx.disputeDecisionReview.upsert({
        where: {
          disputeId_userId: {
            disputeId: data.disputeId,
            userId: data.otherUserId,
          },
        },
        update: {
          response: DisputeDecisionResponse.PENDING,
          reason: null,
        },
        create: {
          disputeId: data.disputeId,
          userId: data.otherUserId,
          response: DisputeDecisionResponse.PENDING,
        },
      });

      return tx.dispute.findUnique({
        where: { id: data.disputeId },
        include: disputeDetailInclude,
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

  /**
   * Kích hoạt giai đoạn Trọng tài: Tạo 2 khoản phí DisputeFee ($200/người) và chuyển sang REVIEW_REQUESTED.
   */
  async escalateToArbitrationTransaction(
    disputeId: number,
    feeAmount: number,
    feeDeadline: Date,
    clientId: number,
    freelancerId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.disputeFee.upsert({
        where: { disputeId_userId: { disputeId, userId: clientId } },
        update: {
          amount: new Prisma.Decimal(feeAmount),
          status: DisputeFeeStatus.PENDING,
          deadline: feeDeadline,
        },
        create: {
          disputeId,
          userId: clientId,
          amount: new Prisma.Decimal(feeAmount),
          status: DisputeFeeStatus.PENDING,
          deadline: feeDeadline,
        },
      });

      await tx.disputeFee.upsert({
        where: { disputeId_userId: { disputeId, userId: freelancerId } },
        update: {
          amount: new Prisma.Decimal(feeAmount),
          status: DisputeFeeStatus.PENDING,
          deadline: feeDeadline,
        },
        create: {
          disputeId,
          userId: freelancerId,
          amount: new Prisma.Decimal(feeAmount),
          status: DisputeFeeStatus.PENDING,
          deadline: feeDeadline,
        },
      });

      return tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.REVIEW_REQUESTED,
          feeDeadline,
        },
        include: disputeDetailInclude,
      });
    });
  }

  async findUserWithProfileAndRoles(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
        profile: {
          include: { expertProfile: true },
        },
      },
    });
  }

  /**
   * Lấy toàn bộ chuyên gia đang hoạt động trong hệ thống.
   */
  async findAllActiveExperts() {
    return this.prisma.user.findMany({
      where: {
        profile: {
          expertProfile: {
            isActive: true,
          },
        },
        deletedAt: null,
        isBanned: false,
      },
      include: {
        profile: {
          include: { expertProfile: true },
        },
      },
    });
  }

  /**
   * Admin phân công Expert vào vụ tranh chấp.
   */
  async assignExpert(disputeId: number, expertId: number) {
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        decisionById: expertId,
        status: DisputeStatus.UNDER_REVIEW,
      },
      include: disputeDetailInclude,
    });
  }

  async claimDispute(disputeId: number, expertId: number) {
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        decisionById: expertId,
        status: DisputeStatus.UNDER_REVIEW,
      },
      include: disputeDetailInclude,
    });
  }

  async listDisputesForExpert(
    query: GetDisputeListQueryType,
    expertExpertise: string[],
    expertId: number,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {
      milestone: {
        contract: {
          clientId: { not: expertId },
          freelancerId: { not: expertId },
        },
      },
    };

    if (query.status) {
      where.status = query.status as DisputeStatus;
    } else {
      where.OR = [
        { decisionById: expertId },
        { status: DisputeStatus.REVIEW_REQUESTED, decisionById: null },
      ];
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
        include: disputeDetailInclude,
      });
    });
  }
}
