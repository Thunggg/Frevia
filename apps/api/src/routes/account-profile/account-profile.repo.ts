import { Injectable } from '@nestjs/common';
import {
  AddSocialLinkType,
  DocumentTypeType,
  RoleName,
  UpdateClientProfileType,
  UpdateGeneralProfileType,
} from '@shared/types';
import { NotificationType, Prisma, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  calculateClientProfileStrength,
  calculateFreelancerProfileStrength,
} from '../../shared/utils/profile-strength';

@Injectable()
export class AccountProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserWithRoles(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { userRoles: { include: { role: true } }, profile: true },
    });
  }

  findGeneralProfile(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        profile: true,

        userRoles: {
          select: { isPrimary: true, role: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  findPasswordCredential(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        password: true,
        profile: { select: { id: true } },
      },
    });
  }

  async updateGeneralProfile(
    userId: number,
    input: UpdateGeneralProfileType,
    primaryRole?: string,
  ) {
    const current = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
      include: {
        clientProfile: true,
        freelancerProfile: {
          include: {
            _count: {
              select: {
                skills: true,
                portfolioItems: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
    });
    const profileCompletionPercent =
      primaryRole === RoleName.CLIENT
        ? calculateClientProfileStrength({
            ...input,
            companyName: current.clientProfile?.companyName,
            companyDescription: current.clientProfile?.companyDescription,
            website: current.clientProfile?.website,
          })
        : primaryRole === RoleName.FREELANCER
          ? calculateFreelancerProfileStrength({
              ...input,
              title: current.freelancerProfile?.title,
              education: current.freelancerProfile?.education,
              certifications: current.freelancerProfile?.certifications,
              skillCount: current.freelancerProfile?._count.skills ?? 0,
              portfolioCount:
                current.freelancerProfile?._count.portfolioItems ?? 0,
            })
          : current.profileCompletionPercent;

    return this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        bio: input.bio ?? null,
        profileCompletionPercent,
      },
    });
  }

  updatePassword(userId: number, password: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password },
    });
  }

  updateAvatar(userId: number, avatarUrl: string) {
    return this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
      select: { avatarUrl: true, updatedAt: true },
    });
  }

  findClientProfile(userId: number) {
    return this.prisma.profile.findFirst({
      where: { userId, user: { deletedAt: null } },
      include: {
        clientProfile: true,
        socialLinks: { orderBy: { platform: 'asc' } },
        user: { include: { userRoles: { include: { role: true } } } },
      },
    });
  }

  async updateClientProfile(userId: number, input: UpdateClientProfileType) {
    return this.prisma.$transaction(async (transaction) => {
      const profile = await transaction.profile.findUniqueOrThrow({
        where: { userId },
      });
      const profileCompletionPercent = calculateClientProfileStrength({
        displayName: profile.displayName,
        bio: profile.bio,
        ...input,
      });
      await transaction.profile.update({
        where: { id: profile.id },
        data: { profileCompletionPercent },
      });
      await transaction.clientProfile.upsert({
        where: { profileId: profile.id },
        create: { profileId: profile.id, ...input },
        update: input,
      });
      return transaction.profile.findUniqueOrThrow({
        where: { id: profile.id },
        include: {
          clientProfile: true,
          socialLinks: { orderBy: { platform: 'asc' } },
        },
      });
    });
  }

  createIdentityDocument(
    userId: number,
    documentType: DocumentTypeType,
    fileUrl: string,
  ) {
    return this.prisma.idVerificationDocument.create({
      data: { userId, documentType, fileUrl },
    });
  }

  createIdentityAiDocument(data: {
    userId: number;
    documentType: DocumentTypeType;
    fileUrl: string;
    backFileUrl: string | null;
    status: VerificationStatus;
    reviewNotes: string | null;
    duplicateOfId: number | null;
    aiStatus: string;
    aiScore: number | null;
    aiError: string | null;
    aiSummary: Prisma.InputJsonValue;
    aiSelfieSummary: Prisma.InputJsonValue;
    aiScannedAt: Date;
  }) {
    return this.prisma.idVerificationDocument.create({ data });
  }

  /**
   * Check trùng CCCD đã được APPROVED bởi user khác.
   *
   * 2 bước:
   * 1. Exact match trên cột có index (nhanh, đúng với bản ghi đã chuẩn hóa).
   * 2. Fallback so SỚM normalized (bỏ ký tự phân tách) để không bỏ lọt
   *    bản ghi cũ lưu dạng "0012 345 678 90". Bảng này ít row nên quét
   *    full vẫn chấp nhận được.
   */
  async findApprovedIdentityDocumentByIdentityNumber(
    userId: number,
    identityNumber: string,
  ) {
    const baseWhere = Prisma.sql`
      "deletedAt" IS NULL
      AND "status" = 'APPROVED'
      AND "userId" <> ${userId}
    `;

    const exact = await this.prisma.idVerificationDocument.findFirst({
      where: {
        identityNumber,
        status: VerificationStatus.APPROVED,
        deletedAt: null,
        userId: { not: userId },
      },
      select: { id: true },
    });
    if (exact) return exact;

    const [row] = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT "id" FROM "IdVerificationDocument"
      WHERE ${baseWhere}
        AND regexp_replace("identityNumber", '[^A-Za-z0-9]', '', 'g') = ${identityNumber}
      LIMIT 1
    `;
    return row ?? null;
  }

  findIdentityDocuments(userId: number) {
    return this.prisma.idVerificationDocument.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findIdentityDocumentById(id: number) {
    return this.prisma.idVerificationDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findSocialLinks(userId: number) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    return this.prisma.socialLink.findMany({
      where: { profileId: profile.id },
      orderBy: { platform: 'asc' },
    });
  }

  async findSocialLinkByPlatform(
    userId: number,
    platform: AddSocialLinkType['platform'],
  ) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    return this.prisma.socialLink.findFirst({
      where: { profileId: profile.id, platform },
    });
  }

  async createSocialLink(userId: number, input: AddSocialLinkType) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
    });
    return this.prisma.socialLink.create({
      data: { profileId: profile.id, ...input },
    });
  }

  findSocialLinkById(id: number) {
    return this.prisma.socialLink.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  deleteSocialLink(id: number) {
    return this.prisma.socialLink.delete({ where: { id } });
  }

  findFavorite(clientId: number, freelancerId: number) {
    return this.prisma.favoriteFreelancer.findUnique({
      where: { clientId_freelancerId: { clientId, freelancerId } },
    });
  }

  createFavorite(clientId: number, freelancerId: number) {
    return this.prisma.favoriteFreelancer.create({
      data: { clientId, freelancerId },
    });
  }

  deleteFavorite(clientId: number, freelancerId: number) {
    return this.prisma.favoriteFreelancer.delete({
      where: { clientId_freelancerId: { clientId, freelancerId } },
    });
  }

  findFavorites(clientId: number) {
    return this.prisma.favoriteFreelancer.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        freelancer: {
          include: {
            profile: {
              include: {
                freelancerProfile: {
                  include: {
                    skills: {
                      include: { skill: true },
                      orderBy: { proficiencyLevel: 'desc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findFollow(clientId: number, freelancerId: number) {
    return this.prisma.followFreelancer.findUnique({
      where: { clientId_freelancerId: { clientId, freelancerId } },
    });
  }

  createFollowWithNotification(
    clientId: number,
    freelancerId: number,
    followerName: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const follow = await transaction.followFreelancer.create({
        data: { clientId, freelancerId },
      });

      await transaction.notification.create({
        data: {
          userId: freelancerId,
          type: NotificationType.NEW_FOLLOWER,
          title: 'You have a new follower',
          message: `${followerName} started following you.`,
          data: {
            href: `/clients/${clientId}`,
            followerUserId: clientId,
            followerName,
          },
        },
      });

      return follow;
    });
  }

  deleteFollow(clientId: number, freelancerId: number) {
    return this.prisma.followFreelancer.delete({
      where: { clientId_freelancerId: { clientId, freelancerId } },
    });
  }

  findFollowing(clientId: number) {
    return this.prisma.followFreelancer.findMany({
      where: { clientId, freelancer: { deletedAt: null, isBanned: false } },
      include: {
        freelancer: {
          include: {
            profile: {
              include: {
                freelancerProfile: {
                  include: {
                    skills: {
                      include: { skill: true },
                      orderBy: { proficiencyLevel: 'desc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findDiscoverableFreelancers(clientId: number) {
    return this.prisma.user.findMany({
      where: {
        id: { not: clientId },
        isBanned: false,
        deletedAt: null,
        userRoles: {
          some: {
            role: { name: RoleName.FREELANCER, deletedAt: null },
          },
        },
        profile: {
          is: { freelancerProfile: { isNot: null } },
        },
      },
      select: {
        id: true,
        profile: {
          include: {
            freelancerProfile: {
              include: {
                skills: {
                  include: { skill: true },
                  orderBy: { proficiencyLevel: 'desc' },
                },
              },
            },
          },
        },
        followsAsFreelancer: {
          where: { clientId },
          select: { clientId: true },
          take: 1,
        },
      },
      orderBy: [
        { profile: { profileCompletionPercent: 'desc' } },
        { id: 'desc' },
      ],
    });
  }
}
