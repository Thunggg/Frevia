import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateForumCommentType,
  EditForumCommentType,
  ForumCommentFilterType,
  ForumCommentListResponseType,
  ForumCommentType,
  RoleName,
  ToggleLikeCommentType,
} from '@shared/types';
import { ForumCommentRepository } from './forums-comment.repo';
import {
  FailedToCreateForumCommentException,
  FailedToDeleteForumCommentException,
  FailedToLikeForumCommentException,
  FailedToLoadForumCommentsException,
  FailedToUpdateForumCommentException,
  ForumCommentNotFoundException,
  ForumCommentNotOwnedException,
  ForumPostNotFoundException,
} from './forums-comment.error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { AIModerationService } from '../../../shared/services/ai-moderation.service';

@Injectable()
export class ForumCommentService {
  constructor(
    private readonly forumCommentRepository: ForumCommentRepository,
    private readonly aiModerationService: AIModerationService,
  ) {}

  async createForumComment(
    postId: number,
    userId: number,
    body: CreateForumCommentType,
  ): Promise<ForumCommentType> {
    try {
      const post = await this.forumCommentRepository.findPostById(postId);
      if (!post) {
        throw ForumPostNotFoundException();
      }

      // AI Moderation cho comment mới
      let moderation = body.moderation;
      if (!moderation) {
        moderation = await this.aiModerationService.moderateContent({
          text: body.content,
          context: 'forum-comment',
        });
      }

      return await this.forumCommentRepository.createForumComment(
        postId,
        userId,
        body.content,
        moderation,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateForumCommentException();
    }
  }

  async updateForumComment(
    postId: number,
    id: number,
    userId: number,
    body: EditForumCommentType,
  ): Promise<ForumCommentType> {
    try {
      const existingComment =
        await this.forumCommentRepository.findCommentById(id);

      // kiểm tra comment có tồn tại không
      if (!existingComment) {
        throw ForumCommentNotFoundException();
      }

      // kiểm tra comment có thuộc post không
      if (existingComment.postId !== postId) {
        throw ForumCommentNotFoundException();
      }

      // kiểm tra người dùng có quyền chỉnh sửa comment không
      if (existingComment.user.id !== userId) {
        throw ForumCommentNotOwnedException();
      }

      // AI Moderation cho comment edit
      let moderation = body.moderation;
      if (!moderation) {
        moderation = await this.aiModerationService.moderateContent({
          text: body.content,
          context: 'forum-comment',
        });
      }

      return this.forumCommentRepository.updateForumComment(
        id,
        body,
        moderation,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToUpdateForumCommentException();
    }
  }

  async deleteForumComment(
    postId: number,
    id: number,
    userId: number,
    roleName: string,
  ): Promise<ForumCommentType> {
    try {
      const existingComment =
        await this.forumCommentRepository.findCommentById(id);

      // kiểm tra comment có tồn tại không
      if (!existingComment) {
        throw ForumCommentNotFoundException();
      }

      // kiểm tra comment có thuộc post không
      if (existingComment.postId !== postId) {
        throw ForumCommentNotFoundException();
      }

      // kiểm tra người dùng có quyền xóa comment không (chủ comment hoặc admin / staff)
      const isStaff =
        roleName === RoleName.ADMIN ||
        (roleName !== RoleName.CLIENT && roleName !== RoleName.FREELANCER);
      if (existingComment.user.id !== userId && !isStaff) {
        throw ForumCommentNotOwnedException();
      }

      // xóa mềm comment
      return this.forumCommentRepository.softDeleteForumComment(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteForumCommentException();
    }
  }

  // Like - Unlike comment trong bài post
  async toggleLikeComment(
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<ToggleLikeCommentType> {
    try {
      const existingComment =
        await this.forumCommentRepository.findCommentById(commentId);

      if (!existingComment) {
        throw ForumCommentNotFoundException();
      }

      if (!existingComment || existingComment.postId !== postId) {
        throw ForumCommentNotFoundException();
      }

      const existingCommentLike =
        await this.forumCommentRepository.findLikeByUserAndComment(
          userId,
          commentId,
        );

      // Đã like comment -> unlike
      if (existingCommentLike) {
        await this.forumCommentRepository.deleteCommentLike(userId, commentId);

        return {
          liked: false,
        };
      }

      // Chưa like comment -> like
      await this.forumCommentRepository.createCommentLike(
        userId,
        postId,
        commentId,
      );

      return {
        liked: true,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLikeForumCommentException();
    }
  }

  // danh sách bình luận
  async getForumCommentLists(
    filter: ForumCommentFilterType,
  ): Promise<ForumCommentListResponseType> {
    try {
      const { comments, total } =
        await this.forumCommentRepository.getForumCommentLists(filter);

      return {
        comments,
        pagination: {
          page: filter.page,
          limit: filter.limit,
          total,
          totalPages: Math.ceil(total / filter.limit),
        },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw FailedToLoadForumCommentsException();
      }
      throw error;
    }
  }
}
