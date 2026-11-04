import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { JobCategoryAdminQueryType } from '@shared/types';
import {
  JobCategoryAdminNotFoundException,
  JobCategoryHasJobsException,
  JobCategoryNameAlreadyExistsException,
} from '../../src/routes/job-categories-admin/job-categories-admin.error';
import { JobCategoriesAdminRepository } from '../../src/routes/job-categories-admin/job-categories-admin.repo';
import { JobCategoriesAdminService } from '../../src/routes/job-categories-admin/job-categories-admin.service';

describe('Job Category Management (UF-79 to UF-84)', () => {
  const repository = {
    listJobCategories: jest.fn(),
    getJobCategoryDetail: jest.fn(),
    createJobCategory: jest.fn(),
    updateJobCategory: jest.fn(),
    deleteJobCategory: jest.fn(),
    restoreJobCategory: jest.fn(),
  };

  const service = new JobCategoriesAdminService(
    repository as unknown as JobCategoriesAdminRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const webDevCategory = {
    id: 1,
    name: 'Web Development',
    slug: 'web-development',
    description: 'Websites and web apps',
    status: 'ACTIVE' as const,
    deletedAt: null,
    createdAt,
    updatedAt,
    jobCount: 2,
    jobs: [
      { id: 11, title: 'Build a landing page' },
      { id: 12, title: 'Create an admin dashboard' },
    ],
  };

  const defaultQuery: JobCategoryAdminQueryType = {
    page: 1,
    limit: 10,
    sortBy: 'id',
    sortOrder: 'desc',
  };

  const uniqueViolation = () =>
    new PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });

  beforeEach(() => jest.clearAllMocks());

  describe('UF-79 listJobCategories', () => {
    // UF-79: Trả về danh sách danh mục kèm jobCount và phân trang mặc định.
    it('returns the category list with job counts and default pagination', async () => {
      const response = {
        jobCategories: [webDevCategory],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      repository.listJobCategories.mockResolvedValue(response);

      const result = await service.listJobCategories(defaultQuery);

      expect(result).toEqual(response);
      expect(repository.listJobCategories).toHaveBeenCalledWith(defaultQuery);
    });

    // Từ khóa tìm kiếm được chuyển nguyên vẹn xuống repository.
    it('forwards the search keyword to the repository', async () => {
      const query: JobCategoryAdminQueryType = {
        ...defaultQuery,
        search: 'web',
      };
      repository.listJobCategories.mockResolvedValue({
        jobCategories: [webDevCategory],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.listJobCategories(query);

      expect(repository.listJobCategories).toHaveBeenCalledWith(query);
    });

    // Bộ lọc trạng thái ACTIVE được chuyển nguyên vẹn xuống repository.
    it('forwards the status filter to the repository', async () => {
      const query: JobCategoryAdminQueryType = {
        ...defaultQuery,
        status: 'ACTIVE',
      };
      repository.listJobCategories.mockResolvedValue({
        jobCategories: [webDevCategory],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await service.listJobCategories(query);

      expect(repository.listJobCategories).toHaveBeenCalledWith(query);
    });

    // Bộ lọc deleted = true trả về danh mục đã xóa mềm (deletedAt khác null).
    it('returns soft-deleted categories when the deleted filter is true', async () => {
      const query: JobCategoryAdminQueryType = {
        ...defaultQuery,
        deleted: 'true',
      };
      repository.listJobCategories.mockResolvedValue({
        jobCategories: [{ ...webDevCategory, deletedAt: updatedAt }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const result = await service.listJobCategories(query);

      expect(result.jobCategories[0]?.deletedAt).toEqual(updatedAt);
    });

    // Từ khóa không khớp trả về mảng rỗng và total = 0.
    it('returns an empty list when the search keyword matches nothing', async () => {
      repository.listJobCategories.mockResolvedValue({
        jobCategories: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await service.listJobCategories({
        ...defaultQuery,
        search: 'zzz-not-found',
      });

      expect(result.jobCategories).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    // Lỗi kết nối cơ sở dữ liệu được chuyển thành FailedToLoadJobCategoryListException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.listJobCategories.mockRejectedValue(new Error('Timeout'));

      await expect(
        service.listJobCategories(defaultQuery),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-80 getJobCategoryDetail', () => {
    // UF-80: Trả về chi tiết danh mục kèm jobCount và danh sách công việc liên quan.
    it('returns the category detail with its linked jobs', async () => {
      repository.getJobCategoryDetail.mockResolvedValue(webDevCategory);

      const result = await service.getJobCategoryDetail(1);

      expect(result.jobCount).toBe(2);
      expect(result.jobs).toHaveLength(2);
      expect(repository.getJobCategoryDetail).toHaveBeenCalledWith(1);
    });

    // Danh mục không có công việc nào trả về jobCount = 0 và mảng jobs rỗng.
    it('returns zero job count and an empty jobs array when no job is linked', async () => {
      repository.getJobCategoryDetail.mockResolvedValue({
        ...webDevCategory,
        jobCount: 0,
        jobs: [],
      });

      const result = await service.getJobCategoryDetail(1);

      expect(result.jobCount).toBe(0);
      expect(result.jobs).toEqual([]);
    });

    // Repository trả về null thì service ném NotFoundException.
    it('throws NotFoundException when the category does not exist', async () => {
      repository.getJobCategoryDetail.mockResolvedValue(null);

      await expect(service.getJobCategoryDetail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // ID biên không hợp lệ (0) cũng trả về NotFoundException.
    it('throws NotFoundException when the category ID is zero', async () => {
      repository.getJobCategoryDetail.mockResolvedValue(null);

      await expect(service.getJobCategoryDetail(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi truy vấn cơ sở dữ liệu được chuyển thành FailedToLoadJobCategoryDetailException (500).
    it('throws InternalServerErrorException when the database query fails', async () => {
      repository.getJobCategoryDetail.mockRejectedValue(new Error('Failure'));

      await expect(service.getJobCategoryDetail(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-81 createJobCategory', () => {
    // UF-81: Tạo danh mục mới với tên duy nhất và nhận lại slug được sinh tự động.
    it('creates a category and returns the generated slug', async () => {
      repository.createJobCategory.mockResolvedValue({
        ...webDevCategory,
        jobCount: 0,
        jobs: [],
      });

      const result = await service.createJobCategory({
        name: 'Web Development',
        description: 'Websites and web apps',
        status: 'ACTIVE',
      });

      expect(result.slug).toBe('web-development');
      expect(repository.createJobCategory).toHaveBeenCalledWith({
        name: 'Web Development',
        description: 'Websites and web apps',
        status: 'ACTIVE',
      });
    });

    // Slug gốc đã tồn tại thì repository trả về slug có hậu tố số tăng dần.
    it('returns a slug with an incremented suffix when the base slug is taken', async () => {
      repository.createJobCategory.mockResolvedValue({
        ...webDevCategory,
        id: 2,
        slug: 'web-development-2',
        jobCount: 0,
        jobs: [],
      });

      const result = await service.createJobCategory({
        name: 'Web-Development',
        status: 'ACTIVE',
      });

      expect(result.slug).toBe('web-development-2');
    });

    // Tên trùng với danh mục đang hoạt động bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the category name already exists', async () => {
      repository.createJobCategory.mockRejectedValue(
        JobCategoryNameAlreadyExistsException(),
      );

      await expect(
        service.createJobCategory({
          name: 'web development',
          status: 'ACTIVE',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi P2002 do race condition được chuyển thành ConflictException.
    it('throws ConflictException when Prisma raises a P2002 unique violation', async () => {
      repository.createJobCategory.mockRejectedValue(uniqueViolation());

      await expect(
        service.createJobCategory({
          name: 'Web Development',
          status: 'ACTIVE',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Lỗi ghi cơ sở dữ liệu được chuyển thành FailedToCreateJobCategoryException (500).
    it('throws InternalServerErrorException when the database insert fails', async () => {
      repository.createJobCategory.mockRejectedValue(
        new Error('Insert failure'),
      );

      await expect(
        service.createJobCategory({ name: 'Broken', status: 'ACTIVE' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-82 updateJobCategory', () => {
    // UF-82: Cập nhật trạng thái và mô tả mà giữ nguyên tên danh mục.
    it('updates the status and description while keeping the same name', async () => {
      repository.updateJobCategory.mockResolvedValue({
        ...webDevCategory,
        status: 'INACTIVE',
        description: 'Archived',
      });

      const result = await service.updateJobCategory(1, {
        status: 'INACTIVE',
        description: 'Archived',
      });

      expect(result.status).toBe('INACTIVE');
      expect(repository.updateJobCategory).toHaveBeenCalledWith(1, {
        status: 'INACTIVE',
        description: 'Archived',
      });
    });

    // Đổi sang tên duy nhất mới và nhận lại slug được tạo lại.
    it('renames the category and returns the regenerated slug', async () => {
      repository.updateJobCategory.mockResolvedValue({
        ...webDevCategory,
        name: 'Mobile Development',
        slug: 'mobile-development',
      });

      const result = await service.updateJobCategory(1, {
        name: 'Mobile Development',
      });

      expect(result.slug).toBe('mobile-development');
    });

    // Tên mới trùng với danh mục đang hoạt động khác bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the new name belongs to another category', async () => {
      repository.updateJobCategory.mockRejectedValue(
        JobCategoryNameAlreadyExistsException(),
      );

      await expect(
        service.updateJobCategory(1, { name: 'Design' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // ID không tồn tại hoặc đã xóa mềm trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the category is missing or soft-deleted', async () => {
      repository.updateJobCategory.mockRejectedValue(
        JobCategoryAdminNotFoundException(),
      );

      await expect(
        service.updateJobCategory(999999, { status: 'ACTIVE' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Body rỗng (cập nhật một phần) vẫn được chuyển nguyên vẹn xuống repository.
    it('forwards an empty partial update body to the repository', async () => {
      repository.updateJobCategory.mockResolvedValue(webDevCategory);

      const result = await service.updateJobCategory(1, {});

      expect(repository.updateJobCategory).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(webDevCategory);
    });

    // Lỗi ghi cơ sở dữ liệu được chuyển thành FailedToUpdateJobCategoryException (500).
    it('throws InternalServerErrorException when the database update fails', async () => {
      repository.updateJobCategory.mockRejectedValue(
        new Error('Write failure'),
      );

      await expect(
        service.updateJobCategory(1, { name: 'Broken' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-83 deleteJobCategory', () => {
    // UF-83: Xóa mềm danh mục không còn công việc hoạt động và trả về thông báo thành công.
    it('soft-deletes a category without active jobs', async () => {
      repository.deleteJobCategory.mockResolvedValue({
        message: 'Job category deleted successfully',
      });

      const result = await service.deleteJobCategory(1);

      expect(result).toEqual({ message: 'Job category deleted successfully' });
      expect(repository.deleteJobCategory).toHaveBeenCalledWith(1);
    });

    // Danh mục còn công việc hoạt động bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the category still has active jobs', async () => {
      repository.deleteJobCategory.mockRejectedValue(
        JobCategoryHasJobsException(),
      );

      await expect(service.deleteJobCategory(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // Danh mục chỉ còn công việc đã xóa mềm vẫn được xóa thành công.
    it('deletes a category whose linked jobs are all soft-deleted', async () => {
      repository.deleteJobCategory.mockResolvedValue({
        message: 'Job category deleted successfully',
      });

      const result = await service.deleteJobCategory(3);

      expect(result.message).toBe('Job category deleted successfully');
    });

    // ID không tồn tại hoặc đã xóa mềm trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the category is missing or already deleted', async () => {
      repository.deleteJobCategory.mockRejectedValue(
        JobCategoryAdminNotFoundException(),
      );

      await expect(service.deleteJobCategory(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToDeleteJobCategoryException (500).
    it('throws InternalServerErrorException when the database delete fails', async () => {
      repository.deleteJobCategory.mockRejectedValue(new Error('Query error'));

      await expect(service.deleteJobCategory(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-84 restoreJobCategory', () => {
    // UF-84: Khôi phục danh mục đã xóa mềm bằng cách đặt deletedAt về null.
    it('restores a soft-deleted category with deletedAt reset to null', async () => {
      repository.restoreJobCategory.mockResolvedValue(webDevCategory);

      const result = await service.restoreJobCategory(1);

      expect(result.deletedAt).toBeNull();
      expect(repository.restoreJobCategory).toHaveBeenCalledWith(1);
    });

    // Tên trùng với danh mục đang hoạt động bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the name conflicts with an active category', async () => {
      repository.restoreJobCategory.mockRejectedValue(
        JobCategoryNameAlreadyExistsException(),
      );

      await expect(service.restoreJobCategory(1)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // Danh mục đang hoạt động (chưa xóa) trả về NotFoundException.
    it('rethrows NotFoundException when the category is already active', async () => {
      repository.restoreJobCategory.mockRejectedValue(
        JobCategoryAdminNotFoundException(),
      );

      await expect(service.restoreJobCategory(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // ID không tồn tại trong cơ sở dữ liệu trả về NotFoundException.
    it('rethrows NotFoundException when the category ID does not exist', async () => {
      repository.restoreJobCategory.mockRejectedValue(
        JobCategoryAdminNotFoundException(),
      );

      await expect(service.restoreJobCategory(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToRestoreJobCategoryException (500).
    it('throws InternalServerErrorException when the database restore fails', async () => {
      repository.restoreJobCategory.mockRejectedValue(new Error('Query error'));

      await expect(service.restoreJobCategory(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
