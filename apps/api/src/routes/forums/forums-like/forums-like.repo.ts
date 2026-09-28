import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';

@Injectable()
export class ForumLikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Tìm post theo id
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

  // Tạo like cho post
  async createLike(userId: number, postId: number) {
    return this.prisma.forumLike.create({
      data: {
        userId,
        postId,
        reactionType: 'like',
      },
    });
  }
}
