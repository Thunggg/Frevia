import {
  ForbiddenException,
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

export const FailedToCreateForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_CREATE_FORUM_POST,
      path: 'createPost',
    },
  ]);

export const FailedToViewForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_VIEW_FORUM_POST,
      path: 'viewPost',
    },
  ]);

export const FailedToUpdateForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_UPDATE_FORUM_POST,
      path: 'updatePost',
    },
  ]);

export const ForumPostNotOwnedException = () =>
  new ForbiddenException([
    {
      message: ManageForumPostMessage.FORUM_POST_NOT_OWNED,
      path: 'userId',
    },
  ]);

export const FailedToDeleteForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_DELETE_FORUM_POST,
      path: 'deletePost',
    },
  ]);
