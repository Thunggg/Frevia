import { Injectable } from '@nestjs/common';
import {
  AddSocialLinkType,
  DocumentTypeType,
  UpdateClientProfileType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AccountProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserWithRoles(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { userRoles: { include: { role: true } }, profile: true },
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
                    skills: { orderBy: { proficiencyLevel: 'desc' } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
