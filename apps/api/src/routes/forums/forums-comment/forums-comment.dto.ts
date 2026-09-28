import { createZodDto } from 'nestjs-zod';
import {
  CreateForumCommentSchema,
  CreateForumCommentResponseSchema,
  ForumCommentFilterSchema,
  ForumCommentListResponseSchema,
} from '@shared/types';

export class ForumCommentListResponseDto extends createZodDto(
  ForumCommentListResponseSchema,
) {}

export class ForumCommentFilterDto extends createZodDto(
  ForumCommentFilterSchema,
) {}

export class CreateForumCommentDto extends createZodDto(
  CreateForumCommentSchema,
) {}

export class CreateForumCommentResponseDto extends createZodDto(
  CreateForumCommentResponseSchema,
) {}
