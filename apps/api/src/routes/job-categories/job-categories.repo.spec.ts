import { JobCategoryStatus, JobStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../shared/services/prisma.service';
import { JobCategoriesRepository } from './job-categories.repo';

function createPrismaMock(overrides: {
  findManyCategories?: jest.Mock;
  countCategories?: jest.Mock;
  findFirstCategory?: jest.Mock;
  findManyJobs?: jest.Mock;
  countJobs?: jest.Mock;
}) {
  return {
    $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
      Promise.all(operations),
    ),
    jobCategory: {
      findMany: overrides.findManyCategories ?? jest.fn(),
      count: overrides.countCategories ?? jest.fn(),
      findFirst: overrides.findFirstCategory ?? jest.fn(),
    },
    job: {
      findMany: overrides.findManyJobs ?? jest.fn(),
      count: overrides.countJobs ?? jest.fn(),
    },
  };
}

describe('JobCategoriesRepository', () => {
  const webCategoryRow = {
    id: 1,
    name: 'Web Development',
    slug: 'web-development',
    description: 'Web work',
    _count: { jobs: 3 },
  };

  it('UC-46.06: only returns active, non-deleted categories with their open job count', async () => {
    const findManyCategories = jest.fn().mockResolvedValue([webCategoryRow]);
    const countCategories = jest.fn().mockResolvedValue(12);
    const prisma = createPrismaMock({ findManyCategories, countCategories });
    const repository = new JobCategoriesRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.listJobCategories({
      page: 2,
      limit: 5,
      search: 'web',
    });

    expect(findManyCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: JobCategoryStatus.ACTIVE,
          deletedAt: null,
          OR: [
            { name: { contains: 'web', mode: 'insensitive' } },
            { description: { contains: 'web', mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        skip: 5,
        take: 5,
      }),
    );

    expect(result).toEqual({
      jobCategories: [
        {
          id: 1,
          name: 'Web Development',
          slug: 'web-development',
          description: 'Web work',
          jobCount: 3,
        },
      ],
      pagination: { page: 2, limit: 5, total: 12, totalPages: 3 },
    });
  });

  it('UC-46.07: reports a missing category as not found', async () => {
    const findFirstCategory = jest.fn().mockResolvedValue(null);
    const prisma = createPrismaMock({ findFirstCategory });
    const repository = new JobCategoriesRepository(
      prisma as unknown as PrismaService,
    );

    await expect(
      repository.getJobCategoryDetail('unknown-category', 1, 10),
    ).rejects.toThrow('Error.JobCategoryNotFound');

    expect(findFirstCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: JobCategoryStatus.ACTIVE,
          deletedAt: null,
          slug: 'unknown-category',
        },
      }),
    );
  });

  it('UC-46.07: returns the open jobs of the category with flattened categories and numeric budgets', async () => {
    const findFirstCategory = jest.fn().mockResolvedValue(webCategoryRow);
    const findManyJobs = jest.fn().mockResolvedValue([
      {
        id: 9,
        slug: 'build-landing-page',
        clientId: 4,
        title: 'Build Landing Page',
        description: 'Landing page',
        budgetMin: new Prisma.Decimal('100.50'),
        budgetMax: null,
        budgetType: 'FIXED_PRICE',
        deadline: null,
        status: JobStatus.OPEN,
        featured: false,
        expiryDate: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        skills: [{ jobId: 9, skillId: 2, skill: { name: 'React' } }],
        jobCategories: [
          {
            category: {
              id: 1,
              name: 'Web Development',
              slug: 'web-development',
            },
          },
        ],
      },
    ]);
    const countJobs = jest.fn().mockResolvedValue(1);
    const prisma = createPrismaMock({
      findFirstCategory,
      findManyJobs,
      countJobs,
    });
    const repository = new JobCategoriesRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.getJobCategoryDetail(
      'web-development',
      1,
      10,
    );

    // Chỉ lấy job đang mở, chưa xoá, của khách hàng hợp lệ và thuộc danh mục này.
    expect(findManyJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: JobStatus.OPEN,
          deletedAt: null,
          client: { isBanned: false, deletedAt: null },
          jobCategories: { some: { categoryId: 1 } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      }),
    );

    expect(result.jobCount).toBe(3);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].budgetMin).toBe(100.5);
    expect(result.jobs[0].budgetMax).toBeNull();
    expect(result.jobs[0].jobCategories).toEqual([
      { id: 1, name: 'Web Development', slug: 'web-development' },
    ]);
  });
});
