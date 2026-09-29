import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  ManageForumPostMessage,
  ManageForumReportMessage,
} from '@shared/types';

export const ForumReportNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumReportMessage.FORUM_REPORT_NOT_FOUND,
      path: 'reportId',
    },
  ]);

export const ForumPostNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumReportMessage.FORUM_POST_NOT_FOUND,
      path: 'postId',
    },
  ]);

export const ForumCommentNotFoundException = () =>
  new NotFoundException([
    {
      message: ManageForumReportMessage.FORUM_COMMENT_NOT_FOUND,
      path: 'commentId',
    },
  ]);

export const ForumReportAlreadyExistsException = () =>
  new ForbiddenException([
    {
      message: ManageForumReportMessage.FORUM_REPORT_ALREADY_EXISTS,
      path: 'report',
    },
  ]);

export const FailedToCreateForumReportException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumReportMessage.FAILED_TO_CREATE_FORUM_REPORT,
      path: 'createReport',
    },
  ]);

export const FailedToLoadForumReportsException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumReportMessage.FAILED_TO_LOAD_FORUM_REPORTS,
      path: 'reports',
    },
  ]);

export const FailedToUpdateReportStatusException = () =>
  new InternalServerErrorException([
    {
      message: ManageForumReportMessage.FAILED_TO_UPDATE_REPORT_STATUS,
      path: 'updateReportStatus',
    },
  ]);

export const ForumReportForbiddenException = () =>
  new ForbiddenException([
    {
      message: ManageForumReportMessage.FORUM_REPORT_FORBIDDEN,
      path: 'userId',
    },
  ]);
