import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ForumAdminCategoryType,
  ForumAdminCommentType,
  ForumAdminStatsType,
  ForumCategoryType,
  ForumPostType,
  UpdateForumCategoryBodyType,
} from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';
import { slugify } from '../forums-post/forums.slug';
import {
  ForumCategoryAlreadyExistsException,
  ForumCategoryNotFoundException,
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
    deleted?: string,
  ): Promise<{
    categories: ForumAdminCategoryType[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const showDeleted =
      deleted === 'true' ? true : deleted === 'false' ? false : undefined;

    const where: Prisma.ForumCategoryWhereInput = {
      ...(showDeleted !== undefined
        ? showDeleted
          ? { deletedAt: { not: null } }
          : { deletedAt: null }
        : {}),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
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
          deletedAt: true,
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
        deletedAt: c.deletedAt,
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

  // Tạo category mới
  async createAdminCategory(data: {
    name: string;
    description?: string | null;
  }): Promise<ForumCategoryType> {
    const existingName = await this.prisma.forumCategory.findFirst({
      where: {
        deletedAt: null,
        name: { equals: data.name, mode: 'insensitive' },
      },
    });

    if (existingName) {
      throw ForumCategoryAlreadyExistsException();
    }

    let baseSlug = slugify(data.name);
    if (!baseSlug) {
      baseSlug = 'category';
    }

    let slug = baseSlug;
    let counter = 1;

    while (
      await this.prisma.forumCategory.findFirst({
        where: { slug },
      })
    ) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const created = await this.prisma.forumCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
      },
    });

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      description: created.description,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      postCount: 0,
    };
  }

  // Cập nhật category
  async updateAdminCategory(
    id: number,
    data: UpdateForumCategoryBodyType,
  ): Promise<ForumCategoryType> {
    // Tìm category forum theo id
    const category = await this.prisma.forumCategory.findFirst({
      where: { id, deletedAt: null },
    });

    // nếu không tồn tại thì ném ra exception
    if (!category) {
      throw ForumCategoryNotFoundException();
    }

    let slug = category.slug;

    // Nếu có thay đổi tên category
    if (data.name && data.name !== category.name) {
      const existingName = await this.prisma.forumCategory.findFirst({
        where: {
          deletedAt: null,
          id: { not: id },
          name: { equals: data.name, mode: 'insensitive' },
        },
      });

      if (existingName) {
        throw ForumCategoryAlreadyExistsException();
      }

      let baseSlug = slugify(data.name);
      if (!baseSlug) {
        baseSlug = 'category';
      }

      slug = baseSlug;
      let counter = 1;

      while (
        await this.prisma.forumCategory.findFirst({
          where: { slug, id: { not: id } },
        })
      ) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    }

    const updated = await this.prisma.forumCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        slug,
      },
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

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      postCount: updated._count.posts,
    };
  }

  // Xóa danh mục (Soft delete; tách bài sang Uncategorized trước khi xóa)
  async deleteAdminCategory(id: number): Promise<{ message: string }> {
    const category = await this.prisma.forumCategory.findFirst({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw ForumCategoryNotFoundException();
    }

    await this.prisma.$transaction([
      this.prisma.forumPost.updateMany({
        where: { categoryId: id, deletedAt: null },
        data: { categoryId: null },
      }),
      this.prisma.forumCategory.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Category deleted successfully' };
  }

  // Khôi phục category đã soft-delete
  async restoreAdminCategory(id: number): Promise<ForumCategoryType> {
    const category = await this.prisma.forumCategory.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { id: true, name: true },
    });

    if (!category) {
      throw ForumCategoryNotFoundException();
    }

    const nameConflict = await this.prisma.forumCategory.findFirst({
      where: {
        deletedAt: null,
        id: { not: id },
        name: { equals: category.name, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (nameConflict) {
      throw ForumCategoryAlreadyExistsException();
    }

    const result = await this.prisma.forumCategory.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    if (result.count === 0) {
      throw ForumCategoryNotFoundException();
    }

    const updated = await this.prisma.forumCategory.findUnique({
      where: { id },
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

    if (!updated) {
      throw ForumCategoryNotFoundException();
    }

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      postCount: updated._count.posts,
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
