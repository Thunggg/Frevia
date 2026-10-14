import { Injectable } from '@nestjs/common';
import {
  ForumAdminCommentType,
  ForumAdminStatsType,
  ForumCategoryType,
  ForumPostType,
} from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';
import {
  ForumCommentNotFoundException,
  ForumPostNotFoundException,
} from './forums-admin.error';

// Prisma trả Json column dạng JsonValue -> cast về string[] | null cho đúng contract
function castJsonStringArray(value: unknown): string[] | null {
  return Array.isArray(value) ? (value as string[]) : null;
}

@Injectable()
export class ForumAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Danh sách bài viết PENDING chờ kiểm duyệt
  async getPendingPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      moderationStatus: 'PENDING' as const,
    };

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.forumPost.findMany({
        where,
        select: {
          id: true,
          categoryId: true,
          userId: true,
          title: true,
          slug: true,
          content: true,
          moderationStatus: true,
          moderationScore: true,
          moderationCategories: true,
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
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.forumPost.count({ where }),
    ]);

    return {
      posts: posts.map((p) => ({
        ...p,
        moderationCategories: castJsonStringArray(p.moderationCategories),
      })),
      total,
    };
  }

  // Duyệt bài: Approve -> APPROVED | Reject -> REJECTED (trash)
  async reviewForumPost(
    postId: number,
    status: 'APPROVED' | 'REJECTED',
    adminId: number,
  ): Promise<ForumPostType> {
    // updateMany để áp filter trạng thái PENDING (update không hỗ trợ filter non-unique)
    const result = await this.prisma.forumPost.updateMany({
      where: {
        id: postId,
        moderationStatus: 'PENDING',
        deletedAt: null,
      },
      data: {
        moderationStatus: status,
        reviewedById: adminId,
        reviewedAt: new Date(),
        // REJECTED -> chuyển vào trash (soft-delete, không hiển thị public)
        ...(status === 'REJECTED' && { deletedAt: new Date() }),
      },
    });

    if (result.count === 0) {
      throw ForumPostNotFoundException();
    }

    // Reject đã set deletedAt nên không filter deletedAt: null — bài vẫn phải
    // đọc được để trả response cho admin.
    const forumPost = await this.prisma.forumPost.findFirst({
      where: { id: postId },
      select: {
        id: true,
        categoryId: true,
        userId: true,
        title: true,
        slug: true,
        content: true,
        moderationStatus: true,
        moderationScore: true,
        moderationCategories: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!forumPost) {
      throw ForumPostNotFoundException();
    }

    return {
      ...forumPost,
      moderationCategories: castJsonStringArray(forumPost.moderationCategories),
    };
  }

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
              categoryId: true,
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

  async getAdminCategoryLists(
    page: number,
    limit: number,
    search?: string,
    sortBy: 'id' | 'name' | 'createdAt' = 'id',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    categories: ForumCategoryType[];
    total: number;
  }> {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      ...(search && {
        // kiếm theo tên không phân biệt hoa thường
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.forumCategory.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: { where: { deletedAt: null } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.forumCategory.count({ where }),
    ]);

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        postCount: c._count.posts,
      })),
      total,
    };
  }

  // Chi tiết category theo ID
  async getAdminCategoryById(id: number): Promise<ForumCategoryType | null> {
    const category = await this.prisma.forumCategory.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      postCount: category._count.posts,
    };
  }

  // Danh sách bài viết trong trash (đã xóa hoặc bị reject)
  async getTrashPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { deletedAt: { not: null } },
        { moderationStatus: 'REJECTED' as const },
      ],
    };

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.forumPost.findMany({
        where,
        select: {
          id: true,
          categoryId: true,
          userId: true,
          title: true,
          slug: true,
          content: true,
          moderationStatus: true,
          moderationScore: true,
          moderationCategories: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
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
        orderBy: { deletedAt: { sort: 'desc', nulls: 'last' } },
      }),
      this.prisma.forumPost.count({ where }),
    ]);

    return {
      posts: posts.map((p) => ({
        ...p,
        moderationCategories: castJsonStringArray(p.moderationCategories),
      })),
      total,
    };
  }

  // Danh sách bình luận trong trash (đã xóa)
  async getTrashComments(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: { not: null },
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
          deletedAt: true,
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
              categoryId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.forumComment.count({ where }),
    ]);

    return { comments, total };
  }

  // Khôi phục bài viết khỏi trash.
  // - Bài bị xóa mềm (APPROVED) -> hiển thị lại ngay.
  // - Bài bị REJECTED -> trả về hàng đợi PENDING để duyệt lại.
  async restoreTrashPost(postId: number): Promise<ForumPostType> {
    const existing = await this.prisma.forumPost.findFirst({
      where: {
        id: postId,
        OR: [{ deletedAt: { not: null } }, { moderationStatus: 'REJECTED' }],
      },
      select: { moderationStatus: true },
    });

    if (!existing) {
      throw ForumPostNotFoundException();
    }

    await this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        deletedAt: null,
        ...(existing.moderationStatus === 'REJECTED' && {
          moderationStatus: 'PENDING',
          reviewedById: null,
          reviewedAt: null,
        }),
      },
    });

    const restored = await this.prisma.forumPost.findFirst({
      where: { id: postId },
      select: {
        id: true,
        categoryId: true,
        userId: true,
        title: true,
        slug: true,
        content: true,
        moderationStatus: true,
        moderationScore: true,
        moderationCategories: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...restored!,
      moderationCategories: castJsonStringArray(restored!.moderationCategories),
    };
  }

  // Khôi phục bình luận đã xóa khỏi trash
  async restoreTrashComment(commentId: number): Promise<ForumAdminCommentType> {
    const result = await this.prisma.forumComment.updateMany({
      where: { id: commentId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    if (result.count === 0) {
      throw ForumCommentNotFoundException();
    }

    const restored = await this.prisma.forumComment.findUnique({
      where: { id: commentId },
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
            categoryId: true,
          },
        },
      },
    });

    return restored!;
  }
}
