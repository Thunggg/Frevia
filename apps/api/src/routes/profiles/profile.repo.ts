import { Injectable } from '@nestjs/common';
import { AvailabilityStatus } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFreelancerProfileById(profileId: number) {
    return this.prisma.profile.findUnique({
      where: {
        id: profileId,
        user: {
          deletedAt: null,
        },
      },
      include: {
        freelancerProfile: true,
      },
    });
  }

  async updateFreelancerProfile(
    profileId: number,
    data: {
      displayName: string;
      title: string;
      bio?: string | null;
      availabilityStatus?: AvailabilityStatus;
      education?: any;
      certifications?: any;
      languages?: any;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Profile fields
      await tx.profile.update({
        where: { id: profileId },
        data: {
          displayName: data.displayName,
          bio: data.bio ?? null,
          availabilityStatus: data.availabilityStatus,
        },
      });

      // 2. Upsert FreelancerProfile fields
      await tx.freelancerProfile.upsert({
        where: { profileId },
        update: {
          title: data.title,
          education: data.education ?? null,
          certifications: data.certifications ?? null,
          languages: data.languages ?? null,
        },
        create: {
          profileId,
          title: data.title,
          education: data.education ?? null,
          certifications: data.certifications ?? null,
          languages: data.languages ?? null,
        },
      });

      // 3. Fetch the fully updated profile to return
      return tx.profile.findUnique({
        where: { id: profileId },
        include: {
          freelancerProfile: true,
        },
      });
    });
  }

  async findSkillsByProfileId(profileId: number) {
    const freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { profileId },
    });
    if (!freelancerProfile) return [];
    return this.prisma.freelancerSkill.findMany({
      where: { freelancerProfileId: freelancerProfile.id },
    });
  }

  async findSkillByNameAndProfileId(profileId: number, skillName: string) {
    const freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { profileId },
    });
    if (!freelancerProfile) return null;
    return this.prisma.freelancerSkill.findFirst({
      where: {
        freelancerProfileId: freelancerProfile.id,
        skillName,
      },
    });
  }

  async addSkillToProfile(
    profileId: number,
    skillName: string,
    proficiencyLevel: number,
  ) {
    let freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { profileId },
    });
    if (!freelancerProfile) {
      freelancerProfile = await this.prisma.freelancerProfile.create({
        data: { profileId },
      });
    }

    return this.prisma.freelancerSkill.create({
      data: {
        freelancerProfileId: freelancerProfile.id,
        skillName,
        proficiencyLevel,
      },
    });
  }

  async findSkillById(skillId: number) {
    return this.prisma.freelancerSkill.findUnique({
      where: { id: skillId },
      include: {
        freelancerProfile: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async deleteSkill(skillId: number) {
    return this.prisma.freelancerSkill.delete({
      where: { id: skillId },
    });
  }
}
