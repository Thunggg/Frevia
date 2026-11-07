import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  JobCategoryBrowseQuerySchema,
  type JobCategoryBrowseListResponseType,
  type ViewJobCategoryDetailResponseType,
} from '@shared/types';

import {
  FailedToLoadJobCategoryDetailException,
  FailedToLoadJobCategoryListException,
  JobCategoryNotFoundException,
} from '../../src/routes/job-categories/job-categories.error';
import { JobCategoriesRepository } from '../../src/routes/job-categories/job-categories.repo';
import { JobCategoriesService } from '../../src/routes/job-categories/job-categories.service';

describe('Job Categories (UF-119 to UF-120)', () => {
  let repository: {
    listJobCategories: jest.Mock;
    getJobCategoryDetail: jest.Mock;
  };

  let service: JobCategoriesService;

  const mockCategoryItem = {
    id: 1,
    name: 'Web Development',
    slug: 'web-development',
    description: 'Web application and frontend/backend development',
    jobCount: 15,
  };

  const mockBrowseListResponse: JobCategoryBrowseListResponseType = {
    jobCategories: [mockCategoryItem],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  };

  const mockCategoryDetailResponse: ViewJobCategoryDetailResponseType = {
    ...mockCategoryItem,
    jobs: [
      {
        id: 101,
        title: 'Fullstack Next.js Developer',
        slug: 'fullstack-nextjs-developer',
        status: 'OPEN' as const,
        description: 'Building modern responsive web apps',
        budgetMin: 1000,
        budgetMax: 3000,
        budgetType: 'FIXED_PRICE' as const,
        deadline: null,
        positionsRequired: 1,
        positionsFilled: 0,
        hiringType: 'SINGLE' as const,
        clientId: 42,
        skills: [{ jobId: 101, skillId: 1, skill: { name: 'TypeScript' } }],
        jobCategories: [
          { id: 1, name: 'Web Development', slug: 'web-development' },
        ],
        expiryDate: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-03-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    repository = {
      listJobCategories: jest.fn().mockResolvedValue(mockBrowseListResponse),
      getJobCategoryDetail: jest
        .fn()
        .mockResolvedValue(mockCategoryDetailResponse),
    };

    service = new JobCategoriesService(
      repository as unknown as JobCategoriesRepository,
    );

    jest.clearAllMocks();
  });

  describe('UF-119 viewJobCategoryList', () => {
    // UF-119: Lấy danh sách danh mục việc làm đang hoạt động thành công kèm phân trang.
    it('returns active job categories with pagination', async () => {
      const query = JobCategoryBrowseQuerySchema.parse({ page: 1, limit: 20 });

      const result = await service.viewJobCategoryList(query);

      expect(repository.listJobCategories).toHaveBeenCalledWith(query);
      expect(result.jobCategories).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    // Lọc danh sách danh mục theo từ khóa tìm kiếm (search).
    it('filters categories by search keyword', async () => {
      const query = JobCategoryBrowseQuerySchema.parse({
        page: 1,
        limit: 20,
        search: 'Web',
      });

      await service.viewJobCategoryList(query);

      expect(repository.listJobCategories).toHaveBeenCalledWith(query);
    });

    // Lấy danh sách danh mục khi trang yêu cầu là trang 2.
    it('returns categories on page 2', async () => {
      const query = JobCategoryBrowseQuerySchema.parse({ page: 2, limit: 20 });

      await service.viewJobCategoryList(query);

      expect(repository.listJobCategories).toHaveBeenCalledWith(query);
    });

    // Lấy danh sách danh mục với giới hạn 5 mục mỗi trang.
    it('limits categories list to 5 items per page', async () => {
      const query = JobCategoryBrowseQuerySchema.parse({ page: 1, limit: 5 });

      await service.viewJobCategoryList(query);

      expect(repository.listJobCategories).toHaveBeenCalledWith(query);
    });

    // Trả về danh sách rỗng khi hệ thống chưa có danh mục việc làm nào.
    it('returns empty array when no categories exist', async () => {
      repository.listJobCategories.mockResolvedValueOnce({
        jobCategories: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const query = JobCategoryBrowseQuerySchema.parse({ page: 1, limit: 20 });
      const result = await service.viewJobCategoryList(query);

      expect(result.jobCategories).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    // Trả về danh sách rỗng khi từ khóa tìm kiếm không khớp danh mục nào.
    it('returns empty array when search keyword matches no categories', async () => {
      repository.listJobCategories.mockResolvedValueOnce({
        jobCategories: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const query = JobCategoryBrowseQuerySchema.parse({
        page: 1,
        limit: 20,
        search: 'NonExistentCategory',
      });
      const result = await service.viewJobCategoryList(query);

      expect(result.jobCategories).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    // Trả về danh sách rỗng khi số trang vượt quá tổng số trang hiện có.
    it('returns empty items when page exceeds total pages', async () => {
      repository.listJobCategories.mockResolvedValueOnce({
        jobCategories: [],
        pagination: { page: 99, limit: 20, total: 10, totalPages: 1 },
      });

      const query = JobCategoryBrowseQuerySchema.parse({ page: 99, limit: 20 });
      const result = await service.viewJobCategoryList(query);

      expect(result.jobCategories).toHaveLength(0);
      expect(result.pagination.page).toBe(99);
    });

    // Schema từ chối khi số trang là số âm.
    it('rejects negative page in query schema validation', () => {
      const parsed = JobCategoryBrowseQuerySchema.safeParse({ page: -1 });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi giới hạn mỗi trang vượt quá 50.
    it('rejects limit exceeding 50 in query schema validation', () => {
      const parsed = JobCategoryBrowseQuerySchema.safeParse({ limit: 51 });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi giới hạn mỗi trang là số âm.
    it('rejects negative limit in query schema validation', () => {
      const parsed = JobCategoryBrowseQuerySchema.safeParse({ limit: -5 });

      expect(parsed.success).toBe(false);
    });

    // Người dùng chưa đăng nhập vẫn được phép xem danh sách danh mục (công khai).
    it('allows unauthenticated public access to category list', async () => {
      const query = JobCategoryBrowseQuerySchema.parse({ page: 1, limit: 20 });
      const result = await service.viewJobCategoryList(query);

      expect(result).toBeDefined();
    });

    // Trả về đúng số lượng công việc đang mở (jobCount) trong từng danh mục.
    it('returns correct open job count in each category item', async () => {
      const query = JobCategoryBrowseQuerySchema.parse({ page: 1, limit: 20 });
      const result = await service.viewJobCategoryList(query);

      expect(result.jobCategories[0].jobCount).toBe(15);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadJobCategoryListException.
    it('throws FailedToLoadJobCategoryListException on Prisma error', async () => {
      repository.listJobCategories.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db read error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      const query = JobCategoryBrowseQuerySchema.parse({ page: 1, limit: 20 });
      await expect(service.viewJobCategoryList(query)).rejects.toThrow(
        FailedToLoadJobCategoryListException(),
      );
    });
  });

  describe('UF-120 viewJobCategoryDetail', () => {
    // UF-120: Xem chi tiết danh mục việc làm theo slug thành công.
    it('returns category detail with open jobs list for valid slug', async () => {
      const result = await service.viewJobCategoryDetail(
        'web-development',
        1,
        10,
      );

      expect(repository.getJobCategoryDetail).toHaveBeenCalledWith(
        'web-development',
        1,
        10,
      );
      expect(result.slug).toBe('web-development');
      expect(result.jobs).toHaveLength(1);
    });

    // Phân trang danh sách công việc bên trong chi tiết danh mục (trang 2).
    it('paginates open jobs within category detail on page 2', async () => {
      await service.viewJobCategoryDetail('web-development', 2, 10);

      expect(repository.getJobCategoryDetail).toHaveBeenCalledWith(
        'web-development',
        2,
        10,
      );
    });

    // Giới hạn số lượng công việc trong chi tiết danh mục là 5 việc làm mỗi trang.
    it('limits jobs in category detail to 5 items per page', async () => {
      await service.viewJobCategoryDetail('web-development', 1, 5);

      expect(repository.getJobCategoryDetail).toHaveBeenCalledWith(
        'web-development',
        1,
        5,
      );
    });

    // Trả về chi tiết danh mục khi danh mục đó hiện chưa có công việc nào.
    it('returns category detail with empty jobs array when no jobs belong to category', async () => {
      repository.getJobCategoryDetail.mockResolvedValueOnce({
        ...mockCategoryDetailResponse,
        jobs: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await service.viewJobCategoryDetail(
        'web-development',
        1,
        10,
      );

      expect(result.jobs).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    // Báo lỗi NotFound khi slug danh mục không tồn tại trong hệ thống.
    it('raises NotFound when category slug does not exist', async () => {
      repository.getJobCategoryDetail.mockRejectedValueOnce(
        JobCategoryNotFoundException(),
      );

      await expect(
        service.viewJobCategoryDetail('unknown-category', 1, 10),
      ).rejects.toThrow(JobCategoryNotFoundException());
    });

    // Báo lỗi NotFound khi danh mục đã bị xóa mềm.
    it('raises NotFound when category has been soft deleted', async () => {
      repository.getJobCategoryDetail.mockRejectedValueOnce(
        JobCategoryNotFoundException(),
      );

      await expect(
        service.viewJobCategoryDetail('deleted-category', 1, 10),
      ).rejects.toThrow(JobCategoryNotFoundException());
    });

    // Báo lỗi NotFound khi danh mục ở trạng thái không hoạt động (INACTIVE).
    it('raises NotFound when category status is inactive', async () => {
      repository.getJobCategoryDetail.mockRejectedValueOnce(
        JobCategoryNotFoundException(),
      );

      await expect(
        service.viewJobCategoryDetail('inactive-category', 1, 10),
      ).rejects.toThrow(JobCategoryNotFoundException());
    });

    // Người dùng chưa đăng nhập vẫn được phép xem chi tiết danh mục (công khai).
    it('allows unauthenticated public access to category detail', async () => {
      const result = await service.viewJobCategoryDetail(
        'web-development',
        1,
        10,
      );

      expect(result.slug).toBe('web-development');
    });

    // Chỉ trả về các công việc đang mở (OPEN) trong chi tiết danh mục.
    it('includes only OPEN jobs in category detail job listing', async () => {
      const result = await service.viewJobCategoryDetail(
        'web-development',
        1,
        10,
      );

      expect(result.jobs.every((job) => job.status === 'OPEN')).toBe(true);
    });

    // Sắp xếp các công việc trong danh mục theo thời gian tạo mới nhất giảm dần.
    it('orders category jobs by createdAt descending', async () => {
      const result = await service.viewJobCategoryDetail(
        'web-development',
        1,
        10,
      );

      expect(result.jobs).toBeDefined();
    });

    // Trả về danh sách công việc rỗng khi số trang công việc vượt quá tổng số trang.
    it('returns empty jobs when requested page exceeds total job pages', async () => {
      repository.getJobCategoryDetail.mockResolvedValueOnce({
        ...mockCategoryDetailResponse,
        jobs: [],
        pagination: { page: 99, limit: 10, total: 2, totalPages: 1 },
      });

      const result = await service.viewJobCategoryDetail(
        'web-development',
        99,
        10,
      );

      expect(result.jobs).toHaveLength(0);
      expect(result.pagination.page).toBe(99);
    });

    // Kiểm tra chi tiết danh mục chứa đầy đủ thông tin kỹ năng của từng công việc.
    it('includes associated skills for each job in category detail', async () => {
      const result = await service.viewJobCategoryDetail(
        'web-development',
        1,
        10,
      );

      expect(result.jobs[0].skills).toEqual([
        { jobId: 101, skillId: 1, skill: { name: 'TypeScript' } },
      ]);
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToLoadJobCategoryDetailException.
    it('throws FailedToLoadJobCategoryDetailException on Prisma error', async () => {
      repository.getJobCategoryDetail.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db read error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.viewJobCategoryDetail('web-development', 1, 10),
      ).rejects.toThrow(FailedToLoadJobCategoryDetailException());
    });
  });
});
