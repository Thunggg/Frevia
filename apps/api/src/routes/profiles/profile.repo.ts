import { Injectable } from '@nestjs/common';
import {
  UpdateFreelancerProfileType,
  AddFreelancerSkillType,
} from '@shared/types';
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

  async findSkillsByProfileId(profileId: number) {
    return this.prisma.freelancerSkill.findMany({
      where: {
        freelancerProfile: {
          profileId,
          profile: {
            user: {
              deletedAt: null,
            },
          },
        },
      },
      select: {
        id: true,
        freelancerProfileId: true,
        skillName: true,
        proficiencyLevel: true,
      },
    });
  }

  async findSkillByNameAndProfileId(profileId: number, skillName: string) {
    return this.prisma.freelancerSkill.findFirst({
      where: {
        skillName: {
          equals: skillName,
          mode: 'insensitive',
        },
        freelancerProfile: {
          profileId,
        },
      },
    });
  }

  async addSkillToProfile(
    profileId: number,
    skillData: AddFreelancerSkillType,
  ) {
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

      return tx.freelancerSkill.create({
        data: {
          freelancerProfileId: freelancerProfile.id,
          skillName: skillData.skillName,
          proficiencyLevel: skillData.proficiencyLevel,
        },
      });
    });
  }
}
