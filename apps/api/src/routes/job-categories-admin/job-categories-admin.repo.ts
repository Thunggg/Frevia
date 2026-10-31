import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AdminCreateJobCategoryBodyType,
  AdminUpdateJobCategoryBodyType,
  JobCategoryAdminDeleteResponseType,
  JobCategoryAdminDetailResponseType,
  JobCategoryAdminItemType,
  JobCategoryAdminListResponseType,
  JobCategoryAdminQueryType,
  ManageJobCategoryAdminMessage,
} from '@shared/types';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  JobCategoryAdminNotFoundException,
  JobCategoryHasJobsException,
  JobCategoryNameAlreadyExistsException,
} from './job-categories-admin.error';

// Số công việc liên quan tối đa trả về ở trang chi tiết (UC-46.02)
const RELATED_JOBS_LIMIT = 10;

// "Đang hoạt động" = job chưa bị soft-delete. Job đã xoá không chặn thao tác xoá danh mục.
// Quan hệ N-N qua JobJobCategory nên điều kiện phải lọc theo quan hệ `job`.
const ACTIVE_JOB_LINK_WHERE = { job: { deletedAt: null } } as const;

const jobCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  status: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { jobs: { where: ACTIVE_JOB_LINK_WHERE } } },
} as const;

const relatedJobSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  deletedAt: true,
  createdAt: true,
} as const;

type JobCategoryRow = Prisma.JobCategoryGetPayload<{
  select: typeof jobCategorySelect;
}>;

@Injectable()
export class JobCategoriesAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách danh mục: phân trang + tìm kiếm (name/slug/description)
  // + lọc theo status + lọc soft-deleted (deleted)
  async listJobCategories(
    query: JobCategoryAdminQueryType,
  ): Promise<JobCategoryAdminListResponseType> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search?.trim();
    const showDeleted =
      query.deleted === 'true'
        ? true
        : query.deleted === 'false'
          ? false
          : undefined;

    const sortBy = query.sortBy ?? 'id';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.JobCategoryOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const where: Prisma.JobCategoryWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      // deleted = 'true'  → chỉ lấy danh mục đã soft-delete (deletedAt != null)
      // deleted = 'false' → chỉ lấy danh mục đang hoạt động (deletedAt = null)
      ...(showDeleted !== undefined
        ? { deletedAt: showDeleted ? { not: null } : null }
        : {}),
    };

    const [jobCategories, total] = await this.prisma.$transaction([
      this.prisma.jobCategory.findMany({
        where,
        select: jobCategorySelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobCategory.count({ where }),
    ]);

    return {
      jobCategories: jobCategories.map((row) => this.toItem(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Chi tiết 1 danh mục kèm danh sách công việc liên quan
  async getJobCategoryDetail(
    id: number,
  ): Promise<JobCategoryAdminDetailResponseType | null> {
    const category = await this.prisma.jobCategory.findUnique({
      where: { id },
      select: jobCategorySelect,
    });

    if (!category) {
      return null;
    }

    return this.toDetail(category);
  }

  // Tạo danh mục mới (kiểm tra trùng tên + sinh slug duy nhất)
  async createJobCategory(
    data: AdminCreateJobCategoryBodyType,
  ): Promise<JobCategoryAdminDetailResponseType> {
    const trimmedName = data.name.trim();

    const existingName = await this.prisma.jobCategory.findFirst({
      where: {
        deletedAt: null,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existingName) {
      throw JobCategoryNameAlreadyExistsException();
    }

    const slug = await this.generateUniqueSlug(trimmedName);

    const created = await this.prisma.jobCategory.create({
      data: {
        name: trimmedName,
        slug,
        description: data.description ?? null,
        status: data.status ?? 'ACTIVE',
      },
      select: jobCategorySelect,
    });

    return this.toDetail(created);
  }

  // Cập nhật danh mục (kiểm tra tồn tại + trùng tên + sinh lại slug nếu đổi tên)
  async updateJobCategory(
    id: number,
    data: AdminUpdateJobCategoryBodyType,
  ): Promise<JobCategoryAdminDetailResponseType> {
    // Danh mục đã soft-delete phải được khôi phục trước khi sửa
    const category = await this.prisma.jobCategory.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true },
    });

    if (!category) {
      throw JobCategoryAdminNotFoundException();
    }

    let slug = category.slug;
    const trimmedName = data.name?.trim();

    if (trimmedName !== undefined && trimmedName !== category.name) {
      const existingName = await this.prisma.jobCategory.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          name: { equals: trimmedName, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (existingName) {
        throw JobCategoryNameAlreadyExistsException();
      }

      slug = await this.generateUniqueSlug(trimmedName);
    }

    const updated = await this.prisma.jobCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: trimmedName }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        slug,
      },
      select: jobCategorySelect,
    });

    return this.toDetail(updated);
  }

  // Xoá danh mục (soft delete). Chặn khi vẫn còn công việc đang hoạt động —
  // trường hợp đó Admin nên chuyển danh mục sang INACTIVE thay vì xoá (UC-46.05).
  async deleteJobCategory(
    id: number,
  ): Promise<JobCategoryAdminDeleteResponseType> {
    const category = await this.prisma.jobCategory.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        _count: { select: { jobs: { where: ACTIVE_JOB_LINK_WHERE } } },
      },
    });

    if (!category) {
      throw JobCategoryAdminNotFoundException();
    }

    if (category._count.jobs > 0) {
      throw JobCategoryHasJobsException();
    }

    await this.prisma.jobCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: ManageJobCategoryAdminMessage.JOB_CATEGORY_DELETED };
  }

  // Khôi phục danh mục đã soft-delete (kiểm tra trùng tên với danh mục đang hoạt động)
  async restoreJobCategory(
    id: number,
  ): Promise<JobCategoryAdminDetailResponseType> {
    const category = await this.prisma.jobCategory.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { id: true, name: true },
    });

    if (!category) {
      throw JobCategoryAdminNotFoundException();
    }

    const nameConflict = await this.prisma.jobCategory.findFirst({
      where: {
        deletedAt: null,
        id: { not: id },
        name: { equals: category.name, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (nameConflict) {
      throw JobCategoryNameAlreadyExistsException();
    }

    const result = await this.prisma.jobCategory.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    if (result.count === 0) {
      throw JobCategoryAdminNotFoundException();
    }

    const restored = await this.prisma.jobCategory.findUnique({
      where: { id },
      select: jobCategorySelect,
    });

    if (!restored) {
      throw JobCategoryAdminNotFoundException();
    }

    return this.toDetail(restored);
  }

  private toItem(row: JobCategoryRow): JobCategoryAdminItemType {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      jobCount: row._count.jobs,
    };
  }

  private async toDetail(
    row: JobCategoryRow,
  ): Promise<JobCategoryAdminDetailResponseType> {
    // Danh sách công việc liên quan (UC-46.02) — job đã xoá không hiển thị.
    // Quan hệ N-N: đọc qua bảng trung gian JobJobCategory.
    const links = await this.prisma.jobJobCategory.findMany({
      where: { categoryId: row.id, job: { deletedAt: null } },
      select: { job: { select: relatedJobSelect } },
      orderBy: { job: { createdAt: 'desc' } },
      take: RELATED_JOBS_LIMIT,
    });

    return {
      ...this.toItem(row),
      jobCount: row._count.jobs,
      jobs: links.map(({ job }) => ({
        id: job.id,
        title: job.title,
        slug: job.slug,
        status: job.status,
        deletedAt: job.deletedAt,
        createdAt: job.createdAt,
      })),
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
    const base = this.slugify(name) || 'job-category';
    let slug = base;
    let suffix = 2;

    while (
      await this.prisma.jobCategory.findFirst({
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
