import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageForumCommentMessage } from '@shared/types';

export const ForumCommentNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumCommentMessage.FORUM_COMMENT_NOT_FOUND,
      path: 'id',
    },
  ]);

export const FailedToLoadForumCommentsException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumCommentMessage.FORUM_COMMENT_LIST_NOT_FOUND,
      path: 'comments',
    },
  ]);

export const FailedToCreateForumCommentException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumCommentMessage.FAILED_TO_CREATE_FORUM_COMMENT,
      path: 'createComment',
    },
  ]);

export const FailedToDeleteForumCommentException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumCommentMessage.FAILED_TO_DELETE_FORUM_COMMENT,
      path: 'deleteComment',
    },
  ]);
