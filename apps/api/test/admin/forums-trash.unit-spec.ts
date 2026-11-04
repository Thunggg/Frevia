import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { ForumAdminRepository } from '../../src/routes/forums/forums-admin/forums-admin.repo';
import { ForumAdminService } from '../../src/routes/forums/forums-admin/forums-admin.service';
import {
  ForumCommentNotFoundException,
  ForumPostNotFoundException,
} from '../../src/routes/forums/forums-admin/forums-admin.error';

describe('Admin forum trash (UF-33 to UF-36)', () => {
  const repository = {
    getTrashPosts: jest.fn(),
    getTrashComments: jest.fn(),
    restoreTrashPost: jest.fn(),
    restoreTrashComment: jest.fn(),
  };

  const service = new ForumAdminService(
    repository as unknown as ForumAdminRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');
  const deletedAt = new Date('2026-01-03T00:00:00.000Z');

  const trashPost = {
    id: 1,
    categoryId: 1,
    userId: 10,
    title: 'Deleted post',
    slug: 'deleted-post',
    content: 'Post content',
    moderationStatus: 'APPROVED' as const,
    moderationScore: null,
    moderationCategories: null,
    createdAt,
    updatedAt,
    deletedAt,
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
  };

  const trashComment = {
    id: 5,
    postId: 1,
    content: 'Deleted comment',
    createdAt,
    updatedAt,
    deletedAt,
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
    post: {
      id: 1,
      title: 'Deleted post',
      categoryId: 1,
    },
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-33 getTrashPosts', () => {
    // UF-33: Admin lấy trang đầu danh sách bài viết đã xóa kèm metadata phân trang.
    it('returns the paginated deleted post list for an administrator', async () => {
      repository.getTrashPosts.mockResolvedValue({
        posts: [trashPost],
        total: 1,
      });

      const result = await service.getTrashPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts).toEqual([trashPost]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    // Trả về mảng rỗng và totalPages = 0 khi chưa có bài viết nào bị xóa.
    it('returns an empty trash list when no post is deleted', async () => {
      repository.getTrashPosts.mockResolvedValue({ posts: [], total: 0 });

      const result = await service.getTrashPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Client không phải Admin bị chặn 403 và repository không được gọi.
    it('forbids a client from reading deleted posts', async () => {
      await expect(
        service.getTrashPosts(RoleName.CLIENT, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.getTrashPosts).not.toHaveBeenCalled();
    });

    // Lỗi database từ repository được service chuyển thành phản hồi lỗi (Forbidden).
    it('converts a database failure into a forbidden/error response', async () => {
      repository.getTrashPosts.mockRejectedValue(
        new Error('database is down'),
      );

      await expect(
        service.getTrashPosts(RoleName.ADMIN, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Admin lấy được trang 2 của danh sách bài viết đã xóa.
    it('supports a second page of deleted posts', async () => {
      repository.getTrashPosts.mockResolvedValue({
        posts: [trashPost],
        total: 11,
      });

      const result = await service.getTrashPosts(RoleName.ADMIN, 2, 10);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('UF-34 getTrashComments', () => {
    // UF-34: Admin lấy trang đầu danh sách bình luận đã xóa kèm phân trang.
    it('returns the paginated deleted comment list for an administrator', async () => {
      repository.getTrashComments.mockResolvedValue({
        comments: [trashComment],
        total: 1,
      });

      const result = await service.getTrashComments(RoleName.ADMIN, 1, 10);

      expect(result.comments).toEqual([trashComment]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    // Trả về mảng rỗng khi chưa có bình luận nào bị xóa.
    it('returns an empty trash list when no comment is deleted', async () => {
      repository.getTrashComments.mockResolvedValue({
        comments: [],
        total: 0,
      });

      const result = await service.getTrashComments(RoleName.ADMIN, 1, 10);

      expect(result.comments).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Client bị chặn 403 khi đọc danh sách bình luận đã xóa.
    it('forbids a client from reading deleted comments', async () => {
      await expect(
        service.getTrashComments(RoleName.CLIENT, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.getTrashComments).not.toHaveBeenCalled();
    });

    // Lỗi database khi đọc bình luận đã xóa được chuyển thành lỗi phản hồi.
    it('converts a database failure into a forbidden/error response', async () => {
      repository.getTrashComments.mockRejectedValue(
        new Error('database is down'),
      );

      await expect(
        service.getTrashComments(RoleName.ADMIN, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Admin lấy được trang 2 của danh sách bình luận đã xóa.
    it('supports a second page of deleted comments', async () => {
      repository.getTrashComments.mockResolvedValue({
        comments: [trashComment],
        total: 11,
      });

      const result = await service.getTrashComments(RoleName.ADMIN, 2, 10);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('UF-35 restoreTrashPost', () => {
    // UF-35: Admin khôi phục bài viết đã xóa và nhận lại bản ghi đã khôi phục.
    it('restores a deleted post', async () => {
      const restored = { ...trashPost, deletedAt: null };
      repository.restoreTrashPost.mockResolvedValue(restored);

      await expect(
        service.restoreTrashPost(RoleName.ADMIN, 1),
      ).resolves.toEqual(restored);
      expect(repository.restoreTrashPost).toHaveBeenCalledWith(1);
    });

    // Báo NotFound khi bài viết đang hoạt động (không nằm trong thùng rác).
    it('raises NotFound when the post is already active', async () => {
      repository.restoreTrashPost.mockRejectedValue(
        ForumPostNotFoundException(),
      );

      await expect(
        service.restoreTrashPost(RoleName.ADMIN, 2),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Báo NotFound khi id bài viết không tồn tại.
    it('raises NotFound when the post is missing', async () => {
      repository.restoreTrashPost.mockRejectedValue(
        ForumPostNotFoundException(),
      );

      await expect(
        service.restoreTrashPost(RoleName.ADMIN, 999999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Client bị chặn 403 khi khôi phục bài viết.
    it('forbids a client from restoring a deleted post', async () => {
      await expect(
        service.restoreTrashPost(RoleName.CLIENT, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.restoreTrashPost).not.toHaveBeenCalled();
    });

    // Bản ghi sau khôi phục được trả về đúng id/nội dung (API không select deletedAt).
    it('returns the restored post record', async () => {
      repository.restoreTrashPost.mockResolvedValue(trashPost);

      const result = await service.restoreTrashPost(RoleName.ADMIN, 1);

      expect(result).toEqual(trashPost);
      expect(result.id).toBe(1);
    });

    // Client vẫn bị chặn 403 kể cả khi bài viết không tồn tại.
    it('forbids a client even when the post is missing', async () => {
      await expect(
        service.restoreTrashPost(RoleName.CLIENT, 999999),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.restoreTrashPost).not.toHaveBeenCalled();
    });
  });

  describe('UF-36 restoreTrashComment', () => {
    // UF-36: Admin khôi phục bình luận đã xóa và nhận lại bản ghi đã khôi phục.
    it('restores a deleted comment', async () => {
      const restored = { ...trashComment, deletedAt: null };
      repository.restoreTrashComment.mockResolvedValue(restored);

      await expect(
        service.restoreTrashComment(RoleName.ADMIN, 5),
      ).resolves.toEqual(restored);
      expect(repository.restoreTrashComment).toHaveBeenCalledWith(5);
    });

    // Báo NotFound khi bình luận đang hoạt động (không nằm trong thùng rác).
    it('raises NotFound when the comment is already active', async () => {
      repository.restoreTrashComment.mockRejectedValue(
        ForumCommentNotFoundException(),
      );

      await expect(
        service.restoreTrashComment(RoleName.ADMIN, 6),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Báo NotFound khi id bình luận không tồn tại.
    it('raises NotFound when the comment is missing', async () => {
      repository.restoreTrashComment.mockRejectedValue(
        ForumCommentNotFoundException(),
      );

      await expect(
        service.restoreTrashComment(RoleName.ADMIN, 999999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Client bị chặn 403 khi khôi phục bình luận.
    it('forbids a client from restoring a deleted comment', async () => {
      await expect(
        service.restoreTrashComment(RoleName.CLIENT, 5),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.restoreTrashComment).not.toHaveBeenCalled();
    });

    // Bản ghi sau khôi phục được trả về đúng id/nội dung (API không select deletedAt).
    it('returns the restored comment record', async () => {
      repository.restoreTrashComment.mockResolvedValue(trashComment);

      const result = await service.restoreTrashComment(RoleName.ADMIN, 5);

      expect(result).toEqual(trashComment);
      expect(result.id).toBe(5);
    });

    // Client vẫn bị chặn 403 kể cả khi bình luận không tồn tại.
    it('forbids a client even when the comment is missing', async () => {
      await expect(
        service.restoreTrashComment(RoleName.CLIENT, 999999),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.restoreTrashComment).not.toHaveBeenCalled();
    });
  });
});
