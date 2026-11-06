import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ForumLikeRepository } from '../../src/routes/forums/forums-like/forums-like.repo';
import { ForumLikeService } from '../../src/routes/forums/forums-like/forums-like.service';

describe('Forum post likes (UF-08 to UF-10)', () => {
  const repository = {
    findPostById: jest.fn(),
    findLikeByUserAndPost: jest.fn(),
    createPostLike: jest.fn(),
    deletePostLike: jest.fn(),
    viewForumLikeDetail: jest.fn(),
  };

  const service = new ForumLikeService(
    repository as unknown as ForumLikeRepository,
  );

  const like = {
    id: 1,
    userId: 10,
    postId: 1,
    commentId: null,
    reactionType: 'like',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    user: {
      id: 10,
      profile: { displayName: 'Alice', avatarUrl: null },
    },
  };

  beforeEach(() => jest.clearAllMocks());

  describe('UF-08 toggleLikePost (like)', () => {
    // UF-08: Like bài viết chưa like tạo bản ghi và trả về {liked: true}.
    it('creates a like and returns {liked: true}', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.findLikeByUserAndPost.mockResolvedValue(null);
      repository.createPostLike.mockResolvedValue(like);

      await expect(service.toggleLikePost(10, 1)).resolves.toEqual({
        liked: true,
      });
      expect(repository.createPostLike).toHaveBeenCalledWith(10, 1);
    });

    // Vẫn like được bài viết đã có 100 lượt like.
    it('creates a like on a post that already has 100 likes', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.findLikeByUserAndPost.mockResolvedValue(null);
      repository.createPostLike.mockResolvedValue(like);

      await expect(service.toggleLikePost(10, 1)).resolves.toEqual({
        liked: true,
      });
    });

    // Like bài viết không tồn tại trả về NotFound và không tạo bản ghi.
    it('raises NotFound when the post does not exist', async () => {
      repository.findPostById.mockResolvedValue(null);

      await expect(service.toggleLikePost(10, 999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.createPostLike).not.toHaveBeenCalled();
    });

    // Lỗi repository bất ngờ được bọc thành lỗi server.
    it('wraps an unexpected repository failure', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.findLikeByUserAndPost.mockResolvedValue(null);
      repository.createPostLike.mockRejectedValue(new Error('write failed'));

      await expect(service.toggleLikePost(10, 1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-09 toggleLikePost (unlike)', () => {
    // UF-09: Bỏ like bài viết đã like trả về {liked: false}.
    it('removes an existing like and returns {liked: false}', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.findLikeByUserAndPost.mockResolvedValue({
        id: 1,
        commentId: null,
      });
      repository.deletePostLike.mockResolvedValue(undefined);

      await expect(service.toggleLikePost(10, 1)).resolves.toEqual({
        liked: false,
      });
      expect(repository.deletePostLike).toHaveBeenCalledWith(10, 1);
    });

    // Biên toggle: bài viết chưa like thì thao tác tạo like.
    it('creates a like when the post was not liked yet (toggle boundary)', async () => {
      repository.findPostById.mockResolvedValue({ id: 1 });
      repository.findLikeByUserAndPost.mockResolvedValue(null);
      repository.createPostLike.mockResolvedValue(like);

      await expect(service.toggleLikePost(10, 1)).resolves.toEqual({
        liked: true,
      });
    });

    // Bỏ like bài viết không tồn tại trả về NotFound.
    it('raises NotFound when the post does not exist', async () => {
      repository.findPostById.mockResolvedValue(null);

      await expect(service.toggleLikePost(10, 999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('UF-10 viewForumLikeDetail', () => {
    // UF-10: Trả về danh sách profile những người đã like bài viết.
    it('returns the list of liker profiles', async () => {
      repository.viewForumLikeDetail.mockResolvedValue([like]);

      await expect(service.viewForumLikeDetail(1)).resolves.toEqual([like]);
      expect(repository.viewForumLikeDetail).toHaveBeenCalledWith(1);
    });

    // Bài viết chưa có like trả về mảng rỗng.
    it('returns an empty list when the post has no likes', async () => {
      repository.viewForumLikeDetail.mockResolvedValue([]);

      await expect(service.viewForumLikeDetail(2)).resolves.toEqual([]);
    });

    // Post id không khớp like nào trả về mảng rỗng (không ném lỗi).
    it('returns an empty list when no like row matches the post id', async () => {
      repository.viewForumLikeDetail.mockResolvedValue([]);

      await expect(service.viewForumLikeDetail(999999)).resolves.toEqual([]);
    });

    // Lỗi repository được bọc thành FailedToViewForumLikeDetailException.
    it('wraps a repository failure in FailedToViewForumLikeDetailException', async () => {
      repository.viewForumLikeDetail.mockRejectedValue(
        new Error('query failed'),
      );

      await expect(service.viewForumLikeDetail(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
