import { Injectable } from '@nestjs/common';
import {
  ForumCategoryType,
  ForumModerationType,
  ForumPostFilterType,
  ForumPostType,
  ForumTopActiveUserType,
  ForumTopPostType,
  UpdateForumPostType,
} from '@shared/types';
import { PrismaService } from '../../../shared/services/prisma.service';
import {
  ForumCategoryNotFoundException,
  ForumPostNotFoundException,
} from './forums.error';
import { createPostSlug } from './forums.slug';

// Chỉ những bài viết được admin duyệt (APPROVED) mới hiển thị công khai
const PUBLIC_MODERATION_STATUSES: 'APPROVED'[] = ['APPROVED'];

// Prisma trả Json column dạng JsonValue -> cast về string[] | null cho đúng contract
function castJsonStringArray(value: unknown): string[] | null {
  return Array.isArray(value) ? (value as string[]) : null;
}

@Injectable()
export class ForumRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách tất cả forum categories đang active kèm số lượng posts
  async getForumCategories(): Promise<
    Pick<
      ForumCategoryType,
      | 'id'
      | 'name'
      | 'slug'
      | 'description'
      | 'createdAt'
      | 'updatedAt'
      | 'postCount'
    >[]
  > {
    const categories = await this.prisma.forumCategory.findMany({
      where: {
        deletedAt: null,
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
            posts: {
              where: {
                deletedAt: null,
                moderationStatus: { in: PUBLIC_MODERATION_STATUSES },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      postCount: c._count.posts,
    }));
  }

  // Lấy top forum categories có nhiều posts nhất
  async getTopForumCategories(
    limit: number = 3,
  ): Promise<
    Pick<
      ForumCategoryType,
      | 'id'
      | 'name'
      | 'slug'
      | 'description'
      | 'createdAt'
      | 'updatedAt'
      | 'postCount'
    >[]
  > {
    const categories = await this.prisma.forumCategory.findMany({
      where: {
        deletedAt: null,
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
            posts: {
              where: {
                deletedAt: null,
                moderationStatus: { in: PUBLIC_MODERATION_STATUSES },
              },
            },
          },
        },
      },
      orderBy: {
        posts: { _count: 'desc' },
      },
      take: limit,
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      postCount: c._count.posts,
    }));
  }

  // Lấy top người dùng hoạt động nhiều nhất (dựa trên số bài viết)
  async getTopActiveUsers(
    limit: number = 5,
  ): Promise<ForumTopActiveUserType[]> {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isBanned: false,
      },
      select: {
        id: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            forumPosts: { where: { deletedAt: null } },
            forumComments: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: {
        forumPosts: { _count: 'desc' },
      },
      take: limit,
    });

    return users.map((u) => ({
      id: u.id,
      displayName: u.profile?.displayName ?? null,
      avatarUrl: u.profile?.avatarUrl ?? null,
      postCount: u._count.forumPosts,
      commentCount: u._count.forumComments,
    }));
  }

  // Tìm xem category hiện tại có tồn tại không trước khi tạo post
  async findForumCategoryById(
    id: number,
  ): Promise<Pick<ForumCategoryType, 'id'> | null> {
    return this.prisma.forumCategory.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  async getForumCategoryById(
    id: number,
  ): Promise<
    Pick<
      ForumCategoryType,
      | 'id'
      | 'name'
      | 'slug'
      | 'description'
      | 'createdAt'
      | 'updatedAt'
      | 'postCount'
    >
  > {
    // DÙng findFirst để tìm kiếm forum category theo id và deletedAt = null (chỉ lấy các category đang active)
    const forumCategory = await this.prisma.forumCategory.findFirst({
      where: {
        id,
        deletedAt: null,
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

    if (!forumCategory) {
      throw ForumCategoryNotFoundException();
    }

    return {
      id: forumCategory.id,
      name: forumCategory.name,
      slug: forumCategory.slug,
      description: forumCategory.description,
      createdAt: forumCategory.createdAt,
      updatedAt: forumCategory.updatedAt,
      postCount: forumCategory._count.posts,
    };
  }

  async findForumCategoryBySlug(
    slug: string,
  ): Promise<Pick<ForumCategoryType, 'id'> | null> {
    return this.prisma.forumCategory.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  }

  async getForumPostLists(filter: ForumPostFilterType) {
    const { page, limit, categoryId, userId, search } = filter;
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null,
      moderationStatus: { in: PUBLIC_MODERATION_STATUSES },
      ...(categoryId !== undefined && {
        categoryId,
      }),
      ...(userId !== undefined && {
        userId,
      }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' as const },
      }),
    };
    // Sử dụng transaction để thực hiện 2 truy vấn cùng lúc: lấy danh sách forum posts và đếm tổng số forum posts thỏa mãn điều kiện lọc
    // tính tổng số forum để hiển thị thông tin phân trang
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
          _count: {
            select: {
              likes: true,
              comments: { where: { deletedAt: null } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.forumPost.count({
        where,
      }),
    ]);
    return {
      posts: posts.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        userId: p.userId,
        title: p.title,
        slug: p.slug,
        content: p.content,
        moderationStatus: p.moderationStatus,
        moderationScore: p.moderationScore,
        moderationCategories: castJsonStringArray(p.moderationCategories),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        user: p.user,
      })),
      total,
    };
  }

  async createForumPost(
    categoryId: number | null,
    userId: number,
    title: string,
    content: string,
    moderation?: ForumModerationType,
  ): Promise<ForumPostType> {
    const slug = createPostSlug(title);

    const forumPost = await this.prisma.forumPost.create({
      data: {
        categoryId,
        userId,
        title,
        slug,
        content,
        moderationStatus: moderation?.status ?? 'PENDING',
        moderationScore: moderation?.score ?? null,
        moderationCategories: moderation?.categories?.length
          ? moderation.categories
          : undefined,
      },
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
      ...forumPost,
      moderationCategories: castJsonStringArray(forumPost.moderationCategories),
    };
  }

  async viewForumPostDetail(id: number) {
    const forumPost = await this.prisma.forumPost.findFirst({
      where: {
        id,
        deletedAt: null,
        moderationStatus: { in: PUBLIC_MODERATION_STATUSES },
      },
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

        // Lấy ID, tên và slug Category của post hiện tại
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        // Lấy thông tin user của post hiện tại bao gồm id, displayName và avatarUrl
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

    if (!forumPost) {
      throw ForumPostNotFoundException();
    }

    return {
      ...forumPost,
      moderationCategories: castJsonStringArray(forumPost.moderationCategories),
    };
  }

  async findForumPostById(id: number): Promise<ForumPostType | null> {
    const forumPost = await this.prisma.forumPost.findFirst({
      where: {
        id,
        deletedAt: null,
      },
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
      return null;
    }

    return {
      ...forumPost,
      moderationCategories: castJsonStringArray(forumPost.moderationCategories),
    };
  }

  async findForumPostBySlug(
    slug: string,
  ): Promise<Pick<ForumPostType, 'id'> | null> {
    return this.prisma.forumPost.findFirst({
      where: {
        slug,
        deletedAt: null,
        moderationStatus: { in: PUBLIC_MODERATION_STATUSES },
      },
      select: {
        id: true,
      },
    });
  }

  async updateForumPost(
    id: number,
    data: UpdateForumPostType,
  ): Promise<ForumPostType> {
    const forumPost = await this.prisma.forumPost.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...(data.categoryId !== undefined && {
          categoryId: data.categoryId,
        }),
        title: data.title,
        slug: createPostSlug(data.title),
        content: data.content,
      },
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
      ...forumPost,
      moderationCategories: castJsonStringArray(forumPost.moderationCategories),
    };
  }

  async softDeleteForumPost(id: number): Promise<ForumPostType> {
    const forumPost = await this.prisma.forumPost.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
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
      ...forumPost,
      moderationCategories: castJsonStringArray(forumPost.moderationCategories),
    };
  }

  async getTopInteractedPosts(
    limit: number = 3,
    categoryId?: number,
  ): Promise<ForumTopPostType[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const posts = await this.prisma.forumPost.findMany({
      where: {
        deletedAt: null,
        moderationStatus: { in: PUBLIC_MODERATION_STATUSES },
        createdAt: { gte: oneWeekAgo },
        ...(categoryId !== undefined && { categoryId }),
      },
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return posts.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      userId: p.userId,
      title: p.title,
      slug: p.slug,
      content: p.content,
      moderationStatus: p.moderationStatus,
      moderationScore: p.moderationScore,
      moderationCategories: castJsonStringArray(p.moderationCategories),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      interactionScore: p._count.likes + p._count.comments,
      user: p.user,
      category: p.category,
    }));
  }
}
