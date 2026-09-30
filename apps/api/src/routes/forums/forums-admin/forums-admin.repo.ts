import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { ForumAdminStatsType } from '@shared/types';

@Injectable()
export class ForumAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStats(): Promise<ForumAdminStatsType> {
    const [
      totalCategories,
      totalPosts,
      totalComments,
      totalReports,
      pendingReports,
      totalUsers,
      recentPosts,
    ] = await this.prisma.$transaction([
      this.prisma.forumCategory.count({ where: { deletedAt: null } }),
      this.prisma.forumPost.count({ where: { deletedAt: null } }),
      this.prisma.forumComment.count({ where: { deletedAt: null } }),
      this.prisma.forumReport.count(),
      this.prisma.forumReport.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.forumPost.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
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
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalCategories,
      totalPosts,
      totalComments,
      totalReports,
      pendingReports,
      totalUsers,
      recentPosts,
    };
  }

  async getAdminCommentLists(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(search && {
        content: { contains: search, mode: 'insensitive' as const },
      }),
    };

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
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.forumComment.count({ where }),
    ]);

    return { comments, total };
  }
}
