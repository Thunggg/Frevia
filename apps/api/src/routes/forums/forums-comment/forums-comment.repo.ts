import { Injectable } from '@nestjs/common';
import { ForumCommentFilterType } from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';

@Injectable()
export class ForumCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getForumCommentLists(filter: ForumCommentFilterType) {
    const { page, limit, postId } = filter;
    const skip = (page - 1) * limit;
    const where = {
      postId,
      deletedAt: null,
    };

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
