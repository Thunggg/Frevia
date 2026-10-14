import { Injectable } from '@nestjs/common';
import { AvailabilityStatus, Prisma } from '@prisma/client';
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
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
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
      education?: string[] | null;
      certifications?: string[] | null;
      languages?: string[] | null;
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
      // Lưu ý: education/certifications/languages là String[] (không nullable),
      // null → [] (xoá hết mục)
      await tx.freelancerProfile.upsert({
        where: { profileId },
        update: {
          title: data.title,
          education: data.education ?? [],
          certifications: data.certifications ?? [],
          languages: data.languages ?? [],
        },
        create: {
          profileId,
          title: data.title,
          education: data.education ?? [],
          certifications: data.certifications ?? [],
          languages: data.languages ?? [],
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
      orderBy: { skillName: 'asc' },
    });
  }

  async searchActiveCatalogSkills(search?: string) {
    return this.prisma.skill.findMany({
      where: {
        isActive: true,
        ...(search && {
          name: { contains: search, mode: Prisma.QueryMode.insensitive },
        }),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  async findActiveCatalogSkillByName(skillName: string) {
    return this.prisma.skill.findFirst({
      where: {
        isActive: true,
        name: { equals: skillName, mode: Prisma.QueryMode.insensitive },
      },
      select: { name: true },
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
        skillName: {
          equals: skillName,
          mode: 'insensitive',
        },
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
