import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';

@Injectable()
export class ForumLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPostById(postId: number): Promise<{ id: number } | null> {
    return this.prisma.forumPost.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  async findLikeByUserAndPost(
    userId: number,
    postId: number,
  ): Promise<{ id: number; commentId: number | null } | null> {
    return this.prisma.forumLike.findFirst({
      where: {
        userId,
        postId,
      },
      select: {
        id: true,
        commentId: true,
      },
    });
  }

  // Tìm comment like của người dùng nhưng không like post
  async findCommentOnlyLike(userId: number) {
    return this.prisma.forumLike.findFirst({
      where: {
        userId,
        postId: null,
        commentId: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async createPostLike(userId: number, postId: number) {
    const commentLike = await this.findCommentOnlyLike(userId);

    // Nếu người dùng đã like comment rồi nhưng chưa like post
    if (commentLike) {
      return this.prisma.forumLike.update({
        where: {
          id: commentLike.id,
        },
        data: {
          postId,
          reactionType: 'like',
        },
      });
    }

    // Nếu người dùng chưa like comment, chưa like post
    return this.prisma.forumLike.create({
      data: {
        userId,
        postId,
        commentId: null,
        reactionType: 'like',
      },
    });
  }

  async deletePostLike(userId: number, postId: number) {
    const like = await this.findLikeByUserAndPost(userId, postId);

    if (!like) {
      return;
    }

    // Nếu có like comment -> chỉ bỏ like post
    if (like.commentId !== null) {
      return this.prisma.forumLike.update({
        where: {
          id: like.id,
        },
        data: {
          postId: null,
        },
      });
    }

    // Nếu không có like comment -> xóa luôn
    return this.prisma.forumLike.delete({
      where: {
        id: like.id,
      },
    });
  }

  async viewForumLikeDetail(postId: number) {
    return this.prisma.forumLike.findMany({
      where: {
        postId,
      },
      select: {
        id: true,
        userId: true,
        postId: true,
        commentId: true,
        reactionType: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
