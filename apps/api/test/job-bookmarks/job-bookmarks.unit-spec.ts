import { JobStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  RoleName,
  ViewBookmarkedJobFilterSchema,
  type ViewBookmarkedJobParsedFilterType,
} from '@shared/types';

import {
  BookmarkJobOnlyForFreelancerException,
  BookmarkNotFoundException,
  CannotBookmarkOwnJobException,
  CannotBookmarkUnavailableJobException,
  FailedToRemoveBookmarkException,
  JobAlreadyBookmarkedException,
  JobNotFoundException,
} from '../../src/routes/manage-job/manage-job.error';
import { ManageJobRepository } from '../../src/routes/manage-job/manage-job.repo';
import { ManageJobService } from '../../src/routes/manage-job/manage-job.service';
import type { EmbeddingOutboxService } from '../../src/routes/recommendations/embedding-outbox.service';

describe('Job Bookmarks (UF-97 to UF-99)', () => {
  let repository: {
    findJobBySlug: jest.Mock;
    findBookmark: jest.Mock;
    bookmarkJob: jest.Mock;
    removeBookmark: jest.Mock;
    getBookmarkedJobLists: jest.Mock;
  };

  let embeddingOutbox: {
    enqueueAndProcess: jest.Mock;
  };

  let service: ManageJobService;

  const mockJob = {
    id: 101,
    clientId: 42,
    title: 'Senior NestJS Engineer',
    slug: 'senior-nestjs-engineer',
    status: JobStatus.OPEN,
    budgetMin: 500,
    budgetMax: 1500,
    expiryDate: new Date(Date.now() + 86400000 * 7),
    createdAt: new Date('2026-03-01T00:00:00Z'),
  };

  const mockBookmarkItem = {
    id: 101,
    title: 'Senior NestJS Engineer',
    slug: 'senior-nestjs-engineer',
    status: JobStatus.OPEN,
    budgetMin: 500,
    budgetMax: 1500,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    bookmarkedAt: new Date('2026-03-02T00:00:00Z'),
  };

  beforeEach(() => {
    repository = {
      findJobBySlug: jest.fn().mockResolvedValue(mockJob),
      findBookmark: jest.fn().mockResolvedValue(null),
      bookmarkJob: jest.fn().mockResolvedValue({ userId: 1, jobId: 101 }),
      removeBookmark: jest.fn().mockResolvedValue({ userId: 1, jobId: 101 }),
      getBookmarkedJobLists: jest.fn().mockResolvedValue({
        jobs: [mockBookmarkItem],
        total: 1,
      }),
    };

    embeddingOutbox = {
      enqueueAndProcess: jest.fn().mockResolvedValue(undefined),
    };

    service = new ManageJobService(
      repository as unknown as ManageJobRepository,
      embeddingOutbox as unknown as EmbeddingOutboxService,
    );

    jest.clearAllMocks();
  });

  describe('UF-97 viewBookmarkedJob', () => {
    // UF-97: Freelancer xem danh sách việc làm đã lưu thành công với phân trang mặc định.
    it('returns bookmarked jobs with pagination for freelancer', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        });

      const result = await service.viewBookmarkedJob(
        1,
        RoleName.FREELANCER,
        filter,
      );

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    // Tìm kiếm việc làm đã lưu theo từ khóa.
    it('filters bookmarked jobs by search keyword', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          search: 'NestJS',
          sortBy: 'createdAt',
          order: 'desc',
        });

      await service.viewBookmarkedJob(1, RoleName.FREELANCER, filter);

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Lọc việc làm đã lưu theo trạng thái OPEN.
    it('filters bookmarked jobs by OPEN status', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          status: 'OPEN',
          sortBy: 'createdAt',
          order: 'desc',
        });

      await service.viewBookmarkedJob(1, RoleName.FREELANCER, filter);

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Lọc việc làm đã lưu theo trạng thái CLOSED kèm sắp xếp tăng dần.
    it('filters bookmarked jobs by CLOSED status with ascending sort order', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          status: 'CLOSED',
          sortBy: 'createdAt',
          order: 'asc',
        });

      await service.viewBookmarkedJob(1, RoleName.FREELANCER, filter);

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Lọc việc làm đã lưu theo trạng thái IN_PROGRESS.
    it('filters bookmarked jobs by IN_PROGRESS status', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          status: 'IN_PROGRESS',
          sortBy: 'createdAt',
          order: 'desc',
        });

      await service.viewBookmarkedJob(1, RoleName.FREELANCER, filter);

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Lọc việc làm đã lưu theo trạng thái COMPLETED.
    it('filters bookmarked jobs by COMPLETED status', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          status: 'COMPLETED',
          sortBy: 'createdAt',
          order: 'desc',
        });

      await service.viewBookmarkedJob(1, RoleName.FREELANCER, filter);

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Sắp xếp danh sách việc làm đã lưu theo ngân sách tối đa giảm dần.
    it('sorts bookmarked jobs by budgetMax descending', async () => {
      const filter: ViewBookmarkedJobParsedFilterType =
        ViewBookmarkedJobFilterSchema.parse({
          page: 1,
          limit: 10,
          sortBy: 'budgetMax',
          order: 'desc',
        });

      await service.viewBookmarkedJob(1, RoleName.FREELANCER, filter);

      expect(repository.getBookmarkedJobLists).toHaveBeenCalledWith(1, filter);
    });

    // Trả về mảng rỗng khi freelancer chưa lưu việc làm nào.
    it('returns empty list when freelancer has no bookmarked jobs', async () => {
      repository.getBookmarkedJobLists.mockResolvedValueOnce({
        jobs: [],
        total: 0,
      });

      const filter = ViewBookmarkedJobFilterSchema.parse({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      const result = await service.viewBookmarkedJob(
        1,
        RoleName.FREELANCER,
        filter,
      );

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Trả về mảng rỗng khi số trang yêu cầu vượt quá tổng số trang hiện có.
    it('returns empty data when requested page exceeds total available pages', async () => {
      repository.getBookmarkedJobLists.mockResolvedValueOnce({
        jobs: [],
        total: 10,
      });

      const filter = ViewBookmarkedJobFilterSchema.parse({
        page: 99,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      const result = await service.viewBookmarkedJob(
        1,
        RoleName.FREELANCER,
        filter,
      );

      expect(result.data).toHaveLength(0);
      expect(result.pagination.page).toBe(99);
      expect(result.pagination.totalPages).toBe(1);
    });

    // Người dùng không phải Freelancer bị từ chối truy cập.
    it('forbids non-freelancer roles from viewing bookmarked jobs', async () => {
      const filter = ViewBookmarkedJobFilterSchema.parse({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      await expect(
        service.viewBookmarkedJob(1, RoleName.CLIENT, filter),
      ).rejects.toThrow(BookmarkJobOnlyForFreelancerException());
    });

    // Schema từ chối khi số trang là số âm.
    it('rejects negative page number in query schema validation', () => {
      const parsed = ViewBookmarkedJobFilterSchema.safeParse({ page: -1 });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối khi số lượng mỗi trang vượt quá 20.
    it('rejects limit greater than 20 in query schema validation', () => {
      const parsed = ViewBookmarkedJobFilterSchema.safeParse({ limit: 21 });

      expect(parsed.success).toBe(false);
    });

    // Trả về danh sách rỗng khi từ khóa tìm kiếm không khớp việc làm nào.
    it('returns empty list when search keyword matches no jobs', async () => {
      repository.getBookmarkedJobLists.mockResolvedValueOnce({
        jobs: [],
        total: 0,
      });

      const filter = ViewBookmarkedJobFilterSchema.parse({
        page: 1,
        limit: 10,
        search: 'NonExistentJobTitle',
        sortBy: 'createdAt',
        order: 'desc',
      });

      const result = await service.viewBookmarkedJob(
        1,
        RoleName.FREELANCER,
        filter,
      );

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    // Bắt lỗi cơ sở dữ liệu khi truy vấn danh sách (ném lỗi Prisma trực tiếp do service không try/catch).
    it('propagates database error when repository throws PrismaClientKnownRequestError', async () => {
      repository.getBookmarkedJobLists.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db query error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      const filter = ViewBookmarkedJobFilterSchema.parse({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'desc',
      });

      await expect(
        service.viewBookmarkedJob(1, RoleName.FREELANCER, filter),
      ).rejects.toThrow('db query error');
    });
  });

  describe('UF-98 bookmarkJob', () => {
    // UF-98: Freelancer lưu việc làm thành công khi việc làm đang mở và còn hạn.
    it('bookmarks an open and active job successfully', async () => {
      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).resolves.toBeUndefined();

      expect(repository.findJobBySlug).toHaveBeenCalledWith(
        'senior-nestjs-engineer',
      );
      expect(repository.bookmarkJob).toHaveBeenCalledWith(1, mockJob.id);
    });

    // Người dùng không phải Freelancer không được phép lưu việc làm.
    it('forbids non-freelancer role from bookmarking job', async () => {
      await expect(
        service.bookmarkJob(1, RoleName.CLIENT, 'senior-nestjs-engineer'),
      ).rejects.toThrow(BookmarkJobOnlyForFreelancerException());
    });

    // Không cho phép freelancer lưu việc làm do chính mình đăng.
    it('rejects bookmarking client own job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        clientId: 1,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(CannotBookmarkOwnJobException());
    });

    // Không cho phép lưu việc làm đã đóng (CLOSED).
    it('rejects bookmarking a closed job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.CLOSED,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(CannotBookmarkUnavailableJobException());
    });

    // Không cho phép lưu việc làm đã hoàn thành (COMPLETED).
    it('rejects bookmarking a completed job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.COMPLETED,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(CannotBookmarkUnavailableJobException());
    });

    // Không cho phép lưu việc làm đang thực hiện (IN_PROGRESS).
    it('rejects bookmarking an in-progress job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.IN_PROGRESS,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(CannotBookmarkUnavailableJobException());
    });

    // Không cho phép lưu việc làm đã hết hạn nộp hồ sơ.
    it('rejects bookmarking an expired job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        expiryDate: new Date('2020-01-01T00:00:00Z'),
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(CannotBookmarkUnavailableJobException());
    });

    // Báo lỗi khi việc làm đã được lưu trước đó.
    it('rejects bookmarking an already bookmarked job', async () => {
      repository.findBookmark.mockResolvedValueOnce({
        userId: 1,
        jobId: mockJob.id,
      });

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(JobAlreadyBookmarkedException());
    });

    // Báo NotFound khi slug việc làm không tồn tại trong hệ thống.
    it('raises NotFound when job slug does not exist', async () => {
      repository.findJobBySlug.mockResolvedValueOnce(null);

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'non-existent-slug'),
      ).rejects.toThrow(JobNotFoundException());
    });

    // Xử lý lỗi trùng lặp từ cơ sở dữ liệu và ném JobAlreadyBookmarkedException.
    it('handles database unique constraint conflict and throws JobAlreadyBookmarkedException', async () => {
      repository.bookmarkJob.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('duplicate bookmark', {
          code: 'P2002',
          clientVersion: '1',
        }),
      );

      await expect(
        service.bookmarkJob(1, RoleName.FREELANCER, 'senior-nestjs-engineer'),
      ).rejects.toThrow(JobAlreadyBookmarkedException());
    });
  });

  describe('UF-99 removeBookmark', () => {
    // UF-99: Xóa việc làm đã lưu thành công khi việc làm đang mở (OPEN).
    it('removes bookmark successfully on an open job', async () => {
      repository.findBookmark.mockResolvedValueOnce({
        userId: 1,
        jobId: mockJob.id,
      });

      await expect(
        service.removeBookmark(1, 'senior-nestjs-engineer'),
      ).resolves.toBeUndefined();

      expect(repository.removeBookmark).toHaveBeenCalledWith(1, mockJob.id);
    });

    // Xóa việc làm đã lưu thành công ngay cả khi việc làm đã đóng (CLOSED).
    it('removes bookmark successfully on a closed job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.CLOSED,
      });
      repository.findBookmark.mockResolvedValueOnce({
        userId: 1,
        jobId: mockJob.id,
      });

      await expect(
        service.removeBookmark(1, 'senior-nestjs-engineer'),
      ).resolves.toBeUndefined();

      expect(repository.removeBookmark).toHaveBeenCalledWith(1, mockJob.id);
    });

    // Xóa việc làm đã lưu thành công ngay cả khi việc làm đã hoàn thành (COMPLETED).
    it('removes bookmark successfully on a completed job', async () => {
      repository.findJobBySlug.mockResolvedValueOnce({
        ...mockJob,
        status: JobStatus.COMPLETED,
      });
      repository.findBookmark.mockResolvedValueOnce({
        userId: 1,
        jobId: mockJob.id,
      });

      await expect(
        service.removeBookmark(1, 'senior-nestjs-engineer'),
      ).resolves.toBeUndefined();

      expect(repository.removeBookmark).toHaveBeenCalledWith(1, mockJob.id);
    });

    // Báo NotFound khi việc làm chưa được lưu bởi người dùng.
    it('raises NotFound when job is not bookmarked by the user', async () => {
      repository.findBookmark.mockResolvedValueOnce(null);

      await expect(
        service.removeBookmark(1, 'senior-nestjs-engineer'),
      ).rejects.toThrow(BookmarkNotFoundException());
    });

    // Báo NotFound khi việc làm không tồn tại trong hệ thống.
    it('raises NotFound when target job slug does not exist', async () => {
      repository.findJobBySlug.mockResolvedValueOnce(null);

      await expect(
        service.removeBookmark(1, 'unknown-job-slug'),
      ).rejects.toThrow(JobNotFoundException());
    });

    // Xử lý lỗi cơ sở dữ liệu và ném FailedToRemoveBookmarkException.
    it('throws FailedToRemoveBookmarkException on database failure', async () => {
      repository.findBookmark.mockResolvedValueOnce({
        userId: 1,
        jobId: mockJob.id,
      });
      repository.removeBookmark.mockRejectedValueOnce(
        new PrismaClientKnownRequestError('db error', {
          code: 'P2000',
          clientVersion: '1',
        }),
      );

      await expect(
        service.removeBookmark(1, 'senior-nestjs-engineer'),
      ).rejects.toThrow(FailedToRemoveBookmarkException());
    });

    // Kiểm tra trạng thái đã lưu trả về true khi đã bookmark và false khi chưa.
    it('returns correct bookmark status via getBookmarkStatus', async () => {
      repository.findBookmark.mockResolvedValueOnce({
        userId: 1,
        jobId: mockJob.id,
      });

      const statusTrue = await service.getBookmarkStatus(
        1,
        RoleName.FREELANCER,
        'senior-nestjs-engineer',
      );
      expect(statusTrue.isBookmarked).toBe(true);

      repository.findBookmark.mockResolvedValueOnce(null);

      const statusFalse = await service.getBookmarkStatus(
        1,
        RoleName.FREELANCER,
        'senior-nestjs-engineer',
      );
      expect(statusFalse.isBookmarked).toBe(false);
    });
  });
});
