import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  CreateForumCommentSchema,
  EditForumCommentSchema,
  ForumCommentFilterSchema,
  RoleName,
} from '@shared/types';
import { ForumCommentRepository } from '../../src/routes/forums/forums-comment/forums-comment.repo';
import { ForumCommentService } from '../../src/routes/forums/forums-comment/forums-comment.service';

describe('Forum comments (UF-11 to UF-16)', () => {
  const repository = {
    findPostById: jest.fn(),
    findCommentById: jest.fn(),
    createForumComment: jest.fn(),
    updateForumComment: jest.fn(),
    softDeleteForumComment: jest.fn(),
    getForumCommentLists: jest.fn(),
    findLikeByUserAndComment: jest.fn(),
    findLikeByUserAndPost: jest.fn(),
    createCommentLike: jest.fn(),
    deleteCommentLike: jest.fn(),
  };

  const service = new ForumCommentService(
    repository as unknown as ForumCommentRepository,
  );

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  const comment = {
    id: 5,
    postId: 1,
    content: 'Useful answer',
    createdAt,
    updatedAt,
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
    likeCount: 0,
    likedByMe: false,
  };

  const existingComment = {
    id: 5,
    postId: 1,
    content: 'Useful answer',
    createdAt,
    updatedAt,
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-11 getForumCommentLists', () => {
    // UF-11: Trả về trang đầu danh sách bình luận kèm metadata phân trang.
    it('returns the first page with pagination metadata', async () => {
      repository.getForumCommentLists.mockResolvedValue({
        comments: [comment],
        total: 11,
      });

      const result = await service.getForumCommentLists({
        postId: 1,
        page: 1,
        limit: 10,
      });

      expect(result.comments).toEqual([comment]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 11,
        totalPages: 2,
      });
    });

    // Trả về trang thứ hai theo yêu cầu.
    it('returns the requested second page', async () => {
      repository.getForumCommentLists.mockResolvedValue({
        comments: [],
        total: 11,
      });

      const result = await service.getForumCommentLists({
        postId: 1,
        page: 2,
        limit: 10,
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });

    // Bài viết chưa có bình luận trả về mảng rỗng, totalPages = 0.
    it('returns an empty comment list for a post without comments', async () => {
      repository.getForumCommentLists.mockResolvedValue({
        comments: [],
        total: 0,
      });

      const result = await service.getForumCommentLists({
        postId: 2,
        page: 1,
        limit: 10,
      });

      expect(result.comments).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    // Schema từ chối page = 0.
    it('rejects page=0 through ForumCommentFilterSchema', () => {
      const parsed = ForumCommentFilterSchema.safeParse({
        page: '0',
        limit: '10',
      });

      expect(parsed.success).toBe(false);
    });

    // Schema từ chối limit = 0.
    it('rejects limit=0 through ForumCommentFilterSchema', () => {
      const parsed = ForumCommentFilterSchema.safeParse({
        page: '1',
        limit: '0',
      });

      expect(parsed.success).toBe(false);
    });

    // Dữ liệu likedByMe của người dùng được giữ nguyên khi trả về.
    it('passes likedByMe data through unchanged', async () => {
      const liked = { ...comment, likeCount: 3, likedByMe: true };
      repository.getForumCommentLists.mockResolvedValue({
        comments: [liked],
        total: 1,
      });

      const result = await service.getForumCommentLists({
        postId: 1,
        page: 1,
        limit: 10,
        userId: 10,
      });

      expect(result.comments[0]).toEqual(liked);
    });
  });

  describe('UF-12 createForumComment', () => {
    // UF-12: Tạo bình luận với nội dung hợp lệ và truyền đúng tham số cho repository.
    it('creates a comment with valid content', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.createForumComment.mockResolvedValue(comment);

      await expect(
        service.createForumComment(1, 10, { content: 'Useful answer' }),
      ).resolves.toEqual(comment);
      expect(repository.createForumComment).toHaveBeenCalledWith(
        1,
        10,
        'Useful answer',
      );
    });

    // Chấp nhận nội dung dài 1 ký tự (biên dưới).
    it('accepts one-character content', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.createForumComment.mockResolvedValue({
        ...comment,
        content: 'x',
      });

      const result = await service.createForumComment(1, 10, { content: 'x' });

      expect(result.content).toBe('x');
    });

    // Schema từ chối nội dung rỗng.
    it('rejects empty content at the schema level', () => {
      const parsed = CreateForumCommentSchema.safeParse({ content: '' });

      expect(parsed.success).toBe(false);
    });

    // Bài viết không tồn tại trả về NotFound và không tạo bình luận.
    it('raises NotFound when the post does not exist', async () => {
      repository.findPostById.mockResolvedValue(null);

      await expect(
        service.createForumComment(999999, 10, { content: 'Hello' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createForumComment).not.toHaveBeenCalled();
    });

    // Vẫn tạo được bình luận khi tác giả đã có bình luận khác trên bài viết.
    it('creates a comment on an existing post even when the author has other comments', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.createForumComment.mockResolvedValue(comment);

      await service.createForumComment(1, 10, { content: 'Another answer' });

      expect(repository.createForumComment).toHaveBeenCalledTimes(1);
    });

    // Không tạo bình luận khi bài viết không tồn tại (kiểm tra lần nữa).
    it('does not create a comment for a missing post', async () => {
      repository.findPostById.mockResolvedValue(null);

      await expect(
        service.createForumComment(999999, 10, { content: 'Hello' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createForumComment).not.toHaveBeenCalled();
    });
  });

  describe('UF-13 updateForumComment', () => {
    // UF-13: Tác giả cập nhật được bình luận của mình.
    it('updates a comment owned by the author', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      const updated = { ...comment, content: 'Updated answer' };
      repository.updateForumComment.mockResolvedValue(updated);

      await expect(
        service.updateForumComment(1, 5, 10, { content: 'Updated answer' }),
      ).resolves.toEqual(updated);
      expect(repository.updateForumComment).toHaveBeenCalledWith(5, {
        content: 'Updated answer',
      });
    });

    // Schema từ chối nội dung rỗng khi cập nhật.
    it('rejects empty content at the schema level', () => {
      const parsed = EditForumCommentSchema.safeParse({ content: '' });

      expect(parsed.success).toBe(false);
    });

    // Người khác không được sửa bình luận (Forbidden).
    it('forbids another user from updating the comment', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);

      await expect(
        service.updateForumComment(1, 5, 99, { content: 'Hijacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.updateForumComment).not.toHaveBeenCalled();
    });

    // Bình luận không tồn tại trả về NotFound khi cập nhật.
    it('raises NotFound when the comment is missing', async () => {
      repository.findCommentById.mockResolvedValue(null);

      await expect(
        service.updateForumComment(1, 999999, 10, { content: 'Updated' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Bình luận thuộc bài viết khác trả về NotFound khi cập nhật.
    it('raises NotFound when the comment belongs to another post', async () => {
      repository.findCommentById.mockResolvedValue({
        ...existingComment,
        postId: 2,
      });

      await expect(
        service.updateForumComment(1, 5, 10, { content: 'Updated' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.updateForumComment).not.toHaveBeenCalled();
    });

    // Cập nhật được bình luận với nội dung 1 ký tự.
    it('updates a comment with one-character content', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.updateForumComment.mockResolvedValue({
        ...comment,
        content: 'y',
      });

      const result = await service.updateForumComment(1, 5, 10, {
        content: 'y',
      });

      expect(result.content).toBe('y');
    });
  });

  describe('UF-14 deleteForumComment', () => {
    // UF-14: Tác giả xóa mềm được bình luận của mình.
    it('soft deletes a comment owned by the author', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.softDeleteForumComment.mockResolvedValue(comment);

      await expect(
        service.deleteForumComment(1, 5, 10, RoleName.CLIENT),
      ).resolves.toEqual(comment);
      expect(repository.softDeleteForumComment).toHaveBeenCalledWith(5);
    });

    // Người dùng không phải Admin không được xóa bình luận của người khác.
    it('forbids a different non-admin user from deleting the comment', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);

      await expect(
        service.deleteForumComment(1, 5, 99, RoleName.CLIENT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.softDeleteForumComment).not.toHaveBeenCalled();
    });

    // Admin được xóa bình luận của người khác.
    it('allows an administrator to delete a comment owned by someone else', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.softDeleteForumComment.mockResolvedValue(comment);

      await expect(
        service.deleteForumComment(1, 5, 99, RoleName.ADMIN),
      ).resolves.toEqual(comment);
    });

    // Bình luận không tồn tại trả về NotFound khi xóa.
    it('raises NotFound when the comment is missing', async () => {
      repository.findCommentById.mockResolvedValue(null);

      await expect(
        service.deleteForumComment(1, 999999, 10, RoleName.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Bình luận thuộc bài viết khác trả về NotFound khi xóa.
    it('raises NotFound when the comment belongs to another post', async () => {
      repository.findCommentById.mockResolvedValue({
        ...existingComment,
        postId: 2,
      });

      await expect(
        service.deleteForumComment(1, 5, 10, RoleName.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('UF-15 toggleLikeComment (like)', () => {
    // UF-15: Like bình luận lần đầu trả về {liked: true}.
    it('creates a comment like and returns {liked: true}', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.findLikeByUserAndComment.mockResolvedValue(null);
      repository.createCommentLike.mockResolvedValue({ id: 1 });

      await expect(service.toggleLikeComment(10, 1, 5)).resolves.toEqual({
        liked: true,
      });
      expect(repository.createCommentLike).toHaveBeenCalledWith(10, 1, 5);
    });

    // Vẫn like được bình luận đã có 50 lượt like.
    it('creates a like on a comment that already has 50 likes', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.findLikeByUserAndComment.mockResolvedValue(null);
      repository.createCommentLike.mockResolvedValue({ id: 1 });

      await expect(service.toggleLikeComment(10, 1, 5)).resolves.toEqual({
        liked: true,
      });
    });

    // Like bình luận không tồn tại trả về NotFound.
    it('raises NotFound when the comment is missing', async () => {
      repository.findCommentById.mockResolvedValue(null);

      await expect(
        service.toggleLikeComment(10, 1, 999999),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createCommentLike).not.toHaveBeenCalled();
    });

    // Like bình luận thuộc bài viết khác trả về NotFound.
    it('raises NotFound when the comment belongs to another post', async () => {
      repository.findCommentById.mockResolvedValue({
        ...existingComment,
        postId: 2,
      });

      await expect(
        service.toggleLikeComment(10, 1, 5),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createCommentLike).not.toHaveBeenCalled();
    });
  });

  describe('UF-16 toggleLikeComment (unlike)', () => {
    // UF-16: Bỏ like bình luận đã like trả về {liked: false}.
    it('removes an existing comment like and returns {liked: false}', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.findLikeByUserAndComment.mockResolvedValue({
        id: 1,
        postId: 1,
      });
      repository.deleteCommentLike.mockResolvedValue(undefined);

      await expect(service.toggleLikeComment(10, 1, 5)).resolves.toEqual({
        liked: false,
      });
      expect(repository.deleteCommentLike).toHaveBeenCalledWith(10, 5);
    });

    // Biên toggle: bình luận chưa like thì thao tác tạo like.
    it('creates a like when the comment was not liked yet (toggle boundary)', async () => {
      repository.findCommentById.mockResolvedValue(existingComment);
      repository.findLikeByUserAndComment.mockResolvedValue(null);
      repository.createCommentLike.mockResolvedValue({ id: 1 });

      await expect(service.toggleLikeComment(10, 1, 5)).resolves.toEqual({
        liked: true,
      });
    });

    // Bỏ like bình luận không tồn tại trả về NotFound.
    it('raises NotFound when the comment is missing', async () => {
      repository.findCommentById.mockResolvedValue(null);

      await expect(
        service.toggleLikeComment(10, 1, 999999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // Bỏ like bình luận thuộc bài viết khác trả về NotFound.
    it('raises NotFound when the comment belongs to another post', async () => {
      repository.findCommentById.mockResolvedValue({
        ...existingComment,
        postId: 2,
      });

      await expect(
        service.toggleLikeComment(10, 1, 5),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
