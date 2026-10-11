import { Injectable } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';

export type IdentityVerificationAdminListParams = {
  page: number;
  limit: number;
  status?: VerificationStatus;
  search?: string;
};

const listSelect = {
  id: true,
  userId: true,
  documentType: true,
  fileUrl: true,
  status: true,
  reviewNotes: true,
  createdAt: true,
  reviewedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
} as const;

const detailSelect = {
  id: true,
  userId: true,
  documentType: true,
  fileUrl: true,
  status: true,
  reviewNotes: true,
  createdAt: true,
  reviewedAt: true,
  admin: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      createdAt: true,
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
          bio: true,
          freelancerProfile: {
            select: {
              title: true,
              idVerified: true,
            },
          },
        },
      },
    },
  },
} as const;

@Injectable()
export class IdentityVerificationsAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDocuments(params: IdentityVerificationAdminListParams) {
    const { page, limit, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.IdVerificationDocumentWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                user: {
                  email: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                user: {
                  profile: {
                    displayName: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [documents, total] = await Promise.all([
      this.prisma.idVerificationDocument.findMany({
        where,
        select: listSelect,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.idVerificationDocument.count({ where }),
    ]);

    return {
      documents,
      total,
    };
  }

  async findDocumentById(id: number) {
    return this.prisma.idVerificationDocument.findFirst({
      where: { id, deletedAt: null },
      select: detailSelect,
    });
  }

  findDocumentRaw(id: number) {
    return this.prisma.idVerificationDocument.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, userId: true, fileUrl: true, status: true },
    });
  }

  async reviewDocument(
    id: number,
    adminId: number,
    status: VerificationStatus,
    reviewNotes: string | null,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const document = await transaction.idVerificationDocument.update({
          where: { id },
          data: {
            status,
            adminId,
            reviewNotes,
            reviewedAt: new Date(),
          },
          select: { userId: true },
        });

        const profile = await transaction.profile.findUnique({
          where: { userId: document.userId },
          select: { freelancerProfile: { select: { id: true } } },
        });

        if (profile?.freelancerProfile) {
          await transaction.freelancerProfile.update({
            where: { id: profile.freelancerProfile.id },
            data: { idVerified: status === VerificationStatus.APPROVED },
          });
        }

        return transaction.idVerificationDocument.findFirst({
          where: { id },
          select: detailSelect,
        });
      },
      { maxWait: 10_000, timeout: 15_000 },
    );
  }
}
