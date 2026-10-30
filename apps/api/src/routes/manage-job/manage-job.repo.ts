import { Injectable } from '@nestjs/common';
import {
  ContractStatus,
  JobCategoryStatus,
  JobStatus,
  Prisma,
  ProposalStatus,
} from '@prisma/client';

import {
  CreateJobBodyType,
  JobBookmarkType,
  JobType,
  UpdateJobBodyType,
  ViewJobDetailResType,
  ViewBookmarkedJobParsedFilterType,
  ViewListJobParsedFilterType,
} from '@shared/types';

import { PrismaService } from '../../shared/services/prisma.service';
import {
  JobCannotBeClosedException,
  JobCannotBePublishedException,
  JobCannotBeReopenedException,
  JobCannotBeDeletedWithActiveContractException,
  JobReopenPeriodExpiredException,
  JobCategoriesNotFoundException,
  JobNotFoundException,
  PositionsRequiredBelowFilledException,
} from './manage-job.error';

const jobSelect = {
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
  jobCategories: {
    select: { category: { select: { id: true, name: true, slug: true } } },
  },
} satisfies Prisma.JobSelect;

@Injectable()
export class ManageJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBookmarkedJobLists(
    userId: number,
    filter: ViewBookmarkedJobParsedFilterType,
  ): Promise<{
    jobs: ViewJobDetailResType[];
    total: number;
  }> {
    const { page, limit } = filter;

    const where = {
      userId,
      job: {
        deletedAt: null,
        status: JobStatus.OPEN,
        client: {
          isBanned: false,
          deletedAt: null,
        },
      },
    } satisfies Prisma.JobBookmarkWhereInput;

    const [bookmarks, total] = await this.prisma.$transaction([
      this.prisma.jobBookmark.findMany({
        where,

        select: {
          job: {
            select: {
              ...jobSelect,
              skills: {
                select: {
                  jobId: true,
                  skillId: true,
                  skill: { select: { name: true } },
                },
              },
            },
          },
        },

        skip: (page - 1) * limit,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.jobBookmark.count({
        where,
      }),
    ]);

    return {
      jobs: bookmarks.map(({ job }) => this.normalizeJob(job)),
      total,
    };
  }

  private async autoCloseExpiredJobs(clientId?: number): Promise<void> {
    const now = new Date();
    const expiredJobs = await this.prisma.job.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        status: JobStatus.OPEN,
        deletedAt: null,
        expiryDate: { lte: now },
      },
      select: { id: true },
    });

    if (expiredJobs.length > 0) {
      const expiredJobIds = expiredJobs.map((j) => j.id);
      await this.prisma.$transaction([
        this.prisma.job.updateMany({
          where: { id: { in: expiredJobIds } },
          data: { status: JobStatus.CLOSED },
        }),
        this.prisma.proposal.updateMany({
          where: {
            jobId: { in: expiredJobIds },
            status: {
              in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING],
            },
          },
          data: { status: ProposalStatus.EXPIRED },
        }),
      ]);
    }
  }

  async getClientJobLists(
    clientId: number,
    filter: ViewListJobParsedFilterType,
  ): Promise<{ jobs: JobType[]; total: number }> {
    // BR-J40: Tự động đóng các job đã quá hạn đăng
    await this.autoCloseExpiredJobs(clientId);

    const { page, limit, status, search, sortBy, order } = filter;
    const where = {
      clientId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        title: { contains: search, mode: Prisma.QueryMode.insensitive },
      }),
    } satisfies Prisma.JobWhereInput;
    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        select: {
          ...jobSelect,
          skills: {
            select: {
              jobId: true,
              skillId: true,
              skill: { select: { name: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.job.count({ where }),
    ]);
    return { jobs: jobs.map((job) => this.normalizeJob(job)), total };
  }

  async findJobBySlug(slug: string): Promise<Pick<JobType, 'id'> | null> {
    return this.prisma.job.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: JobStatus.OPEN,
        client: {
          isBanned: false,
          deletedAt: null,
        },
      },

      select: {
        id: true,
      },
    });
  }

  async findBookmark(
    userId: number,
    jobId: number,
  ): Promise<JobBookmarkType | null> {
    return this.prisma.jobBookmark.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });
  }

  async bookmarkJob(userId: number, jobId: number): Promise<JobBookmarkType> {
    return this.prisma.jobBookmark.create({
      data: {
        userId,
        jobId,
      },
    });
  }

  async removeBookmark(
    userId: number,
    jobId: number,
  ): Promise<JobBookmarkType> {
    return this.prisma.jobBookmark.delete({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });
  }

  async createJob(clientId: number, data: CreateJobBodyType): Promise<JobType> {
    const job = await this.prisma.$transaction(async (tx) => {
      await this.assertJobCategoriesUsable(tx, data.jobCategories);

      const createdJob = await tx.job.create({
        data: {
          clientId,
          title: data.title,
          slug: this.createJobSlug(data.title),
          description: data.description,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budgetType: data.budgetType,
          deadline: data.deadline,
          expiryDate: data.expiryDate,
          hiringType: data.hiringType,
          positionsRequired: data.positionsRequired,
        },

        select: jobSelect,
      });

      await this.replaceJobSkills(tx, createdJob.id, data.skills);
      await this.replaceJobCategories(tx, createdJob.id, data.jobCategories);

      // Đọc lại sau khi gắn kỹ năng/danh mục để response phản ánh đúng dữ liệu vừa lưu.
      return tx.job.findUniqueOrThrow({
        where: { id: createdJob.id },
        select: jobSelect,
      });
    });

    return this.normalizeJob(job);
  }

  async updateJob(
    userId: number,
    jobId: number,
    data: UpdateJobBodyType,
  ): Promise<JobType> {
    await this.checkJobOwner(userId, jobId);

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      await this.assertJobCategoriesUsable(tx, data.jobCategories);

      // Không cho giảm số vị trí cần tuyển xuống dưới số vị trí đã tuyển.
      const current = await tx.job.findUniqueOrThrow({
        where: { id: jobId },
        select: { positionsFilled: true, status: true, slug: true },
      });

      if (data.positionsRequired < current.positionsFilled) {
        throw PositionsRequiredBelowFilledException();
      }

      // BR-J42: Tính bất biến của URL Slug sau khi Job đã Publish (chỉ cập nhật slug khi DRAFT)
      const slug =
        current.status === JobStatus.DRAFT
          ? this.createJobSlug(data.title)
          : current.slug;

      const job = await tx.job.update({
        where: {
          id: jobId,
        },

        data: {
          title: data.title,
          slug,
          description: data.description,
          budgetMin: data.budgetMin,
          budgetMax: data.budgetMax,
          budgetType: data.budgetType,
          deadline: data.deadline,
          expiryDate: data.expiryDate,
          hiringType: data.hiringType,
          positionsRequired: data.positionsRequired,
        },

        select: jobSelect,
      });

      await tx.jobSkill.deleteMany({
        where: {
          jobId,
        },
      });

      await tx.jobJobCategory.deleteMany({
        where: {
          jobId,
        },
      });

      await this.replaceJobSkills(tx, jobId, data.skills);
      await this.replaceJobCategories(tx, jobId, data.jobCategories);

      // Đọc lại sau khi gắn kỹ năng/danh mục để response phản ánh đúng dữ liệu vừa lưu.
      return tx.job.findUniqueOrThrow({
        where: { id: job.id },
        select: jobSelect,
      });
    });

    return this.normalizeJob(updatedJob);
  }

  async deleteJob(userId: number, jobId: number): Promise<void> {
    const job = await this.checkJobOwner(userId, jobId);

    // BR-J38: Chặn xóa Job khi đang có hợp đồng hoạt động hoặc đang có tranh chấp
    if (job.status === JobStatus.IN_PROGRESS) {
      throw JobCannotBeDeletedWithActiveContractException();
    }

    const activeContract = await this.prisma.contract.findFirst({
      where: {
        jobId,
        status: {
          in: [
            ContractStatus.PENDING_SIGN,
            ContractStatus.ACTIVE,
            ContractStatus.DISPUTED,
          ],
        },
      },
      select: { id: true },
    });

    if (activeContract) {
      throw JobCannotBeDeletedWithActiveContractException();
    }

    // BR-J39: Tự động hủy/hết hạn Proposal khi Job OPEN bị xóa trong cùng transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: {
          id: jobId,
        },

        data: {
          deletedAt: new Date(),
        },
      });

      if (job.status === JobStatus.OPEN) {
        await tx.proposal.updateMany({
          where: {
            jobId,
            status: {
              in: [ProposalStatus.SUBMITTED, ProposalStatus.INTERVIEWING],
            },
          },
          data: {
            status: ProposalStatus.EXPIRED,
          },
        });
      }
    });
  }

  async publishJob(userId: number, jobId: number): Promise<JobType> {
    const job = await this.checkJobOwner(userId, jobId);

    if (job.status !== JobStatus.DRAFT) {
      throw JobCannotBePublishedException();
    }

    const updatedJob = await this.prisma.job.update({
      where: {
        id: jobId,
      },

      data: {
        status: JobStatus.OPEN,
      },

      select: jobSelect,
    });

    return this.normalizeJob(updatedJob);
  }

  async closeJob(userId: number, jobId: number): Promise<JobType> {
    const job = await this.checkJobOwner(userId, jobId);

    // BR-J22 & BR-J28: Chỉ đóng được Job khi đang OPEN và chưa có hợp đồng hiệu lực
    if (job.status !== JobStatus.OPEN) {
      throw JobCannotBeClosedException();
    }

    const activeContract = await this.prisma.contract.findFirst({
      where: {
        jobId,
        status: {
          in: [
            ContractStatus.PENDING_SIGN,
            ContractStatus.ACTIVE,
            ContractStatus.DISPUTED,
          ],
        },
      },
      select: { id: true },
    });

    if (activeContract) {
      throw JobCannotBeClosedException();
    }

    const updatedJob = await this.prisma.job.update({
      where: {
        id: jobId,
      },

      data: {
        status: JobStatus.CLOSED,
      },

      select: jobSelect,
    });

    return this.normalizeJob(updatedJob);
  }

  async reopenJob(userId: number, jobId: number): Promise<JobType> {
    const job = await this.checkJobOwner(userId, jobId);

    if (job.status !== JobStatus.CLOSED) {
      throw JobCannotBeReopenedException();
    }

    // BR-J46: Thời hạn tối đa cho phép mở lại (Reopen) Job đã đóng là 60 ngày
    const maxReopenDays = 60;
    const diffDays =
      (Date.now() - job.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > maxReopenDays) {
      throw JobReopenPeriodExpiredException();
    }

    const updatedJob = await this.prisma.job.update({
      where: {
        id: jobId,
      },

      data: {
        status: JobStatus.OPEN,
      },

      select: jobSelect,
    });

    return this.normalizeJob(updatedJob);
  }

  private async checkJobOwner(
    userId: number,
    jobId: number,
  ): Promise<{
    id: number;
    status: JobStatus;
    updatedAt: Date;
    expiryDate: Date | null;
  }> {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        clientId: userId,
        deletedAt: null,
      },

      select: {
        id: true,
        status: true,
        updatedAt: true,
        expiryDate: true,
      },
    });

    if (!job) {
      throw JobNotFoundException();
    }

    return job;
  }

  private normalizeJob<
    T extends {
      budgetMin: Prisma.Decimal | number | null;
      budgetMax: Prisma.Decimal | number | null;
      jobCategories?: Array<{
        category: { id: number; name: string; slug: string };
      }>;
    },
  >(
    job: T,
  ): Omit<T, 'budgetMin' | 'budgetMax' | 'jobCategories'> & {
    budgetMin: number | null;
    budgetMax: number | null;
    jobCategories?: Array<{ id: number; name: string; slug: string }>;
  } {
    const { jobCategories, budgetMin, budgetMax, ...rest } = job;

    const normalized = {
      ...rest,
      budgetMin: budgetMin === null ? null : Number(budgetMin),
      budgetMax: budgetMax === null ? null : Number(budgetMax),
    };

    // Quan hệ N-N: làm phẳng JobJobCategory về danh mục thực tế.
    return (
      jobCategories
        ? {
            ...normalized,
            jobCategories: jobCategories.map(({ category }) => category),
          }
        : normalized
    ) as Omit<T, 'budgetMin' | 'budgetMax' | 'jobCategories'> & {
      budgetMin: number | null;
      budgetMax: number | null;
      jobCategories?: Array<{ id: number; name: string; slug: string }>;
    };
  }

  private async replaceJobSkills(
    tx: Prisma.TransactionClient,
    jobId: number,
    skillIds: number[],
  ): Promise<void> {
    await tx.jobSkill.createMany({
      data: skillIds.map((skillId) => ({ jobId, skillId })),
      skipDuplicates: true,
    });
  }

  // Kiểm tra danh mục gửi lên: chỉ chấp nhận danh mục đang ACTIVE và chưa bị xoá
  // (danh mục INACTIVE/đã xoá không còn dùng được để gắn vào job — BR-CAT-15, BR-CAT-18).
  private async assertJobCategoriesUsable(
    tx: Prisma.TransactionClient,
    categoryIds: number[],
  ): Promise<void> {
    const uniqueIds = [...new Set(categoryIds)];

    if (uniqueIds.length === 0) {
      return;
    }

    const usableCount = await tx.jobCategory.count({
      where: {
        id: { in: uniqueIds },
        status: JobCategoryStatus.ACTIVE,
        deletedAt: null,
      },
    });

    if (usableCount !== uniqueIds.length) {
      throw JobCategoriesNotFoundException();
    }
  }

  private async replaceJobCategories(
    tx: Prisma.TransactionClient,
    jobId: number,
    categoryIds: number[],
  ): Promise<void> {
    const uniqueIds = [...new Set(categoryIds)];

    if (uniqueIds.length === 0) {
      return;
    }

    await tx.jobJobCategory.createMany({
      data: uniqueIds.map((categoryId) => ({ jobId, categoryId })),
      skipDuplicates: true,
    });
  }

  async getClientJobDetail(
    clientId: number,
    jobId: number,
  ): Promise<ViewJobDetailResType | null> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, clientId, deletedAt: null },
      select: {
        ...jobSelect,
        skills: {
          select: {
            jobId: true,
            skillId: true,
            skill: { select: { name: true } },
          },
        },
      },
    });

    return job ? this.normalizeJob(job) : null;
  }

  async searchSkills(
    search?: string,
  ): Promise<Array<{ id: number; name: string }>> {
    return this.prisma.skill.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: Prisma.QueryMode.insensitive },
        }),
      },
      select: { id: true, name: true },
      take: 50,
      orderBy: { name: 'asc' },
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

  private createJobSlug(title: string): string {
    return `${this.slugify(title)}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }
}
