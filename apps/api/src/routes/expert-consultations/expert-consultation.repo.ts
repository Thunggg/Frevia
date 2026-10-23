import { Injectable } from '@nestjs/common';
import {
  ExpertConsultationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import {
  RoleName,
  type CreateExpertConsultationType,
  type ExpertConsultationListQueryType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const consultationInclude = {
  requester: {
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  expert: {
    select: {
      id: true,
      profile: {
        select: { userId: true, displayName: true, avatarUrl: true },
      },
    },
  },
} satisfies Prisma.ExpertConsultationInclude;

@Injectable()
export class ExpertConsultationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAvailableExpert(expertId: number) {
    return this.prisma.expert.findFirst({
      where: {
        id: expertId,
        isActive: true,
        profile: { user: { deletedAt: null, isBanned: false } },
      },
      select: {
        id: true,
        profile: { select: { userId: true, displayName: true } },
      },
    });
  }

  findActiveBetween(requesterId: number, expertId: number) {
    return this.prisma.expertConsultation.findFirst({
      where: {
        requesterId,
        expertId,
        status: {
          in: [
            ExpertConsultationStatus.PENDING,
            ExpertConsultationStatus.ACCEPTED,
            ExpertConsultationStatus.IN_PROGRESS,
          ],
        },
      },
      select: { id: true },
    });
  }

  create(
    requesterId: number,
    requesterRole: string,
    input: CreateExpertConsultationType,
    expertUserId: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const consultation = await transaction.expertConsultation.create({
        data: {
          requesterId,
          requesterRole,
          expertId: input.expertId,
          type: input.type,
          title: input.title,
          description: input.description,
        },
        include: consultationInclude,
      });
      await transaction.notification.create({
        data: {
          userId: expertUserId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'New consultation request',
          message: input.title,
          data: {
            kind: 'EXPERT_CONSULTATION_NEW',
            consultationId: consultation.id,
            requestTitle: consultation.title,
            href: '/expert/consultations',
          },
        },
      });
      return consultation;
    });
  }

  async findForRequester(
    requesterId: number,
    query: ExpertConsultationListQueryType,
  ) {
    const where: Prisma.ExpertConsultationWhereInput = {
      requesterId,
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [consultations, total] = await this.prisma.$transaction([
      this.prisma.expertConsultation.findMany({
        where,
        include: consultationInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.expertConsultation.count({ where }),
    ]);
    return { consultations, total };
  }

  async findForExpert(
    expertUserId: number,
    query: ExpertConsultationListQueryType,
  ) {
    const where: Prisma.ExpertConsultationWhereInput = {
      expert: { profile: { userId: expertUserId } },
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [consultations, total] = await this.prisma.$transaction([
      this.prisma.expertConsultation.findMany({
        where,
        include: consultationInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.expertConsultation.count({ where }),
    ]);
    return { consultations, total };
  }

  findById(id: number) {
    return this.prisma.expertConsultation.findUnique({
      where: { id },
      include: consultationInclude,
    });
  }

  updateStatus(
    id: number,
    status: ExpertConsultationStatus,
    requesterId: number,
    data: {
      rejectionReason?: string;
      expertResponse?: string;
      acceptedAt?: Date;
      startedAt?: Date;
      completedAt?: Date;
    } = {},
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const consultation = await transaction.expertConsultation.update({
        where: { id },
        data: { status, ...data },
        include: consultationInclude,
      });
      await transaction.notification.create({
        data: {
          userId: requesterId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Consultation request updated',
          message: consultation.title,
          data: {
            kind: `EXPERT_CONSULTATION_${status}`,
            consultationId: consultation.id,
            requestTitle: consultation.title,
            status,
            href:
              consultation.requesterRole === RoleName.CLIENT
                ? '/client/expert-consultations'
                : '/freelancer/expert-consultations',
          },
        },
      });
      return consultation;
    });
  }

  cancel(id: number, expertUserId: number) {
    return this.prisma.$transaction(async (transaction) => {
      const consultation = await transaction.expertConsultation.update({
        where: { id },
        data: { status: ExpertConsultationStatus.CANCELLED },
        include: consultationInclude,
      });
      await transaction.notification.create({
        data: {
          userId: expertUserId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'Consultation request cancelled',
          message: consultation.title,
          data: {
            kind: 'EXPERT_CONSULTATION_CANCELLED',
            consultationId: consultation.id,
            requestTitle: consultation.title,
            href: '/expert/consultations',
          },
        },
      });
      return consultation;
    });
  }
}
