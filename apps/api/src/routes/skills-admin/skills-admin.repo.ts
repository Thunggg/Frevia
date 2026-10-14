import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminCreateSkillBodyType,
  AdminUpdateSkillBodyType,
  SkillAdminDetailResponseType,
  SkillAdminListResponseType,
  SkillAdminQueryType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  SkillAdminNotFoundException,
  SkillNameAlreadyExistsException,
} from './skills-admin.error';

const skillListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { jobs: true } },
} as const;

@Injectable()
export class SkillsAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách skill: phân trang + tìm kiếm (name/slug/description) + lọc active
  async listSkills(
    query: SkillAdminQueryType,
  ): Promise<SkillAdminListResponseType> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search?.trim();
    const showDeleted =
      query.deleted === 'true'
        ? true
        : query.deleted === 'false'
          ? false
          : undefined;

    const where: Prisma.SkillWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      // deleted = 'true'  → chỉ lấy skill đã soft-delete (deletedAt != null)
      // deleted = 'false' → chỉ lấy skill còn hoạt động (deletedAt = null)
      ...(showDeleted !== undefined
        ? { deletedAt: showDeleted ? { not: null } : null }
        : {}),
    };

    const [skills, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        select: skillListSelect,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.skill.count({ where }),
    ]);

    return {
      skills: skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        deletedAt: skill.deletedAt,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
        jobCount: skill._count.jobs,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Chi tiết 1 skill kèm số công việc đang dùng
  async getSkillDetail(
    id: number,
  ): Promise<SkillAdminDetailResponseType | null> {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      select: skillListSelect,
    });

    if (!skill) {
      return null;
    }

    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      deletedAt: skill.deletedAt,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      jobCount: skill._count.jobs,
    };
  }

  // Tạo skill mới (kiểm tra trùng tên + sinh slug duy nhất)
  async createSkill(
    data: AdminCreateSkillBodyType,
  ): Promise<SkillAdminDetailResponseType> {
    const trimmedName = data.name.trim();

    const existingName = await this.prisma.skill.findFirst({
      where: {
        deletedAt: null,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
      select: { id: true },
    });

    // check trùng tên
    if (existingName) {
      throw SkillNameAlreadyExistsException();
    }

    const slug = await this.generateUniqueSlug(trimmedName);

    const created = await this.prisma.skill.create({
      data: {
        name: trimmedName,
        slug,
        description: data.description ?? null,
      },
      select: skillListSelect,
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description,
      deletedAt: created.deletedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      jobCount: created._count.jobs,
    };
  }

  // Cập nhật skill (kiểm tra tồn tại + trùng tên + sinh lại slug nếu đổi tên)
  async updateSkill(
    id: number,
    data: AdminUpdateSkillBodyType,
  ): Promise<SkillAdminDetailResponseType> {
    const skill = await this.prisma.skill.findFirst({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!skill) {
      throw SkillAdminNotFoundException();
    }

    let slug = skill.slug;
    const trimmedName = data.name?.trim();

    // Nếu có thay đổi tên → kiểm tra trùng (loại trừ chính nó) + sinh lại slug
    if (trimmedName !== undefined && trimmedName !== skill.name) {
      const existingName = await this.prisma.skill.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          name: { equals: trimmedName, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (existingName) {
        throw SkillNameAlreadyExistsException();
      }

      slug = await this.generateUniqueSlug(trimmedName);
    }

    const updated = await this.prisma.skill.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: trimmedName }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        slug,
      },
      select: skillListSelect,
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      deletedAt: updated.deletedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      jobCount: updated._count.jobs,
    };
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
        where: { slug, deletedAt: null },
        select: { id: true },
      })
    ) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}
