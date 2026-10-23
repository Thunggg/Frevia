import { Injectable } from '@nestjs/common';
import { JobCategoryStatus, JobStatus, Prisma } from '@prisma/client';
import {
  JobCategoryBrowseItemType,
  JobCategoryBrowseListResponseType,
  JobCategoryBrowseParsedQueryType,
  ViewJobCategoryDetailResponseType,
} from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';
import { JobCategoryNotFoundException } from './job-categories.error';

// Danh mục hiển thị cho người dùng: chỉ ACTIVE và chưa bị soft-delete (BR-CAT-01, BR-CAT-18).
const VISIBLE_CATEGORY_WHERE = {
  status: JobCategoryStatus.ACTIVE,
  deletedAt: null,
} satisfies Prisma.JobCategoryWhereInput;

// Công việc được xem khi duyệt theo danh mục:
// job đang mở, chưa xoá và thuộc khách hàng hợp lệ (giống điều kiện của trang tìm việc).
const VISIBLE_JOB_WHERE = {
  status: JobStatus.OPEN,
  deletedAt: null,
  client: { isBanned: false, deletedAt: null },
} as const;

const jobCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  _count: { select: { jobs: { where: { job: VISIBLE_JOB_WHERE } } } },
} as const;

const browseJobSelect = {
  id: true,
  slug: true,
  clientId: true,
  title: true,
  description: true,
  budgetMin: true,
  budgetMax: true,
  budgetType: true,
  deadline: true,
  status: true,
  featured: true,
  expiryDate: true,
  hiringType: true,
  positionsRequired: true,
  positionsFilled: true,
  createdAt: true,
  updatedAt: true,
  skills: {
    select: {
      jobId: true,
      skillId: true,
      skill: { select: { name: true } },
    },
  },
  jobCategories: {
    select: { category: { select: { id: true, name: true, slug: true } } },
  },
} satisfies Prisma.JobSelect;

type JobCategoryRow = Prisma.JobCategoryGetPayload<{
  select: typeof jobCategorySelect;
}>;

type BrowseJobRow = Prisma.JobGetPayload<{ select: typeof browseJobSelect }>;

@Injectable()
export class JobCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // UC-46.06 — Danh sách danh mục đang hoạt động (phân trang + tìm kiếm).
  async listJobCategories(
    query: JobCategoryBrowseParsedQueryType,
  ): Promise<JobCategoryBrowseListResponseType> {
    const { page, limit } = query;
    const search = query.search?.trim();

    const where: Prisma.JobCategoryWhereInput = {
      ...VISIBLE_CATEGORY_WHERE,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [jobCategories, total] = await this.prisma.$transaction([
      this.prisma.jobCategory.findMany({
        where,
        select: jobCategorySelect,
        orderBy: { name: 'asc' },
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

  // UC-46.07 — Chi tiết danh mục kèm danh sách công việc đang mở thuộc danh mục.
  async getJobCategoryDetail(
    slug: string,
    page: number,
    limit: number,
  ): Promise<ViewJobCategoryDetailResponseType> {
    const category = await this.prisma.jobCategory.findFirst({
      where: { ...VISIBLE_CATEGORY_WHERE, slug },
      select: jobCategorySelect,
    });

    if (!category) {
      throw JobCategoryNotFoundException();
    }

    const where: Prisma.JobWhereInput = {
      ...VISIBLE_JOB_WHERE,
      jobCategories: { some: { categoryId: category.id } },
    };

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        select: browseJobSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      ...this.toItem(category),
      jobs: jobs.map((job) => this.normalizeJob(job)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private toItem(row: JobCategoryRow): JobCategoryBrowseItemType {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      jobCount: row._count.jobs,
    };
  }

  private normalizeJob(
    job: BrowseJobRow,
  ): ViewJobCategoryDetailResponseType['jobs'][number] {
    return {
      ...job,
      budgetMin: job.budgetMin === null ? null : Number(job.budgetMin),
      budgetMax: job.budgetMax === null ? null : Number(job.budgetMax),
      jobCategories: job.jobCategories.map(({ category }) => category),
    };
  }
}
