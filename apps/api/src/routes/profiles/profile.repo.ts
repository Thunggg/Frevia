import { Injectable } from '@nestjs/common';
import { UpdateFreelancerProfileType } from '@shared/types';
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

  async updateFreelancerProfile(
    profileId: number,
    data: UpdateFreelancerProfileType,
  ) {
    return this.prisma.profile.update({
      where: {
        id: profileId,
      },
      data: {
        displayName: data.displayName,
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.availabilityStatus !== undefined && {
          availabilityStatus: data.availabilityStatus,
        }),
        freelancerProfile: {
          upsert: {
            create: {
              title: data.title,
              education: data.education ?? null,
              certifications: data.certifications ?? null,
              languages: data.languages ?? null,
            },
            update: {
              title: data.title,
              ...(data.education !== undefined && {
                education: data.education,
              }),
              ...(data.certifications !== undefined && {
                certifications: data.certifications,
              }),
              ...(data.languages !== undefined && {
                languages: data.languages,
              }),
            },
          },
        },
      },
      include: {
        freelancerProfile: true,
      },
    });
  }
}
