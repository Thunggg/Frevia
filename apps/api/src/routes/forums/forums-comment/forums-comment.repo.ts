import { Injectable } from '@nestjs/common';
import {
  EditForumCommentType,
  ForumCommentFilterType,
  ForumCommentType,
} from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';

@Injectable()
export class ForumCommentRepository {
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

  async findCommentById(id: number): Promise<ForumCommentType | null> {
    return this.prisma.forumComment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        postId: true,

        content: true,
        createdAt: true,
        updatedAt: true,
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

  async createForumComment(
    postId: number,
    userId: number,
    content: string,
  ): Promise<ForumCommentType> {
    return this.prisma.forumComment.create({
      data: {
        postId,
        userId,
        content,
      },
      select: {
        id: true,
        postId: true,

        content: true,
        createdAt: true,
        updatedAt: true,
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

  // Sửa comment
  async updateForumComment(
    id: number,
    data: EditForumCommentType,
  ): Promise<ForumCommentType> {
    return this.prisma.forumComment.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        content: data.content,
      },
      select: {
        id: true,
        postId: true,

        content: true,
        createdAt: true,
        updatedAt: true,
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

  async softDeleteForumComment(id: number): Promise<ForumCommentType> {
    return this.prisma.forumComment.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
      select: {
        id: true,
        postId: true,

        content: true,
        createdAt: true,
        updatedAt: true,
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

  async getForumCommentLists(filter: ForumCommentFilterType) {
    const { page, limit, postId } = filter;
    const skip = (page - 1) * limit;
    const where = {
      postId,
      deletedAt: null,
    };

    //$transaction dùng để chạy 2 query cùng lúc để tối ưu hiệu năng
    const [comments, total] = await this.prisma.$transaction([
      this.prisma.forumComment.findMany({
        where,
        select: {
          id: true,
          postId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
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
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.forumComment.count({ where }),
    ]);

    return { comments, total };
  }

  // Kiểm tra người dùng đã like comment chưa
  async findLikeByUserAndComment(
    userId: number,
    commentId: number,
  ): Promise<{ id: number; postId: number | null } | null> {
    return this.prisma.forumLike.findFirst({
      where: {
        userId,
        commentId,
      },
      select: {
        id: true,
        postId: true,
      },
    });
  }

  // Kiểm tra người dùng đã like post chưa
  async findLikeByUserAndPost(
    userId: number,
    postId: number,
  ): Promise<{ id: number; commentId: number | null } | null> {
    return this.prisma.forumLike.findFirst({
      where: { userId, postId },
      select: { id: true, commentId: true },
    });
  }

  async createCommentLike(userId: number, postId: number, commentId: number) {
    const existingLike = await this.findLikeByUserAndPost(userId, postId);
    // Nếu người dùng đã like post và chưa like comment thì cập nhật
    if (existingLike && existingLike.commentId === null) {
      return this.prisma.forumLike.update({
        where: { id: existingLike.id },
        data: { commentId, reactionType: 'like' },
      });
      // Nếu người dùng chưa like post và chưa like comment thì tạo
    } else {
      return this.prisma.forumLike.create({
        data: {
          userId,
          postId: null,
          commentId,
          reactionType: 'like',
        },
      });
    }
  }

  async deleteCommentLike(userId: number, commentId: number) {
    const like = await this.findLikeByUserAndComment(userId, commentId);

    // Nếu không tìm thấy like -> return
    if (!like) {
      return;
    }

    // Nếu có like post -> chỉ bỏ comment
    if (like.postId !== null) {
      return this.prisma.forumLike.update({
        where: {
          id: like.id,
        },
        data: {
          commentId: null,
        },
      });
    }

    // Chỉ like comment -> xóa luôn
    return this.prisma.forumLike.delete({
      where: {
        id: like.id,
      },
    });
  }
}
