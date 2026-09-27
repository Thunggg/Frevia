import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ManageForumMessage } from '@shared/types';

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
