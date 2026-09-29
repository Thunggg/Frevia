import { Injectable } from '@nestjs/common';
import { AddPortfolioType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFreelancerProfileById(profileId: number) {
    return this.prisma.profile.findFirst({
      where: {
        id: profileId,
        user: {
          deletedAt: null,
        },
      },
      include: {
        freelancerProfile: true,
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async findPortfoliosByFreelancerProfileId(freelancerProfileId: number) {
    return this.prisma.portfolioItem.findMany({
      where: {
        freelancerProfileId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addPortfolioToProfile(profileId: number, data: AddPortfolioType) {
    return this.prisma.$transaction(async (tx) => {
      let freelancerProfile = await tx.freelancerProfile.findUnique({
        where: { profileId },
      });

      if (!freelancerProfile) {
        freelancerProfile = await tx.freelancerProfile.create({
          data: {
            profileId,
          },
        });
      }

      return tx.portfolioItem.create({
        data: {
          freelancerProfileId: freelancerProfile.id,
          title: data.title,
          description: data.description ?? null,
          mediaUrls: data.mediaUrls ?? [],
          projectUrl: data.projectUrl ?? null,
        },
      });
    });
  }

  async findPortfolioById(portfolioId: number) {
    return this.prisma.portfolioItem.findFirst({
      where: {
        id: portfolioId,
        deletedAt: null,
      },
    });
  }
}
