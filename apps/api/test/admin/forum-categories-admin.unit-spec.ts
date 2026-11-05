import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@shared/types';
import {
  ForumCategoryAlreadyExistsException,
  ForumCategoryHasPostsException,
  ForumCategoryNotFoundException,
} from '../../src/routes/forums/forums-admin/forums-admin.error';
import { ForumAdminRepository } from '../../src/routes/forums/forums-admin/forums-admin.repo';
import { ForumAdminService } from '../../src/routes/forums/forums-admin/forums-admin.service';

describe('Forum Category Management (UF-53 to UF-58)', () => {
  const repository = {
    createAdminCategory: jest.fn(),
    updateAdminCategory: jest.fn(),
    deleteAdminCategory: jest.fn(),
    getAdminCategoryLists: jest.fn(),
    getAdminCategoryById: jest.fn(),
    restoreAdminCategory: jest.fn(),
  };

  const service = new ForumAdminService(
    repository as unknown as ForumAdminRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const generalCategory = {
    id: 1,
    name: 'General',
    slug: 'general',
    description: 'General discussion',
    createdAt,
    updatedAt,
    postCount: 3,
  };
  const deletedCategory = {
    ...generalCategory,
    id: 2,
    name: 'Archived',
    slug: 'archived',
    deletedAt: updatedAt,
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-53 createAdminCategory', () => {
    // UF-53: Admin tạo danh mục diễn đàn mới và nhận lại bản ghi vừa tạo.
    it('creates a forum category when the administrator submits a unique name', async () => {
      repository.createAdminCategory.mockResolvedValue(generalCategory);

      const result = await service.createAdminCategory(RoleName.ADMIN, {
        name: 'General',
        description: 'General discussion',
      });

      expect(result).toEqual(generalCategory);
      expect(repository.createAdminCategory).toHaveBeenCalledWith({
        name: 'General',
        description: 'General discussion',
      });
    });

    // Tên danh mục trùng với danh mục đang hoạt động bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the category name already exists', async () => {
      repository.createAdminCategory.mockRejectedValue(
        ForumCategoryAlreadyExistsException(),
      );

      await expect(
        service.createAdminCategory(RoleName.ADMIN, { name: 'General' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Người dùng không phải Admin bị chặn bằng ForbiddenException và repository không được gọi.
    it('throws ForbiddenException when a client creates a category', async () => {
      await expect(
        service.createAdminCategory(RoleName.CLIENT, { name: 'General' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.createAdminCategory).not.toHaveBeenCalled();
    });

    // Tên danh mục dài đúng 100 ký tự vẫn được tạo thành công.
    it('creates a forum category when the name has exactly 100 characters', async () => {
      const boundaryName = 'C'.repeat(100);
      repository.createAdminCategory.mockResolvedValue({
        ...generalCategory,
        name: boundaryName,
      });

      const result = await service.createAdminCategory(RoleName.ADMIN, {
        name: boundaryName,
      });

      expect(result.name).toBe(boundaryName);
    });

    // Mô tả null được chấp nhận và chuyển nguyên vẹn xuống repository.
    it('forwards a null description to the repository', async () => {
      repository.createAdminCategory.mockResolvedValue({
        ...generalCategory,
        description: null,
      });

      await service.createAdminCategory(RoleName.ADMIN, {
        name: 'General',
        description: null,
      });

      expect(repository.createAdminCategory).toHaveBeenCalledWith({
        name: 'General',
        description: null,
      });
    });

    // Lỗi cơ sở dữ liệu không phải HttpException được ném lại nguyên vẹn.
    it('rethrows an unexpected database error without wrapping it', async () => {
      const databaseError = new Error('Database error on insert');
      repository.createAdminCategory.mockRejectedValue(databaseError);

      await expect(
        service.createAdminCategory(RoleName.ADMIN, { name: 'General' }),
      ).rejects.toBe(databaseError);
    });
  });

  describe('UF-54 updateAdminCategory', () => {
    // UF-54: Admin cập nhật tên và mô tả của danh mục đang tồn tại.
    it('updates the category name and description for an administrator', async () => {
      repository.updateAdminCategory.mockResolvedValue({
        ...generalCategory,
        name: 'Announcements',
        slug: 'announcements',
      });

      const result = await service.updateAdminCategory(RoleName.ADMIN, 1, {
        name: 'Announcements',
        description: 'Official news',
      });

      expect(result.slug).toBe('announcements');
      expect(repository.updateAdminCategory).toHaveBeenCalledWith(1, {
        name: 'Announcements',
        description: 'Official news',
      });
    });

    // Tên mới trùng với danh mục khác bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the new name belongs to another category', async () => {
      repository.updateAdminCategory.mockRejectedValue(
        ForumCategoryAlreadyExistsException(),
      );

      await expect(
        service.updateAdminCategory(RoleName.ADMIN, 1, { name: 'Support' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // ID danh mục không tồn tại trả về NotFoundException từ repository.
    it('rethrows NotFoundException when the category ID does not exist', async () => {
      repository.updateAdminCategory.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(
        service.updateAdminCategory(RoleName.ADMIN, 999, { name: 'Ghost' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Danh mục đã xóa mềm không thể cập nhật và trả về NotFoundException.
    it('rethrows NotFoundException when the category is already soft-deleted', async () => {
      repository.updateAdminCategory.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(
        service.updateAdminCategory(RoleName.ADMIN, 2, { name: 'Archived 2' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Người dùng không phải Admin bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when a client updates a category', async () => {
      await expect(
        service.updateAdminCategory(RoleName.CLIENT, 1, { name: 'Hacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updateAdminCategory).not.toHaveBeenCalled();
    });

    // Lỗi cơ sở dữ liệu không phải HttpException được ném lại nguyên vẹn.
    it('rethrows an unexpected database error without wrapping it', async () => {
      const databaseError = new Error('Database error on update');
      repository.updateAdminCategory.mockRejectedValue(databaseError);

      await expect(
        service.updateAdminCategory(RoleName.ADMIN, 1, { name: 'General 2' }),
      ).rejects.toBe(databaseError);
    });
  });

  describe('UF-55 deleteAdminCategory', () => {
    // UF-55: Admin xóa mềm danh mục không còn bài viết nào.
    it('soft-deletes a category that has no posts', async () => {
      repository.deleteAdminCategory.mockResolvedValue({
        message: 'Category deleted successfully',
      });

      const result = await service.deleteAdminCategory(RoleName.ADMIN, 1);

      expect(result).toEqual({ message: 'Category deleted successfully' });
      expect(repository.deleteAdminCategory).toHaveBeenCalledWith(1);
    });

    // Danh mục còn bài viết hoạt động bị từ chối bằng BadRequestException.
    it('rethrows BadRequestException when the category still has posts', async () => {
      repository.deleteAdminCategory.mockRejectedValue(
        ForumCategoryHasPostsException(),
      );

      await expect(
        service.deleteAdminCategory(RoleName.ADMIN, 1),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // Danh mục đã bị xóa trước đó trả về NotFoundException.
    it('rethrows NotFoundException when the category is already deleted', async () => {
      repository.deleteAdminCategory.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(
        service.deleteAdminCategory(RoleName.ADMIN, 2),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // ID danh mục không tồn tại trả về NotFoundException.
    it('rethrows NotFoundException when the category ID does not exist', async () => {
      repository.deleteAdminCategory.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(
        service.deleteAdminCategory(RoleName.ADMIN, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Người dùng không phải Admin bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when a client deletes a category', async () => {
      await expect(
        service.deleteAdminCategory(RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.deleteAdminCategory).not.toHaveBeenCalled();
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToDeleteForumCategoryException (500).
    it('throws InternalServerErrorException when the database delete fails', async () => {
      repository.deleteAdminCategory.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.deleteAdminCategory(RoleName.ADMIN, 1),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-56 getAdminCategoryLists', () => {
    // UF-56: Admin xem trang đầu danh sách danh mục kèm metadata phân trang.
    it('returns the first page of categories with pagination metadata', async () => {
      repository.getAdminCategoryLists.mockResolvedValue({
        categories: [{ ...generalCategory, deletedAt: null }],
        total: 25,
      });

      const result = await service.getAdminCategoryLists(RoleName.ADMIN, 1, 10);

      expect(result.categories).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    // Bộ lọc deleted = true được chuyển xuống repository để xem thùng rác.
    it('forwards the deleted filter to the repository', async () => {
      repository.getAdminCategoryLists.mockResolvedValue({
        categories: [deletedCategory],
        total: 1,
      });

      await service.getAdminCategoryLists(
        RoleName.ADMIN,
        1,
        10,
        undefined,
        'id',
        'desc',
        'true',
      );

      expect(repository.getAdminCategoryLists).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        'id',
        'desc',
        'true',
      );
    });

    // Từ khóa tìm kiếm và kiểu sắp xếp được chuyển nguyên vẹn xuống repository.
    it('forwards the search keyword and sorting options to the repository', async () => {
      repository.getAdminCategoryLists.mockResolvedValue({
        categories: [{ ...generalCategory, deletedAt: null }],
        total: 1,
      });

      await service.getAdminCategoryLists(
        RoleName.ADMIN,
        1,
        10,
        'Gen',
        'name',
        'asc',
      );

      expect(repository.getAdminCategoryLists).toHaveBeenCalledWith(
        1,
        10,
        'Gen',
        'name',
        'asc',
        undefined,
      );
    });

    // Trang vượt quá dữ liệu trả về mảng rỗng nhưng vẫn giữ metadata phân trang.
    it('returns an empty list with pagination metadata when the page exceeds the data', async () => {
      repository.getAdminCategoryLists.mockResolvedValue({
        categories: [],
        total: 5,
      });

      const result = await service.getAdminCategoryLists(RoleName.ADMIN, 9, 10);

      expect(result.categories).toEqual([]);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(9);
    });

    // Người dùng không phải Admin bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when a client lists categories', async () => {
      await expect(
        service.getAdminCategoryLists(RoleName.CLIENT, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.getAdminCategoryLists).not.toHaveBeenCalled();
    });

    // Lỗi truy vấn không phải HttpException được service chuyển thành ForbiddenException.
    it('throws ForbiddenException when the repository query fails unexpectedly', async () => {
      repository.getAdminCategoryLists.mockRejectedValue(
        new Error('Database query failure'),
      );

      await expect(
        service.getAdminCategoryLists(RoleName.ADMIN, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('UF-57 getAdminCategoryById', () => {
    // UF-57: Admin xem chi tiết danh mục đang hoạt động kèm số bài viết.
    it('returns the category detail with its post count', async () => {
      repository.getAdminCategoryById.mockResolvedValue(generalCategory);

      const result = await service.getAdminCategoryById(RoleName.ADMIN, 1);

      expect(result).toEqual(generalCategory);
      expect(repository.getAdminCategoryById).toHaveBeenCalledWith(1);
    });

    // Admin vẫn xem được chi tiết danh mục đã xóa mềm.
    it('returns the detail of a soft-deleted category', async () => {
      repository.getAdminCategoryById.mockResolvedValue(deletedCategory);

      const result = await service.getAdminCategoryById(RoleName.ADMIN, 2);

      expect(result).toEqual(deletedCategory);
    });

    // Repository trả về null thì service ném NotFoundException.
    it('throws NotFoundException when the category does not exist', async () => {
      repository.getAdminCategoryById.mockResolvedValue(null);

      await expect(
        service.getAdminCategoryById(RoleName.ADMIN, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // ID biên không hợp lệ (0) cũng trả về NotFoundException.
    it('throws NotFoundException when the category ID is zero', async () => {
      repository.getAdminCategoryById.mockResolvedValue(null);

      await expect(
        service.getAdminCategoryById(RoleName.ADMIN, 0),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Người dùng không phải Admin bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when a client reads a category detail', async () => {
      await expect(
        service.getAdminCategoryById(RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.getAdminCategoryById).not.toHaveBeenCalled();
    });

    // Lỗi truy vấn không phải HttpException được service chuyển thành ForbiddenException.
    it('throws ForbiddenException when the repository query fails unexpectedly', async () => {
      repository.getAdminCategoryById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.getAdminCategoryById(RoleName.ADMIN, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('UF-58 restoreAdminCategory', () => {
    // UF-58: Admin khôi phục danh mục đã xóa mềm bằng cách đặt deletedAt về null.
    it('restores a soft-deleted category', async () => {
      repository.restoreAdminCategory.mockResolvedValue({
        ...generalCategory,
        id: 2,
        name: 'Archived',
      });

      const result = await service.restoreAdminCategory(RoleName.ADMIN, 2);

      expect(result.id).toBe(2);
      expect(repository.restoreAdminCategory).toHaveBeenCalledWith(2);
    });

    // Danh mục đang hoạt động (chưa xóa) trả về NotFoundException.
    it('rethrows NotFoundException when the category is already active', async () => {
      repository.restoreAdminCategory.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(
        service.restoreAdminCategory(RoleName.ADMIN, 1),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // ID danh mục không tồn tại trả về NotFoundException.
    it('rethrows NotFoundException when the category ID does not exist', async () => {
      repository.restoreAdminCategory.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(
        service.restoreAdminCategory(RoleName.ADMIN, 999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Tên danh mục trùng với danh mục đang hoạt động bị từ chối bằng ConflictException.
    it('rethrows ConflictException when the name conflicts with an active category', async () => {
      repository.restoreAdminCategory.mockRejectedValue(
        ForumCategoryAlreadyExistsException(),
      );

      await expect(
        service.restoreAdminCategory(RoleName.ADMIN, 2),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    // Người dùng không phải Admin bị chặn bằng ForbiddenException.
    it('throws ForbiddenException when a client restores a category', async () => {
      await expect(
        service.restoreAdminCategory(RoleName.CLIENT, 2),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.restoreAdminCategory).not.toHaveBeenCalled();
    });

    // Lỗi cơ sở dữ liệu được chuyển thành FailedToRestoreForumCategoryException (500).
    it('throws InternalServerErrorException when the database restore fails', async () => {
      repository.restoreAdminCategory.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.restoreAdminCategory(RoleName.ADMIN, 2),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});

