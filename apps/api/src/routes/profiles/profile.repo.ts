import { Injectable } from '@nestjs/common';
import { AvailabilityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFreelancerProfileById(profileId: number) {
    return this.prisma.profile.findFirst({
      where: {
        OR: [{ id: profileId }, { userId: profileId }],
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
    const freelancerProfile = await this.prisma.freelancerProfile.findFirst({
      where: {
        OR: [{ profileId }, { profile: { userId: profileId } }],
      },
    });
    if (!freelancerProfile) return [];
    return this.prisma.freelancerSkill.findMany({
      where: { freelancerProfileId: freelancerProfile.id },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } },
    });
  }

  async searchActiveCatalogSkills(search?: string) {
    return this.prisma.skill.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: Prisma.QueryMode.insensitive },
        }),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  async findOrCreateCatalogSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Skill name is required.');
    }

    const existing = await this.prisma.skill.findFirst({
      where: { name: { equals: trimmed, mode: Prisma.QueryMode.insensitive } },
    });
    if (existing) return existing;

    const slug = await this.generateUniqueSlug(trimmed);
    return this.prisma.skill.create({ data: { name: trimmed, slug } });
  }

  async findSkillByProfileIdAndSkillId(profileId: number, skillId: number) {
    const freelancerProfile = await this.prisma.freelancerProfile.findUnique({
      where: { profileId },
    });
    if (!freelancerProfile) return null;
    return this.prisma.freelancerSkill.findFirst({
      where: {
        freelancerProfileId: freelancerProfile.id,
        skillId,
      },
    });
  }

  async addSkillToProfile(
    profileId: number,
    skillId: number,
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
        skillId,
        proficiencyLevel,
      },
      include: { skill: true },
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = this.slugify(name) || 'skill';
    let slug = base;
    let suffix = 2;
    while (
      await this.prisma.skill.findFirst({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    return slug;
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
