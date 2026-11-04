import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ForumRepository } from '../../src/routes/forums/forums-post/forums.repo';
import { ForumService } from '../../src/routes/forums/forums-post/forums.service';
import { ForumCategoryNotFoundException } from '../../src/routes/forums/forums-post/forums.error';

describe('Forum categories (UF-01, UF-02)', () => {
  const repository = {
    getForumCategories: jest.fn(),
    getForumCategoryById: jest.fn(),
  };

  const service = new ForumService(
    repository as unknown as ForumRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const category = {
    id: 1,
    name: 'General',
    slug: 'general',
    description: 'General discussion',
    createdAt,
    updatedAt,
    postCount: 4,
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-01 getForumCategories', () => {
    // UF-01: Trả về một danh mục đang hoạt động kèm postCount.
    it('returns one active category with its post count', async () => {
      repository.getForumCategories.mockResolvedValue([category]);

      await expect(service.getForumCategories()).resolves.toEqual([category]);
    });

    // Trả về nhiều danh mục đang hoạt động kèm postCount tương ứng.
    it('returns multiple active categories with post counts', async () => {
      const second = {
        ...category,
        id: 2,
        name: 'Freelancing',
        slug: 'freelancing',
        postCount: 9,
      };
      repository.getForumCategories.mockResolvedValue([category, second]);

      const result = await service.getForumCategories();

      expect(result).toHaveLength(2);
      expect(result[1].postCount).toBe(9);
    });

    // Trả về mảng rỗng khi không có danh mục nào đang hoạt động.
    it('returns an empty array when no active category exists', async () => {
      repository.getForumCategories.mockResolvedValue([]);

      await expect(service.getForumCategories()).resolves.toEqual([]);
    });

    // Lỗi database được bọc thành FailedToLoadForumCategoriesException.
    it('wraps a database error in FailedToLoadForumCategoriesException', async () => {
      repository.getForumCategories.mockRejectedValue(
        new Error('database is down'),
      );

      await expect(service.getForumCategories()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-02 getForumCategoryById', () => {
    // UF-02: Trả về chi tiết danh mục kèm postCount.
    it('returns the category detail with postCount', async () => {
      repository.getForumCategoryById.mockResolvedValue(category);

      await expect(service.getForumCategoryById(1)).resolves.toEqual(category);
      expect(repository.getForumCategoryById).toHaveBeenCalledWith(1);
    });

    // Danh mục tồn tại nhưng chưa có bài viết thì postCount = 0.
    it('returns postCount = 0 for an existing category without posts', async () => {
      repository.getForumCategoryById.mockResolvedValue({
        ...category,
        id: 2,
        postCount: 0,
      });

      const result = await service.getForumCategoryById(2);

      expect(result.postCount).toBe(0);
    });

    // Id không tồn tại trả về NotFound.
    it('propagates NotFound for a missing category id', async () => {
      repository.getForumCategoryById.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(service.getForumCategoryById(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Id không hợp lệ (0) cũng trả về NotFound.
    it('propagates NotFound for the invalid id 0', async () => {
      repository.getForumCategoryById.mockRejectedValue(
        ForumCategoryNotFoundException(),
      );

      await expect(service.getForumCategoryById(0)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
