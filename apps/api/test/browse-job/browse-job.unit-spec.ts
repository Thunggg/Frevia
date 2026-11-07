import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  ViewListJobFilterSchema,
  type ViewJobDetailResType,
  type ViewListJobParsedFilterType,
} from '@shared/types';
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
    clientId: 10,
    title: 'Senior Fullstack Engineer',
    description:
      'Looking for a Senior Fullstack Engineer skilled in NestJS and React',
    budgetMin: 1000,
    budgetMax: 2000,
    budgetType: 'FIXED_PRICE' as const,
    deadline: new Date('2026-12-31T00:00:00.000Z'),
    expiryDate: new Date('2026-12-15T00:00:00.000Z'),
    status: 'OPEN' as const,
    hiringType: 'SINGLE' as const,
    positionsRequired: 1,
    positionsFilled: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    skills: [
      { id: 1, name: 'NestJS' },
      { id: 2, name: 'React' },
    ],
    jobCategories: [
      { id: 1, name: 'Web Development', slug: 'web-development' },
    ],
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
    // UF-85: Trả về danh sách công việc công khai kèm phân trang mặc định khi query thành công.
    it('returns paginated jobs with default pagination when query succeeds', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getJobLists.mockResolvedValueOnce({
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

    // Chuyển tiếp bộ lọc tìm kiếm theo từ khóa và trả về các công việc khớp kết quả.
    it('forwards keyword search filter and returns matching jobs', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          search: 'NestJS',
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getJobLists.mockResolvedValueOnce({
        jobs: [mockJob],
        total: 1,
      });

      const result = await service.viewListJob(filter);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Senior Fullstack Engineer');
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // Áp dụng kết hợp các bộ lọc danh mục, kỹ năng, khoảng ngân sách và sắp xếp tùy chỉnh.
    it('applies category, budget and skill filters with custom sorting', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          category: 'web-development',
          skill: 'React',
          budgetMin: 500,
          budgetMax: 2500,
          sortBy: 'budgetMax',
          order: 'asc',
        },
      );

      repository.getJobLists.mockResolvedValueOnce({
        jobs: [mockJob],
        total: 1,
      });

      const result = await service.viewListJob(filter);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(repository.getJobLists).toHaveBeenCalledWith(filter);
    });

    // Trả về mảng dữ liệu rỗng khi yêu cầu trang vượt quá tổng số trang.
    it('returns empty data when requesting a page beyond total pages', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 999,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getJobLists.mockResolvedValueOnce({
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

    // Trả về dữ liệu chính xác khi limit đạt mốc biên dưới là 1.
    it('handles boundary min limit = 1 cleanly', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 1,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getJobLists.mockResolvedValueOnce({
        jobs: [mockJob],
        total: 5,
      });

      const result = await service.viewListJob(filter);

      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.totalPages).toBe(5);
    });

    // Trả về dữ liệu chính xác khi limit đạt mốc biên trên là 20.
    it('handles boundary max limit = 20 cleanly', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getJobLists.mockResolvedValueOnce({
        jobs: [mockJob],
        total: 1,
      });

      const result = await service.viewListJob(filter);

      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.totalPages).toBe(1);
    });

    // Ném FailedToLoadJobListException khi cơ sở dữ liệu Prisma gặp sự cố.
    it('throws FailedToLoadJobListException on Prisma database failure', async () => {
      const filter: ViewListJobParsedFilterType = ViewListJobFilterSchema.parse(
        {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
      );

      repository.getJobLists.mockRejectedValueOnce(prismaError());

      await expect(service.viewListJob(filter)).rejects.toThrow(
        FailedToLoadJobListException(),
      );
    });

    // Schema bộ lọc từ chối khi số trang page <= 0.
    it('rejects page <= 0 through ViewListJobFilterSchema', () => {
      const parsed = ViewListJobFilterSchema.safeParse({ page: -1, limit: 10 });
      expect(parsed.success).toBe(false);
    });

    // Schema bộ lọc từ chối khi limit vượt quá 20.
    it('rejects limit > 20 through ViewListJobFilterSchema', () => {
      const parsed = ViewListJobFilterSchema.safeParse({ page: 1, limit: 21 });
      expect(parsed.success).toBe(false);
    });

    // Schema bộ lọc từ chối khi ngân sách tối thiểu budgetMin < 0.
    it('rejects negative budgetMin through ViewListJobFilterSchema', () => {
      const parsed = ViewListJobFilterSchema.safeParse({
        page: 1,
        limit: 10,
        budgetMin: -1,
      });
      expect(parsed.success).toBe(false);
    });

    // Schema bộ lọc từ chối khi budgetMin lớn hơn budgetMax.
    it('rejects budgetMin greater than budgetMax through ViewListJobFilterSchema', () => {
      const parsed = ViewListJobFilterSchema.safeParse({
        page: 1,
        limit: 10,
        budgetMin: 2000,
        budgetMax: 100,
      });
      expect(parsed.success).toBe(false);
    });
  });

  // =========================================================================
  // UF-86: viewJobDetail
  // =========================================================================
  describe('UF-86 viewJobDetail', () => {
    // UF-86: Trả về chi tiết công việc đầy đủ kèm kỹ năng và danh mục khi slug hợp lệ và job đang OPEN.
    it('returns full job detail with skills and categories for valid OPEN job', async () => {
      const slug = 'senior-fullstack-engineer';

      repository.viewJobDetail.mockResolvedValueOnce(
        mockJob as unknown as ViewJobDetailResType,
      );

      const result = await service.viewJobDetail(slug);

      expect(result).toEqual(mockJob);
      expect(result.status).toBe('OPEN');
      expect(result.skills).toHaveLength(2);
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // Trả về chi tiết công việc khi các trường tùy chọn mang giá trị null và danh sách rỗng.
    it('returns job detail when optional fields are null and lists are empty', async () => {
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

      repository.viewJobDetail.mockResolvedValueOnce(
        minimalJob as unknown as ViewJobDetailResType,
      );

      const result = await service.viewJobDetail(slug);

      expect(result.description).toBeNull();
      expect(result.budgetMin).toBeNull();
      expect(result.budgetMax).toBeNull();
      expect(result.skills).toEqual([]);
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // Trả về chi tiết công việc thành công khi job tuyển nhiều vị trí MULTIPLE.
    it('returns job detail for MULTIPLE hiring type job', async () => {
      const slug = 'team-react-developers';
      const multiJob = {
        ...mockJob,
        slug,
        hiringType: 'MULTIPLE' as const,
        positionsRequired: 5,
      };

      repository.viewJobDetail.mockResolvedValueOnce(
        multiJob as unknown as ViewJobDetailResType,
      );

      const result = await service.viewJobDetail(slug);

      expect(result.hiringType).toBe('MULTIPLE');
      expect(result.positionsRequired).toBe(5);
    });

    // Ném JobNotFoundException khi slug không tồn tại trong cơ sở dữ liệu.
    it('throws JobNotFoundException when slug does not exist in database', async () => {
      const slug = 'non-existent-job-slug';

      repository.viewJobDetail.mockRejectedValueOnce(JobNotFoundException());

      await expect(service.viewJobDetail(slug)).rejects.toThrow(
        JobNotFoundException(),
      );
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // Ném JobNotFoundException khi công việc không ở trạng thái OPEN hoặc tài khoản client bị khóa.
    it('throws JobNotFoundException when job is not OPEN or client is banned', async () => {
      const slug = 'draft-or-closed-job';

      repository.viewJobDetail.mockRejectedValueOnce(JobNotFoundException());

      await expect(service.viewJobDetail(slug)).rejects.toThrow(
        JobNotFoundException(),
      );
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });

    // Ném FailedToLoadJobDetailException khi gặp sự cố kết nối cơ sở dữ liệu Prisma.
    it('throws FailedToLoadJobDetailException on Prisma database failure', async () => {
      const slug = 'senior-fullstack-engineer';

      repository.viewJobDetail.mockRejectedValueOnce(prismaError());

      await expect(service.viewJobDetail(slug)).rejects.toThrow(
        FailedToLoadJobDetailException(),
      );
      expect(repository.viewJobDetail).toHaveBeenCalledWith(slug);
    });
  });
});
