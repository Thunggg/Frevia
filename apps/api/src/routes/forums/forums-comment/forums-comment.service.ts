import { Injectable } from '@nestjs/common';
import {
  ForumCommentFilterType,
  ForumCommentListResponseType,
} from '@shared/types';
import { ForumCommentRepository } from './forums-comment.repo';
import { FailedToLoadForumCommentsException } from './forums-comment.error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class ForumCommentService {
  constructor(
    private readonly forumCommentRepository: ForumCommentRepository,
  ) {}

  async getForumCommentLists(
    filter: ForumCommentFilterType,
  ): Promise<ForumCommentListResponseType> {
    try {
      const { comments, total } =
        await this.forumCommentRepository.getForumCommentLists(filter);

      return {
        comments: comments.map((comment) => {
          return {
            ...comment,
            user: {
              id: comment.user.id,
              profile: {
                displayName: comment.user.profile?.displayName || '',
                avatarUrl: comment.user.profile?.avatarUrl || '',
              },
            },
          };
        }),
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
