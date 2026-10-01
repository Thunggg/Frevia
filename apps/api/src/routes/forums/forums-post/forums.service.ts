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

@Injectable()
export class ForumService {
  // Inject ForumRepository để Service có thể lấy dữ liệu từ database
  constructor(private readonly forumRepository: ForumRepository) {}

  // Lấy danh sách tất cả forum categories
  async getForumCategories(): Promise<ForumCategoryListResponseType> {
    try {
      // Gọi Repository để truy vấn dữ liệu từ database
      const categories = await this.forumRepository.getForumCategories();

      // Trả dữ liệu về theo đúng format của API
      return categories;
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
      const categories =
        await this.forumRepository.getTopForumCategories(limit);
      return categories;
    } catch {
      throw FailedToLoadForumCategoriesException();
    }
  }

  // Lấy top người dùng hoạt động nhiều nhất
  async getTopActiveUsers(
    limit: number = 5,
  ): Promise<ForumTopActiveUserListResponseType> {
    try {
      const users = await this.forumRepository.getTopActiveUsers(limit);
      return users;
    } catch {
      throw FailedToLoadForumCategoriesException();
    }
  }

  async getForumCategoryById(
    id: number,
  ): Promise<ForumCategoryDetailResponseType> {
    try {
      const category = await this.forumRepository.getForumCategoryById(id);
      return category;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadForumCategoriesException();
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

      // Tạo post
      return await this.forumRepository.createForumPost(
        body.categoryId ?? null,
        userId,
        body.title,
        body.content,
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

      return this.forumRepository.updateForumPost(id, body);
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

      // Kiểm tra quyền sở hữu, chỉ owner và ADMIN mới có quyền xóa post
      if (existingPost.userId !== userId && roleName !== RoleName.ADMIN) {
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
  ): Promise<ForumTopPostListResponseType> {
    try {
      return await this.forumRepository.getTopInteractedPosts(limit);
    } catch {
      throw FailedToLoadForumPostsException();
    }
  }
}
