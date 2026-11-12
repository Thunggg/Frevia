import { HttpException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ForumAdminRepository } from './forums-admin.repo';
import {
  ForumAdminCategoryListResponseType,
  ForumCategoryDetailResponseType,
  CreateForumCategoryBodyType,
  UpdateForumCategoryBodyType,
  ForumCategoryType,
  ForumAdminCommentType,
  ForumAdminStatsType,
  ForumAdminCommentListResponseType,
  ForumPostType,
  ForumTrashPostListResponseType,
  ForumTrashCommentListResponseType,
  PendingForumPostListResponseType,
  RoleName,
} from '@shared/types';
import {
  ForumCategoryNotFoundException,
  ForumCommentNotFoundException,
  ForumPostNotFoundException,
  FailedToRestoreForumCategoryException,
  FailedToRestoreForumCommentException,
  FailedToRestoreForumPostException,
  FailedToReviewForumPostException,
  FailedToDeleteForumCategoryException,
  ForumReportForbiddenException,
} from './forums-admin.error';
import { CacheService } from '../../../shared/services/cache.service';

@Injectable()
export class ForumAdminService {
  constructor(
    private readonly adminRepository: ForumAdminRepository,
    private readonly cacheService?: CacheService,
  ) {}

  private ensureStaffAccess(roleName: string) {
    if (roleName === RoleName.CLIENT || roleName === RoleName.FREELANCER) {
      throw ForumReportForbiddenException();
    }
  }

  async getAdminStats(roleName: string): Promise<ForumAdminStatsType> {
    this.ensureStaffAccess(roleName);
    try {
      return await this.adminRepository.getAdminStats();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async getAdminCommentLists(
    roleName: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<ForumAdminCommentListResponseType> {
    this.ensureStaffAccess(roleName);
    try {
      const { comments, total } =
        await this.adminRepository.getAdminCommentLists(page, limit, search);

      return {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async getAdminCategoryLists(
    roleName: string,
    page: number,
    limit: number,
    search?: string,
    sortBy?: 'id' | 'name' | 'createdAt',
    sortOrder?: 'asc' | 'desc',
    deleted?: string,
  ): Promise<ForumAdminCategoryListResponseType> {
    this.ensureStaffAccess(roleName);
    try {
      const { categories, total } =
        await this.adminRepository.getAdminCategoryLists(
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          deleted,
        );

      return {
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async getAdminCategoryById(
    roleName: string,
    categoryId: number,
  ): Promise<ForumCategoryDetailResponseType> {
    this.ensureStaffAccess(roleName);
    try {
      const category =
        await this.adminRepository.getAdminCategoryById(categoryId);
      if (!category) {
        throw ForumCategoryNotFoundException();
      }
      return category;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async createAdminCategory(
    roleName: string,
    body: CreateForumCategoryBodyType,
  ): Promise<ForumCategoryType> {
    this.ensureStaffAccess(roleName);
    try {
      const result = await this.adminRepository.createAdminCategory(body);
      this.cacheService?.delByPrefix('forum_categor');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  async updateAdminCategory(
    roleName: string,
    categoryId: number,
    body: UpdateForumCategoryBodyType,
  ): Promise<ForumCategoryType> {
    this.ensureStaffAccess(roleName);
    try {
      const result = await this.adminRepository.updateAdminCategory(categoryId, body);
      this.cacheService?.delByPrefix('forum_categor');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  async deleteAdminCategory(
    roleName: string,
    categoryId: number,
  ): Promise<{ message: string }> {
    this.ensureStaffAccess(roleName);
    try {
      const result = await this.adminRepository.deleteAdminCategory(categoryId);
      this.cacheService?.delByPrefix('forum_categor');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteForumCategoryException();
    }
  }

  async restoreAdminCategory(
    roleName: string,
    categoryId: number,
  ): Promise<ForumCategoryType> {
    this.ensureStaffAccess(roleName);
    try {
      const result = await this.adminRepository.restoreAdminCategory(categoryId);
      this.cacheService?.delByPrefix('forum_categor');
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToRestoreForumCategoryException();
    }
  }

  async getPendingPosts(
    roleName: string,
    page: number,
    limit: number,
  ): Promise<PendingForumPostListResponseType> {
    this.ensureStaffAccess(roleName);
    try {
      const { posts, total } = await this.adminRepository.getPendingPosts(
        page,
        limit,
      );

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async reviewPendingPost(
    roleName: string,
    postId: number,
    status: 'APPROVED' | 'REJECTED',
    adminId: number,
  ): Promise<ForumPostType> {
    this.ensureStaffAccess(roleName);
    try {
      return await this.adminRepository.reviewForumPost(
        postId,
        status,
        adminId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ForumPostNotFoundException();
        }
        throw FailedToReviewForumPostException();
      }
      throw error;
    }
  }

  async getTrashPosts(
    roleName: string,
    page: number,
    limit: number,
  ): Promise<ForumTrashPostListResponseType> {
    this.ensureStaffAccess(roleName);
    try {
      const { posts, total } = await this.adminRepository.getTrashPosts(
        page,
        limit,
      );

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async getTrashComments(
    roleName: string,
    page: number,
    limit: number,
  ): Promise<ForumTrashCommentListResponseType> {
    this.ensureStaffAccess(roleName);
    try {
      const { comments, total } = await this.adminRepository.getTrashComments(
        page,
        limit,
      );

      return {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw ForumReportForbiddenException();
    }
  }

  async restoreTrashPost(
    roleName: string,
    postId: number,
  ): Promise<ForumPostType> {
    this.ensureStaffAccess(roleName);
    try {
      return await this.adminRepository.restoreTrashPost(postId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToRestoreForumPostException();
    }
  }

  async restoreTrashComment(
    roleName: string,
    commentId: number,
  ): Promise<ForumAdminCommentType> {
    this.ensureStaffAccess(roleName);
    try {
      return await this.adminRepository.restoreTrashComment(commentId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ForumCommentNotFoundException();
        }
        throw FailedToRestoreForumCommentException();
      }
      throw error;
    }
  }
}
