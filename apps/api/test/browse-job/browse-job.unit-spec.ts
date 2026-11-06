import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { ViewJobDetailResType, ViewListJobParsedFilterType } from '@shared/types';
import {
  FailedToLoadJobDetailException,
  FailedToLoadJobListException,
  JobNotFoundException,
} from '../../src/routes/browse-job/browse-job.error';
import { BrowseJobRepository } from '../../src/routes/browse-job/browse-job.repo';
import { BrowseJobService } from '../../src/routes/browse-job/browse-job.service';

describe('Job Browsing (UF-85 to UF-86)', () => {
  const repository = {
    getJobLists: jest.fn(),
    viewJobDetail: jest.fn(),
  };

  const service = new BrowseJobService(
    repository as unknown as BrowseJobRepository,
  );

  const prismaError = (code = 'P2000') =>
    new PrismaClientKnownRequestError('Database query failed', {
      code,
      clientVersion: '6.0.0',
    });

  const mockJob = {
    id: 1,
    slug: 'senior-fullstack-engineer',
    title: 'Senior Fullstack Engineer',
    description: 'Looking for a Senior Fullstack Engineer skilled in NestJS and React',
    budgetMin: 1000,
    budgetMax: 2000,
    budgetType: 'FIXED_PRICE' as const,
    deadline: new Date('2026-12-31T00:00:00.000Z'),
    status: 'OPEN' as const,
    positionsRequired: 1,
    positionsFilled: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    skills: [{ id: 1, name: 'NestJS' }, { id: 2, name: 'React' }],
    jobCategories: [{ id: 1, name: 'Web Development', slug: 'web-development' }],
    client: {
      id: 10,
      name: 'Acme Corp',
      isBanned: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // UF-85: viewListJob
  // =========================================================================
  describe('UF-85 viewListJob', () => {
    // UTCID01 (Normal): Default pagination (page=1, limit=10), query succeeds
    it('UTCID01: returns paginated jobs with default pagination when query succeeds', async () => {
      const filter: ViewListJobParsedFilterType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };

      repository.getJobLists.mockResolvedValue({
        jobs: [mockJob],
        total: 1,
      });

      const result = await service.viewListJob(filter);

      expect(result).toEqual({
        data: [mockJob],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // UTCID02 (Normal): Keyword search over title/description/skill
    it('UTCID02: forwards keyword search filter and returns matching jobs', async () => {
      const filter: ViewListJobParsedFilterType = {
        page: 1,
        limit: 10,
        search: 'NestJS',
        sortBy: 'createdAt',
        order: 'desc',
      };

      repository.getJobLists.mockResolvedValue({
        jobs: [mockJob],
        total: 1,
      });

      const result = await service.viewListJob(filter);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Senior Fullstack Engineer');
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // UTCID03 (Normal): Category + budget + skill filters and sorting
    it('UTCID03: applies category, budget and skill filters with custom sorting', async () => {
      const filter: ViewListJobParsedFilterType = {
        page: 1,
        limit: 10,
        category: 'web-development',
        skill: 'React',
        budgetMin: 500,
        budgetMax: 2500,
        sortBy: 'budgetMax',
        order: 'asc',
      };

      repository.getJobLists.mockResolvedValue({
        jobs: [mockJob],
        total: 1,
      });

      const result = await service.viewListJob(filter);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // UTCID04 (Boundary): Page beyond the last page
    it('UTCID04: returns empty data when requesting a page beyond total pages', async () => {
      const filter: ViewListJobParsedFilterType = {
        page: 999,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };

      repository.getJobLists.mockResolvedValue({
        jobs: [],
        total: 25,
      });

      const result = await service.viewListJob(filter);

      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        page: 999,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // UTCID05 (Abnormal): Limit exceeds max limit (e.g., limit=21 handled or rejection)
    it('UTCID05: handles limit exceeding boundary or invalid pagination parameter', async () => {
      // In NestJS controller, limit=21 is rejected by Zod validation (max: 20).
      // At the service layer, we verify pagination calculation handles edge limits cleanly.
      const filter: ViewListJobParsedFilterType = {
        page: 1,
        limit: 21,
        sortBy: 'createdAt',
        order: 'desc',
      };

      repository.getJobLists.mockResolvedValue({
        jobs: [],
        total: 0,
      });

      const result = await service.viewListJob(filter);

      expect(result.pagination.limit).toBe(21);
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // UTCID06 (Abnormal): Database connection failure (Prisma error)
    it('UTCID06: throws FailedToLoadJobListException on Prisma database failure', async () => {
      const filter: ViewListJobParsedFilterType = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      };

      repository.getJobLists.mockRejectedValue(prismaError());

      await expect(service.viewListJob(filter)).rejects.toThrow(
        FailedToLoadJobListException(),
      );
    });
  });

  // =========================================================================
  // UF-86: viewJobDetail
  // =========================================================================
  describe('UF-86 viewJobDetail', () => {
    // UTCID01 (Normal): Valid OPEN job slug
    it('UTCID01: returns full job detail with skills and categories for valid OPEN job', async () => {
      const slug = 'senior-fullstack-engineer';

      repository.viewJobDetail.mockResolvedValue(mockJob as unknown as ViewJobDetailResType);

      const result = await service.viewJobDetail(slug);

      expect(result).toEqual(mockJob);
      expect(result.status).toBe('OPEN');
      expect(result.skills).toHaveLength(2);
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // UTCID02 (Boundary): OPEN job with null optional fields and empty arrays
    it('UTCID02: returns job detail when optional fields are null and lists are empty', async () => {
      const slug = 'minimal-job-posting';
      const minimalJob = {
        id: 2,
        slug,
        title: 'Minimal Job Posting',
        description: null,
        budgetMin: null,
        budgetMax: null,
        budgetType: 'FIXED_PRICE' as const,
        deadline: null,
        status: 'OPEN' as const,
        positionsRequired: 1,
        positionsFilled: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        skills: [],
        jobCategories: [],
      };

      repository.viewJobDetail.mockResolvedValue(minimalJob as unknown as ViewJobDetailResType);

      const result = await service.viewJobDetail(slug);

      expect(result.description).toBeNull();
      expect(result.budgetMin).toBeNull();
      expect(result.budgetMax).toBeNull();
      expect(result.skills).toEqual([]);
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // UTCID03 (Abnormal): Non-existent slug -> JobNotFoundException (404)
    it('UTCID03: throws JobNotFoundException when slug does not exist in database', async () => {
      const slug = 'non-existent-job-slug';

      repository.viewJobDetail.mockRejectedValue(JobNotFoundException());

      await expect(service.viewJobDetail(slug)).rejects.toThrow(
        JobNotFoundException(),
      );
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // UTCID04 (Abnormal): DRAFT / CLOSED / deleted / banned-client job -> JobNotFoundException (404)
    it('UTCID04: throws JobNotFoundException when job is not OPEN or client is banned', async () => {
      const slug = 'draft-or-closed-job';

      repository.viewJobDetail.mockRejectedValue(JobNotFoundException());

      await expect(service.viewJobDetail(slug)).rejects.toThrow(
        JobNotFoundException(),
      );
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // UTCID05 (Abnormal): Database query failure (Prisma error) -> FailedToLoadJobDetailException (500)
    it('UTCID05: throws FailedToLoadJobDetailException on Prisma database failure', async () => {
      const slug = 'senior-fullstack-engineer';

      repository.viewJobDetail.mockRejectedValue(prismaError());

      await expect(service.viewJobDetail(slug)).rejects.toThrow(
        FailedToLoadJobDetailException(),
      );
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });
  });
});

