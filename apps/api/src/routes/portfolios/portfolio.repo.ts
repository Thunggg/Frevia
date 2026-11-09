import { Injectable } from '@nestjs/common';
import { AddPortfolioType, UpdatePortfolioType } from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import { refreshFreelancerStrength } from '../../shared/utils/refresh-freelancer-strength';

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
      const freelancerProfile = await tx.freelancerProfile.upsert({
        where: { profileId },
        update: {},
        create: { profileId },
      });
      const portfolio = await tx.portfolioItem.create({
        data: {
          freelancerProfileId: freelancerProfile.id,
          title: data.title,
          description: data.description ?? null,
          technologies: data.technologies ?? [],
          projectUrl: data.projectUrl ?? null,
        },
      });
      await refreshFreelancerStrength(tx, profileId);
      return portfolio;
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

  async findPortfolioWithProfile(portfolioId: number) {
    return this.prisma.portfolioItem.findFirst({
      where: {
        id: portfolioId,
        deletedAt: null,
      },
      include: {
        freelancerProfile: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async updatePortfolio(portfolioId: number, data: UpdatePortfolioType) {
    return this.prisma.portfolioItem.update({
      where: {
        id: portfolioId,
        deletedAt: null,
      },
      data: {
        title: data.title,
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.technologies !== undefined && {
          technologies: data.technologies,
        }),
        ...(data.projectUrl !== undefined && { projectUrl: data.projectUrl }),
      },
    });
  }

  async deletePortfolio(portfolioId: number) {
    return this.prisma.$transaction(async (transaction) => {
      const portfolio = await transaction.portfolioItem.update({
        where: { id: portfolioId, deletedAt: null },
        data: { deletedAt: new Date() },
        include: { freelancerProfile: { select: { profileId: true } } },
      });
      await refreshFreelancerStrength(
        transaction,
        portfolio.freelancerProfile.profileId,
      );
      return portfolio;
    });
  }
}
