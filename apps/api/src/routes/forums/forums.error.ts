import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageForumMessage, ManageForumPostMessage } from '@shared/types';

export const ForumCategoryNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumMessage.FORUM_CATEGORY_NOT_FOUND,
      path: 'id',
    },
  ]);

export const FailedToLoadForumCategoriesException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumMessage.FAILED_TO_LOAD_FORUM_CATEGORIES,
      path: 'categories',
    },
  ]);

export const ForumPostNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumPostMessage.FORUM_POST_NOT_FOUND,
      path: 'id',
    },
  ]);
export const FailedToLoadForumPostsException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_LOAD_FORUM_POSTS,
      path: 'posts',
    },
  ]);
