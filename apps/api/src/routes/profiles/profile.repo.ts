import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class ProfileRepository {
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
}
