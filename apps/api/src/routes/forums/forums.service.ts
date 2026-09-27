import { Injectable } from '@nestjs/common';
import {
  ForumCategoryListResponseType,
  ForumCategoryDetailResponseType,
  ForumPostListResponseType,
  ForumPostFilterType,
  CreateForumPostType,
  ForumPostType,
  ViewForumPostDetailResponseType,
  UpdateForumPostType,
} from '@shared/types';
import { ForumRepository } from './forums.repo';
import {
  FailedToLoadForumCategoriesException,
  FailedToLoadForumPostsException,
  FailedToViewForumPostException,
  FailedToUpdateForumPostException,
  FailedToDeleteForumPostException,
  ForumPostNotFoundException,
  ForumPostNotOwnedException,
} from './forums.error';
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
      return {
        data: categories,
      };
    } catch {
      // Nếu có lỗi khi truy vấn database thì trả về exception
      throw FailedToLoadForumCategoriesException();
    }
  }

  async getForumCategoryById(
    id: number,
  ): Promise<ForumCategoryDetailResponseType> {
    try {
      const category = await this.forumRepository.getForumCategoryById(id);
      return {
        data: category,
      };
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
        data: posts,
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
    return this.forumRepository.createForumPost(
      body.categoryId ?? null,
      userId,
      body.title,
      body.content,
    );
  }

  async viewForumPostDetail(
    id: number,
  ): Promise<ViewForumPostDetailResponseType> {
    try {
      const post = await this.forumRepository.viewForumPostDetail(id);
      return {
        data: post,
      };
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
      if (existingPost.userId !== userId && roleName !== 'ADMIN') {
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
}
