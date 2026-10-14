import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ManageForumCommentMessage,
  ManageForumMessage,
  ManageForumPostMessage,
  ManageForumReportMessage,
} from '@shared/types';

export const ForumPostNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumPostMessage.FORUM_POST_NOT_FOUND,
      path: 'postId',
    },
  ]);

export const ForumCommentNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumCommentMessage.FORUM_COMMENT_NOT_FOUND,
      path: 'commentId',
    },
  ]);

export const ForumCategoryNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumMessage.FORUM_CATEGORY_NOT_FOUND,
      path: 'categoryId',
    },
  ]);

export const ForumCategoryAlreadyExistsException = () =>
  new ConflictException([
    {
      message: ManageForumMessage.FORUM_CATEGORY_ALREADY_EXISTS,
      path: 'name',
    },
  ]);

export const ForumCategoryHasPostsException = () =>
  new BadRequestException([
    {
      message: ManageForumMessage.FORUM_CATEGORY_HAS_POSTS,
      path: 'categoryId',
    },
  ]);

export const FailedToDeleteForumCategoryException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumMessage.FAILED_TO_DELETE_FORUM_CATEGORY,
      path: 'deleteCategory',
    },
  ]);

export const FailedToReviewForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_UPDATE_FORUM_POST,
      path: 'reviewPost',
    },
  ]);

export const FailedToRestoreForumPostException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumPostMessage.FAILED_TO_UPDATE_FORUM_POST,
      path: 'restorePost',
    },
  ]);

export const FailedToRestoreForumCommentException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumCommentMessage.FAILED_TO_UPDATE_FORUM_COMMENT,
      path: 'restoreComment',
    },
  ]);

// Chỉ ADMIN mới được truy cập các thao tác quản trị
export const ForumReportForbiddenException = () =>
  new ForbiddenException([
    {
      message: ManageForumReportMessage.FORUM_REPORT_FORBIDDEN,
      path: 'roleName',
    },
  ]);
