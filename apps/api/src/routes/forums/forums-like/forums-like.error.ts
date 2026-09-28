import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageForumLikeMessage, ManageForumPostMessage } from '@shared/types';

export const ForumPostNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumPostMessage.FORUM_POST_NOT_FOUND,
      path: 'postId',
    },
  ]);

export const FailedToLikeForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumLikeMessage.FAILED_TO_LIKE_FORUM_POST,
      path: 'likePost',
    },
  ]);
