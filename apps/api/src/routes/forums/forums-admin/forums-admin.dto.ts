import { createZodDto } from 'nestjs-zod';
import {
  ForumAdminStatsSchema,
  ForumAdminCommentListResponseSchema,
  ForumAdminCommentSchema,
  ForumPostSchema,
  PendingForumPostListResponseSchema,
  ReviewForumPostResponseSchema,
  ForumTrashPostListResponseSchema,
  ForumTrashCommentListResponseSchema,
} from '@shared/types';

export class ForumAdminStatsResponseDto extends createZodDto(
  ForumAdminStatsSchema,
) {}

export class ForumAdminCommentListResponseDto extends createZodDto(
  ForumAdminCommentListResponseSchema,
) {}

export class PendingForumPostListResponseDto extends createZodDto(
  PendingForumPostListResponseSchema,
) {}

export class ReviewForumPostResponseDto extends createZodDto(
  ReviewForumPostResponseSchema,
) {}

export class ForumTrashPostListResponseDto extends createZodDto(
  ForumTrashPostListResponseSchema,
) {}

export class ForumTrashCommentListResponseDto extends createZodDto(
  ForumTrashCommentListResponseSchema,
) {}

export class ForumRestorePostResponseDto extends createZodDto(
  ForumPostSchema,
) {}

export class ForumRestoreCommentResponseDto extends createZodDto(
  ForumAdminCommentSchema,
) {}
