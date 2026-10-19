import { Injectable } from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  ProfileRevisionType,
  RevisionStatus,
} from '@prisma/client';
import {
  RoleName,
  type AdminUpdateExpertProfileType,
  type PublicExpertQueryType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

const publicExpertSelect = {
  id: true,
  title: true,
  expertise: true,
  yearsOfExperience: true,
  education: true,
  certifications: true,
  website: true,
  isActive: true,
  profile: {
    select: {
      userId: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      profileCompletionPercent: true,
    },
  },
} as const;

@Injectable()
export class ExpertProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        profile: { include: { expertProfile: true } },
        userRoles: {
          where: { role: { deletedAt: null } },
          select: { role: { select: { name: true } } },
        },
      },
    });
  }

  async updateDirect(
    userId: number,
    adminId: number,
    input: AdminUpdateExpertProfileType,
    profileCompletionPercent: number,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const superseded = await transaction.profileRevision.updateMany({
        where: {
          userId,
          profileType: ProfileRevisionType.EXPERT,
          status: RevisionStatus.PENDING,
        },
        data: {
          status: RevisionStatus.REJECTED,
          adminId,
          reviewNotes: 'Superseded by a direct administrator update.',
          reviewedAt: new Date(),
        },
      });
      if (superseded.count > 0) {
        await transaction.notification.create({
          data: {
            userId,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: 'Profile request superseded',
            message:
              'An administrator updated your expert profile directly. Your pending request was closed.',
            data: { href: '/expert/profile' },
          },
        });
      }

      const profile = await transaction.profile.findUniqueOrThrow({
        where: { userId },
      });
      await transaction.profile.update({
        where: { id: profile.id },
        data: {
          displayName: input.displayName,
          bio: input.bio ?? null,
          profileCompletionPercent,
        },
      });
      await transaction.expert.upsert({
        where: { profileId: profile.id },
        create: {
          profileId: profile.id,
          title: input.title ?? null,
          expertise: input.expertise,
          yearsOfExperience: input.yearsOfExperience ?? 0,
          education: input.education,
          certifications: input.certifications,
          website: input.website || null,
          isActive: input.isActive,
        },
        update: {
          title: input.title ?? null,
          expertise: input.expertise,
          yearsOfExperience: input.yearsOfExperience ?? 0,
          education: input.education,
          certifications: input.certifications,
          website: input.website || null,
          isActive: input.isActive,
        },
      });
    });
  }

  hasPendingRevision(userId: number) {
    return this.prisma.profileRevision.findFirst({
      where: {
        userId,
        profileType: ProfileRevisionType.EXPERT,
        status: RevisionStatus.PENDING,
      },
      select: { id: true },
    });
  }

  async findPublicMany(query: PublicExpertQueryType) {
    const expertise = query.expertise
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const where: Prisma.ExpertWhereInput = {
      isActive: true,
      profile: {
        user: {
          deletedAt: null,
          isBanned: false,
          userRoles: {
            some: {
              role: { name: RoleName.EXPERT, deletedAt: null },
            },
          },
        },
      },
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                profile: {
                  displayName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                profile: {
                  bio: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(expertise?.length ? { expertise: { hasSome: expertise } } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [experts, total] = await this.prisma.$transaction([
      this.prisma.expert.findMany({
        where,
        select: publicExpertSelect,
        skip,
        take: query.limit,
        orderBy: [
          { profile: { profileCompletionPercent: 'desc' } },
          { updatedAt: 'desc' },
        ],
      }),
      this.prisma.expert.count({ where }),
    ]);
    return { experts, total };
  }

  findPublicById(id: number) {
    return this.prisma.expert.findFirst({
      where: {
        id,
        isActive: true,
        profile: {
          user: {
            deletedAt: null,
            isBanned: false,
            userRoles: {
              some: { role: { name: RoleName.EXPERT, deletedAt: null } },
            },
          },
        },
      },
      select: publicExpertSelect,
    });
  }
}
