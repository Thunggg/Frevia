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
        userId: true,
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
        userId: true,
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
        userId: true,
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
          userId: true,
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
}
