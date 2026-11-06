import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@shared/types';
import { ForumAdminRepository } from '../../src/routes/forums/forums-admin/forums-admin.repo';
import { ForumAdminService } from '../../src/routes/forums/forums-admin/forums-admin.service';
import { ForumPostNotFoundException } from '../../src/routes/forums/forums-admin/forums-admin.error';

describe('Admin moderation (UF-26 to UF-28)', () => {
  const repository = {
    getPendingPosts: jest.fn(),
    reviewForumPost: jest.fn(),
  };

  const service = new ForumAdminService(
    repository as unknown as ForumAdminRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const pendingPost = {
    id: 1,
    categoryId: 2,
    userId: 10,
    title: 'Suspicious post',
    slug: 'suspicious-post',
    content: 'Post content',
    moderationStatus: 'PENDING' as const,
    moderationScore: 0.87,
    moderationCategories: ['toxic', 'spam'],
    createdAt,
    updatedAt,
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-26 getPendingPosts', () => {
    // UF-26: Admin lấy hàng đợi bài viết PENDING kèm metadata phân trang.
    it('returns the paginated pending queue for an administrator', async () => {
      repository.getPendingPosts.mockResolvedValue({
        posts: [pendingPost],
        total: 11,
      });

      const result = await service.getPendingPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts).toEqual([pendingPost]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 11,
        totalPages: 2,
      });
    });

    // Hàng đợi rỗng khi không có bài viết nào chờ duyệt.
    it('returns an empty queue when nothing is pending', async () => {
      repository.getPendingPosts.mockResolvedValue({ posts: [], total: 0 });

      const result = await service.getPendingPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Client bị chặn 403 khi đọc hàng đợi.
    it('forbids a client from reading the queue', async () => {
      await expect(
        service.getPendingPosts(RoleName.CLIENT, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.getPendingPosts).not.toHaveBeenCalled();
    });

    // Freelancer bị chặn 403 khi đọc hàng đợi.
    it('forbids a freelancer from reading the queue', async () => {
      await expect(
        service.getPendingPosts(RoleName.FREELANCER, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.getPendingPosts).not.toHaveBeenCalled();
    });

    // Lỗi database được chuyển thành phản hồi lỗi (Forbidden).
    it('converts a database failure into a forbidden/error response', async () => {
      repository.getPendingPosts.mockRejectedValue(
        new Error('database is down'),
      );

      await expect(
        service.getPendingPosts(RoleName.ADMIN, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Admin lấy được trang 2 của hàng đợi.
    it('supports a second page of pending posts', async () => {
      repository.getPendingPosts.mockResolvedValue({
        posts: [pendingPost],
        total: 11,
      });

      const result = await service.getPendingPosts(RoleName.ADMIN, 2, 10);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('UF-27 moderation item detail', () => {
    // UF-27: Chi tiết mục kiểm duyệt trả về nội dung, điểm và nhãn AI của bài PENDING.
    it('returns content, score and categories for a pending post', async () => {
      repository.getPendingPosts.mockResolvedValue({
        posts: [pendingPost],
        total: 1,
      });

      const result = await service.getPendingPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts[0]).toMatchObject({
        content: 'Post content',
        moderationScore: 0.87,
        moderationCategories: ['toxic', 'spam'],
      });
    });

    // Giữ nguyên giá trị null khi bài viết chưa có điểm/nhãn AI.
    it('keeps null AI metadata for a pending post without a score', async () => {
      const withoutAi = {
        ...pendingPost,
        id: 2,
        moderationScore: null,
        moderationCategories: null,
      };
      repository.getPendingPosts.mockResolvedValue({
        posts: [withoutAi],
        total: 1,
      });

      const result = await service.getPendingPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts[0].moderationScore).toBeNull();
      expect(result.posts[0].moderationCategories).toBeNull();
    });

    // Không hiển thị bài viết đã được duyệt trong hàng đợi PENDING.
    it('does not expose already reviewed posts in the pending queue', async () => {
      repository.getPendingPosts.mockResolvedValue({ posts: [], total: 0 });

      const result = await service.getPendingPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts).toEqual([]);
    });

    // Không hiển thị bài viết không tồn tại trong hàng đợi.
    it('does not expose missing posts in the pending queue', async () => {
      repository.getPendingPosts.mockResolvedValue({ posts: [], total: 0 });

      const result = await service.getPendingPosts(RoleName.ADMIN, 1, 10);

      expect(result.posts).toHaveLength(0);
    });

    // Client bị chặn 403 khi xem chi tiết kiểm duyệt.
    it('forbids a client from reading moderation details', async () => {
      await expect(
        service.getPendingPosts(RoleName.CLIENT, 1, 10),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('UF-28 reviewPendingPost', () => {
    // UF-28: Admin duyệt bài viết PENDING (APPROVED).
    it('approves a pending post', async () => {
      const approved = { ...pendingPost, moderationStatus: 'APPROVED' };
      repository.reviewForumPost.mockResolvedValue(approved);

      await expect(
        service.reviewPendingPost(RoleName.ADMIN, 1, 'APPROVED', 99),
      ).resolves.toEqual(approved);
      expect(repository.reviewForumPost).toHaveBeenCalledWith(
        1,
        'APPROVED',
        99,
      );
    });

    // Admin từ chối bài viết PENDING (REJECTED).
    it('rejects a pending post', async () => {
      const rejected = { ...pendingPost, moderationStatus: 'REJECTED' };
      repository.reviewForumPost.mockResolvedValue(rejected);

      await expect(
        service.reviewPendingPost(RoleName.ADMIN, 1, 'REJECTED', 99),
      ).resolves.toEqual(rejected);
      expect(repository.reviewForumPost).toHaveBeenCalledWith(
        1,
        'REJECTED',
        99,
      );
    });

    // Client bị chặn 403 khi xử lý kiểm duyệt.
    it('forbids a client from resolving a moderation item', async () => {
      await expect(
        service.reviewPendingPost(RoleName.CLIENT, 1, 'APPROVED', 99),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.reviewForumPost).not.toHaveBeenCalled();
    });

    // Duyệt bài viết không tồn tại trả về NotFound.
    it('raises NotFound when approving a missing post', async () => {
      repository.reviewForumPost.mockRejectedValue(
        ForumPostNotFoundException(),
      );

      await expect(
        service.reviewPendingPost(RoleName.ADMIN, 999999, 'APPROVED', 99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Từ chối bài viết không tồn tại trả về NotFound.
    it('raises NotFound when rejecting a missing post', async () => {
      repository.reviewForumPost.mockRejectedValue(
        ForumPostNotFoundException(),
      );

      await expect(
        service.reviewPendingPost(RoleName.ADMIN, 999999, 'REJECTED', 99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Bài viết trả về giữ đúng trạng thái đã xử lý.
    it('keeps the resolved status on the returned post', async () => {
      repository.reviewForumPost.mockResolvedValue({
        ...pendingPost,
        moderationStatus: 'APPROVED',
      });

      const result = await service.reviewPendingPost(
        RoleName.ADMIN,
        1,
        'APPROVED',
        99,
      );

      expect(result.moderationStatus).toBe('APPROVED');
    });
  });
});
