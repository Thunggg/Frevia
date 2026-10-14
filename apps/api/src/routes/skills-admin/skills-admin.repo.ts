import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SkillAdminDetailResponseType,
  SkillAdminListResponseType,
  SkillAdminQueryType,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';

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
}
