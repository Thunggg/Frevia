import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  CreateForumPostSchema,
  ForumPostFilterSchema,
  RoleName,
  UpdateForumPostSchema,
} from '@shared/types';
import { ForumRepository } from '../../src/routes/forums/forums-post/forums.repo';
import { ForumService } from '../../src/routes/forums/forums-post/forums.service';
import { ForumPostNotFoundException } from '../../src/routes/forums/forums-post/forums.error';

describe('Forum posts (UF-03 to UF-07)', () => {
  const repository = {
    getForumPostLists: jest.fn(),
    viewForumPostDetail: jest.fn(),
    findForumCategoryById: jest.fn(),
    createForumPost: jest.fn(),
    findForumPostById: jest.fn(),
    updateForumPost: jest.fn(),
    softDeleteForumPost: jest.fn(),
  };

  const service = new ForumService(repository as unknown as ForumRepository);

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const post = {
    id: 1,
    categoryId: 1,
    userId: 10,
    title: 'How does escrow work?',
    slug: 'how-does-escrow-work',
    content: 'I want to understand the escrow flow.',
    moderationStatus: 'PENDING' as const,
    moderationScore: 0.1,
    moderationCategories: ['safe'],
    createdAt,
    updatedAt,
  };

  const detail = {
    ...post,
    category: { id: 1, name: 'General', slug: 'general' },
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-03 getForumPostLists', () => {
    // UF-03: Trả về trang đầu danh sách bài viết kèm metadata phân trang.
    it('returns the first page with pagination metadata', async () => {
      repository.getForumPostLists.mockResolvedValue({
        posts: [post],
        total: 12,
      });

      const result = await service.getForumPostLists({
        page: 1,
        limit: 10,
      });

      expect(result.posts).toEqual([post]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 12,
        totalPages: 2,
      });
    });

    // Trả về trang thứ hai theo yêu cầu.
    it('returns the requested second page', async () => {
      repository.getForumPostLists.mockResolvedValue({ posts: [], total: 12 });

      const result = await service.getForumPostLists({ page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });

    // Bộ lọc categoryId được truyền xuống repository.
    it('passes the category filter to the repository', async () => {
      repository.getForumPostLists.mockResolvedValue({
        posts: [post],
        total: 1,
      });

      await service.getForumPostLists({ page: 1, limit: 10, categoryId: 1 });

      expect(repository.getForumPostLists).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 1 }),
      );
    });

    // Từ khóa tìm kiếm được truyền xuống repository.
    it('passes the search keyword to the repository', async () => {
      repository.getForumPostLists.mockResolvedValue({
        posts: [post],
        total: 1,
      });

      await service.getForumPostLists({ page: 1, limit: 10, search: 'escrow' });

      expect(repository.getForumPostLists).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'escrow' }),
      );
    });

    // Schema từ chối page = 0.
    it('rejects page=0 through ForumPostFilterSchema', () => {
      const parsed = ForumPostFilterSchema.safeParse({
        page: '0',
        limit: '10',
      });

      expect(parsed.success).toBe(false);
    });

    // Trang vượt quá tổng số trang trả về danh sách rỗng.
    it('returns an empty page when the requested page is beyond the last one', async () => {
      repository.getForumPostLists.mockResolvedValue({ posts: [], total: 3 });

      const result = await service.getForumPostLists({ page: 5, limit: 10 });

      expect(result.posts).toEqual([]);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('UF-04 viewForumPostDetail', () => {
    // UF-04: Trả về chi tiết bài viết đã duyệt kèm danh mục và tác giả.
    it('returns an approved post with category and author data', async () => {
      repository.viewForumPostDetail.mockResolvedValue(detail);

      await expect(service.viewForumPostDetail(1)).resolves.toEqual(detail);
    });

    // Bài viết không thuộc danh mục nào trả về category = null.
    it('returns a post whose category is null', async () => {
      repository.viewForumPostDetail.mockResolvedValue({
        ...detail,
        categoryId: null,
        category: null,
      });

      const result = await service.viewForumPostDetail(2);

      expect(result.category).toBeNull();
    });

    // Bài viết không tồn tại trả về NotFound.
    it('propagates NotFound for a missing post', async () => {
      repository.viewForumPostDetail.mockRejectedValue(
        ForumPostNotFoundException(),
      );

      await expect(service.viewForumPostDetail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Bài viết đã bị xóa trả về NotFound.
    it('propagates NotFound for a deleted post', async () => {
      repository.viewForumPostDetail.mockRejectedValue(
        ForumPostNotFoundException(),
      );

      await expect(service.viewForumPostDetail(3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('UF-05 createForumPost', () => {
    // UF-05: Tạo bài viết với tiêu đề, nội dung và danh mục hợp lệ.
    it('creates a post with a valid title, content and category', async () => {
      repository.findForumCategoryById.mockResolvedValue({ id: 1 });
      repository.createForumPost.mockResolvedValue(post);

      const body = {
        categoryId: 1,
        title: 'How does escrow work?',
        content: 'I want to understand the escrow flow.',
        moderation: {
          status: 'PENDING',
          score: 0.1,
          categories: ['safe'],
        },
      };

      await expect(service.createForumPost(10, body as never)).resolves.toEqual(
        post,
      );
      expect(repository.createForumPost).toHaveBeenCalledWith(
        1,
        10,
        body.title,
        body.content,
        body.moderation,
      );
    });

    // Chấp nhận tiêu đề và nội dung dài 1 ký tự (biên dưới).
    it('accepts a one-character title and content', async () => {
      repository.findForumCategoryById.mockResolvedValue({ id: 1 });
      repository.createForumPost.mockResolvedValue({
        ...post,
        title: 'a',
        content: 'b',
      });

      const result = await service.createForumPost(10, {
        categoryId: 1,
        title: 'a',
        content: 'b',
      } as never);

      expect(result.title).toBe('a');
      expect(result.content).toBe('b');
    });

    // Schema từ chối tiêu đề rỗng.
    it('rejects an empty title at the schema level', () => {
      const parsed = CreateForumPostSchema.safeParse({
        categoryId: 1,
        title: '',
        content: 'valid content',
      });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối nội dung rỗng.
    it('rejects empty content at the schema level', () => {
      const parsed = CreateForumPostSchema.safeParse({
        categoryId: 1,
        title: 'valid title',
        content: '',
      });

      expect(parsed.success).toBe(false);
    });

    // Tạo được bài viết không có danh mục.
    it('creates a post without a category', async () => {
      repository.createForumPost.mockResolvedValue({
        ...post,
        categoryId: null,
      });

      const result = await service.createForumPost(10, {
        title: 'No category',
        content: 'Post body',
      } as never);

      expect(repository.createForumPost).toHaveBeenCalledWith(
        null,
        10,
        'No category',
        'Post body',
        undefined,
      );
      expect(result.categoryId).toBeNull();
    });

    // Danh mục không tồn tại trả về NotFound và không tạo bài viết.
    it('raises NotFound when the requested category does not exist', async () => {
      repository.findForumCategoryById.mockResolvedValue(null);

      await expect(
        service.createForumPost(10, {
          categoryId: 999,
          title: 'Title',
          content: 'Content',
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createForumPost).not.toHaveBeenCalled();
    });

    // Tạo được bài viết 1 ký tự và không có danh mục.
    it('creates a one-character post without a category', async () => {
      repository.createForumPost.mockResolvedValue({
        ...post,
        categoryId: null,
        title: 'a',
        content: 'b',
      });

      const result = await service.createForumPost(10, {
        title: 'a',
        content: 'b',
      } as never);

      expect(result.categoryId).toBeNull();
    });
  });

  describe('UF-06 updateForumPost', () => {
    // UF-06: Tác giả cập nhật được bài viết của mình.
    it('updates a post owned by the caller', async () => {
      repository.findForumPostById.mockResolvedValue({ ...post, userId: 10 });
      const updated = { ...post, title: 'Updated title' };
      repository.updateForumPost.mockResolvedValue(updated);

      const body = { title: 'Updated title', content: post.content };

      await expect(
        service.updateForumPost(1, 10, body as never),
      ).resolves.toEqual(updated);
      expect(repository.updateForumPost).toHaveBeenCalledWith(1, body);
    });

    // Schema từ chối tiêu đề rỗng khi cập nhật.
    it('rejects an empty title at the schema level', () => {
      const parsed = UpdateForumPostSchema.safeParse({
        title: '',
        content: 'valid content',
      });

      expect(parsed.success).toBe(false);
    });

    // Người khác không được cập nhật bài viết (Forbidden).
    it('forbids another user from updating the post', async () => {
      repository.findForumPostById.mockResolvedValue({ ...post, userId: 10 });

      await expect(
        service.updateForumPost(1, 99, {
          title: 'Updated title',
          content: 'Updated content',
        } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updateForumPost).not.toHaveBeenCalled();
    });

    // Bài viết không tồn tại trả về NotFound khi cập nhật.
    it('raises NotFound when the post does not exist', async () => {
      repository.findForumPostById.mockResolvedValue(null);

      await expect(
        service.updateForumPost(999999, 10, {
          title: 'Updated title',
          content: 'Updated content',
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Schema từ chối nội dung rỗng khi cập nhật.
    it('rejects empty content at the schema level', () => {
      const parsed = UpdateForumPostSchema.safeParse({
        title: 'valid title',
        content: '',
      });

      expect(parsed.success).toBe(false);
    });

    // Cập nhật được bài viết với tiêu đề/nội dung 1 ký tự.
    it('updates a post with a one-character title and content', async () => {
      repository.findForumPostById.mockResolvedValue({ ...post, userId: 10 });
      repository.updateForumPost.mockResolvedValue({
        ...post,
        title: 'a',
        content: 'b',
      });

      const result = await service.updateForumPost(1, 10, {
        title: 'a',
        content: 'b',
      } as never);

      expect(result.title).toBe('a');
      expect(result.content).toBe('b');
    });
  });

  describe('UF-07 deleteForumPost', () => {
    // UF-07: Tác giả xóa mềm được bài viết của mình.
    it('soft deletes a post owned by the author', async () => {
      repository.findForumPostById.mockResolvedValue({ ...post, userId: 10 });
      repository.softDeleteForumPost.mockResolvedValue(post);

      await expect(
        service.deleteForumPost(1, 10, RoleName.CLIENT),
      ).resolves.toEqual(post);
      expect(repository.softDeleteForumPost).toHaveBeenCalledWith(1);
    });

    // Người dùng không phải Admin không được xóa bài viết của người khác.
    it('forbids a different non-admin user from deleting the post', async () => {
      repository.findForumPostById.mockResolvedValue({ ...post, userId: 10 });

      await expect(
        service.deleteForumPost(1, 99, RoleName.CLIENT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.softDeleteForumPost).not.toHaveBeenCalled();
    });

    // Admin được xóa bài viết của người khác.
    it('allows an administrator to delete a post owned by someone else', async () => {
      repository.findForumPostById.mockResolvedValue({ ...post, userId: 10 });
      repository.softDeleteForumPost.mockResolvedValue(post);

      await expect(
        service.deleteForumPost(1, 99, RoleName.ADMIN),
      ).resolves.toEqual(post);
      expect(repository.softDeleteForumPost).toHaveBeenCalledWith(1);
    });

    // Bài viết không tồn tại trả về NotFound khi xóa.
    it('raises NotFound when the post does not exist', async () => {
      repository.findForumPostById.mockResolvedValue(null);

      await expect(
        service.deleteForumPost(999999, 10, RoleName.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
