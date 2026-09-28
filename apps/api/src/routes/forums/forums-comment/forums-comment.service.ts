import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateForumCommentType,
  ForumCommentFilterType,
  ForumCommentListResponseType,
  ForumCommentType,
} from '@shared/types';
import { ForumCommentRepository } from './forums-comment.repo';
import {
  FailedToCreateForumCommentException,
  FailedToLoadForumCommentsException,
  ForumPostNotFoundException,
} from './forums-comment.error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class ForumCommentService {
  constructor(
    private readonly forumCommentRepository: ForumCommentRepository,
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

      return await this.forumCommentRepository.createForumComment(
        postId,
        userId,
        body.content,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateForumCommentException();
    }
  }

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
