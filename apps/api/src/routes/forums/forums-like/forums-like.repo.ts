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
  ): Promise<{ id: number } | null> {
    return this.prisma.forumLike.findFirst({
      where: {
        userId,
        postId,
      },
      select: {
        id: true,
      },
    });
  }

  async createLike(userId: number, postId: number) {
    return this.prisma.forumLike.create({
      data: {
        userId,
        postId,
        reactionType: 'like',
      },
    });
  }

  async deleteLike(userId: number, postId: number) {
    return this.prisma.forumLike.deleteMany({
      where: {
        userId,
        postId,
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
