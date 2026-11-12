import { Injectable, HttpException } from '@nestjs/common';
import {
  ForumCategoryListResponseType,
  ForumCategoryDetailResponseType,
  ForumCategoryTopListResponseType,
  ForumTopActiveUserListResponseType,
  ForumPostListResponseType,
  ForumPostFilterType,
  CreateForumPostType,
  ForumPostType,
  ViewForumPostDetailResponseType,
  UpdateForumPostType,
  ForumTopPostListResponseType,
} from '@shared/types';
import { ForumRepository } from './forums.repo';
import {
  FailedToLoadForumCategoriesException,
  FailedToLoadForumPostsException,
  FailedToCreateForumPostException,
  FailedToViewForumPostException,
  FailedToUpdateForumPostException,
  FailedToDeleteForumPostException,
  ForumCategoryNotFoundException,
  ForumPostNotFoundException,
  ForumPostNotOwnedException,
} from './forums.error';
import { RoleName } from '@shared/types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { AIModerationService } from '../../../shared/services/ai-moderation.service';
import { CacheService } from '../../../shared/services/cache.service';

@Injectable()
export class ForumService {
  constructor(
    private readonly forumRepository: ForumRepository,
    private readonly aiModerationService: AIModerationService,
    private readonly cacheService?: CacheService,
  ) { }

  // Lấy danh sách tất cả forum categories
  async getForumCategories(): Promise<ForumCategoryListResponseType> {
    try {
      if (this.cacheService) {
        return await this.cacheService.wrap(
          'forum_categories_all',
          () => this.forumRepository.getForumCategories(),
          120,
        );
      }
      return await this.forumRepository.getForumCategories();
    } catch {
      // Nếu có lỗi khi truy vấn database thì trả về exception
      throw FailedToLoadForumCategoriesException();
    }
  }

  // Lấy top forum categories có nhiều posts nhất
  async getTopForumCategories(
    limit: number = 3,
  ): Promise<ForumCategoryTopListResponseType> {
    try {
      if (this.cacheService) {
        return await this.cacheService.wrap(
          `forum_top_categories_${limit}`,
          () => this.forumRepository.getTopForumCategories(limit),
          120,
        );
      }
      return await this.forumRepository.getTopForumCategories(limit);
    } catch {
      throw FailedToLoadForumCategoriesException();
    }
  }

  // Lấy top người dùng hoạt động nhiều nhất
  async getTopActiveUsers(
    limit: number = 5,
  ): Promise<ForumTopActiveUserListResponseType> {
    try {
      if (this.cacheService) {
        return await this.cacheService.wrap(
          `forum_top_users_${limit}`,
          () => this.forumRepository.getTopActiveUsers(limit),
          120,
        );
      }
      return await this.forumRepository.getTopActiveUsers(limit);
    } catch {
      throw FailedToLoadForumCategoriesException();
    }
  }

  async getForumCategoryById(
    id: number,
  ): Promise<ForumCategoryDetailResponseType> {
    try {
      if (this.cacheService) {
        return await this.cacheService.wrap(
          `forum_category_detail_${id}`,
          () => this.forumRepository.getForumCategoryById(id),
          120,
        );
      }
      return await this.forumRepository.getForumCategoryById(id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadForumCategoriesException();
      }
      throw error;
    }
  }

  async getForumCategoryBySlug(
    slug: string,
  ): Promise<ForumCategoryDetailResponseType> {
    try {
      const category = await this.forumRepository.findForumCategoryBySlug(slug);
      if (!category) {
        throw ForumCategoryNotFoundException();
      }
      return await this.forumRepository.getForumCategoryById(category.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadForumCategoriesException();
      }
      throw error;
    }
  }

  async getForumPostBySlug(
    slug: string,
  ): Promise<ViewForumPostDetailResponseType> {
    try {
      const post = await this.forumRepository.findForumPostBySlug(slug);
      if (!post) {
        throw ForumPostNotFoundException();
      }
      return await this.forumRepository.viewForumPostDetail(post.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToViewForumPostException();
      }
      throw error;
    }
  }

  async getForumPostLists(
    // Sử dụng filter để lọc danh sách forum posts theo categoryId, userId, page, limit
    filter: ForumPostFilterType,
  ): Promise<ForumPostListResponseType> {
    try {
      const { posts, total } =
        await this.forumRepository.getForumPostLists(filter);

      return {
        posts,
        pagination: {
          // Trả về thông tin phân trang
          page: filter.page,
          limit: filter.limit,
          total,
          totalPages: Math.ceil(total / filter.limit),
        },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadForumPostsException();
      }

      throw error;
    }
  }

  async createForumPost(
    userId: number,
    body: CreateForumPostType,
  ): Promise<ForumPostType> {
    try {
      // Kiểm tra category có tồn tại không, nếu không tồn tại thì báo lỗi
      if (body.categoryId) {
        const category = await this.forumRepository.findForumCategoryById(
          body.categoryId,
        );

        // Nếu category không tồn tại thì ném lỗi ra ngoài
        if (!category) {
          throw ForumCategoryNotFoundException();
        }
      }

      // AI Moderation cho post mới (chỉ nếu không có sẵn moderation data)
      let moderation = body.moderation;
      if (!moderation) {
        moderation = await this.aiModerationService.moderateContent({
          text: `${body.title || ''} ${body.content || ''}`,
          context: 'forum-post',
        });
      }

      return await this.forumRepository.createForumPost(
        body.categoryId ?? null,
        userId,
        body.title,
        body.content,
        moderation,
      );
    } catch (error) {
      // Nếu là lỗi HttpException thì ném lỗi ra ngoài
      if (error instanceof HttpException) {
        throw error;
      }
      // Nếu là lỗi PrismaClientKnownRequestError thì ném lỗi ra ngoài
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToCreateForumPostException();
      }
      // Ném lỗi ra ngoài
      throw error;
    }
  }

  async viewForumPostDetail(
    id: number,
  ): Promise<ViewForumPostDetailResponseType> {
    try {
      const post = await this.forumRepository.viewForumPostDetail(id);
      return post;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToViewForumPostException();
      }
      throw error;
    }
  }

  async updateForumPost(
    id: number,
    userId: number,
    body: UpdateForumPostType,
  ): Promise<ForumPostType> {
    try {
      const existingPost = await this.forumRepository.findForumPostById(id);

      if (!existingPost) {
        throw ForumPostNotFoundException();
      }

      if (existingPost.userId !== userId) {
        throw ForumPostNotOwnedException();
      }

      // AI Moderation cho post update (chỉ nếu không có sẵn moderation data)
      let moderation = body.moderation;
      if (!moderation) {
        moderation = await this.aiModerationService.moderateContent({
          text: `${body.title || ''} ${body.content || ''}`,
          context: 'forum-post',
        });
      }

      return this.forumRepository.updateForumPost(id, body, moderation);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError ||
        error.code === 'P2025'
      ) {
        throw FailedToUpdateForumPostException();
      }
      throw error;
    }
  }

  async deleteForumPost(
    id: number,
    userId: number,
    roleName: string,
  ): Promise<ForumPostType> {
    try {
      const existingPost = await this.forumRepository.findForumPostById(id);

      if (!existingPost) {
        throw ForumPostNotFoundException();
      }

      // Kiểm tra quyền sở hữu, chỉ owner và ADMIN / staff mới có quyền xóa post
      const isStaff =
        roleName === RoleName.ADMIN ||
        (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
      if (existingPost.userId !== userId && !isStaff) {
        throw ForumPostNotOwnedException();
      }

      return this.forumRepository.softDeleteForumPost(id);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToDeleteForumPostException();
      }
      throw error;
    }
  }

  async getTopInteractedPosts(
    limit: number = 3,
    categoryId?: number,
  ): Promise<ForumTopPostListResponseType> {
    try {
      return await this.forumRepository.getTopInteractedPosts(
        limit,
        categoryId,
      );
    } catch {
      throw FailedToLoadForumPostsException();
    }
  }
}
