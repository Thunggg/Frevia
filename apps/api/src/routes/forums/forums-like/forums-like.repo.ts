import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';

@Injectable()
export class ForumLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPostById(postId: number) {
    return this.prisma.forumPost.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        slug: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });
  }

  // Thông báo cho chủ bài viết khi có lượt thích mới
  async createPostLikeNotification(input: {
    postAuthorId: number;
    likerId: number;
    postId: number;
    postSlug: string;
    categoryId: number | null;
    categorySlug: string | null;
  }) {
    const {
      postAuthorId,
      likerId,
      postId,
      postSlug,
      categoryId,
      categorySlug,
    } = input;

    if (postAuthorId === likerId) {
      return null;
    }

    // Mỗi người chỉ tạo 1 thông báo cho 1 bài viết để tránh spam khi toggle like
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId: postAuthorId,
        type: NotificationType.POST_LIKE,
        deletedAt: null,
        AND: [
          {
            data: {
              path: ['postId'],
              equals: postId,
            },
          },
          {
            data: {
              path: ['likerId'],
              equals: likerId,
            },
          },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return null;
    }

    const liker = await this.prisma.user.findUnique({
      where: { id: likerId },
      select: {
        profile: {
          select: { displayName: true },
        },
      },
    });
    const likerName = liker?.profile?.displayName || 'Someone';

    const categorySegment =
      categorySlug && categoryId
        ? `${categorySlug}-${categoryId}`
        : `category-${categoryId ?? postId}`;
    const href = `/forum/${categorySegment}/${postSlug}-${postId}`;

    return this.prisma.notification.create({
      data: {
        userId: postAuthorId,
        type: NotificationType.POST_LIKE,
        title: 'New like on your post',
        message: `${likerName} liked your post.`,
        data: {
          href,
          postId,
          likerId,
          likerName,
        },
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
